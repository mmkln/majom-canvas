import type {
  AiAssistantCanvasSnapshot,
  AiAssistantIntentKind,
  AiAssistantIntentRequestDetail,
  AiAssistantSelectionItem,
} from '../aiAssistantEvents.ts';
import { getAiAssistantSelectedItems } from './AiAssistantContent.ts';
import type { AiAssistantProfile } from './AiAssistantContextTypes.ts';
import type { AiAssistantIntentContext } from './AiAssistantIntentContext.ts';
import type { AiAssistantPreparedSubmission } from './AiAssistantPreparedSubmission.ts';
import { resolveAiAssistantScenarioFromSubmission } from './AiAssistantScenarioResolver.ts';
import { buildAiAssistantIntentPrompt } from '../aiAssistantPrompts.ts';
import type { I18nService } from '../../../i18n/index.ts';

type AiAssistantIntentI18n = Pick<I18nService, 't'>;

export function resolveAiAssistantIntentSubmission(
  detail: AiAssistantIntentRequestDetail,
  snapshot: AiAssistantCanvasSnapshot | null,
  i18n?: AiAssistantIntentI18n
): AiAssistantPreparedSubmission {
  const scope = detail.scope ?? (detail.targetIds?.length ? 'selection' : 'canvas');
  const resolvedSnapshot =
    scope === 'selection'
      ? withResolvedIntentSelection(snapshot, detail.targetIds)
      : snapshot;
  const selection =
    scope === 'selection' && resolvedSnapshot
      ? getAiAssistantSelectedItems(resolvedSnapshot)
      : [];

  return {
    prompt: buildAiAssistantIntentPrompt(detail.intent, selection),
    snapshot: resolvedSnapshot,
    contextMode: scope === 'selection' ? 'selection' : 'canvas',
    source: 'intent',
    intent: detail.intent,
    intentContext: getAiAssistantIntentContext(detail.intent, selection),
    scenario: resolveAiAssistantScenarioFromSubmission({
      intent: detail.intent,
      intentContext: getAiAssistantIntentContext(detail.intent, selection),
      source: 'intent',
      snapshot: resolvedSnapshot,
      contextMode: scope === 'selection' ? 'selection' : 'canvas',
    }),
    profile: getAiAssistantIntentProfile(detail.intent),
    requestLabel: getAiAssistantIntentRequestLabel(detail.intent, selection, i18n),
    requestMessageKind: 'command',
  };
}

function getAiAssistantIntentContext(
  intent: AiAssistantIntentKind,
  selection: AiAssistantSelectionItem[]
): AiAssistantIntentContext | undefined {
  const item = selection[0];
  if (intent === 'strategic_plan') {
    return {
      strategicPlanMode:
        item?.kind === 'goal' ? 'goal_subgoals' : 'canvas_bootstrap',
    };
  }
  if (intent === 'breakdown') {
    return {
      breakdownMode:
        item?.kind === 'goal'
          ? 'goal_stories'
          : item?.kind === 'story'
            ? 'story_tasks'
            : item?.kind === 'task'
              ? 'task_refine'
              : 'unspecified_goal_decomposition',
    };
  }
  return undefined;
}

function getAiAssistantIntentProfile(
  intent: AiAssistantIntentKind
): AiAssistantProfile {
  switch (intent) {
    case 'review':
      return 'review-selection';
    case 'breakdown':
      return 'breakdown';
    case 'strategic_plan':
      return 'strategic-plan';
    case 'dependencies':
      return 'dependency-review';
    case 'missing':
      return 'readiness-check';
    case 'clarify':
      return 'breakdown';
    case 'fill_details':
      return 'readiness-check';
    case 'next_steps':
    case 'recent_changes':
    case 'duplicates':
    case 'capability_help':
    case 'general_question':
    default:
      return 'review-selection';
  }
}

