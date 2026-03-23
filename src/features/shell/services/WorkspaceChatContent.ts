import type {
  WorkspaceChatCanvasSnapshot,
  WorkspaceChatCanvasElement,
  WorkspaceChatConnectionEdge,
  WorkspaceChatSelectionItem,
} from '../workspaceChatEvents.ts';

const MAX_CANONICAL_HIERARCHY_ITEMS = 24;
const MAX_CANONICAL_RELATIONS = 16;

export function summarizeWorkspaceChatCanvas(
  context: Pick<WorkspaceChatCanvasSnapshot, 'canvasTitle' | 'summary'>
): string {
  return `Canvas "${context.canvasTitle || 'Untitled canvas'}" currently has ${context.summary.goalCount} goals, ${context.summary.storyCount} stories, and ${context.summary.taskCount} tasks.`;
}

export function formatWorkspaceChatCanonicalContext(
  snapshot: WorkspaceChatCanvasSnapshot | null
): string {
  if (!snapshot) {
    return ['Summary', '- No active canvas context', '', 'Hierarchy', '- None', '', 'Relations', '- None'].join('\n');
  }

  const sections = [
    'Summary',
    `- Canvas: ${snapshot.canvasTitle || 'Untitled canvas'}`,
    `- Goals: ${snapshot.summary.goalCount}`,
    `- Stories: ${snapshot.summary.storyCount}`,
    `- Tasks: ${snapshot.summary.taskCount}`,
    `- Selected: ${snapshot.summary.selectedCount}`,
    '',
    'Hierarchy',
    ...buildCanonicalHierarchyLines(snapshot),
    '',
    'Relations',
    ...buildCanonicalRelationLines(snapshot),
  ];

  return sections.join('\n');
}

export function getWorkspaceChatSelectedItems(
  snapshot: WorkspaceChatCanvasSnapshot
): WorkspaceChatCanvasElement[] {
  const selectedIds = new Set(snapshot.selectionIds);
  return snapshot.elements.filter((item) => selectedIds.has(item.id));
}

export function describeWorkspaceChatSelectionInline(
  selection: WorkspaceChatSelectionItem[]
): string {
  return selection
    .map(
      (item) =>
        `${capitalizeWorkspaceChatValue(item.kind)} "${item.title || 'Untitled'}"`
    )
    .join(', ');
}

export function describeWorkspaceChatSelectionItem(
  item: WorkspaceChatSelectionItem
): string {
  const parts = [
    `- ${capitalizeWorkspaceChatValue(item.kind)} "${item.title || 'Untitled'}"`,
  ];
  if (item.status) {
    parts.push(`status: ${item.status}`);
  }
  if (item.priority) {
    parts.push(`priority: ${item.priority}`);
  }
  if (typeof item.childCount === 'number' && item.kind === 'story') {
    parts.push(`${item.childCount} tasks inside`);
  }
  if (typeof item.childCount === 'number' && item.kind === 'goal') {
    parts.push(`${item.childCount} child items`);
  }
  return parts.join(', ');
}

export function capitalizeWorkspaceChatValue(value: string): string {
  return value.length > 0 ? value[0].toUpperCase() + value.slice(1) : value;
}

function buildCanonicalHierarchyLines(
  snapshot: WorkspaceChatCanvasSnapshot
): string[] {
  if (snapshot.elements.length === 0) {
    return ['- None'];
  }

  const elementsById = new Map(snapshot.elements.map((element) => [element.id, element]));
  const roots = snapshot.elements.filter(
    (element) => !element.parentId || !elementsById.has(element.parentId)
  );
  const visited = new Set<string>();
  const lines: string[] = [];
  const counter = { count: 0 };

  const orderedRoots = [...roots].sort(compareCanvasElements);
  orderedRoots.forEach((root) => {
    appendHierarchyLine(root, 0, elementsById, visited, lines, counter);
  });

  const orphans = snapshot.elements.filter((element) => !visited.has(element.id));
  orphans.sort(compareCanvasElements).forEach((element) => {
    appendHierarchyLine(element, 0, elementsById, visited, lines, counter);
  });

  if (lines.length === 0) {
    return ['- None'];
  }

  const remaining = snapshot.elements.length - counter.count;
  if (remaining > 0) {
    lines.push(`- ... ${remaining} more items omitted`);
  }
  return lines;
}

function appendHierarchyLine(
  element: WorkspaceChatCanvasElement,
  depth: number,
  elementsById: Map<string, WorkspaceChatCanvasElement>,
  visited: Set<string>,
  lines: string[],
  counter: { count: number }
): void {
  if (visited.has(element.id) || counter.count >= MAX_CANONICAL_HIERARCHY_ITEMS) {
    return;
  }

  visited.add(element.id);
  counter.count += 1;
  lines.push(`${'  '.repeat(depth)}- ${formatWorkspaceChatElementRef(element)}`);

  element.childIds.forEach((childId) => {
    if (counter.count >= MAX_CANONICAL_HIERARCHY_ITEMS) return;
    const child = elementsById.get(childId);
    if (!child) return;
    appendHierarchyLine(child, depth + 1, elementsById, visited, lines, counter);
  });
}

function buildCanonicalRelationLines(
  snapshot: WorkspaceChatCanvasSnapshot
): string[] {
  const elementsById = new Map(snapshot.elements.map((element) => [element.id, element]));
  const relations = snapshot.connections.filter(
    (connection) =>
      connection.relationType !== 'parent_child' &&
      elementsById.has(connection.fromId) &&
      elementsById.has(connection.toId)
  );

  if (relations.length === 0) {
    return ['- None'];
  }

  return relations.slice(0, MAX_CANONICAL_RELATIONS).map((connection) =>
    formatWorkspaceChatRelation(connection, elementsById)
  ).concat(
    relations.length > MAX_CANONICAL_RELATIONS
      ? [`- ... ${relations.length - MAX_CANONICAL_RELATIONS} more relations omitted`]
      : []
  );
}

function formatWorkspaceChatRelation(
  connection: WorkspaceChatConnectionEdge,
  elementsById: Map<string, WorkspaceChatCanvasElement>
): string {
  const from = elementsById.get(connection.fromId);
  const to = elementsById.get(connection.toId);
  if (!from || !to) {
    return `- [${connection.fromId}] ${connection.relationType} [${connection.toId}]`;
  }
  return `- ${formatWorkspaceChatElementRef(from)} ${connection.relationType} ${formatWorkspaceChatElementRef(to)}`;
}

function formatWorkspaceChatElementRef(
  element: WorkspaceChatSelectionItem
): string {
  return `${capitalizeWorkspaceChatValue(element.kind)} [${element.id}] "${element.title || 'Untitled'}"`;
}

function compareCanvasElements(
  a: WorkspaceChatCanvasElement,
  b: WorkspaceChatCanvasElement
): number {
  const rankA = getCanvasElementRank(a.kind);
  const rankB = getCanvasElementRank(b.kind);
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  return (a.title || '').localeCompare(b.title || '');
}

function getCanvasElementRank(kind: WorkspaceChatCanvasElement['kind']): number {
  switch (kind) {
    case 'goal':
      return 0;
    case 'story':
      return 1;
    case 'task':
    default:
      return 2;
  }
}
