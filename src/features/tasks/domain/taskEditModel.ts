import {
  type Goal,
  Priority,
  Status,
  type PlatformTask,
  type Story,
} from '../../../majom-wrapper/interfaces/index.ts';

export type TaskEditRelationOption = {
  id: number;
  uuid?: string;
  title: string;
  status?: Status;
  goalId?: number | null;
  goal?: TaskEditRelationOption | null;
};

export type TaskEditModel = {
  id: PlatformTask['id'];
  uuid?: PlatformTask['uuid'];
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  isCompleted: boolean;
  goalId: number | null;
  goal: TaskEditRelationOption | null;
  storyId: number | null;
  story: TaskEditRelationOption | null;
};

export type TaskEditPatch = Partial<{
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  isCompleted: boolean;
  goalId: number | null;
  storyId: number | null;
}>;

export type TaskEditCapabilities = Partial<{
  description: boolean;
  status: boolean;
  priority: boolean;
  dueDate: boolean;
  goal: boolean;
  story: boolean;
  delete: boolean;
}>;

export const TASK_EDIT_STATUS_VALUES = [
  Status.Draft,
  Status.Described,
  Status.Active,
  Status.Completed,
  Status.Archived,
  Status.Cancelled,
] as const;

export const TASK_EDIT_PRIORITY_VALUES = [
  Priority.Lowest,
  Priority.Low,
  Priority.Medium,
  Priority.High,
  Priority.Highest,
] as const;

export function normalizeTaskEditModel(task: PlatformTask): TaskEditModel {
  const goalId = task.goal?.id ?? task.goal_id ?? null;
  const goal = normalizeTaskEditGoalOption(task.goal);
  const story = normalizeTaskEditStoryOption(task.story, goal);

  return {
    id: task.id,
    uuid: task.uuid,
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: normalizeDateValue(task.due_date),
    isCompleted: task.is_completed,
    goalId,
    goal,
    storyId: task.story?.id ?? task.story_id ?? null,
    story,
  };
}

export function normalizeTaskEditPatch(
  patch: TaskEditPatch
): TaskEditPatch {
  const normalized: TaskEditPatch = {};
  if (patch.title !== undefined) {
    normalized.title = patch.title.trim();
  }
  if (patch.description !== undefined) {
    normalized.description = patch.description;
  }
  if (patch.status !== undefined) {
    normalized.status = patch.status;
    if (patch.isCompleted === undefined) {
      normalized.isCompleted =
        patch.status === Status.Completed || patch.status === Status.Archived;
    }
  }
  if (patch.priority !== undefined) {
    normalized.priority = patch.priority;
  }
  if (patch.dueDate !== undefined) {
    normalized.dueDate = patch.dueDate;
  }
  if (patch.isCompleted !== undefined) {
    normalized.isCompleted = patch.isCompleted;
  }
  if (patch.goalId !== undefined) {
    normalized.goalId = patch.goalId;
  }
  if (patch.storyId !== undefined) {
    normalized.storyId = patch.storyId;
  }
  return normalized;
}

export function createTaskEditPatch(
  original: TaskEditModel,
  next: TaskEditModel
): TaskEditPatch {
  const patch: TaskEditPatch = {};
  if (next.title.trim() !== original.title) {
    patch.title = next.title.trim();
  }
  if (next.description !== original.description) {
    patch.description = next.description;
  }
  if (next.status !== original.status) {
    patch.status = next.status;
  }
  if (next.priority !== original.priority) {
    patch.priority = next.priority;
  }
  if (next.dueDate !== original.dueDate) {
    patch.dueDate = next.dueDate;
  }
  if (next.goalId !== original.goalId) {
    patch.goalId = next.goalId;
  }
  if (next.storyId !== original.storyId) {
    patch.storyId = next.storyId;
  }
  return normalizeTaskEditPatch(patch);
}

export function isTaskEditPatchEmpty(patch: TaskEditPatch): boolean {
  return Object.keys(patch).length === 0;
}

export function applyTaskEditPatch(
  task: TaskEditModel,
  patch: TaskEditPatch
): TaskEditModel {
  return {
    ...task,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description }
      : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
    ...(patch.isCompleted !== undefined
      ? { isCompleted: patch.isCompleted }
      : {}),
    ...(patch.goalId !== undefined
      ? { goalId: patch.goalId, goal: patch.goalId === task.goal?.id ? task.goal : null }
      : {}),
    ...(patch.storyId !== undefined
      ? {
          storyId: patch.storyId,
          story: patch.storyId === task.story?.id ? task.story : null,
        }
      : {}),
  };
}

export function setTaskEditGoal(
  task: TaskEditModel,
  goal: TaskEditRelationOption | null
): TaskEditModel {
  const goalId = goal?.id ?? null;
  const storyMatchesGoal =
    goalId !== null && task.story?.goalId !== undefined
      ? task.story.goalId === goalId
      : false;
  return {
    ...task,
    goal,
    goalId,
    story: storyMatchesGoal ? task.story : null,
    storyId: storyMatchesGoal ? task.storyId : null,
  };
}

export function setTaskEditStory(
  task: TaskEditModel,
  story: TaskEditRelationOption | null
): TaskEditModel {
  if (!story) {
    return {
      ...task,
      story: null,
      storyId: null,
    };
  }

  const goal = story.goal ?? task.goal;
  const goalId = story.goalId ?? goal?.id ?? task.goalId;
  return {
    ...task,
    story,
    storyId: story.id,
    goal: goal?.id === goalId ? goal : null,
    goalId: goalId ?? null,
  };
}

export function normalizeTaskEditGoalOption(
  goal: Goal | null | undefined
): TaskEditRelationOption | null {
  if (!goal) return null;
  return {
    id: goal.id,
    uuid: goal.uuid,
    title: goal.title,
    status: goal.status,
  };
}

export function normalizeTaskEditStoryOption(
  story: Story | null | undefined,
  fallbackGoal: TaskEditRelationOption | null = null
): TaskEditRelationOption | null {
  if (!story) return null;
  const goal = normalizeTaskEditGoalOption(story.goal) ?? fallbackGoal;
  return {
    id: story.id,
    uuid: story.uuid,
    title: story.title,
    status: story.status,
    goalId: story.goal?.id ?? story.goal_id ?? goal?.id ?? null,
    goal,
  };
}

function normalizeDateValue(value: PlatformTask['due_date']): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}
