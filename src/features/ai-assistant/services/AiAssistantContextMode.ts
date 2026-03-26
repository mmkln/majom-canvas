import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
} from '../aiAssistantEvents.ts';
import type { I18nService } from '../../../i18n/index.ts';

export type AiAssistantContextMode =
  | 'none'
  | 'canvas'
  | 'viewport'
  | 'selection';

type AiAssistantContextModeI18n = Pick<I18nService, 't'>;

const AI_ASSISTANT_CONTEXT_MODE_VALUES: AiAssistantContextMode[] = [
  'none',
  'canvas',
  'viewport',
  'selection',
];

export function getAiAssistantContextModeLabel(
  mode: AiAssistantContextMode,
  i18n?: AiAssistantContextModeI18n
): string {
  switch (mode) {
    case 'none':
      return i18n?.t('aiChat.contextMode.none') ?? 'No context';
    case 'viewport':
      return i18n?.t('aiChat.contextMode.viewport') ?? 'Visible area';
    case 'selection':
      return i18n?.t('aiChat.contextMode.selection') ?? 'Selected items';
    case 'canvas':
    default:
      return i18n?.t('aiChat.contextMode.canvas') ?? 'Whole canvas';
  }
}

export function getAiAssistantContextModeOptions(
  i18n?: AiAssistantContextModeI18n
): Array<{
  value: AiAssistantContextMode;
  label: string;
}> {
  return AI_ASSISTANT_CONTEXT_MODE_VALUES.map((value) => ({
    value,
    label: getAiAssistantContextModeLabel(value, i18n),
  }));
}

export function isAiAssistantContextMode(
  value: string
): value is AiAssistantContextMode {
  return AI_ASSISTANT_CONTEXT_MODE_VALUES.includes(value as AiAssistantContextMode);
}

export function scopeAiAssistantContext(
  snapshot: AiAssistantCanvasSnapshot | null,
  mode: AiAssistantContextMode
): AiAssistantCanvasSnapshot | null {
  if (!snapshot || mode === 'none') {
    return null;
  }
  if (mode === 'canvas') {
    return snapshot;
  }

  const includedIds =
    mode === 'viewport'
      ? resolveViewportIds(snapshot)
      : resolveSelectionScopeIds(snapshot);

  if (includedIds.size === 0) {
    return null;
  }

  return createScopedSnapshot(snapshot, includedIds);
}

function resolveViewportIds(
  snapshot: AiAssistantCanvasSnapshot
): Set<string> {
  const viewportIds = snapshot.viewport?.visibleElementIds ?? [];
  if (viewportIds.length > 0) {
    return new Set(viewportIds);
  }
  return new Set(snapshot.elements.map((element) => element.id));
}

function resolveSelectionScopeIds(
  snapshot: AiAssistantCanvasSnapshot
): Set<string> {
  const elementsById = new Map(snapshot.elements.map((element) => [element.id, element]));
  const selectionIds = snapshot.selectionIds.filter((id) => elementsById.has(id));
  const includedIds = new Set<string>(selectionIds);

  if (selectionIds.length === 0) {
    return includedIds;
  }

  selectionIds.forEach((id) => {
    const element = elementsById.get(id);
    if (!element) return;
    if (element.parentId) {
      includedIds.add(element.parentId);
    }
    element.childIds.forEach((childId) => {
      if (elementsById.has(childId)) {
        includedIds.add(childId);
      }
    });
    snapshot.connections.forEach((connection) => {
      if (connection.fromId === id && elementsById.has(connection.toId)) {
        includedIds.add(connection.toId);
      } else if (
        connection.toId === id &&
        elementsById.has(connection.fromId)
      ) {
        includedIds.add(connection.fromId);
      }
    });
  });

  if (snapshot.focusId && elementsById.has(snapshot.focusId)) {
    includedIds.add(snapshot.focusId);
  }

  return includedIds;
}

function createScopedSnapshot(
  snapshot: AiAssistantCanvasSnapshot,
  includedIds: Set<string>
): AiAssistantCanvasSnapshot {
  const selectionIds = snapshot.selectionIds.filter((id) => includedIds.has(id));
  const highlightedIds = snapshot.highlightedIds.filter((id) => includedIds.has(id));
  const focusId =
    snapshot.focusId && includedIds.has(snapshot.focusId) ? snapshot.focusId : null;

  const elements = snapshot.elements
    .filter((element) => includedIds.has(element.id))
    .map((element): AiAssistantCanvasElement => ({
      ...element,
      parentId:
        element.parentId && includedIds.has(element.parentId)
          ? element.parentId
          : null,
      childIds: element.childIds.filter((childId) => includedIds.has(childId)),
      selected: selectionIds.includes(element.id),
      focused: focusId === element.id,
      highlighted: highlightedIds.includes(element.id),
    }));

  const connections = snapshot.connections.filter(
    (connection) =>
      includedIds.has(connection.fromId) && includedIds.has(connection.toId)
  );

  const visibleElementIds = snapshot.viewport?.visibleElementIds.filter((id) =>
    includedIds.has(id)
  );

  const recentActivity = snapshot.recentActivity.filter((item) =>
    item.entityIds.some((id) => includedIds.has(id))
  );

  return {
    canvasId: snapshot.canvasId,
    canvasTitle: snapshot.canvasTitle,
    summary: {
      goalCount: elements.filter((element) => element.kind === 'goal').length,
      storyCount: elements.filter((element) => element.kind === 'story').length,
      taskCount: elements.filter((element) => element.kind === 'task').length,
      selectedCount: selectionIds.length,
    },
    selectionIds,
    focusId,
    highlightedIds,
    elements,
    connections,
    viewport: snapshot.viewport
      ? {
          ...snapshot.viewport,
          visibleElementIds: visibleElementIds ?? [],
        }
      : null,
    recentActivity,
  };
}
