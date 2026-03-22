import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatIntentKind,
  WorkspaceChatIntentRequestDetail,
  WorkspaceChatSelectionItem,
} from '../workspaceChatEvents.ts';
import { getWorkspaceChatSelectedItems } from './WorkspaceChatContent.ts';
import type { WorkspaceChatProfile } from './WorkspaceChatContextTypes.ts';
import type { WorkspaceChatPreparedSubmission } from './WorkspaceChatPreparedSubmission.ts';
import { buildWorkspaceChatIntentPrompt } from '../workspaceChatPrompts.ts';

export function resolveWorkspaceChatIntentSubmission(
  detail: WorkspaceChatIntentRequestDetail,
  snapshot: WorkspaceChatCanvasSnapshot | null
): WorkspaceChatPreparedSubmission {
  const scope = detail.scope ?? (detail.targetIds?.length ? 'selection' : 'canvas');
  const resolvedSnapshot =
    scope === 'selection'
      ? withResolvedIntentSelection(snapshot, detail.targetIds)
      : snapshot;
  const selection =
    scope === 'selection' && resolvedSnapshot
      ? getWorkspaceChatSelectedItems(resolvedSnapshot)
      : [];

  return {
    prompt: buildWorkspaceChatIntentPrompt(detail.intent, selection),
    snapshot: resolvedSnapshot,
    contextMode: scope === 'selection' ? 'selection' : 'canvas',
    source: 'intent',
    intent: detail.intent,
    profile: getWorkspaceChatIntentProfile(detail.intent),
    requestLabel: getWorkspaceChatIntentRequestLabel(detail.intent, selection),
    requestMessageKind: 'command',
  };
}

function getWorkspaceChatIntentProfile(
  intent: WorkspaceChatIntentKind
): WorkspaceChatProfile {
  switch (intent) {
    case 'review':
      return 'review-selection';
    case 'breakdown':
      return 'breakdown';
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

function getWorkspaceChatIntentRequestLabel(
  intent: WorkspaceChatIntentKind,
  selection: WorkspaceChatSelectionItem[]
): string {
  const item = selection[0];
  switch (intent) {
    case 'breakdown':
      if (item?.kind === 'goal') return 'Break into stories';
      if (item?.kind === 'story') return 'Break into tasks';
      return 'Break down';
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
  snapshot: WorkspaceChatCanvasSnapshot | null,
  targetIds?: string[]
): WorkspaceChatCanvasSnapshot | null {
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
