import type { IConnectable } from '../interfaces/connectable.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import { CompositeCommand } from '../commands/CompositeCommand.ts';
import { historyService } from './HistoryService.ts';
import { Scene } from '../scene/Scene.ts';
import {
  buildCanvasRelationEndpoint,
  emitCanvasRelationLifecycle,
} from '../canvasRelationLifecycle.ts';
import { emitStoryGoalLinkSet } from '../canvasLinkLifecycle.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

export type ConnectionCreateSkipReason =
  | 'same-element'
  | 'invalid-pair'
  | 'duplicate';

export type ConnectionCreateOptions = {
  preventDuplicates?: boolean;
};

export type ConnectionCreationPlan = {
  source: IConnectable;
  target: IConnectable;
  from: IConnectable;
  to: IConnectable;
  fromRef: string;
  toRef: string;
  relationType: ConnectionRelationType;
};

export type ConnectionPlanningResult =
  | { ok: true; plan: ConnectionCreationPlan }
  | { ok: false; reason: ConnectionCreateSkipReason };

export type ConnectionBatchCreateResult = {
  createdPlans: ConnectionCreationPlan[];
  skipped: Array<{
    source: IConnectable;
    reason: ConnectionCreateSkipReason;
  }>;
};

export class ConnectionCreationService {
  constructor(private readonly scene: Scene) {}

  public canCreate(
    from: IConnectable,
    to: IConnectable,
    options: ConnectionCreateOptions = {}
  ): boolean {
    return this.plan(from, to, options).ok;
  }

  public plan(
    from: IConnectable,
    to: IConnectable,
    options: ConnectionCreateOptions = {}
  ): ConnectionPlanningResult {
    return this.planInternal(from, to, options, new Set<string>());
  }

  public create(
    from: IConnectable,
    to: IConnectable,
    options: ConnectionCreateOptions = {}
  ): ConnectionPlanningResult {
    const result = this.plan(from, to, options);
    if (!result.ok) {
      return result;
    }
    this.executePlans([result.plan]);
    return result;
  }

  public createManyToTarget(
    sources: ReadonlyArray<IConnectable>,
    target: IConnectable,
    options: ConnectionCreateOptions = {}
  ): ConnectionBatchCreateResult {
    const pendingKeys = new Set<string>();
    const createdPlans: ConnectionCreationPlan[] = [];
    const skipped: ConnectionBatchCreateResult['skipped'] = [];

    sources.forEach((source) => {
      const result = this.planInternal(source, target, options, pendingKeys);
      if (!result.ok) {
        skipped.push({ source, reason: result.reason });
        return;
      }
      createdPlans.push(result.plan);
      pendingKeys.add(this.getPlanKey(result.plan));
    });

    if (createdPlans.length > 0) {
      this.executePlans(createdPlans);
    }

    return {
      createdPlans,
      skipped,
    };
  }

  private planInternal(
    source: IConnectable,
    target: IConnectable,
    options: ConnectionCreateOptions,
    pendingKeys: Set<string>
  ): ConnectionPlanningResult {
    if (source === target || source.id === target.id) {
      return { ok: false, reason: 'same-element' };
    }

    if (this.isInvalidPair(source, target)) {
      return { ok: false, reason: 'invalid-pair' };
    }

    const relationType = this.resolveRelationType(source, target);
    const normalized = this.normalizeEndpoints(relationType, source, target);
    if (!normalized) {
      return { ok: false, reason: 'invalid-pair' };
    }

    const plan: ConnectionCreationPlan = {
      source,
      target,
      from: normalized.from,
      to: normalized.to,
      fromRef: this.getElementRef(normalized.from),
      toRef: this.getElementRef(normalized.to),
      relationType,
    };

    if (options.preventDuplicates) {
      const planKey = this.getPlanKey(plan);
      if (pendingKeys.has(planKey) || this.hasExistingConnection(plan)) {
        return { ok: false, reason: 'duplicate' };
      }
    }

    return { ok: true, plan };
  }

  private executePlans(plans: ReadonlyArray<ConnectionCreationPlan>): void {
    if (plans.length === 0) {
      return;
    }

    const commands = plans.map(
      (plan) =>
        new ConnectCommand(
          this.scene,
          plan.fromRef,
          plan.toRef,
          plan.relationType
        )
    );

    historyService.execute(
      commands.length === 1 ? commands[0] : new CompositeCommand(commands)
    );

    plans.forEach((plan) => {
      emitCanvasRelationLifecycle({
        action: 'created',
        relationType: plan.relationType,
        from: buildCanvasRelationEndpoint(plan.from, plan.fromRef),
        to: buildCanvasRelationEndpoint(plan.to, plan.toRef),
      });

      if (
        plan.relationType === ConnectionRelationType.ParentChild &&
        plan.from instanceof GoalElement &&
        plan.to instanceof StoryElement
      ) {
        emitStoryGoalLinkSet(plan.to, plan.from);
      }
    });
  }

  private resolveRelationType(
    from: IConnectable,
    to: IConnectable
  ): ConnectionRelationType {
    if (from instanceof GoalElement && to instanceof GoalElement) {
      return ConnectionRelationType.LeadsTo;
    }
    if (this.isGoalStoryParentChildPair(from, to)) {
      return ConnectionRelationType.ParentChild;
    }
    return ConnectionRelationType.RelatesTo;
  }

  private normalizeEndpoints(
    relationType: ConnectionRelationType,
    from: IConnectable,
    to: IConnectable
  ): { from: IConnectable; to: IConnectable } | null {
    if (relationType !== ConnectionRelationType.ParentChild) {
      return { from, to };
    }
    if (from instanceof GoalElement && to instanceof StoryElement) {
      return { from, to };
    }
    if (from instanceof StoryElement && to instanceof GoalElement) {
      return { from: to, to: from };
    }
    return null;
  }

  private isGoalStoryParentChildPair(
    a: IConnectable,
    b: IConnectable
  ): boolean {
    return (
      (a instanceof GoalElement && b instanceof StoryElement) ||
      (a instanceof StoryElement && b instanceof GoalElement)
    );
  }

  private isInvalidPair(from: IConnectable, to: IConnectable): boolean {
    return (
      (from instanceof StoryElement &&
        to instanceof TaskElement &&
        from.tasks.some((task) => task.id === to.id)) ||
      (from instanceof TaskElement &&
        to instanceof StoryElement &&
        to.tasks.some((task) => task.id === from.id))
    );
  }

  private hasExistingConnection(plan: ConnectionCreationPlan): boolean {
    const directExists = this.scene.getConnections().some(
      (connection) =>
        connection.fromId === plan.fromRef &&
        connection.toId === plan.toRef &&
        connection.relationType === plan.relationType
    );
    if (directExists) {
      return true;
    }
    if (plan.relationType !== ConnectionRelationType.RelatesTo) {
      return false;
    }
    return this.scene.getConnections().some(
      (connection) =>
        connection.fromId === plan.toRef &&
        connection.toId === plan.fromRef &&
        connection.relationType === plan.relationType
    );
  }

  private getPlanKey(plan: ConnectionCreationPlan): string {
    if (plan.relationType === ConnectionRelationType.RelatesTo) {
      const refs = [plan.fromRef, plan.toRef].sort();
      return `${plan.relationType}:${refs[0]}:${refs[1]}`;
    }
    return `${plan.relationType}:${plan.fromRef}:${plan.toRef}`;
  }

  private getElementRef(element: IConnectable): string {
    const uuid = (element as { uuid?: string }).uuid;
    return uuid ?? element.id;
  }
}
