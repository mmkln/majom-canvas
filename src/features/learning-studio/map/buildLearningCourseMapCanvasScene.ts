import Connection from '../../canvas-core/core/shapes/Connection.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
  type IConnection,
} from '../../canvas-core/core/interfaces/connection.ts';
import type {
  LearningCanvasNode,
  LearningCanvasUnitNode,
} from '../canvas/learningCanvasNodes.ts';
import { LearningCheckpointNode } from '../canvas/LearningCheckpointNode.ts';
import { LearningExerciseNode } from '../canvas/LearningExerciseNode.ts';
import { LearningLessonNode } from '../canvas/LearningLessonNode.ts';
import { LearningModuleNode } from '../canvas/LearningModuleNode.ts';
import {
  LEARNING_CHILD_UNIT_HEIGHT,
  LEARNING_CHILD_UNIT_WIDTH,
  LEARNING_LESSON_HEIGHT,
  LEARNING_LESSON_WIDTH,
  LEARNING_MODULE_HEIGHT,
  LEARNING_MODULE_WIDTH,
} from '../canvas/LearningCanvasRenderConstants.ts';
import type {
  LearningCourseMapEdge,
  LearningCourseMapModel,
  LearningCourseMapNode,
  LearningCourseMapNodeState,
} from './courseMapModel.ts';

const OUTER_MARGIN = 64;
const MODULE_HEADER_HEIGHT = 56;
const MODULE_TOP_PADDING = 20;
const MODULE_HORIZONTAL_GAP = 96;
const MODULE_VERTICAL_GAP = 112;
const MODULE_PADDING_X = 24;
const MODULE_BODY_TOP_GAP = 20;
const MODULE_PADDING_BOTTOM = 24;
const LESSON_VERTICAL_GAP = 20;
const LESSON_TO_CHILD_GAP = 10;
const CHILD_VERTICAL_GAP = 8;
const CHILD_INDENT = 24;
const TWO_COLUMN_THRESHOLD = 2;

