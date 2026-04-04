import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';

export type TaskStoryLinkSnapshot = {
  taskRef: string;
  taskUuid: string | null;
  storyRef: string | null;
  storyUuid: string | null;
};

export type StoryGoalLinkSnapshot = {
  storyRef: string;
  storyUuid: string | null;
  goalRef: string;
  goalUuid: string | null;
};

export type TaskStoryLinkLifecycleDetail = {
  kind: 'task-story';
  action: 'set';
  taskStoryLink: TaskStoryLinkSnapshot;
};

export type StoryGoalLinkLifecycleDetail = {
  kind: 'story-goal';
  action: 'set';
  storyGoalLink: StoryGoalLinkSnapshot;
};

export type CanvasLinkLifecycleDetail =
  | TaskStoryLinkLifecycleDetail
  | StoryGoalLinkLifecycleDetail;

export const CANVAS_LINK_LIFECYCLE_EVENT = 'canvasLinkLifecycle';

export function emitTaskStoryLinkSet(
  task: TaskElement,
  story: StoryElement | null
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TaskStoryLinkLifecycleDetail>(CANVAS_LINK_LIFECYCLE_EVENT, {
      detail: {
        kind: 'task-story',
        action: 'set',
        taskStoryLink: {
          taskRef: task.uuid ?? task.id,
          taskUuid: task.uuid ?? null,
          storyRef: story ? (story.uuid ?? story.id) : null,
          storyUuid: story?.uuid ?? null,
        },
      },
    })
  );
}

export function emitStoryGoalLinkSet(
  story: StoryElement,
  goal: GoalElement
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<StoryGoalLinkLifecycleDetail>(CANVAS_LINK_LIFECYCLE_EVENT, {
      detail: {
        kind: 'story-goal',
        action: 'set',
        storyGoalLink: {
          storyRef: story.uuid ?? story.id,
          storyUuid: story.uuid ?? null,
          goalRef: goal.uuid ?? goal.id,
          goalUuid: goal.uuid ?? null,
        },
      },
    })
  );
}

export function isCanvasLinkLifecycleDetail(
  detail: unknown
): detail is CanvasLinkLifecycleDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasLinkLifecycleDetail>;
  if (value.kind === 'task-story') {
    const taskStoryLink =
      'taskStoryLink' in value ? value.taskStoryLink : undefined;
    return (
      value.action === 'set' &&
      Boolean(taskStoryLink) &&
      typeof taskStoryLink?.taskRef === 'string' &&
      (typeof taskStoryLink?.taskUuid === 'string' ||
        taskStoryLink?.taskUuid === null) &&
      (typeof taskStoryLink?.storyRef === 'string' ||
        taskStoryLink?.storyRef === null) &&
      (typeof taskStoryLink?.storyUuid === 'string' ||
        taskStoryLink?.storyUuid === null)
    );
  }
  if (value.kind === 'story-goal') {
    const storyGoalLink =
      'storyGoalLink' in value ? value.storyGoalLink : undefined;
    return (
      value.action === 'set' &&
      Boolean(storyGoalLink) &&
      typeof storyGoalLink?.storyRef === 'string' &&
      (typeof storyGoalLink?.storyUuid === 'string' ||
        storyGoalLink?.storyUuid === null) &&
      typeof storyGoalLink?.goalRef === 'string' &&
      (typeof storyGoalLink?.goalUuid === 'string' ||
        storyGoalLink?.goalUuid === null)
    );
  }
  return false;
}
