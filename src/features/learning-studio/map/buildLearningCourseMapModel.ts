import type {
  LearningCourseContent,
  LearningCourseModule,
  LearningCourseUnit,
  LearningProgressState,
} from '../domain/types.ts';
import {
  createDefaultLearningCourseMapPresentation,
  type LearningCourseMapEdge,
  type LearningCourseMapModel,
  type LearningCourseMapNode,
  type LearningCourseMapNodeKind,
  type LearningCourseMapPresentation,
} from './courseMapModel.ts';

type BuildLearningCourseMapModelArgs = {
  content: LearningCourseContent;
  progressByUnitId: Record<string, LearningProgressState>;
  focusedUnitId: string | null;
  recommendedUnitId: string | null;
  labels: {
    module: string;
    lesson: string;
    exercise: string;
    checkpoint: string;
  };
  presentation?: Partial<LearningCourseMapPresentation>;
};

export function buildLearningCourseMapModel(
  args: BuildLearningCourseMapModelArgs
): LearningCourseMapModel {
  const presentation = {
    ...createDefaultLearningCourseMapPresentation(),
    ...args.presentation,
    promotedUnitIds: args.presentation?.promotedUnitIds ?? [],
    hiddenNodeIds: args.presentation?.hiddenNodeIds ?? [],
    manualNodePositions: args.presentation?.manualNodePositions ?? {},
  };
  const nodes: LearningCourseMapNode[] = [];
  const edges: LearningCourseMapEdge[] = [];
  const visibleNodeIds = new Set<string>();
  const topLevelLessons = getTopLevelLessons(args.content);
  const topLevelLessonIds = new Set(topLevelLessons.map((lesson) => lesson.id));

  args.content.modules
    .slice()
    .sort((left, right) => left.order - right.order)
    .forEach((module) => {
      const moduleLessons = getModuleLessons(args.content, module);
      const visibleChildren = moduleLessons.flatMap((lesson) =>
        getVisibleChildUnits(lesson, args.content, presentation)
      );

      if (presentation.showModules && !presentation.hiddenNodeIds.includes(module.id)) {
        nodes.push(
          createNode({
            id: module.id,
            kind: 'module',
            title: fallbackTitle(module.title, args.labels.module),
            moduleId: module.id,
            parentId: null,
            state: 'none',
            isFocused: false,
            isRecommended: false,
            childCount: moduleLessons.length,
            hiddenChildCount: moduleLessons.length + visibleChildren.length,
            position: presentation.manualNodePositions[module.id] ?? null,
          })
        );
        visibleNodeIds.add(module.id);
      }

      moduleLessons.forEach((lesson) => {
        const lessonNode = createNode({
          id: lesson.id,
          kind: 'lesson',
          title: fallbackTitle(lesson.title, args.labels.lesson),
          moduleId: module.id,
          parentId: presentation.showModules ? module.id : null,
          state: args.progressByUnitId[lesson.id] ?? 'available',
          isFocused: lesson.id === args.focusedUnitId,
          isRecommended: lesson.id === args.recommendedUnitId,
          childCount: getLessonChildUnits(lesson, args.content).length,
          hiddenChildCount:
            getLessonChildUnits(lesson, args.content).length -
            getVisibleChildUnits(lesson, args.content, presentation).length,
          position: presentation.manualNodePositions[lesson.id] ?? null,
        });
        nodes.push(lessonNode);
        visibleNodeIds.add(lesson.id);

        if (presentation.showModules && visibleNodeIds.has(module.id)) {
          edges.push({
            id: `${module.id}->${lesson.id}:contains`,
            kind: 'contains',
            fromId: module.id,
            toId: lesson.id,
          });
        }

        getVisibleChildUnits(lesson, args.content, presentation).forEach((unit) => {
          const unitKind = unit.type as Extract<
            LearningCourseMapNodeKind,
            'exercise' | 'checkpoint'
          >;
          nodes.push(
            createNode({
              id: unit.id,
              kind: unitKind,
              title: fallbackTitle(
                unit.title,
                unit.type === 'checkpoint'
                  ? args.labels.checkpoint
                  : args.labels.exercise
              ),
              moduleId: module.id,
              parentId: lesson.id,
              state: args.progressByUnitId[unit.id] ?? 'available',
              isFocused: unit.id === args.focusedUnitId,
              isRecommended: unit.id === args.recommendedUnitId,
              childCount: 0,
              hiddenChildCount: 0,
              position: presentation.manualNodePositions[unit.id] ?? null,
            })
          );
          visibleNodeIds.add(unit.id);
          edges.push({
            id: `${lesson.id}->${unit.id}:contains`,
            kind: 'contains',
            fromId: lesson.id,
            toId: unit.id,
          });
        });
      });
    });

  topLevelLessons.forEach((lesson) => {
    lesson.prerequisiteLessonIds.forEach((prerequisiteId) => {
      if (!topLevelLessonIds.has(prerequisiteId)) return;
      if (!visibleNodeIds.has(prerequisiteId) || !visibleNodeIds.has(lesson.id)) return;
      edges.push({
        id: `${prerequisiteId}->${lesson.id}:prerequisite`,
        kind: 'prerequisite',
        fromId: prerequisiteId,
        toId: lesson.id,
      });
    });
  });

  const focusedNodeId = resolveVisibleNodeId(nodes, args.focusedUnitId, args.content);
  const recommendedNodeId = resolveVisibleNodeId(
    nodes,
    args.recommendedUnitId,
    args.content
  );

  return {
    layoutMode: presentation.layoutMode,
    presentation,
    nodes: nodes.map((node) => ({
      ...node,
      isFocused: node.id === focusedNodeId,
      isRecommended: node.id === recommendedNodeId,
    })),
    edges,
    focusedNodeId,
    recommendedNodeId,
  };
}