type BuildLearningCourseMapCanvasSceneArgs = {
  model: LearningCourseMapModel;
  labels: {
    structural: string;
    available: string;
    inProgress: string;
    completed: string;
    locked: string;
    review: string;
    hiddenChildren: (count: number) => string;
  };
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

export type LearningCourseMapCanvasSceneSnapshot = {
  nodes: LearningCanvasNode[];
  connections: IConnection[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
};

export function buildLearningCourseMapCanvasScene(
  args: BuildLearningCourseMapCanvasSceneArgs
): LearningCourseMapCanvasSceneSnapshot {
  const moduleNodes = args.model.nodes.filter((node) => node.kind === 'module');
  const lessonNodes = args.model.nodes.filter((node) => node.kind === 'lesson');
  const childNodes = args.model.nodes.filter(
    (node) => node.kind === 'exercise' || node.kind === 'checkpoint'
  );
  const childNodesByLessonId = new Map<string, LearningCourseMapNode[]>();

  childNodes.forEach((node) => {
    if (!node.parentId) return;
    const existing = childNodesByLessonId.get(node.parentId) ?? [];
    existing.push(node);
    childNodesByLessonId.set(node.parentId, existing);
  });

  const moduleOrder = getModuleOrder(args.model, moduleNodes, lessonNodes);
  const moduleNodeById = new Map(moduleNodes.map((node) => [node.id, node] as const));
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
      moduleNode: moduleNodeById.get(moduleId) ?? null,
      lessons,
      height: getModuleClusterHeight(
        moduleNodeById.get(moduleId) ?? null,
        lessons.map((cluster) => cluster.height)
      ),
    };
  });

  const nodes: LearningCanvasNode[] = [];
  const nodeById = new Map<string, LearningCanvasNode>();
  const columns = moduleClusters.length >= TWO_COLUMN_THRESHOLD ? 2 : 1;
  const rowCount = Math.ceil(moduleClusters.length / columns);
  const rowHeights: number[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const slice = moduleClusters.slice(rowIndex * columns, rowIndex * columns + columns);
    rowHeights.push(Math.max(...slice.map((cluster) => cluster.height)));
  }

  moduleClusters.forEach((cluster, index) => {
    const columnIndex = index % columns;
    const rowIndex = Math.floor(index / columns);
    const originX =
      OUTER_MARGIN + columnIndex * (LEARNING_MODULE_WIDTH + MODULE_HORIZONTAL_GAP);
    const originY = rowYForRow(rowHeights, rowIndex);

    const lessonCanvasNodes: LearningLessonNode[] = [];
    if (cluster.moduleNode) {
      const moduleNode = new LearningModuleNode({
        id: cluster.moduleNode.id,
        uuid: cluster.moduleNode.id,
        x: originX,
        y: originY,
        title: cluster.moduleNode.title,
        description: '',
        units: [],
        selected: cluster.moduleNode.id === args.model.focusedNodeId,
      });
      moduleNode.width = LEARNING_MODULE_WIDTH;
      moduleNode.height = Math.max(LEARNING_MODULE_HEIGHT, cluster.height);
      moduleNode.focused = cluster.moduleNode.id === args.model.focusedNodeId;
      moduleNode.highlighted =
        cluster.moduleNode.id === args.model.recommendedNodeId;
      nodes.push(moduleNode);
      nodeById.set(moduleNode.id, moduleNode);
    }

    let lessonY =
      originY +
      (cluster.moduleNode
        ? MODULE_TOP_PADDING + MODULE_HEADER_HEIGHT + MODULE_BODY_TOP_GAP
        : 0);

    cluster.lessons.forEach((lessonCluster, lessonIndex) => {
      const lessonNode = new LearningLessonNode({
        id: lessonCluster.lesson.id,
        uuid: lessonCluster.lesson.id,
        x: originX + MODULE_PADDING_X,
        y: lessonY,
        title: lessonCluster.lesson.title,
        description: buildLessonDescription(lessonCluster.lesson, args.labels),
        moduleId: cluster.moduleId,
        parentLessonId: null,
        prerequisiteLessonIds: getIncomingPrerequisiteIds(
          lessonCluster.lesson.id,
          args.model.edges
        ),
        selected: lessonCluster.lesson.id === args.model.focusedNodeId,
      });
      lessonNode.focused = lessonCluster.lesson.id === args.model.focusedNodeId;
      lessonNode.highlighted =
        lessonCluster.lesson.id === args.model.recommendedNodeId;
      nodes.push(lessonNode);
      lessonCanvasNodes.push(lessonNode);
      nodeById.set(lessonNode.id, lessonNode);

      let childY = lessonY + LEARNING_LESSON_HEIGHT + LESSON_TO_CHILD_GAP;
      lessonCluster.children.forEach((child, childIndex) => {
        const childNode = createChildUnitNode({
          node: child,
          x: originX + MODULE_PADDING_X + CHILD_INDENT,
          y: childY,
          moduleId: cluster.moduleId,
          parentLessonId: lessonCluster.lesson.id,
          description: buildChildDescription(child.state, args.labels),
          selected: child.id === args.model.focusedNodeId,
          highlighted: child.id === args.model.recommendedNodeId,
        });
        nodes.push(childNode);
        nodeById.set(childNode.id, childNode);
        childY += LEARNING_CHILD_UNIT_HEIGHT;
        if (childIndex < lessonCluster.children.length - 1) {
          childY += CHILD_VERTICAL_GAP;
        }
      });

      lessonY += lessonCluster.height;
      if (lessonIndex < cluster.lessons.length - 1) {
        lessonY += LESSON_VERTICAL_GAP;
      }
    });

    const moduleCanvasNode = cluster.moduleNode
      ? nodeById.get(cluster.moduleNode.id)
      : null;
    if (moduleCanvasNode instanceof LearningModuleNode) {
      moduleCanvasNode.units = [...lessonCanvasNodes];
      moduleCanvasNode.replaceOrderedLayoutChildren([...lessonCanvasNodes]);
    }
  });

  const connections = args.model.edges
    .filter((edge) => shouldRenderEdge(edge, nodeById))
    .map<IConnection>((edge) =>
      new Connection(
        edge.fromId,
        edge.toId,
        edge.id,
        ConnectionLineType.SShaped,
        edge.kind === 'prerequisite'
          ? ConnectionRelationType.Prerequisite
          : ConnectionRelationType.ParentChild
      )
    );

  const bounds = getSceneBounds(nodes);
  return {
    nodes,
    connections,
    bounds,
  };
}

