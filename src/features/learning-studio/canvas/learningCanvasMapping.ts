import Connection from '../../canvas-core/core/shapes/Connection.ts';
import {
  ConnectionLineType,
  ConnectionRelationType,
  type IConnection,
} from '../../canvas-core/core/interfaces/connection.ts';
import type { Scene } from '../../canvas-core/core/scene/Scene.ts';
import type {
  LearningCourseContent,
  LearningCourseModule,
  LearningCourseUnit,
} from '../domain/types.ts';
import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import {
  LEARNING_MODULE_HEIGHT,
  LEARNING_MODULE_WIDTH,
  LEARNING_CHILD_UNIT_HEIGHT,
  LEARNING_LESSON_HEIGHT,
} from './LearningCanvasRenderConstants.ts';
import {
  type LearningCanvasUnitNode,
  isLearningUnitNode as isLearningCanvasUnitNode,
  isLearningModuleNode,
} from './learningCanvasNodes.ts';

const MODULE_HORIZONTAL_GAP = 72;
const MODULE_HEADER_HEIGHT = 56;
const MODULE_PADDING_X = 24;
const MODULE_BODY_TOP_GAP = 20;
const MODULE_PADDING_BOTTOM = 20;
const LESSON_VERTICAL_GAP = 20;
const LESSON_TO_CHILD_GAP = 10;
const CHILD_VERTICAL_GAP = 8;
const CHILD_INDENT = 24;

type LearningCanvasSelection =
  | { kind: 'course'; id: string }
  | { kind: 'module'; id: string }
  | { kind: 'unit'; id: string };

export type LearningCanvasSceneSnapshot = {
  elements: Array<LearningModuleNode | LearningCanvasUnitNode>;
  connections: IConnection[];
};

export function buildLearningCanvasScene(
  content: LearningCourseContent,
  selection: LearningCanvasSelection | null = null
): LearningCanvasSceneSnapshot {
  const orderedModules = content.modules
    .slice()
    .sort((left, right) => left.order - right.order);
  const unitsById = new Map(content.units.map((unit) => [unit.id, unit] as const));
  const elements: Array<LearningModuleNode | LearningCanvasUnitNode> = [];
  const connections: IConnection[] = [];

  orderedModules.forEach((module, index) => {
    const layout =
      content.moduleLayouts.find((candidate) => candidate.moduleId === module.id) ??
      {
        moduleId: module.id,
        x: 64 + (index % 2) * 820,
        y: 64 + Math.floor(index / 2) * 420,
        collapsed: false,
      };
    const moduleNode = new LearningModuleNode({
      id: module.id,
      uuid: module.id,
      x: layout.x,
      y: layout.y,
      title: module.title || 'Untitled module',
      description: module.description,
      units: [],
      selected: selection?.kind === 'module' && selection.id === module.id,
    });

    const orderedUnits = flattenModuleUnits(content, module, unitsById).map(
      (unit) =>
        createLearningUnitNode(
          unit,
          selection?.kind === 'unit' && selection.id === unit.id
        )
    );
    moduleNode.width = LEARNING_MODULE_WIDTH;
    moduleNode.replaceOrderedLayoutChildren(orderedUnits);
    const startY = layout.y + MODULE_HEADER_HEIGHT + MODULE_BODY_TOP_GAP;
    let previousKind: 'lesson' | 'child' | null = null;
    let bottomY = startY;
    orderedUnits.forEach((unitNode) => {
      const isChildUnit = unitNode.parentLessonId !== null;
      const gap =
        previousKind == null
          ? 0
          : isChildUnit
            ? previousKind === 'lesson'
              ? LESSON_TO_CHILD_GAP
              : CHILD_VERTICAL_GAP
            : LESSON_VERTICAL_GAP;
      const nextY = previousKind == null ? startY : bottomY + gap;
      unitNode.x =
        layout.x +
        MODULE_PADDING_X +
        (isChildUnit ? CHILD_INDENT : 0);
      unitNode.y = nextY;
      bottomY = unitNode.y + unitNode.height;
      previousKind = isChildUnit ? 'child' : 'lesson';
    });
    moduleNode.height = Math.max(
      LEARNING_MODULE_HEIGHT,
      bottomY - layout.y + MODULE_PADDING_BOTTOM
    );

    elements.push(moduleNode, ...orderedUnits);
  });

  content.units
    .filter((unit) => unit.parentLessonId === null && unit.type === 'lesson')
    .forEach((lesson) => {
      /*
       * UX contract from docs:
       * - Prerequisite is a dependency, not a content node.
       * - It connects top-level lessons only; it should not be used as the
       *   primary structure between modules, lessons, and child units.
       * - It should read as an exception, a conditional dependency, and a
       *   cross-structure rule, not as the main structure of the course.
       * - Final visual treatment should be a thin, restrained, low-contrast
       *   directional line that supports interpretation without dominating
       *   the board.
       * - It should be directional enough to read flow, while still staying
       *   quieter than node borders and primary structure.
       * - It should stay lower-contrast than node borders and support reading,
       *   not turn the board into a line-first diagram or diagrammatic theater.
       * - Visibility should stay restrained by default and become clearer only
       *   when needed for interpretation of a relevant selected lesson.
       * - Prerequisite editing is a secondary lesson-level action, not primary
       *   persistent node chrome.
       *
       * Current implementation state:
       * - prerequisites are emitted structurally here and rendered with a
       *   restrained learning-specific connection treatment in canvas-core
       * - dense visibility policies can still evolve later without changing the
       *   structural ownership encoded here
       */
      lesson.prerequisiteLessonIds.forEach((prerequisiteId) => {
        if (!unitsById.has(prerequisiteId)) return;
        connections.push(
          new Connection(
            prerequisiteId,
            lesson.id,
            `learning-prerequisite:${prerequisiteId}:${lesson.id}`,
            ConnectionLineType.SShaped,
            ConnectionRelationType.Prerequisite
          )
        );
      });
    });

  return { elements, connections };
}