function getAiAssistantIntentRequestLabel(
  intent: AiAssistantIntentKind,
  selection: AiAssistantSelectionItem[],
  i18n?: AiAssistantIntentI18n
): string {
  const item = selection[0];
  const selectionTargetLabel = getAiAssistantSelectionTargetLabel(selection, i18n);
  switch (intent) {
    case 'breakdown':
      if (item?.kind === 'goal') {
        return selectionTargetLabel
          ? `${i18n?.t('aiChat.quickAction.breakIntoStories') ?? 'Break into stories'} · ${selectionTargetLabel}`
          : i18n?.t('aiChat.quickAction.breakIntoStories') ?? 'Break into stories';
      }
      if (item?.kind === 'story') {
        return selectionTargetLabel
          ? `${i18n?.t('aiChat.quickAction.breakIntoTasks') ?? 'Break into tasks'} · ${selectionTargetLabel}`
          : i18n?.t('aiChat.quickAction.breakIntoTasks') ?? 'Break into tasks';
      }
      return selectionTargetLabel
        ? `${i18n?.t('aiChat.quickAction.breakDown') ?? 'Break down'} · ${selectionTargetLabel}`
        : i18n?.t('aiChat.quickAction.breakDown') ?? 'Break down';
    case 'strategic_plan':
      return (
        i18n?.t('aiChat.quickAction.generateStrategicPlan') ??
        'Generate strategic plan'
      );
    case 'dependencies':
      return selection.length > 1
        ? i18n?.t('aiChat.quickAction.connectSelected') ?? 'Connect selected'
        : i18n?.t('aiChat.quickAction.linkBlockers') ?? 'Link blockers';
    case 'missing':
      return i18n?.t('aiChat.quickAction.missing') ?? 'What is missing?';
    case 'clarify':
      return selectionTargetLabel
        ? `${i18n?.t('aiChat.quickAction.clarify') ?? 'Clarify'} · ${selectionTargetLabel}`
        : i18n?.t('aiChat.quickAction.clarify') ?? 'Clarify';
    case 'fill_details':
      return selectionTargetLabel
        ? `${i18n?.t('aiChat.quickAction.fillMissingDetails') ?? 'Fill missing details'} · ${selectionTargetLabel}`
        : i18n?.t('aiChat.quickAction.fillMissingDetails') ??
            'Fill missing details';
    case 'review':
    default:
      return selection.length > 0
        ? i18n?.t('aiChat.quickAction.reviewSelection') ?? 'Review selection'
        : i18n?.t('aiChat.quickAction.reviewPlan') ?? 'Review plan';
  }
}

function getAiAssistantSelectionTargetLabel(
  selection: AiAssistantSelectionItem[],
  i18n?: AiAssistantIntentI18n
): string | null {
  if (selection.length === 0) {
    return null;
  }

  if (selection.length > 1) {
    return (
      i18n?.t('aiChat.context.selectedItemsCount', { count: selection.length }) ??
      `${selection.length} selected items`
    );
  }

  const item = selection[0];
  if (!item) {
    return null;
  }

  return `${formatAiAssistantSelectionKindLabel(item.kind, i18n)}: ${item.title}`;
}

function formatAiAssistantSelectionKindLabel(
  kind: AiAssistantSelectionItem['kind'],
  i18n?: AiAssistantIntentI18n
): string {
  switch (kind) {
    case 'goal':
      return i18n?.t('aiChat.kind.goal') ?? 'Goal';
    case 'story':
      return i18n?.t('aiChat.kind.story') ?? 'Story';
    case 'task':
    default:
      return i18n?.t('aiChat.kind.task') ?? 'Task';
  }
}

function withResolvedIntentSelection(
  snapshot: AiAssistantCanvasSnapshot | null,
  targetIds?: string[]
): AiAssistantCanvasSnapshot | null {
  if (!snapshot || targetIds === undefined) {
    return snapshot;
  }

  const elementsById = new Map(snapshot.elements.map((element) => [element.id, element]));
  const selectionIds = Array.from(new Set(targetIds)).filter((id) =>
    elementsById.has(id)
  );
  const selectionIdSet = new Set(selectionIds);
  const focusId =
    selectionIds.length === 1
      ? (selectionIds[0] ?? null)
      : snapshot.focusId && selectionIdSet.has(snapshot.focusId)
        ? snapshot.focusId
        : null;
  const selectionUnchanged =
    selectionIds.length === snapshot.selectionIds.length &&
    selectionIds.every((id, index) => snapshot.selectionIds[index] === id);
  const focusUnchanged = focusId === snapshot.focusId;
  const selectedFlagsUnchanged = snapshot.elements.every(
    (element) => element.selected === selectionIdSet.has(element.id)
  );
  const focusedFlagsUnchanged = snapshot.elements.every(
    (element) => element.focused === (focusId === element.id)
  );

  if (
    selectionUnchanged &&
    focusUnchanged &&
    selectedFlagsUnchanged &&
    focusedFlagsUnchanged
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    summary: {
      ...snapshot.summary,
      selectedCount: selectionIds.length,
    },
    selectionIds,
    focusId,
    elements: snapshot.elements.map((element) => ({
      ...element,
      selected: selectionIdSet.has(element.id),
      focused: focusId === element.id,
    })),
  };
}
