import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import { finalize } from 'rxjs/operators';
import { notify } from '../../core/services/NotificationService.ts';
import { confirmReplaceStoryGoalModal } from '../../ui/components/ConfirmReplaceStoryGoalModal.ts';
import type {
  CanvasLinkLifecycleDetail,
  GoalLinkSnapshot,
  StoryGoalLinkSnapshot,
  TaskStoryLinkSnapshot,
} from '../../core/canvasLinkLifecycle.ts';
import type { Scene } from '../../core/scene/Scene.ts';
import type { CanvasDataAdapter } from '../CanvasDataAdapter.ts';
import { planningCanvasElementSemantics } from './PlanningCanvasElementSemantics.ts';
import { PlanningLinkResolver } from './PlanningLinkResolver.ts';
import type {
  PlanningCanvasRelationAdapter,
} from './PlanningCanvasRelationAdapter.ts';

export type PlanningCanvasRelationLifecycleContext = {
  scene: Scene;
  canvasDataService: CanvasDataAdapter;
  planningRelations: PlanningCanvasRelationAdapter;
  beginLinkDecision: () => void;
  endLinkDecision: () => void;
};

export class PlanningCanvasLinkLifecycleCoordinator {
  private readonly linkResolver = new PlanningLinkResolver();

  public handleLinkLifecycle(
    detail: CanvasLinkLifecycleDetail,
    context: PlanningCanvasRelationLifecycleContext
  ): void {
    if (detail.kind === 'task-story') {
      const taskStoryLink = this.linkResolver.resolveTaskStoryLink(
        detail.taskStoryLink,
        context.scene
      );
      if (!taskStoryLink) {
        notify('Failed to resolve task link', 'error');
        return;
      }
      context.planningRelations
        .updateTaskStoryLink(taskStoryLink)
        .subscribe({
          error: (err) => {
            console.error('Failed to update task story link', err);
            notify('Failed to update task link', 'error');
          },
        });
      return;
    }

    if (detail.kind === 'goal-link') {
      void this.handleGoalLinkLifecycle(detail, context);
      return;
    }

    void this.handleStoryGoalLinkSet(detail.storyGoalLink, context);
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
    storyGoalLink: StoryGoalLinkSnapshot,
    context: PlanningCanvasRelationLifecycleContext
  ): Promise<void> {
    const resolvedLink = this.linkResolver.resolveStoryGoalLink(
      storyGoalLink,
      context.scene
    );
    if (!resolvedLink) {
      notify('Failed to resolve story goal link', 'error');
      return;
    }
    const { story, goal } = resolvedLink;
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
      .updateStoryGoalLink(resolvedLink, {
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

  private async handleGoalLinkLifecycle(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>,
    context: PlanningCanvasRelationLifecycleContext
  ): Promise<void> {
    context.beginLinkDecision();
    const request$ = this.buildGoalLinkRequest(detail, context);

    if (!request$) {
      this.rollbackGoalLinkLifecycle(detail, context.scene);
      notify('Failed to sync goal relation', 'error');
      context.endLinkDecision();
      return;
    }

    request$
      .pipe(
        finalize(() => {
          context.endLinkDecision();
        })
      )
      .subscribe({
        next: () => {
          this.syncCanvasRelations(context.scene, context.canvasDataService);
        },
        error: (err) => {
          this.rollbackGoalLinkLifecycle(detail, context.scene);
          console.error('Failed to sync goal relation', err);
          notify('Failed to sync goal relation', 'error');
        },
      });
  }

  private getElementRef(element: { id: string; uuid?: string }): string {
    return element.uuid ?? element.id;
  }

  private getElementBackendId(element: {
    id: string;
    backendId?: string | number | null;
  }): number | null {
    if (Number.isFinite(element.backendId)) {
      return Number(element.backendId);
    }
    const legacyId = Number(element.id);
    return Number.isFinite(legacyId) ? legacyId : null;
  }

  private getStoryGoalConnections(
    connections: IConnection[],
    storyRef: string
  ): IConnection[] {
    return connections.filter(
      (connection) =>
        connection.relationType === ConnectionRelationType.ParentChild &&
        connection.toId === storyRef
    );
  }

  private findLatestStoryGoalConnection(
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

  private getDuplicateStoryGoalConnections(
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

  private rollbackGoalLinkLifecycle(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>,
    scene: Scene
  ): void {
    if (detail.action === 'set') {
      const connection = this.linkResolver.findConnectionById(
        scene,
        detail.goalLink.connectionId
      );
      if (connection) {
        scene.removeElements([connection]);
      }
      return;
    }
    if (detail.action === 'remove') {
      const connection = this.linkResolver.findConnectionById(
        scene,
        detail.goalLink.connectionId
      );
      if (connection) {
        this.applyGoalLinkSnapshot(connection, detail.goalLink, scene);
        return;
      }
      scene.addElement(this.linkResolver.createConnectionFromGoalLink(detail.goalLink));
      return;
    }
    const connection =
      this.linkResolver.findConnectionById(
        scene,
        detail.currentGoalLink.connectionId
      ) ??
      this.linkResolver.findConnectionById(
        scene,
        detail.nextGoalLink.connectionId
      );
    if (connection) {
      this.applyGoalLinkSnapshot(connection, detail.currentGoalLink, scene);
      return;
    }
    scene.addElement(
      this.linkResolver.createConnectionFromGoalLink(detail.currentGoalLink)
    );
  }

  private applyGoalLinkSnapshot(
    connection: IConnection,
    goalLink: GoalLinkSnapshot,
    scene: Scene
  ): void {
    connection.fromId = goalLink.fromGoalRef;
    connection.toId = goalLink.toGoalRef;
    connection.lineType = goalLink.lineType;
    connection.relationType = goalLink.relationType;
    scene.changes.next();
  }

  private buildGoalLinkRequest(
    detail: Extract<CanvasLinkLifecycleDetail, { kind: 'goal-link' }>,
    context: PlanningCanvasRelationLifecycleContext
  ) {
    if (detail.action === 'set') {
      const goalLink = this.linkResolver.resolveGoalLink(
        detail.goalLink,
        context.scene
      );
      return goalLink
        ? context.planningRelations.createGoalRelation(goalLink)
        : null;
    }
    if (detail.action === 'remove') {
      const goalLink = this.linkResolver.resolveGoalLink(
        detail.goalLink,
        context.scene
      );
      return goalLink
        ? context.planningRelations.deleteGoalRelation(goalLink)
        : null;
    }
    const currentGoalLink = this.linkResolver.resolveGoalLink(
      detail.currentGoalLink,
      context.scene
    );
    const nextGoalLink = this.linkResolver.resolveGoalLink(
      detail.nextGoalLink,
      context.scene
    );
    if (!currentGoalLink || !nextGoalLink) {
      return null;
    }
    return context.planningRelations.updateGoalRelation(
      currentGoalLink,
      nextGoalLink
    );
  }
}
