import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type {
  CanvasDraftHabitRecord,
  CanvasDraftNodeRecord,
  CanvasDraftSnapshot,
} from './CanvasDraftRepository.ts';
import type { ElementStatus } from '../elements/ElementStatus.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';

export type CanvasRestoreElementPatchIntent = {
  elementId: string;
  patch: Partial<{
    title: string;
    description: string;
    status: ElementStatus;
    priority: UiPriority;
    dueDate: Date | null;
    tagIds: number[];
  }>;
};

export type CanvasRestoreHabitMutationIntent =
  | {
      elementId: string;
      action: 'archive' | 'restore';
    }
  | {
      elementId: string;
      action: 'set-completion-date';
      date: string;
      completed: boolean;
    };

export type CanvasRestoreDiff = {
  hasStructuralChanges: boolean;
  structurallyChangedElementIds: string[];
  elementPatchIntents: CanvasRestoreElementPatchIntent[];
  habitMutationIntents: CanvasRestoreHabitMutationIntent[];
};

export function diffCanvasRestoreSnapshots(
  base: CanvasDraftSnapshot,
  restored: CanvasDraftSnapshot
): CanvasRestoreDiff {
  const baseNodes = new Map(base.nodes.map((node) => [getNodeIdentity(node), node] as const));
  const restoredNodes = new Map(
    restored.nodes.map((node) => [getNodeIdentity(node), node] as const)
  );
  const structurallyChangedElementIds = new Set<string>();
  const elementPatchIntents: CanvasRestoreElementPatchIntent[] = [];
  const habitMutationIntents: CanvasRestoreHabitMutationIntent[] = [];

  let hasStructuralChanges = false;

  if (!haveEqualStringSets(baseNodes.keys(), restoredNodes.keys())) {
    hasStructuralChanges = true;
    restored.nodes.forEach((node) => structurallyChangedElementIds.add(node.id));
  }

  restored.nodes.forEach((restoredNode) => {
    const identity = getNodeIdentity(restoredNode);
    const baseNode = baseNodes.get(identity);
    if (!baseNode) return;

    if (hasNodeStructuralDifference(baseNode, restoredNode)) {
      hasStructuralChanges = true;
      structurallyChangedElementIds.add(restoredNode.id);
    }

    const contentPatch = diffNodeContentPatch(baseNode, restoredNode);
    if (contentPatch) {
      elementPatchIntents.push({
        elementId: restoredNode.id,
        patch: contentPatch,
      });
    }

    if (baseNode.kind === 'habit' && restoredNode.kind === 'habit') {
      if (baseNode.habitStatus !== restoredNode.habitStatus) {
        habitMutationIntents.push({
          elementId: restoredNode.id,
          action:
            restoredNode.habitStatus === Status.Archived
              ? 'archive'
              : 'restore',
        });
      }
      const baseCompletionMap = getHabitCompletionMap(baseNode);
      const restoredCompletionMap = getHabitCompletionMap(restoredNode);
      const allDates = new Set([
        ...baseCompletionMap.keys(),
        ...restoredCompletionMap.keys(),
      ]);
      allDates.forEach((date) => {
        if (
          (baseCompletionMap.get(date) ?? false) ===
          (restoredCompletionMap.get(date) ?? false)
        ) {
          return;
        }
        habitMutationIntents.push({
          elementId: restoredNode.id,
          action: 'set-completion-date',
          date,
          completed: restoredCompletionMap.get(date) ?? false,
        });
      });
    }
  });

  if (
    !haveEqualConnectionSets(base.connections, restored.connections) ||
    base.focusedElementId !== restored.focusedElementId ||
    !haveEqualStringSets(
      base.highlightedElementIds,
      restored.highlightedElementIds
    )
  ) {
    hasStructuralChanges = true;
    restored.nodes.forEach((node) => structurallyChangedElementIds.add(node.id));
  }

  return {
    hasStructuralChanges,
    structurallyChangedElementIds: [...structurallyChangedElementIds],
    elementPatchIntents,
    habitMutationIntents,
  };
}

function diffNodeContentPatch(
  base: CanvasDraftNodeRecord,
  restored: CanvasDraftNodeRecord
): CanvasRestoreElementPatchIntent['patch'] | null {
  if (base.kind !== restored.kind) return null;
  const patch: CanvasRestoreElementPatchIntent['patch'] = {};

  if (base.title !== restored.title) {
    patch.title = restored.title;
  }
  if (base.description !== restored.description) {
    patch.description = restored.description;
  }

  switch (restored.kind) {
    case 'task':
      if (base.status !== restored.status) {
        patch.status = restored.status;
      }
      if (base.priority !== restored.priority) {
        patch.priority = restored.priority;
      }
      if (base.dueDate !== restored.dueDate) {
        patch.dueDate = restored.dueDate ? new Date(restored.dueDate) : null;
      }
      break;
    case 'story':
      if (base.status !== restored.status) {
        patch.status = restored.status;
      }
      if (base.priority !== restored.priority) {
        patch.priority = restored.priority;
      }
      break;
    case 'goal':
      if (base.status !== restored.status) {
        patch.status = restored.status;
      }
      if (base.priority !== restored.priority) {
        patch.priority = restored.priority;
      }
      if (!haveEqualNumberSets(base.tagIds, restored.tagIds)) {
        patch.tagIds = [...restored.tagIds];
      }
      break;
    case 'habit':
      if (base.priority !== restored.priority) {
        patch.priority = restored.priority;
      }
      break;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

function hasNodeStructuralDifference(
  base: CanvasDraftNodeRecord,
  restored: CanvasDraftNodeRecord
): boolean {
  if (base.kind !== restored.kind) return true;
  if (base.x !== restored.x || base.y !== restored.y) return true;
  if (restored.kind === 'story' && base.kind === 'story') {
    return base.width !== restored.width || base.height !== restored.height;
  }
  if (restored.kind === 'goal' && base.kind === 'goal') {
    return base.scale !== restored.scale;
  }
  return false;
}

function getNodeIdentity(node: CanvasDraftNodeRecord): string {
  const stableRef =
    node.uuid ??
    (node.backendId !== undefined && node.backendId !== null
      ? String(node.backendId)
      : node.id);
  return `${node.kind}:${stableRef}`;
}

function haveEqualStringSets(
  left: Iterable<string>,
  right: Iterable<string>
): boolean {
  const leftValues = [...new Set(left)].sort();
  const rightValues = [...new Set(right)].sort();
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function haveEqualNumberSets(
  left: Iterable<number>,
  right: Iterable<number>
): boolean {
  const leftValues = [...new Set(left)].sort((a, b) => a - b);
  const rightValues = [...new Set(right)].sort((a, b) => a - b);
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function haveEqualConnectionSets(
  left: CanvasDraftSnapshot['connections'],
  right: CanvasDraftSnapshot['connections']
): boolean {
  const leftValues = left
    .map(
      (connection) =>
        `${connection.fromId}:${connection.toId}:${connection.lineType}:${connection.relationType}`
    )
    .sort();
  const rightValues = right
    .map(
      (connection) =>
        `${connection.fromId}:${connection.toId}:${connection.lineType}:${connection.relationType}`
    )
    .sort();
  return (
    leftValues.length === rightValues.length &&
    leftValues.every((value, index) => value === rightValues[index])
  );
}

function getHabitCompletionMap(
  node: CanvasDraftHabitRecord
): Map<string, boolean> {
  return new Map(node.completionHistory.map(([date, checked]) => [date, checked]));
}
