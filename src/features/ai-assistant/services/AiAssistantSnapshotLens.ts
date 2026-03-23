import type {
  AiAssistantCanvasElement,
  AiAssistantCanvasSnapshot,
  AiAssistantConnectionEdge,
  AiAssistantRecentActivityItem,
} from '../aiAssistantEvents.ts';
import type {
  AiAssistantFocusItem,
  AiAssistantProfile,
} from './AiAssistantContextTypes.ts';

const MAX_CHILDREN = 6;
const MAX_SIBLINGS = 5;
const MAX_RELATED = 6;
const MAX_QUERY_MATCHES = 4;

export type AiAssistantFocusTargetOptions = {
  target?: 'selection' | 'focus' | 'prompt' | 'id';
  elementId?: string;
  prompt?: string;
  profile?: AiAssistantProfile;
};

export function getFocusBundle(
  snapshot: AiAssistantCanvasSnapshot | null,
  options: AiAssistantFocusTargetOptions = {}
): AiAssistantFocusItem | null {
  if (!snapshot) return null;
  const elementsById = new Map(snapshot.elements.map((item) => [item.id, item]));
  const selection = getSelectedElements(snapshot);
  const element = resolveFocusElement(snapshot, elementsById, selection, options);
  if (!element) return null;

  const parent = element.parentId ? elementsById.get(element.parentId) ?? null : null;
  const children = element.childIds
    .map((id) => elementsById.get(id))
    .filter((item): item is AiAssistantCanvasElement => Boolean(item))
    .slice(0, MAX_CHILDREN);
  const siblings = parent
    ? parent.childIds
        .filter((id) => id !== element.id)
        .map((id) => elementsById.get(id))
        .filter((item): item is AiAssistantCanvasElement => Boolean(item))
        .slice(0, MAX_SIBLINGS)
    : [];

  return {
    item: element,
    parent,
    children,
    siblings,
    related: getRelatedElements(snapshot, [element.id]).slice(0, MAX_RELATED),
  };
}

export function getSelectionCluster(
  snapshot: AiAssistantCanvasSnapshot | null,
  ids?: string[]
): AiAssistantCanvasSnapshot | null {
  if (!snapshot) return null;
  const selectionIds = (ids ?? snapshot.selectionIds).filter((id) =>
    snapshot.elements.some((element) => element.id === id)
  );
  if (selectionIds.length === 0) return null;

  const elementsById = new Map(snapshot.elements.map((item) => [item.id, item]));
  const includedIds = new Set<string>(selectionIds);

  selectionIds.forEach((id) => {
    const element = elementsById.get(id);
    if (!element) return;
    if (element.parentId && elementsById.has(element.parentId)) {
      includedIds.add(element.parentId);
    }
    element.childIds.forEach((childId) => {
      if (elementsById.has(childId)) {
        includedIds.add(childId);
      }
    });
  });

  snapshot.connections.forEach((connection) => {
    if (includedIds.has(connection.fromId) || includedIds.has(connection.toId)) {
      if (elementsById.has(connection.fromId)) {
        includedIds.add(connection.fromId);
      }
      if (elementsById.has(connection.toId)) {
        includedIds.add(connection.toId);
      }
    }
  });

  if (snapshot.focusId && elementsById.has(snapshot.focusId)) {
    includedIds.add(snapshot.focusId);
  }

  return createScopedSnapshot(snapshot, includedIds, selectionIds);
}

export function getRelations(
  snapshot: AiAssistantCanvasSnapshot | null,
  ids: string[]
): AiAssistantConnectionEdge[] {
  if (!snapshot || ids.length === 0) return [];
  const idSet = new Set(ids);
  return snapshot.connections.filter(
    (connection) => idSet.has(connection.fromId) || idSet.has(connection.toId)
  );
}

export function getRecentActivity(
  snapshot: AiAssistantCanvasSnapshot | null,
  ids?: string[]
): AiAssistantRecentActivityItem[] {
  if (!snapshot) return [];
  const relevantIds = ids && ids.length > 0 ? new Set(ids) : null;
  if (!relevantIds) {
    return snapshot.recentActivity.slice();
  }
  return snapshot.recentActivity.filter((item) =>
    item.entityIds.some((id) => relevantIds.has(id))
  );
}

