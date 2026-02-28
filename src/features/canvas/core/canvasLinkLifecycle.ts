import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';

export type TaskStoryLinkLifecycleDetail = {
  kind: 'task-story';
  action: 'set';
  task: TaskElement;
  story: StoryElement | null;
};

export type StoryGoalLinkLifecycleDetail = {
  kind: 'story-goal';
  action: 'set';
  story: StoryElement;
  goal: GoalElement;
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
        task,
        story,
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
    new CustomEvent<StoryGoalLinkLifecycleDetail>(
      CANVAS_LINK_LIFECYCLE_EVENT,
      {
        detail: {
          kind: 'story-goal',
          action: 'set',
          story,
          goal,
        },
      }
    )
  );
}

export function isCanvasLinkLifecycleDetail(
  detail: unknown
): detail is CanvasLinkLifecycleDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasLinkLifecycleDetail>;
  if (value.kind === 'task-story') {
    return value.action === 'set' && value.task instanceof TaskElement;
  }
  if (value.kind === 'story-goal') {
    return (
      value.action === 'set' &&
      value.story instanceof StoryElement &&
      value.goal instanceof GoalElement
    );
  }
  return false;
}