function createNode(node: LearningCourseMapNode): LearningCourseMapNode {
  return node;
}

function getTopLevelLessons(content: LearningCourseContent): LearningCourseUnit[] {
  return content.units
    .filter((unit) => unit.type === 'lesson' && unit.parentLessonId === null)
    .slice()
    .sort((left, right) =>
      left.moduleId === right.moduleId
        ? left.order - right.order
        : left.moduleId.localeCompare(right.moduleId)
    );
}

function getModuleLessons(
  content: LearningCourseContent,
  module: LearningCourseModule
): LearningCourseUnit[] {
  return content.units
    .filter(
      (unit) =>
        unit.moduleId === module.id &&
        unit.type === 'lesson' &&
        unit.parentLessonId === null
    )
    .slice()
    .sort((left, right) => left.order - right.order);
}

function getLessonChildUnits(
  lesson: LearningCourseUnit,
  content: LearningCourseContent
): LearningCourseUnit[] {
  return content.units
    .filter((unit) => unit.parentLessonId === lesson.id)
    .slice()
    .sort((left, right) => left.order - right.order);
}

function getVisibleChildUnits(
  lesson: LearningCourseUnit,
  content: LearningCourseContent,
  presentation: LearningCourseMapPresentation
): LearningCourseUnit[] {
  return getLessonChildUnits(lesson, content).filter((unit) => {
    if (presentation.hiddenNodeIds.includes(unit.id)) {
      return false;
    }
    if (presentation.promotedUnitIds.includes(unit.id)) {
      return true;
    }
    switch (presentation.childUnitVisibility) {
      case 'all_child_units':
        return true;
      case 'important_only':
        return unit.type === 'checkpoint';
      case 'auto':
      default:
        return false;
    }
  });
}

function resolveVisibleNodeId(
  nodes: LearningCourseMapNode[],
  requestedId: string | null,
  content: LearningCourseContent
): string | null {
  if (!requestedId) return null;
  if (nodes.some((node) => node.id === requestedId)) {
    return requestedId;
  }

  const unit = content.units.find((candidate) => candidate.id === requestedId);
  if (!unit) return null;
  if (unit.parentLessonId && nodes.some((node) => node.id === unit.parentLessonId)) {
    return unit.parentLessonId;
  }
  if (nodes.some((node) => node.id === unit.moduleId)) {
    return unit.moduleId;
  }
  return null;
}

function fallbackTitle(title: string, fallback: string): string {
  return title.trim().length > 0 ? title : fallback;
}