export function getSelectedElements(
  snapshot: AiAssistantCanvasSnapshot
): AiAssistantCanvasElement[] {
  const selectedIds = new Set(snapshot.selectionIds);
  return snapshot.elements.filter((item) => selectedIds.has(item.id));
}

function resolveFocusElement(
  snapshot: AiAssistantCanvasSnapshot,
  elementsById: Map<string, AiAssistantCanvasElement>,
  selection: AiAssistantCanvasElement[],
  options: AiAssistantFocusTargetOptions
): AiAssistantCanvasElement | null {
  if (options.target === 'id' && options.elementId) {
    return elementsById.get(options.elementId) ?? null;
  }

  if (options.target === 'focus' && snapshot.focusId) {
    return elementsById.get(snapshot.focusId) ?? null;
  }

  if ((options.target === 'selection' || !options.target) && selection.length === 1) {
    return selection[0] ?? null;
  }

  if ((options.target === 'selection' || !options.target) && snapshot.focusId) {
    const focused = elementsById.get(snapshot.focusId);
    if (focused) return focused;
  }

  if (options.target === 'prompt' && options.prompt) {
    const queryMatches = findPromptMatches(options.prompt, snapshot.elements, selection);
    if (queryMatches.length > 0) {
      return queryMatches[0] ?? null;
    }
    if (options.profile === 'summarize') {
      return snapshot.elements.find((item) => item.kind === 'goal') ?? null;
    }
  }

  if (selection.length > 0) {
    return selection[0] ?? null;
  }

  if (snapshot.focusId) {
    return elementsById.get(snapshot.focusId) ?? null;
  }

  return null;
}

function findPromptMatches(
  prompt: string,
  elements: AiAssistantCanvasElement[],
  selection: AiAssistantCanvasElement[]
): AiAssistantCanvasElement[] {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (normalizedPrompt.length < 3) return [];
  const candidateIds = new Set<string>();
  const candidates = [...selection, ...elements].filter((item) => {
    if (candidateIds.has(item.id)) return false;
    candidateIds.add(item.id);
    return true;
  });
  return candidates
    .filter((item) => {
      const title = item.title.trim().toLowerCase();
      return title.length >= 3 && normalizedPrompt.includes(title);
    })
    .slice(0, MAX_QUERY_MATCHES);
}

function getRelatedElements(
  snapshot: AiAssistantCanvasSnapshot,
  ids: string[]
): Array<{ item: AiAssistantCanvasElement; relationType: string }> {
  const elementsById = new Map(snapshot.elements.map((item) => [item.id, item]));
  const idSet = new Set(ids);
  const related: Array<{ item: AiAssistantCanvasElement; relationType: string }> = [];
  snapshot.connections.forEach((connection) => {
    const otherId =
      idSet.has(connection.fromId) && !idSet.has(connection.toId)
        ? connection.toId
        : idSet.has(connection.toId) && !idSet.has(connection.fromId)
          ? connection.fromId
          : null;
    if (!otherId) return;
    const other = elementsById.get(otherId);
    if (!other) return;
    related.push({ item: other, relationType: connection.relationType });
  });
  return related;
}

function createScopedSnapshot(
  snapshot: AiAssistantCanvasSnapshot,
  includedIds: Set<string>,
  selectionIds: string[]
): AiAssistantCanvasSnapshot {
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

  return {
    canvasId: snapshot.canvasId,
    canvasTitle: snapshot.canvasTitle,
    summary: {
      goalCount: elements.filter((element) => element.kind === 'goal').length,
      storyCount: elements.filter((element) => element.kind === 'story').length,
      taskCount: elements.filter((element) => element.kind === 'task').length,
      selectedCount: selectionIds.length,
    },
    selectionIds: selectionIds.filter((id) => includedIds.has(id)),
    focusId,
    highlightedIds,
    elements,
    connections,
    viewport: snapshot.viewport
      ? {
          ...snapshot.viewport,
          visibleElementIds: snapshot.viewport.visibleElementIds.filter((id) =>
            includedIds.has(id)
          ),
        }
      : null,
    recentActivity: snapshot.recentActivity.filter((item) =>
      item.entityIds.some((id) => includedIds.has(id))
    ),
  };
}
