import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { GoalElement } from '../GoalElement.ts';
import { HabitElement } from '../HabitElement.ts';
import { StoryElement } from '../StoryElement.ts';
import { TaskElement } from '../TaskElement.ts';

export type CanvasPlanningElement =
  | TaskElement
  | StoryElement
  | GoalElement
  | HabitElement;

export type RelationPlanningElement =
  | TaskElement
  | StoryElement
  | GoalElement
  | HabitElement;

export type CanvasPlanningElementKind = 'task' | 'story' | 'goal' | 'habit';

export type PlanningElementCapabilities = {
  supportsPriority: boolean;
  supportsLifecycleStatus: boolean;
  supportsDailyCompletion: boolean;
  supportsRelations: boolean;
  supportsPermanentDelete: boolean;
  supportsDuplication: boolean;
  supportsAiActions: boolean;
};

const DEFAULT_CAPABILITIES: Record<
  CanvasPlanningElementKind,
  PlanningElementCapabilities
> = {
  task: {
    supportsPriority: true,
    supportsLifecycleStatus: true,
    supportsDailyCompletion: false,
    supportsRelations: true,
    supportsPermanentDelete: true,
    supportsDuplication: true,
    supportsAiActions: true,
  },
  story: {
    supportsPriority: true,
    supportsLifecycleStatus: true,
    supportsDailyCompletion: false,
    supportsRelations: true,
    supportsPermanentDelete: true,
    supportsDuplication: true,
    supportsAiActions: true,
  },
  goal: {
    supportsPriority: true,
    supportsLifecycleStatus: true,
    supportsDailyCompletion: false,
    supportsRelations: true,
    supportsPermanentDelete: true,
    supportsDuplication: true,
    supportsAiActions: true,
  },
  habit: {
    supportsPriority: false,
    supportsLifecycleStatus: false,
    supportsDailyCompletion: true,
    supportsRelations: true,
    supportsPermanentDelete: true,
    supportsDuplication: true,
    supportsAiActions: false,
  },
};

export function isCanvasPlanningElement(
  element: unknown
): element is CanvasPlanningElement {
  return (
    element instanceof TaskElement ||
    element instanceof StoryElement ||
    element instanceof GoalElement ||
    element instanceof HabitElement
  );
}

export function isTaskStoryGoalPlanningElement(
  element: unknown
): element is TaskElement | StoryElement | GoalElement {
  return (
    element instanceof TaskElement ||
    element instanceof StoryElement ||
    element instanceof GoalElement
  );
}

export function isHabitElement(element: unknown): element is HabitElement {
  return element instanceof HabitElement;
}

export function isRelationPlanningElement(
  element: unknown
): element is RelationPlanningElement {
  return isCanvasPlanningElement(element);
}

export function getPlanningElementKind(
  element: CanvasPlanningElement
): CanvasPlanningElementKind {
  if (element instanceof TaskElement) return 'task';
  if (element instanceof StoryElement) return 'story';
  if (element instanceof GoalElement) return 'goal';
  return 'habit';
}

export function getPlanningElementCapabilities(
  element: CanvasPlanningElement
): PlanningElementCapabilities {
  return DEFAULT_CAPABILITIES[getPlanningElementKind(element)];
}

export function selectionSupportsLifecycleStatus(
  elements: CanvasPlanningElement[]
): elements is Array<TaskElement | StoryElement | GoalElement> {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsLifecycleStatus
    )
  );
}

export function selectionSupportsDailyCompletion(
  elements: CanvasPlanningElement[]
): elements is HabitElement[] {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsDailyCompletion
    )
  );
}

export function selectionSupportsRelations(
  elements: CanvasPlanningElement[]
): elements is RelationPlanningElement[] {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsRelations
    )
  );
}

export function selectionSupportsPermanentDelete(
  elements: CanvasPlanningElement[]
): boolean {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsPermanentDelete
    )
  );
}

export function selectionSupportsDuplication(
  elements: CanvasPlanningElement[]
): boolean {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsDuplication
    )
  );
}

export function selectionSupportsAiActions(
  elements: CanvasPlanningElement[]
): elements is Array<TaskElement | StoryElement | GoalElement> {
  return (
    elements.length > 0 &&
    elements.every((element) =>
      getPlanningElementCapabilities(element).supportsAiActions
    )
  );
}

export function getHabitLifecycleStatus(
  status: Status
): Status.Active | Status.Archived {
  return status === Status.Archived ? Status.Archived : Status.Active;
}