export async function hydrateLearningCanvasScene(
  scene: Scene,
  content: LearningCourseContent
): Promise<void> {
  const snapshot = buildLearningCanvasScene(content);
  scene.clear();
  snapshot.elements.forEach((element) => scene.addElement(element));
  snapshot.connections.forEach((connection) => scene.addElement(connection));
}

export function mergeSceneIntoLearningContent(
  content: LearningCourseContent,
  scene: Scene
): LearningCourseContent {
  const moduleNodes = scene
    .getElements()
    .filter(isLearningModuleNode);
  const unitNodes = scene
    .getElements()
    .filter(isLearningCanvasUnitNode);
  return mergeElementsIntoLearningContent(
    content,
    moduleNodes,
    unitNodes,
    scene.getConnections()
  );
}

export function mergeElementsIntoLearningContent(
  content: LearningCourseContent,
  moduleNodes: LearningModuleNode[],
  unitNodes: LearningCanvasUnitNode[],
  connections: IConnection[]
): LearningCourseContent {
  const originalModules = new Map(
    content.modules.map((module) => [module.id, module] as const)
  );
  const originalUnits = new Map(
    content.units.map((unit) => [unit.id, unit] as const)
  );
  const unitById = new Map(unitNodes.map((unit) => [unit.id, unit] as const));
  const moduleById = new Map(moduleNodes.map((module) => [module.id, module] as const));

  const nextModules = moduleNodes
    .slice()
    .sort((left, right) =>
      left.y === right.y ? left.x - right.x : left.y - right.y
    )
    .map((module, index) => {
      const original = originalModules.get(module.id);
      const lessonIds = module
        .getOrderedLayoutChildren()
        .map((unit) => originalUnits.get(unit.id))
        .filter(
          (unit): unit is LearningCourseUnit =>
            unit != null &&
            unit.parentLessonId === null &&
            unit.type === 'lesson'
        )
        .map((lesson) => lesson.id);
      return {
        id: module.id,
        title: module.title,
        description: module.description,
        order: index,
        lessonIds,
        ...(original
          ? {}
          : {
              lessonIds,
            }),
      } satisfies LearningCourseModule;
    });

  const moduleIdByLessonId = new Map<string, string>();
  nextModules.forEach((module) => {
    module.lessonIds.forEach((lessonId) => {
      moduleIdByLessonId.set(lessonId, module.id);
    });
  });

  const lessonOrderById = new Map<string, number>();
  const childOrderById = new Map<string, number>();
  nextModules.forEach((module) => {
    const moduleNode = moduleById.get(module.id);
    if (!moduleNode) return;
    const moduleUnitIds = moduleNode.getOrderedLayoutChildren().map((unit) => unit.id);
    const topLevelLessonIds = moduleUnitIds.filter((unitId) => {
      const original = originalUnits.get(unitId);
      return original?.parentLessonId === null && original.type === 'lesson';
    });
    topLevelLessonIds.forEach((lessonId, index) => {
      lessonOrderById.set(lessonId, index);
    });

    const childCounters = new Map<string, number>();
    moduleUnitIds.forEach((unitId) => {
      const original = originalUnits.get(unitId);
      if (!original || original.parentLessonId === null) return;
      const parentLessonId = original.parentLessonId;
      const nextIndex = childCounters.get(parentLessonId) ?? 0;
      childOrderById.set(unitId, nextIndex);
      childCounters.set(parentLessonId, nextIndex + 1);
    });
  });

  const prerequisiteMap = new Map<string, Set<string>>();
  connections.forEach((connection) => {
    if (
      connection.relationType !== ConnectionRelationType.Prerequisite &&
      connection.relationType !== ConnectionRelationType.Blocks
    ) {
      return;
    }
    const from = originalUnits.get(connection.fromId);
    const to = originalUnits.get(connection.toId);
    if (!from || !to) return;
    if (
      from.parentLessonId !== null ||
      to.parentLessonId !== null ||
      from.type !== 'lesson' ||
      to.type !== 'lesson'
    ) {
      return;
    }
    if (!prerequisiteMap.has(to.id)) {
      prerequisiteMap.set(to.id, new Set<string>());
    }
    prerequisiteMap.get(to.id)!.add(from.id);
  });

  const nextUnits = content.units
    .filter((unit) => unitById.has(unit.id))
    .map((unit) => {
      const unitNode = unitById.get(unit.id)!;
      const nextModuleId =
        unit.parentLessonId === null
          ? moduleIdByLessonId.get(unit.id) ?? unit.moduleId
          : moduleIdByLessonId.get(unit.parentLessonId) ?? unit.moduleId;
      return {
        ...unit,
        moduleId: nextModuleId,
        title: unitNode.title,
        description: unitNode.description,
        order:
          unit.parentLessonId === null
            ? lessonOrderById.get(unit.id) ?? unit.order
            : childOrderById.get(unit.id) ?? unit.order,
        prerequisiteLessonIds:
          unit.parentLessonId === null && unit.type === 'lesson'
            ? Array.from(prerequisiteMap.get(unit.id) ?? [])
            : unit.prerequisiteLessonIds,
      };
    });

  const nextModuleLayouts = nextModules.map((module, index) => {
    const moduleNode = moduleById.get(module.id)!;
    const existingLayout =
      content.moduleLayouts.find((layout) => layout.moduleId === module.id) ??
      {
        moduleId: module.id,
        x: 64 + (index % 2) * 820,
        y: 64 + Math.floor(index / 2) * 420,
        collapsed: false,
      };
    return {
      ...existingLayout,
      x: moduleNode.x,
      y: moduleNode.y,
    };
  });

  return {
    ...content,
    modules: nextModules,
    units: nextUnits,
    moduleLayouts: nextModuleLayouts,
  };
}

