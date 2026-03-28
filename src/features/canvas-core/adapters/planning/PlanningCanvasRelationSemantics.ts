import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import { finalize } from 'rxjs/operators';
import { notify } from '../../core/services/NotificationService.ts';
import { confirmReplaceStoryGoalModal } from '../../ui/components/ConfirmReplaceStoryGoalModal.ts';
import type { CanvasLinkLifecycleDetail } from '../../core/canvasLinkLifecycle.ts';
import type { Scene } from '../../core/scene/Scene.ts';
import type { CanvasDataAdapter } from '../CanvasDataAdapter.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type { PlanningCanvasElement } from './PlanningCanvasElementSemantics.ts';
import { planningCanvasElementSemantics } from './PlanningCanvasElementSemantics.ts';
import type { PlanningCanvasRelationAdapter } from './PlanningCanvasRelationAdapter.ts';

export type PlanningCanvasHierarchy = {
  goalParentById: Map<string, string | null>;
  storyParentById: Map<string, string | null>;
  taskParentById: Map<string, string | null>;
  goalChildIds: Map<string, string[]>;
  storyChildIds: Map<string, string[]>;
};

export type PlanningCanvasRelationLifecycleContext = {
  scene: Scene;
  canvasDataService: CanvasDataAdapter;
  planningRelations: PlanningCanvasRelationAdapter;
  beginLinkDecision: () => void;
  endLinkDecision: () => void;
};

export class PlanningCanvasRelationSemantics {
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
    if (detail.kind === 'task-story') {
      context.planningRelations
        .updateTaskStoryLink(detail.task, detail.story)
        .subscribe({
          error: (err) => {
            console.error('Failed to update task story link', err);
            notify('Failed to update task link', 'error');
          },
        });
      return;
    }

    void this.handleStoryGoalLinkSet(detail.story, detail.goal, context);
  }

  public syncCanvasRelations(
    scene: Scene,
    canvasDataService: CanvasDataAdapter
  ): void {
    const elements = planningCanvasElementSemantics.getSceneElements(scene);
    const records = planningCanvasElementSemantics.toNodeRecords(elements, scene);
    if (
      !canvasDataService.hasRelationChanges(scene.getConnections(), records)
    ) {
      return;
    }
    canvasDataService.updateCanvasRelations(scene.getConnections(), records).subscribe({
      error: (err) => {
        console.error('Failed to sync canvas relations', err);
        notify('Failed to sync canvas relations', 'error');
      },
    });
  }

  private async handleStoryGoalLinkSet(
    story: StoryElement,
    goal: GoalElement,
    context: PlanningCanvasRelationLifecycleContext
  ): Promise<void> {
    context.beginLinkDecision();
    const storyRef = this.getElementRef(story);
    const goalRef = this.getElementRef(goal);
    const currentGoalId = Number.isFinite(story.goalBackendId)
      ? Number(story.goalBackendId)
      : null;
    const requestedGoalId = this.getElementBackendId(goal);
    const shouldConfirmReplace =
      Number.isFinite(currentGoalId) &&
      (requestedGoalId === null || requestedGoalId !== currentGoalId);

    if (shouldConfirmReplace) {
      const confirmed = await confirmReplaceStoryGoalModal({
        storyTitle: story.title,
      });
      if (!confirmed) {
        this.rollbackCreatedStoryGoalRelation(context.scene, storyRef, goalRef);
        context.endLinkDecision();
        return;
      }
    }

    context.planningRelations
      .updateStoryGoalLink(story, goal, {
        allowReplace: shouldConfirmReplace,
      })
      .pipe(
        finalize(() => {
          context.endLinkDecision();
        })
      )
      .subscribe({
        next: (result) => {
          if (result.status === 'conflict') {
            this.rollbackCreatedStoryGoalRelation(context.scene, storyRef, goalRef);
            notify(
              'Story already has another goal. Cannot link to this goal.',
              'error'
            );
            return;
          }
          this.enforceSingleStoryGoalCanvasRelation(
            context.scene,
            storyRef,
            goalRef
          );
          this.syncCanvasRelations(context.scene, context.canvasDataService);
        },
        error: (err) => {
          this.rollbackCreatedStoryGoalRelation(context.scene, storyRef, goalRef);
          console.error('Failed to update story goal link', err);
          notify('Failed to update story goal link', 'error');
        },
      });
  }

  private rollbackCreatedStoryGoalRelation(
    scene: Scene,
    storyRef: string,
    goalRef: string
  ): void {
    const created = this.findLatestStoryGoalConnection(
      scene.getConnections(),
      storyRef,
      goalRef
    );
    if (!created) return;
    scene.removeElements([created]);
  }

  private enforceSingleStoryGoalCanvasRelation(
    scene: Scene,
    storyRef: string,
    goalRef: string
  ): void {
    const duplicates = this.getDuplicateStoryGoalConnections(
      scene.getConnections(),
      storyRef,
      goalRef
    );
    if (duplicates.length === 0) return;
    scene.removeElements(duplicates);
  }
}

export const planningCanvasRelationSemantics =
  new PlanningCanvasRelationSemantics();
