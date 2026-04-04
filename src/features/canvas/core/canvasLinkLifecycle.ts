import {
  ConnectionLineType,
  ConnectionRelationType,
} from './interfaces/connection.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';

export type GoalLinkSnapshot = {
  connectionId: string;
  lineType: ConnectionLineType;
  fromGoalRef: string;
  toGoalRef: string;
  fromGoalUuid: string | null;
  toGoalUuid: string | null;
  relationType: ConnectionRelationType;
};

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

export type GoalLinkSetLifecycleDetail = {
  kind: 'goal-link';
  action: 'set';
  goalLink: GoalLinkSnapshot;
};

export type GoalLinkUpdateLifecycleDetail = {
  kind: 'goal-link';
  action: 'update';
  currentGoalLink: GoalLinkSnapshot;
  nextGoalLink: GoalLinkSnapshot;
};

export type GoalLinkRemoveLifecycleDetail = {
  kind: 'goal-link';
  action: 'remove';
  goalLink: GoalLinkSnapshot;
};

export type CanvasLinkLifecycleDetail =
  | TaskStoryLinkLifecycleDetail
  | StoryGoalLinkLifecycleDetail
  | GoalLinkSetLifecycleDetail
  | GoalLinkUpdateLifecycleDetail
  | GoalLinkRemoveLifecycleDetail;

export const CANVAS_LINK_LIFECYCLE_EVENT = 'canvasLinkLifecycle';

export function isGoalLinkRelationType(
  relationType: ConnectionRelationType
): boolean {
  return (
    relationType === ConnectionRelationType.LeadsTo ||
    relationType === ConnectionRelationType.Blocks ||
    relationType === ConnectionRelationType.RelatesTo
  );
}

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

export function emitGoalLinkSet(goalLink: GoalLinkSnapshot): void {
  if (typeof window === 'undefined') return;
  if (!isGoalLinkRelationType(goalLink.relationType)) return;
  window.dispatchEvent(
    new CustomEvent<GoalLinkSetLifecycleDetail>(CANVAS_LINK_LIFECYCLE_EVENT, {
      detail: {
        kind: 'goal-link',
        action: 'set',
        goalLink,
      },
    })
  );
}

export function emitGoalLinkUpdated(
  currentGoalLink: GoalLinkSnapshot,
  nextGoalLink: GoalLinkSnapshot
): void {
  if (typeof window === 'undefined') return;
  if (
    !isGoalLinkRelationType(currentGoalLink.relationType) ||
    !isGoalLinkRelationType(nextGoalLink.relationType)
  ) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<GoalLinkUpdateLifecycleDetail>(CANVAS_LINK_LIFECYCLE_EVENT, {
      detail: {
        kind: 'goal-link',
        action: 'update',
        currentGoalLink,
        nextGoalLink,
      },
    })
  );
}

export function emitGoalLinkRemoved(goalLink: GoalLinkSnapshot): void {
  if (typeof window === 'undefined') return;
  if (!isGoalLinkRelationType(goalLink.relationType)) return;
  window.dispatchEvent(
    new CustomEvent<GoalLinkRemoveLifecycleDetail>(CANVAS_LINK_LIFECYCLE_EVENT, {
      detail: {
        kind: 'goal-link',
        action: 'remove',
        goalLink,
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
  if (value.kind === 'goal-link') {
    if (value.action === 'set' || value.action === 'remove') {
      const goalLink =
        'goalLink' in value ? value.goalLink : undefined;
      return (
        Boolean(goalLink) &&
        typeof goalLink?.connectionId === 'string' &&
        typeof goalLink?.fromGoalRef === 'string' &&
        typeof goalLink?.toGoalRef === 'string' &&
        (typeof goalLink?.fromGoalUuid === 'string' ||
          goalLink?.fromGoalUuid === null) &&
        (typeof goalLink?.toGoalUuid === 'string' ||
          goalLink?.toGoalUuid === null) &&
        typeof goalLink?.relationType === 'string'
      );
    }
    if (value.action === 'update') {
      const currentGoalLink =
        'currentGoalLink' in value ? value.currentGoalLink : undefined;
      const nextGoalLink =
        'nextGoalLink' in value ? value.nextGoalLink : undefined;
      return (
        Boolean(currentGoalLink) &&
        Boolean(nextGoalLink) &&
        typeof currentGoalLink?.connectionId === 'string' &&
        typeof nextGoalLink?.connectionId === 'string' &&
        typeof currentGoalLink?.fromGoalRef === 'string' &&
        typeof currentGoalLink?.toGoalRef === 'string' &&
        typeof nextGoalLink?.fromGoalRef === 'string' &&
        typeof nextGoalLink?.toGoalRef === 'string' &&
        typeof currentGoalLink?.relationType === 'string' &&
        typeof nextGoalLink?.relationType === 'string'
      );
    }
  }
  return false;
}