function flattenModuleUnits(
  content: LearningCourseContent,
  module: LearningCourseModule,
  unitsById: ReadonlyMap<string, LearningCourseUnit>
): LearningCourseUnit[] {
  const topLevelLessons = (module.lessonIds.length > 0
    ? module.lessonIds
        .map((lessonId) => unitsById.get(lessonId) ?? null)
        .filter((unit): unit is LearningCourseUnit => unit !== null)
    : content.units
        .filter(
          (unit) => unit.moduleId === module.id && unit.parentLessonId === null
        )
        .slice()
        .sort((left, right) => left.order - right.order)
  ).filter((unit) => unit.type === 'lesson');

  const result: LearningCourseUnit[] = [];
  topLevelLessons.forEach((lesson) => {
    result.push(lesson);
    const childUnits = content.units
      .filter((unit) => unit.parentLessonId === lesson.id)
      .slice()
      .sort((left, right) => left.order - right.order);
    result.push(...childUnits);
  });
  return result;
}

function createLearningUnitNode(
  unit: LearningCourseUnit,
  selected = false
): LearningCanvasUnitNode {
  const shared = {
    id: unit.id,
    uuid: unit.id,
    title: unit.title || 'Untitled unit',
    description: unit.description,
    moduleId: unit.moduleId,
    parentLessonId: unit.parentLessonId,
    selected,
    prerequisiteLessonIds:
      unit.type === 'lesson' ? unit.prerequisiteLessonIds : [],
  };

  switch (unit.type) {
    case 'lesson':
      return new LearningLessonNode({
        ...shared,
        parentLessonId: null,
      });
    case 'exercise':
      return new LearningExerciseNode({
        ...shared,
        parentLessonId: unit.parentLessonId ?? '',
      });
    case 'checkpoint':
      return new LearningCheckpointNode({
        ...shared,
        parentLessonId: unit.parentLessonId ?? '',
      });
  }
}
