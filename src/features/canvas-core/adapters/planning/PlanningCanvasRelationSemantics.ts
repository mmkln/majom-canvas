import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type { PlanningCanvasElement } from './PlanningCanvasElementSemantics.ts';
import {
  PlanningCanvasLinkLifecycleCoordinator,
  type PlanningCanvasRelationLifecycleContext,
} from './PlanningCanvasLinkLifecycleCoordinator.ts';
import type { CanvasLinkLifecycleDetail } from '../../core/canvasLinkLifecycle.ts';
import type { Scene } from '../../core/scene/Scene.ts';
import type { CanvasDataAdapter } from '../CanvasDataAdapter.ts';

export type PlanningCanvasHierarchy = {
  goalParentById: Map<string, string | null>;
  storyParentById: Map<string, string | null>;
  taskParentById: Map<string, string | null>;
  goalChildIds: Map<string, string[]>;
  storyChildIds: Map<string, string[]>;
};

export class PlanningCanvasRelationSemantics {
  private readonly lifecycleCoordinator =
    new PlanningCanvasLinkLifecycleCoordinator();

  public getElementRef(element: { id: string; uuid?: string }): string {
    return element.uuid ?? element.id;
  }

  public getElementBackendId(element: {
    id: string;
    backendId?: string | number | null;
  }): number | null {
    if (Number.isFinite(element.backendId)) {
      return Number(element.backendId);
    }
    const legacyId = Number(element.id);
    return Number.isFinite(legacyId) ? legacyId : null;
  }

  public buildHierarchy(
    planningElements: PlanningCanvasElement[],
    connections: IConnection[]
  ): PlanningCanvasHierarchy {
    const goals = planningElements.filter(
      (element): element is GoalElement => element instanceof GoalElement
    );
    const stories = planningElements.filter(
      (element): element is StoryElement => element instanceof StoryElement
    );
    const tasks = planningElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const goalByBackendId = new Map<number, GoalElement>();
    goals.forEach((goal) => {
      if (typeof goal.backendId === 'number') {
        goalByBackendId.set(goal.backendId, goal);
      }
    });

    const refToPlanningId = new Map<string, string>();
    planningElements.forEach((element) => {
      refToPlanningId.set(element.id, element.id);
      if (element.uuid) {
        refToPlanningId.set(element.uuid, element.id);
      }
    });

    const goalParentById = new Map<string, string | null>();
    goals.forEach((goal) => {
      goalParentById.set(goal.id, null);
    });

    const storyParentById = new Map<string, string | null>();
    stories.forEach((story) => {
      const backendGoal = Number.isFinite(story.goalBackendId)
        ? goalByBackendId.get(Number(story.goalBackendId))
        : undefined;
      storyParentById.set(story.id, backendGoal?.id ?? null);
    });

    connections
      .filter(
        (connection) =>
          connection.relationType === ConnectionRelationType.ParentChild
      )
      .forEach((connection) => {
        const fromId = refToPlanningId.get(connection.fromId);
        const toId = refToPlanningId.get(connection.toId);
        if (!fromId || !toId) return;
        const fromEl = planningElements.find((element) => element.id === fromId);
        const toEl = planningElements.find((element) => element.id === toId);
        if (!(fromEl instanceof GoalElement)) return;
        if (toEl instanceof GoalElement) {
          goalParentById.set(toEl.id, fromEl.id);
          return;
        }
        if (toEl instanceof StoryElement) {
          storyParentById.set(toEl.id, fromEl.id);
        }
      });

    const taskParentById = new Map<string, string | null>();
    stories.forEach((story) => {
      story.tasks.forEach((task) => {
        taskParentById.set(task.id, story.id);
      });
    });
    tasks.forEach((task) => {
      if (!taskParentById.has(task.id)) {
        taskParentById.set(task.id, null);
      }
    });

    const storyChildIds = new Map<string, string[]>();
    stories.forEach((story) => {
      storyChildIds.set(
        story.id,
        story.tasks.map((task) => task.id)
      );
    });

    const goalChildIds = new Map<string, string[]>();
    goals.forEach((goal) => goalChildIds.set(goal.id, []));
    goals.forEach((goal) => {
      const parentId = goalParentById.get(goal.id);
      if (!parentId) return;
      const current = goalChildIds.get(parentId) ?? [];
      current.push(goal.id);
      goalChildIds.set(parentId, current);
    });
    stories.forEach((story) => {
      const parentId = storyParentById.get(story.id);
      if (!parentId) return;
      const current = goalChildIds.get(parentId) ?? [];
      current.push(story.id);
      goalChildIds.set(parentId, current);
    });

    return {
      goalParentById,
      storyParentById,
      taskParentById,
      goalChildIds,
      storyChildIds,
    };
  }

  public getStoryGoalConnections(
    connections: IConnection[],
    storyRef: string
  ): IConnection[] {
    return connections.filter(
      (connection) =>
        connection.relationType === ConnectionRelationType.ParentChild &&
        connection.toId === storyRef
    );
  }

  public findLatestStoryGoalConnection(
    connections: IConnection[],
    storyRef: string,
    goalRef: string
  ): IConnection | null {
    for (let i = connections.length - 1; i >= 0; i -= 1) {
      const connection = connections[i];
      if (connection.relationType !== ConnectionRelationType.ParentChild) {
        continue;
      }
      if (connection.toId !== storyRef || connection.fromId !== goalRef) {
        continue;
      }
      return connection;
    }
    return null;
  }

  public getDuplicateStoryGoalConnections(
    connections: IConnection[],
    storyRef: string,
    goalRef: string
  ): IConnection[] {
    const all = this.getStoryGoalConnections(connections, storyRef);
    if (all.length <= 1) return [];
    const keep =
      this.findLatestStoryGoalConnection(connections, storyRef, goalRef) ??
      all[all.length - 1];
    return all.filter((connection) => connection !== keep);
  }

  public handleLinkLifecycle(
    detail: CanvasLinkLifecycleDetail,
    context: PlanningCanvasRelationLifecycleContext
  ): void {
    this.lifecycleCoordinator.handleLinkLifecycle(detail, context);
  }

  public syncCanvasRelations(
    scene: Scene,
    canvasDataService: CanvasDataAdapter
  ): void {
    this.lifecycleCoordinator.syncCanvasRelations(scene, canvasDataService);
  }
}

export const planningCanvasRelationSemantics =
  new PlanningCanvasRelationSemantics();
