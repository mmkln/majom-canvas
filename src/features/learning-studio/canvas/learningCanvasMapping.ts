import { StoryLayoutService } from '../../canvas-core/core/services/StoryLayoutService.ts';
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
import type { LearningCanvasSelection } from './LearningCanvasHostApi.ts';
import { LearningCheckpointNode } from './LearningCheckpointNode.ts';
import { LearningExerciseNode } from './LearningExerciseNode.ts';
import { LearningLessonNode } from './LearningLessonNode.ts';
import { LearningModuleNode } from './LearningModuleNode.ts';
import type { LearningUnitNode } from './LearningUnitNode.ts';
import {
  isLearningUnitNode as isLearningCanvasUnitNode,
  isLearningModuleNode,
} from './learningCanvasNodes.ts';

const MODULE_STORY_WIDTH = 744;
const MODULE_STORY_MIN_HEIGHT = 252;
const storyLayoutService = new StoryLayoutService();

export type LearningCanvasSceneSnapshot = {
  elements: Array<LearningModuleNode | LearningUnitNode>;
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
  const elements: Array<LearningModuleNode | LearningUnitNode> = [];
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
    const story = new LearningModuleNode({
      id: module.id,
      uuid: module.id,
      x: layout.x,
      y: layout.y,
      width: MODULE_STORY_WIDTH,
      height: MODULE_STORY_MIN_HEIGHT,
      title: module.title || 'Untitled module',
      description: module.description,
      tasks: [],
      selected: selection?.kind === 'module' && selection.id === module.id,
    });

    const orderedUnits = flattenModuleUnits(content, module, unitsById).map(
      (unit) =>
        createLearningUnitNode(
          unit,
          selection?.kind === 'unit' && selection.id === unit.id
        )
    );

    const layoutPlan = storyLayoutService.planLayoutForOrderedTasks(
      story,
      orderedUnits,
      story.width,
      story.height
    );
    story.width = layoutPlan.nextWidth;
    story.height = layoutPlan.nextHeight;
    story.replaceOrderedLayoutChildren(layoutPlan.orderedTasks);
    layoutPlan.orderedTasks.forEach((task) => {
      const position = layoutPlan.positions.get(task.id);
      if (position) {
        task.x = position.x;
        task.y = position.y;
      }
    });

    elements.push(story, ...layoutPlan.orderedTasks);
  });

  content.units
    .filter((unit) => unit.parentLessonId === null && unit.type === 'lesson')
    .forEach((lesson) => {
      lesson.prerequisiteLessonIds.forEach((prerequisiteId) => {
        if (!unitsById.has(prerequisiteId)) return;
        connections.push(
          new Connection(
            prerequisiteId,
            lesson.id,
            `learning-prerequisite:${prerequisiteId}:${lesson.id}`,
            ConnectionLineType.SShaped,
            ConnectionRelationType.Blocks
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
  const stories = scene
    .getElements()
    .filter(isLearningModuleNode);
  const tasks = scene
    .getElements()
    .filter(isLearningCanvasUnitNode);
  return mergeElementsIntoLearningContent(content, stories, tasks, scene.getConnections());
}

export function mergeElementsIntoLearningContent(
  content: LearningCourseContent,
  stories: LearningModuleNode[],
  tasks: LearningUnitNode[],
  connections: IConnection[]
): LearningCourseContent {
  const originalModules = new Map(
    content.modules.map((module) => [module.id, module] as const)
  );
  const originalUnits = new Map(
    content.units.map((unit) => [unit.id, unit] as const)
  );
  const taskById = new Map(tasks.map((task) => [task.id, task] as const));
  const storyById = new Map(stories.map((story) => [story.id, story] as const));

  const nextModules = stories
    .slice()
    .sort((left, right) =>
      left.y === right.y ? left.x - right.x : left.y - right.y
    )
    .map((story, index) => {
      const original = originalModules.get(story.id);
      const lessonIds = story
        .getOrderedLayoutChildren()
        .map((task) => originalUnits.get(task.id))
        .filter(
          (unit): unit is LearningCourseUnit =>
            unit != null &&
            unit.parentLessonId === null &&
            unit.type === 'lesson'
        )
        .map((lesson) => lesson.id);
      return {
        id: story.id,
        title: story.title,
        description: story.description,
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

  const lessonTaskOrderById = new Map<string, number>();
  const childTaskOrderById = new Map<string, number>();
  nextModules.forEach((module) => {
    const story = storyById.get(module.id);
    if (!story) return;
    const storyTaskIds = story.getOrderedLayoutChildren().map((task) => task.id);
    const topLevelLessonIds = storyTaskIds.filter((taskId) => {
      const original = originalUnits.get(taskId);
      return original?.parentLessonId === null && original.type === 'lesson';
    });
    topLevelLessonIds.forEach((lessonId, index) => {
      lessonTaskOrderById.set(lessonId, index);
    });

    const childCounters = new Map<string, number>();
    storyTaskIds.forEach((taskId) => {
      const original = originalUnits.get(taskId);
      if (!original || original.parentLessonId === null) return;
      const parentLessonId = original.parentLessonId;
      const nextIndex = childCounters.get(parentLessonId) ?? 0;
      childTaskOrderById.set(taskId, nextIndex);
      childCounters.set(parentLessonId, nextIndex + 1);
    });
  });

  const prerequisiteMap = new Map<string, Set<string>>();
  connections.forEach((connection) => {
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
    .filter((unit) => taskById.has(unit.id))
    .map((unit) => {
      const task = taskById.get(unit.id)!;
      const nextModuleId =
        unit.parentLessonId === null
          ? moduleIdByLessonId.get(unit.id) ?? unit.moduleId
          : moduleIdByLessonId.get(unit.parentLessonId) ?? unit.moduleId;
      return {
        ...unit,
        moduleId: nextModuleId,
        title: task.title,
        description: task.description,
        order:
          unit.parentLessonId === null
            ? lessonTaskOrderById.get(unit.id) ?? unit.order
            : childTaskOrderById.get(unit.id) ?? unit.order,
        prerequisiteLessonIds:
          unit.parentLessonId === null && unit.type === 'lesson'
            ? Array.from(prerequisiteMap.get(unit.id) ?? [])
            : unit.prerequisiteLessonIds,
      };
    });

  const nextModuleLayouts = nextModules.map((module, index) => {
    const story = storyById.get(module.id)!;
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
      x: story.x,
      y: story.y,
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
): LearningUnitNode {
  const shared = {
    id: unit.id,
    uuid: unit.id,
    title: unit.title || 'Untitled unit',
    description: unit.description,
    moduleId: unit.moduleId,
    parentLessonId: unit.parentLessonId,
    selected,
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
