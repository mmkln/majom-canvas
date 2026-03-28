import type {
  LearningCourseMapEdge,
  LearningCourseMapModel,
  LearningCourseMapNode,
} from './courseMapModel.ts';

const OUTER_MARGIN = 32;
const MODULE_WIDTH = 460;
const MODULE_TOP_PADDING = 18;
const MODULE_HORIZONTAL_GAP = 72;
const MODULE_VERTICAL_GAP = 96;
const MODULE_CARD_HEIGHT = 56;
const MODULE_PADDING_X = 24;
const MODULE_BODY_TOP_GAP = 20;
const MODULE_PADDING_BOTTOM = 24;
const LESSON_WIDTH = 360;
const LESSON_HEIGHT = 100;
const LESSON_VERTICAL_GAP = 20;
const LESSON_TO_CHILD_GAP = 10;
const CHILD_INDENT = 28;
const CHILD_WIDTH = 280;
const CHILD_HEIGHT = 68;
const CHILD_VERTICAL_GAP = 8;
const TWO_COLUMN_THRESHOLD = 2;

export type LearningCourseMapLayoutNode = LearningCourseMapNode & {
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type LearningCourseMapLayoutEdge = LearningCourseMapEdge & {
  path: string;
};

export type LearningCourseMapLayout = {
  width: number;
  height: number;
  nodes: LearningCourseMapLayoutNode[];
  edges: LearningCourseMapLayoutEdge[];
};

type LessonCluster = {
  lesson: LearningCourseMapNode;
  children: LearningCourseMapNode[];
  height: number;
};

type ModuleCluster = {
  moduleId: string;
  moduleNode: LearningCourseMapNode | null;
  lessons: LessonCluster[];
  height: number;
};

export function layoutLearningCourseMap(
  model: LearningCourseMapModel
): LearningCourseMapLayout {
  const moduleNodes = model.nodes.filter((node) => node.kind === 'module');
  const lessonNodes = model.nodes.filter((node) => node.kind === 'lesson');
  const childNodes = model.nodes.filter(
    (node) => node.kind === 'exercise' || node.kind === 'checkpoint'
  );
  const childNodesByLessonId = new Map<string, LearningCourseMapNode[]>();

  childNodes.forEach((node) => {
    const lessonId = node.parentId;
    if (!lessonId) return;
    const existing = childNodesByLessonId.get(lessonId) ?? [];
    existing.push(node);
    childNodesByLessonId.set(lessonId, existing);
  });

  const moduleOrder = getModuleOrder(model, moduleNodes, lessonNodes);
  const moduleNodesById = new Map(moduleNodes.map((node) => [node.id, node] as const));
  const lessonsByModuleId = new Map<string, LearningCourseMapNode[]>();

  lessonNodes.forEach((node) => {
    const existing = lessonsByModuleId.get(node.moduleId) ?? [];
    existing.push(node);
    lessonsByModuleId.set(node.moduleId, existing);
  });

  const moduleClusters = moduleOrder.map<ModuleCluster>((moduleId) => {
    const lessons = (lessonsByModuleId.get(moduleId) ?? []).map<LessonCluster>(
      (lesson) => {
        const children = childNodesByLessonId.get(lesson.id) ?? [];
        return {
          lesson,
          children,
          height: getLessonClusterHeight(children.length),
        };
      }
    );

    return {
      moduleId,
      moduleNode: moduleNodesById.get(moduleId) ?? null,
      lessons,
      height: getModuleClusterHeight(
        moduleNodesById.get(moduleId) ?? null,
        lessons.map((cluster) => cluster.height)
      ),
    };
  });

  const laidOutNodes: LearningCourseMapLayoutNode[] = [];
  const columns =
    moduleClusters.length >= TWO_COLUMN_THRESHOLD &&
    moduleClusters.some((cluster) => cluster.moduleNode !== null)
      ? 2
      : 1;
  const rowCount = Math.ceil(moduleClusters.length / columns);
  const rowHeights: number[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const slice = moduleClusters.slice(rowIndex * columns, rowIndex * columns + columns);
    rowHeights.push(Math.max(...slice.map((cluster) => cluster.height)));
  }

  moduleClusters.forEach((cluster, index) => {
    const columnIndex = index % columns;
    const rowIndex = Math.floor(index / columns);
    const originX = OUTER_MARGIN + columnIndex * (MODULE_WIDTH + MODULE_HORIZONTAL_GAP);
    const originY = rowYForRow(rowHeights, rowIndex);

    if (cluster.moduleNode) {
      laidOutNodes.push({
        ...cluster.moduleNode,
        frame: {
          x: originX + MODULE_PADDING_X,
          y: originY + MODULE_TOP_PADDING,
          width: MODULE_WIDTH - MODULE_PADDING_X * 2,
          height: MODULE_CARD_HEIGHT,
        },
      });
    }

    let lessonY =
      originY +
      (cluster.moduleNode
        ? MODULE_TOP_PADDING + MODULE_CARD_HEIGHT + MODULE_BODY_TOP_GAP
        : 0);

    cluster.lessons.forEach((lessonCluster, lessonIndex) => {
      laidOutNodes.push({
        ...lessonCluster.lesson,
        frame: {
          x: originX + MODULE_PADDING_X,
          y: lessonY,
          width: LESSON_WIDTH,
          height: LESSON_HEIGHT,
        },
      });

      let childY = lessonY + LESSON_HEIGHT + LESSON_TO_CHILD_GAP;
      lessonCluster.children.forEach((child, childIndex) => {
        laidOutNodes.push({
          ...child,
          frame: {
            x: originX + MODULE_PADDING_X + CHILD_INDENT,
            y: childY,
            width: CHILD_WIDTH,
            height: CHILD_HEIGHT,
          },
        });
        childY += CHILD_HEIGHT;
        if (childIndex < lessonCluster.children.length - 1) {
          childY += CHILD_VERTICAL_GAP;
        }
      });

      lessonY += lessonCluster.height;
      if (lessonIndex < cluster.lessons.length - 1) {
        lessonY += LESSON_VERTICAL_GAP;
      }
    });
  });

  const nodesById = new Map(laidOutNodes.map((node) => [node.id, node] as const));
  const edges = model.edges
    .filter((edge) => shouldRenderEdge(edge, nodesById))
    .map<LearningCourseMapLayoutEdge>((edge) => ({
      ...edge,
      path: buildEdgePath(edge, nodesById),
    }));

  return {
    width:
      OUTER_MARGIN * 2 +
      Math.max(1, Math.min(columns, moduleClusters.length || 1)) * MODULE_WIDTH +
      Math.max(0, Math.min(columns, moduleClusters.length || 1) - 1) *
        MODULE_HORIZONTAL_GAP,
    height:
      OUTER_MARGIN * 2 +
      rowHeights.reduce((total, height) => total + height, 0) +
      Math.max(0, rowHeights.length - 1) * MODULE_VERTICAL_GAP,
    nodes: laidOutNodes,
    edges,
  };
}

function getModuleOrder(
  model: LearningCourseMapModel,
  moduleNodes: LearningCourseMapNode[],
  lessonNodes: LearningCourseMapNode[]
): string[] {
  if (moduleNodes.length > 0) {
    return moduleNodes.map((node) => node.id);
  }

  const order: string[] = [];
  lessonNodes.forEach((node) => {
    if (!order.includes(node.moduleId)) {
      order.push(node.moduleId);
    }
  });
  if (order.length > 0) {
    return order;
  }

  model.nodes.forEach((node) => {
    if (!order.includes(node.moduleId)) {
      order.push(node.moduleId);
    }
  });
  return order;
}

function getLessonClusterHeight(childCount: number): number {
  if (childCount === 0) {
    return LESSON_HEIGHT;
  }

  return (
    LESSON_HEIGHT +
    LESSON_TO_CHILD_GAP +
    childCount * CHILD_HEIGHT +
    Math.max(0, childCount - 1) * CHILD_VERTICAL_GAP
  );
}

function getModuleClusterHeight(
  moduleNode: LearningCourseMapNode | null,
  lessonHeights: number[]
): number {
  const lessonsHeight =
    lessonHeights.reduce((total, height) => total + height, 0) +
    Math.max(0, lessonHeights.length - 1) * LESSON_VERTICAL_GAP;

  if (moduleNode === null) {
    return Math.max(LESSON_HEIGHT, lessonsHeight);
  }

  return Math.max(
    MODULE_TOP_PADDING + MODULE_CARD_HEIGHT + MODULE_BODY_TOP_GAP + MODULE_PADDING_BOTTOM,
    MODULE_TOP_PADDING +
      MODULE_CARD_HEIGHT +
      MODULE_BODY_TOP_GAP +
      lessonsHeight +
      MODULE_PADDING_BOTTOM
  );
}

function rowYForRow(rowHeights: number[], rowIndex: number): number {
  return (
    OUTER_MARGIN +
    rowHeights
      .slice(0, rowIndex)
      .reduce((total, height) => total + height + MODULE_VERTICAL_GAP, 0)
  );
}

function shouldRenderEdge(
  edge: LearningCourseMapEdge,
  nodesById: Map<string, LearningCourseMapLayoutNode>
): boolean {
  const from = nodesById.get(edge.fromId);
  const to = nodesById.get(edge.toId);
  if (!from || !to) return false;
  if (edge.kind === 'contains') {
    return from.kind === 'lesson' && (to.kind === 'exercise' || to.kind === 'checkpoint');
  }
  return true;
}

function buildEdgePath(
  edge: LearningCourseMapEdge,
  nodesById: Map<string, LearningCourseMapLayoutNode>
): string {
  const from = nodesById.get(edge.fromId);
  const to = nodesById.get(edge.toId);
  if (!from || !to) return '';

  if (edge.kind === 'contains') {
    const startX = from.frame.x + from.frame.width / 2;
    const startY = from.frame.y + from.frame.height;
    const endX = to.frame.x + 24;
    const endY = to.frame.y + to.frame.height / 2;
    const midY = startY + (endY - startY) / 2;
    return `M ${startX} ${startY} C ${startX} ${midY}, ${endX - 24} ${midY}, ${endX} ${endY}`;
  }

  if (from.moduleId === to.moduleId) {
    const startX = from.frame.x + from.frame.width * 0.7;
    const startY = from.frame.y + from.frame.height;
    const endX = to.frame.x + to.frame.width * 0.3;
    const endY = to.frame.y;
    const controlOffset = Math.max(28, (endY - startY) / 2);
    return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
  }

  const startX = from.frame.x + from.frame.width;
  const startY = from.frame.y + from.frame.height / 2;
  const endX = to.frame.x;
  const endY = to.frame.y + to.frame.height / 2;
  const controlOffset = Math.max(56, Math.abs(endX - startX) / 2);
  return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
}