function createChildUnitNode(args: {
  node: LearningCourseMapNode;
  x: number;
  y: number;
  moduleId: string;
  parentLessonId: string;
  description: string;
  selected: boolean;
  highlighted: boolean;
}): LearningCanvasUnitNode {
  if (args.node.kind === 'checkpoint') {
    const node = new LearningCheckpointNode({
      id: args.node.id,
      uuid: args.node.id,
      x: args.x,
      y: args.y,
      title: args.node.title,
      description: args.description,
      moduleId: args.moduleId,
      parentLessonId: args.parentLessonId,
      selected: args.selected,
    });
    node.focused = args.selected;
    node.highlighted = args.highlighted;
    return node;
  }

  const node = new LearningExerciseNode({
    id: args.node.id,
    uuid: args.node.id,
    x: args.x,
    y: args.y,
    title: args.node.title,
    description: args.description,
    moduleId: args.moduleId,
    parentLessonId: args.parentLessonId,
    selected: args.selected,
  });
  node.focused = args.selected;
  node.highlighted = args.highlighted;
  return node;
}

function buildLessonDescription(
  node: LearningCourseMapNode,
  labels: BuildLearningCourseMapCanvasSceneArgs['labels']
): string {
  const parts = [getProgressLabel(node.state, labels)];
  if (node.hiddenChildCount > 0) {
    parts.push(labels.hiddenChildren(node.hiddenChildCount));
  }
  return parts.filter((part) => part.length > 0).join(' · ');
}

function buildChildDescription(
  state: LearningCourseMapNodeState,
  labels: BuildLearningCourseMapCanvasSceneArgs['labels']
): string {
  return getProgressLabel(state, labels);
}

function getProgressLabel(
  state: LearningCourseMapNodeState,
  labels: BuildLearningCourseMapCanvasSceneArgs['labels']
): string {
  switch (state) {
    case 'completed':
      return labels.completed;
    case 'in_progress':
      return labels.inProgress;
    case 'locked':
      return labels.locked;
    case 'review':
      return labels.review;
    case 'available':
      return labels.available;
    case 'none':
    default:
      return labels.structural;
  }
}

function getIncomingPrerequisiteIds(
  lessonId: string,
  edges: LearningCourseMapEdge[]
): string[] {
  return edges
    .filter((edge) => edge.kind === 'prerequisite' && edge.toId === lessonId)
    .map((edge) => edge.fromId);
}

function shouldRenderEdge(
  edge: LearningCourseMapEdge,
  nodeById: ReadonlyMap<string, LearningCanvasNode>
): boolean {
  if (!nodeById.has(edge.fromId) || !nodeById.has(edge.toId)) {
    return false;
  }
  if (edge.kind === 'contains') {
    const fromNode = nodeById.get(edge.fromId);
    return !(fromNode instanceof LearningModuleNode);
  }
  return true;
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
    return LEARNING_LESSON_HEIGHT;
  }

  return (
    LEARNING_LESSON_HEIGHT +
    LESSON_TO_CHILD_GAP +
    childCount * LEARNING_CHILD_UNIT_HEIGHT +
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
    return Math.max(LEARNING_LESSON_HEIGHT, lessonsHeight);
  }

  return Math.max(
    LEARNING_MODULE_HEIGHT,
    MODULE_TOP_PADDING +
      MODULE_HEADER_HEIGHT +
      MODULE_BODY_TOP_GAP +
      lessonsHeight +
      MODULE_PADDING_BOTTOM
  );
}

function rowYForRow(rowHeights: number[], rowIndex: number): number {
  let y = OUTER_MARGIN;
  for (let index = 0; index < rowIndex; index += 1) {
    y += rowHeights[index] + MODULE_VERTICAL_GAP;
  }
  return y;
}

function getSceneBounds(nodes: LearningCanvasNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: LEARNING_MODULE_WIDTH,
      maxY: LEARNING_MODULE_HEIGHT,
      width: LEARNING_MODULE_WIDTH,
      height: LEARNING_MODULE_HEIGHT,
    };
  }

  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(LEARNING_CHILD_UNIT_WIDTH, maxX - minX),
    height: Math.max(LEARNING_CHILD_UNIT_HEIGHT, maxY - minY),
  };
}
