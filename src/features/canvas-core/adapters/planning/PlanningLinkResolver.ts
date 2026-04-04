import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import type {
  GoalLinkSnapshot,
  StoryGoalLinkSnapshot,
  TaskStoryLinkSnapshot,
} from '../../core/canvasLinkLifecycle.ts';
import type { Scene } from '../../core/scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import Connection from '../../core/shapes/Connection.ts';
import type {
  PlanningGoalLink,
  PlanningStoryGoalLink,
  PlanningTaskStoryLink,
} from './PlanningCanvasRelationAdapter.ts';

export class PlanningLinkResolver {
  public resolveGoalLink(
    goalLink: GoalLinkSnapshot,
    scene: Scene
  ): PlanningGoalLink | null {
    const fromGoal = this.findGoalBySnapshot(
      scene,
      goalLink.fromGoalRef,
      goalLink.fromGoalUuid
    );
    const toGoal = this.findGoalBySnapshot(
      scene,
      goalLink.toGoalRef,
      goalLink.toGoalUuid
    );
    if (
      !fromGoal ||
      !toGoal ||
      !(
        goalLink.relationType === ConnectionRelationType.LeadsTo ||
        goalLink.relationType === ConnectionRelationType.Blocks ||
        goalLink.relationType === ConnectionRelationType.RelatesTo
      )
    ) {
      return null;
    }
    return {
      fromGoal,
      toGoal,
      relationType: goalLink.relationType,
    };
  }

  public resolveTaskStoryLink(
    taskStoryLink: TaskStoryLinkSnapshot,
    scene: Scene
  ): PlanningTaskStoryLink | null {
    const task = this.findTaskBySnapshot(
      scene,
      taskStoryLink.taskRef,
      taskStoryLink.taskUuid
    );
    if (!task) {
      return null;
    }
    const story = taskStoryLink.storyRef
      ? this.findStoryBySnapshot(
          scene,
          taskStoryLink.storyRef,
          taskStoryLink.storyUuid
        )
      : null;
    if (taskStoryLink.storyRef && !story) {
      return null;
    }
    return { task, story };
  }

  public resolveStoryGoalLink(
    storyGoalLink: StoryGoalLinkSnapshot,
    scene: Scene
  ): PlanningStoryGoalLink | null {
    const story = this.findStoryBySnapshot(
      scene,
      storyGoalLink.storyRef,
      storyGoalLink.storyUuid
    );
    const goal = this.findGoalBySnapshot(
      scene,
      storyGoalLink.goalRef,
      storyGoalLink.goalUuid
    );
    if (!story || !goal) {
      return null;
    }
    return { story, goal };
  }

  public findConnectionById(
    scene: Scene,
    connectionId: string
  ): IConnection | null {
    return (
      scene
        .getConnections()
        .find((connection) => connection.id === connectionId) ?? null
    );
  }

  public createConnectionFromGoalLink(goalLink: GoalLinkSnapshot): IConnection {
    return new Connection(
      goalLink.fromGoalRef,
      goalLink.toGoalRef,
      goalLink.connectionId,
      goalLink.lineType,
      goalLink.relationType
    );
  }

  private findGoalBySnapshot(
    scene: Scene,
    goalRef: string,
    goalUuid: string | null
  ): GoalElement | null {
    return (
      scene
        .getElements()
        .find(
          (element): element is GoalElement =>
            element instanceof GoalElement &&
            (element.id === goalRef ||
              element.uuid === goalRef ||
              (goalUuid !== null && element.uuid === goalUuid))
        ) ?? null
    );
  }

  private findStoryBySnapshot(
    scene: Scene,
    storyRef: string,
    storyUuid: string | null
  ): StoryElement | null {
    return (
      scene
        .getElements()
        .find(
          (element): element is StoryElement =>
            element instanceof StoryElement &&
            (element.id === storyRef ||
              element.uuid === storyRef ||
              (storyUuid !== null && element.uuid === storyUuid))
        ) ?? null
    );
  }

  private findTaskBySnapshot(
    scene: Scene,
    taskRef: string,
    taskUuid: string | null
  ): TaskElement | null {
    return (
      scene
        .getElements()
        .find(
          (element): element is TaskElement =>
            element instanceof TaskElement &&
            (element.id === taskRef ||
              element.uuid === taskRef ||
              (taskUuid !== null && element.uuid === taskUuid))
        ) ?? null
    );
  }
}
