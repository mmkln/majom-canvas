import type { IConnectable } from '../interfaces/connectable.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import { CompositeCommand } from '../commands/CompositeCommand.ts';
import { UpdateConnectionCommand } from '../commands/UpdateConnectionCommand.ts';
import { historyService } from './HistoryService.ts';
import { Scene } from '../scene/Scene.ts';
import {
  buildCanvasRelationEndpoint,
  emitCanvasRelationLifecycle,
} from '../canvasRelationLifecycle.ts';
import {
  findConnectionForPair,
  getConnectionPairKey,
  isDirectionalConnectionRelation,
} from '../utils/connectionPairs.ts';
import type { CanvasConnectionPolicy } from '../../adapters/CanvasConnectionPolicy.ts';
import { PlanningCanvasConnectionPolicy } from '../../adapters/planning/PlanningCanvasConnectionPolicy.ts';

export type ConnectionCreateSkipReason =
  | 'same-element'
  | 'invalid-pair'
  | 'duplicate'
  | 'pair-occupied';

export type ConnectionRedirectSkipReason =
  | 'same-element'
  | 'invalid-pair'
  | 'no-existing-connection'
  | 'already-directed'
  | 'not-redirectable';

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

export type ConnectionRedirectPlan = {
  source: IConnectable;
  target: IConnectable;
  from: IConnectable;
  to: IConnectable;
  fromRef: string;
  toRef: string;
  relationType: ConnectionRelationType;
  existingConnection: IConnection;
};

export type ConnectionRedirectPlanningResult =
  | { ok: true; plan: ConnectionRedirectPlan }
  | { ok: false; reason: ConnectionRedirectSkipReason };

export type ConnectionBatchCreateResult = {
  createdPlans: ConnectionCreationPlan[];
  skipped: Array<{
    source: IConnectable;
    target: IConnectable;
    reason: ConnectionCreateSkipReason;
  }>;
};

type ConnectionCreateRequest = {
  source: IConnectable;
  target: IConnectable;
};

export type ConnectionBatchRedirectResult = {
  redirectedPlans: ConnectionRedirectPlan[];
  skipped: Array<{
    source: IConnectable;
    target: IConnectable;
    reason: ConnectionRedirectSkipReason;
  }>;
};

export class ConnectionCreationService {
  constructor(
    private readonly scene: Scene,
    private readonly connectionPolicy: CanvasConnectionPolicy = new PlanningCanvasConnectionPolicy()
  ) {}

  public canCreate(
    from: IConnectable,
    to: IConnectable,
    _options: ConnectionCreateOptions = {}
  ): boolean {
    void _options;
    return this.plan(from, to).ok;
  }

