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

export function resolveAiAssistantIntentSubmission(
  detail: AiAssistantIntentRequestDetail,
  snapshot: AiAssistantCanvasSnapshot | null
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
    requestLabel: getAiAssistantIntentRequestLabel(detail.intent, selection),
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
  }
}

function getAiAssistantIntentRequestLabel(
  intent: AiAssistantIntentKind,
  selection: AiAssistantSelectionItem[]
): string {
  const item = selection[0];
  switch (intent) {
    case 'breakdown':
      if (item?.kind === 'goal') return 'Break into stories';
      if (item?.kind === 'story') return 'Break into tasks';
      return 'Break down';
    case 'strategic_plan':
      return 'Generate strategic plan';
    case 'dependencies':
      return selection.length > 1 ? 'Connect selected' : 'Link blockers';
    case 'missing':
      return 'What is missing?';
    case 'clarify':
      return 'Clarify';
    case 'fill_details':
      return 'Fill missing details';
    case 'review':
    default:
      return selection.length > 0 ? 'Review selection' : 'Review plan';
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
