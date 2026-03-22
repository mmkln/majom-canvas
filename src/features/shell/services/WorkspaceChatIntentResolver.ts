import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatIntentKind,
  WorkspaceChatIntentRequestDetail,
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
    profile: getWorkspaceChatIntentProfile(detail.intent),
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