  public canCreateWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): boolean {
    return this.planWithRelationType(from, to, relationType).ok;
  }

  public canUseRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): boolean {
    return this.connectionPolicy.resolveRelationType(from, to, relationType) !== null;
  }

  public canCreateManyToTarget(
    sources: ReadonlyArray<IConnectable>,
    target: IConnectable,
    _options: ConnectionCreateOptions = {}
  ): boolean {
    void _options;
    if (this.connectionPolicy.violatesBatchRule(sources, [target])) {
      return false;
    }
    return sources.some((source) => this.plan(source, target).ok);
  }

  public canCreateFromSourceToManyTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>,
    _options: ConnectionCreateOptions = {}
  ): boolean {
    void _options;
    if (this.connectionPolicy.violatesBatchRule([source], targets)) {
      return false;
    }
    return targets.some((target) => this.plan(source, target).ok);
  }

  public canRedirect(from: IConnectable, to: IConnectable): boolean {
    return this.planRedirect(from, to).ok;
  }

  public canRedirectWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): boolean {
    return this.planRedirectWithRelationType(from, to, relationType).ok;
  }

  public canRedirectManyToTarget(
    sources: ReadonlyArray<IConnectable>,
    target: IConnectable
  ): boolean {
    if (this.connectionPolicy.violatesBatchRule(sources, [target])) {
      return false;
    }
    return sources.some((source) => this.planRedirect(source, target).ok);
  }

  public canRedirectFromSourceToManyTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>
  ): boolean {
    if (this.connectionPolicy.violatesBatchRule([source], targets)) {
      return false;
    }
    return targets.some((target) => this.planRedirect(source, target).ok);
  }

  public plan(
    from: IConnectable,
    to: IConnectable,
    _options: ConnectionCreateOptions = {}
  ): ConnectionPlanningResult {
    void _options;
    return this.planInternal(from, to, new Set<string>());
  }

  public planWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): ConnectionPlanningResult {
    return this.planInternal(from, to, new Set<string>(), relationType);
  }

  public planRedirect(
    from: IConnectable,
    to: IConnectable
  ): ConnectionRedirectPlanningResult {
    return this.planRedirectInternal(from, to);
  }

  public planRedirectWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): ConnectionRedirectPlanningResult {
    return this.planRedirectInternal(from, to, relationType);
  }

  public create(
    from: IConnectable,
    to: IConnectable,
    _options: ConnectionCreateOptions = {}
  ): ConnectionPlanningResult {
    void _options;
    const result = this.plan(from, to);
    if (!result.ok) {
      return result;
    }
    this.executePlans([result.plan]);
    return result;
  }

  public createWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): ConnectionPlanningResult {
    const result = this.planWithRelationType(from, to, relationType);
    if (!result.ok) {
      return result;
    }
    this.executePlans([result.plan]);
    return result;
  }

  public redirect(
    from: IConnectable,
    to: IConnectable
  ): ConnectionRedirectPlanningResult {
    const result = this.planRedirect(from, to);
    if (!result.ok) {
      return result;
    }
    this.executeRedirectPlans([result.plan]);
    return result;
  }

  public redirectWithRelationType(
    from: IConnectable,
    to: IConnectable,
    relationType: ConnectionRelationType
  ): ConnectionRedirectPlanningResult {
    const result = this.planRedirectWithRelationType(from, to, relationType);
    if (!result.ok) {
      return result;
    }
    this.executeRedirectPlans([result.plan]);
    return result;
  }

  public createManyToTarget(
    sources: ReadonlyArray<IConnectable>,
    target: IConnectable,
    _options: ConnectionCreateOptions = {}
  ): ConnectionBatchCreateResult {
    void _options;
    if (this.connectionPolicy.violatesBatchRule(sources, [target])) {
      return {
        createdPlans: [],
        skipped: sources.map((source) => ({
          source,
          target,
          reason: 'invalid-pair' as const,
        })),
      };
    }
    return this.createBatch(sources.map((source) => ({ source, target })));
  }

  public redirectManyToTarget(
    sources: ReadonlyArray<IConnectable>,
    target: IConnectable
  ): ConnectionBatchRedirectResult {
    if (this.connectionPolicy.violatesBatchRule(sources, [target])) {
      return {
        redirectedPlans: [],
        skipped: sources.map((source) => ({
          source,
          target,
          reason: 'invalid-pair' as const,
        })),
      };
    }
    return this.redirectBatch(
      sources.map((source) => ({ source, target }))
    );
  }

  public createFromSourceToManyTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>,
    _options: ConnectionCreateOptions = {}
  ): ConnectionBatchCreateResult {
    void _options;
    if (this.connectionPolicy.violatesBatchRule([source], targets)) {
      return {
        createdPlans: [],
        skipped: targets.map((target) => ({
          source,
          target,
          reason: 'invalid-pair' as const,
        })),
      };
    }
    return this.createBatch(targets.map((target) => ({ source, target })));
  }

  public redirectFromSourceToManyTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>
  ): ConnectionBatchRedirectResult {
    if (this.connectionPolicy.violatesBatchRule([source], targets)) {
      return {
        redirectedPlans: [],
        skipped: targets.map((target) => ({
          source,
          target,
          reason: 'invalid-pair' as const,
        })),
      };
    }
    return this.redirectBatch(
      targets.map((target) => ({ source, target }))
    );
  }

  private createBatch(
    requests: ReadonlyArray<ConnectionCreateRequest>
  ): ConnectionBatchCreateResult {
    const pendingKeys = new Set<string>();
    const createdPlans: ConnectionCreationPlan[] = [];
    const skipped: ConnectionBatchCreateResult['skipped'] = [];

    requests.forEach(({ source, target }) => {
      const result = this.planInternal(source, target, pendingKeys);
      if (!result.ok) {
        skipped.push({ source, target, reason: result.reason });
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

  private redirectBatch(
    requests: ReadonlyArray<ConnectionCreateRequest>
  ): ConnectionBatchRedirectResult {
    const redirectedPlans: ConnectionRedirectPlan[] = [];
    const skipped: ConnectionBatchRedirectResult['skipped'] = [];

    requests.forEach(({ source, target }) => {
      const result = this.planRedirectInternal(source, target);
      if (!result.ok) {
        skipped.push({ source, target, reason: result.reason });
        return;
      }
      redirectedPlans.push(result.plan);
    });

    if (redirectedPlans.length > 0) {
      this.executeRedirectPlans(redirectedPlans);
    }

    return {
      redirectedPlans,
      skipped,
    };
  }

  private planInternal(
    source: IConnectable,
    target: IConnectable,
    pendingKeys: Set<string>,
    requestedRelationType?: ConnectionRelationType
  ): ConnectionPlanningResult {
    if (source === target || source.id === target.id) {
      return { ok: false, reason: 'same-element' };
    }

    if (this.connectionPolicy.isInvalidPair(source, target)) {
      return { ok: false, reason: 'invalid-pair' };
    }

    const relationType = this.connectionPolicy.resolveRelationType(
      source,
      target,
      requestedRelationType
    );
    if (!relationType) {
      return { ok: false, reason: 'invalid-pair' };
    }
    const normalized = this.connectionPolicy.normalizeEndpoints(
      relationType,
      source,
      target
    );
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

    const pairMatch = this.findPairMatch(plan.fromRef, plan.toRef);
    if (
      pairMatch &&
      pairMatch.connection.relationType === plan.relationType &&
      ((pairMatch.connection.fromId === plan.fromRef &&
        pairMatch.connection.toId === plan.toRef) ||
        !isDirectionalConnectionRelation(plan.relationType))
    ) {
      return { ok: false, reason: 'duplicate' };
    }
    if (pairMatch) {
      return { ok: false, reason: 'pair-occupied' };
    }
    const planKey = this.getPlanKey(plan);
    if (pendingKeys.has(planKey)) {
      return { ok: false, reason: 'duplicate' };
    }

    return { ok: true, plan };
  }

  private planRedirectInternal(
    source: IConnectable,
    target: IConnectable,
    requestedRelationType?: ConnectionRelationType
  ): ConnectionRedirectPlanningResult {
    if (source === target || source.id === target.id) {
      return { ok: false, reason: 'same-element' };
    }

    if (this.connectionPolicy.isInvalidPair(source, target)) {
      return { ok: false, reason: 'invalid-pair' };
    }

    const relationType = this.connectionPolicy.resolveRelationType(
      source,
      target,
      requestedRelationType
    );
    if (!relationType) {
      return { ok: false, reason: 'invalid-pair' };
    }
    const normalized = this.connectionPolicy.normalizeEndpoints(
      relationType,
      source,
      target
    );
    if (!normalized) {
      return { ok: false, reason: 'invalid-pair' };
    }

    const fromRef = this.getElementRef(normalized.from);
    const toRef = this.getElementRef(normalized.to);
    const pairMatch = this.findPairMatch(fromRef, toRef);
    if (!pairMatch) {
      return { ok: false, reason: 'no-existing-connection' };
    }

    if (pairMatch.connection.relationType !== relationType) {
      return { ok: false, reason: 'not-redirectable' };
    }
    if (!isDirectionalConnectionRelation(relationType)) {
      return { ok: false, reason: 'not-redirectable' };
    }
    if (
      pairMatch.connection.fromId === fromRef &&
      pairMatch.connection.toId === toRef
    ) {
      return { ok: false, reason: 'already-directed' };
    }

    return {
      ok: true,
      plan: {
        source,
        target,
        from: normalized.from,
        to: normalized.to,
        fromRef,
        toRef,
        relationType,
        existingConnection: pairMatch.connection,
      },
    };
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
      this.connectionPolicy.onConnectionCreated?.(plan);
    });
  }

  private executeRedirectPlans(
    plans: ReadonlyArray<ConnectionRedirectPlan>
  ): void {
    if (plans.length === 0) {
      return;
    }

    const commands = plans.map(
      (plan) =>
        new UpdateConnectionCommand(this.scene, plan.existingConnection, {
          fromId: plan.fromRef,
          toId: plan.toRef,
          relationType: plan.relationType,
        })
    );

    historyService.execute(
      commands.length === 1 ? commands[0] : new CompositeCommand(commands)
    );
  }

  private findPairMatch(
    fromRef: string,
    toRef: string
  ): ReturnType<typeof findConnectionForPair> {
    return findConnectionForPair(this.scene.getConnections(), fromRef, toRef);
  }

  private getPlanKey(plan: ConnectionCreationPlan): string {
    return getConnectionPairKey(plan.fromRef, plan.toRef);
  }

  private getElementRef(element: IConnectable): string {
    const uuid = (element as { uuid?: string }).uuid;
    return uuid ?? element.id;
  }
}
