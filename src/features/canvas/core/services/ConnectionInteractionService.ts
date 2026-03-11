// src/core/services/ConnectionInteractionService.ts
import { Scene } from '../scene/Scene.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import {
  AllowAllRelationPolicy,
  ConnectionInteractionRuntime,
  type RelationPolicy,
  type RuntimeConnectable,
  type RuntimeConnection,
} from 'majom-canvas-core';
import { getOrderedConnectables } from '../utils/connectableUtils.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import { historyService } from './HistoryService.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import {
  noopConnectionLifecycleAdapter,
  type ConnectionLifecycleAdapter,
} from '../adapters/ConnectionLifecycleAdapter.ts';
import {
  buildCanvasRelationEndpoint,
  emitCanvasRelationLifecycle,
} from '../canvasRelationLifecycle.ts';

export class ConnectionInteractionService {
  private readonly runtime: ConnectionInteractionRuntime<
    RuntimeConnectable,
    RuntimeConnection<RuntimeConnectable>
  >;

  constructor(
    private scene: Scene,
    private panZoom: PanZoomManager,
    private relationPolicy: RelationPolicy<IConnectable> = new AllowAllRelationPolicy<IConnectable>(),
    private lifecycleAdapter: ConnectionLifecycleAdapter = noopConnectionLifecycleAdapter
  ) {
    this.runtime = new ConnectionInteractionRuntime({
      getConnectables: () => getOrderedConnectables(this.scene),
      getConnections: () =>
        this.scene.getConnections() as RuntimeConnection<RuntimeConnectable>[],
      getScale: () => this.panZoom.scale,
      relationPolicy: this.relationPolicy as RelationPolicy<RuntimeConnectable>,
      notifyChanged: () => {
        this.scene.changes.next();
      },
      resolveElementRef: (element) => this.getElementRef(element as IConnectable),
      mapRelationType: (value) => this.toRelationType(value),
      normalizeConnection: ({ relationType, source, target }) => {
        const parsed = this.toRelationType(relationType);
        if (!parsed) return null;
        const normalized = this.normalizeConnectionRefs(
          parsed,
          source as IConnectable,
          target as IConnectable
        );
        if (!normalized) return null;
        return {
          source: normalized.from as RuntimeConnectable,
          target: normalized.to as RuntimeConnectable,
        };
      },
      resolveHitTolerance: ({ relationType, scale, baseTolerance }) =>
        this.resolveHitTolerance(relationType, scale, baseTolerance),
      defaultRelationType: ConnectionRelationType.RelatesTo,
      onConnectionCreate: (payload) => {
        const source = payload.source as IConnectable;
        const target = payload.target as IConnectable;
        const relationType = this.toRelationType(payload.relationType);
        if (!relationType) return;
        const fromRef = this.getElementRef(source);
        const toRef = this.getElementRef(target);
        historyService.execute(
          new ConnectCommand(this.scene, fromRef, toRef, relationType)
        );
        emitCanvasRelationLifecycle({
          action: 'created',
          relationType,
          from: buildCanvasRelationEndpoint(source, fromRef),
          to: buildCanvasRelationEndpoint(target, toRef),
        });
        this.lifecycleAdapter.onConnectionCreated?.({
          relationType,
          from: source,
          to: target,
        });
      },
    });
  }

  /** Hit test existing connections */
  public hitTest(x: number, y: number): IConnection | null {
    return this.runtime.hitTest(x, y) as IConnection | null;
  }

  /** Start drawing a new connection */
  public start(x: number, y: number): boolean {
    return this.runtime.start(x, y);
  }

  /** Update the temporary connection line */
  public update(x: number, y: number): boolean {
    return this.runtime.update(x, y);
  }

  /** Finish and execute the connection command */
  public finish(): boolean {
    return this.runtime.finish();
  }

  /** Check if a connection is being created */
  public isCreating(): boolean {
    return this.runtime.isCreating();
  }

  /** Cancel in-progress connection drawing */
  public cancel(): void {
    this.runtime.cancel();
  }

  /** Get the temporary line for rendering */
  public getTemporaryLine(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null {
    return this.runtime.getTemporaryLine();
  }

  private getElementRef(element: IConnectable): string {
    const uuid = (element as { uuid?: string }).uuid;
    return uuid ?? element.id;
  }

  private toRelationType(
    value: string | undefined
  ): ConnectionRelationType | null {
    if (!value) return null;
    switch (value) {
      case ConnectionRelationType.LeadsTo:
        return ConnectionRelationType.LeadsTo;
      case ConnectionRelationType.Blocks:
        return ConnectionRelationType.Blocks;
      case ConnectionRelationType.ParentChild:
        return ConnectionRelationType.ParentChild;
      case ConnectionRelationType.RelatesTo:
        return ConnectionRelationType.RelatesTo;
      default:
        return null;
    }
  }

  private resolveHitTolerance(
    relationType: string,
    scale: number,
    baseTolerance: number
  ): number {
    const parsedRelationType = this.toRelationType(relationType);
    if (
      parsedRelationType === ConnectionRelationType.LeadsTo ||
      parsedRelationType === ConnectionRelationType.ParentChild
    ) {
      return Math.max(baseTolerance, 8 / scale);
    }
    return baseTolerance;
  }

  private normalizeConnectionRefs(
    relationType: ConnectionRelationType,
    from: IConnectable,
    to: IConnectable
  ): { from: IConnectable; to: IConnectable } | null {
    return this.lifecycleAdapter.normalizeConnectionRefs(relationType, from, to);
  }
}

