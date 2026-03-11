import {
  AllowAllRelationPolicy,
  type RelationPolicy,
} from '../policies/relationPolicy.ts';
import { DefaultConnectionRelationType } from '../interfaces/connection.ts';
import { findConnectionPointAt } from '../utils/connectionPointHitTest.ts';

export type RuntimeConnectionPoint = {
  x: number;
  y: number;
};

export type RuntimeConnectable = {
  id: string;
  zIndex: number;
  contains(px: number, py: number): boolean;
  getConnectionPoints(): RuntimeConnectionPoint[];
};

export type RuntimeConnection<TConnectable extends RuntimeConnectable> = {
  relationType: string;
  isNearPoint(
    px: number,
    py: number,
    elements: TConnectable[],
    tolerance?: number,
    scale?: number
  ): boolean;
};

export type RuntimeConnectionCreatePayload<
  TConnectable extends RuntimeConnectable,
> = {
  fromId: string;
  toId: string;
  relationType: string;
  source: TConnectable;
  target: TConnectable;
};

export type RuntimeConnectionNormalizeContext<
  TConnectable extends RuntimeConnectable,
> = {
  relationType: string;
  source: TConnectable;
  target: TConnectable;
};

export type RuntimeConnectionNormalizeResult<
  TConnectable extends RuntimeConnectable,
> = {
  source: TConnectable;
  target: TConnectable;
};

export type RuntimeConnectionInteractionOptions<
  TConnectable extends RuntimeConnectable,
  TConnection extends RuntimeConnection<TConnectable>,
> = {
  getConnectables: () => TConnectable[];
  getConnections: () => TConnection[];
  getScale: () => number;
  onConnectionCreate: (
    payload: RuntimeConnectionCreatePayload<TConnectable>
  ) => void;
  relationPolicy?: RelationPolicy<TConnectable>;
  resolveElementRef?: (element: TConnectable) => string;
  notifyChanged?: () => void;
  mapRelationType?: (value: string | undefined) => string | null;
  normalizeConnection?: (
    context: RuntimeConnectionNormalizeContext<TConnectable>
  ) => RuntimeConnectionNormalizeResult<TConnectable> | null;
  resolveHitTolerance?: (context: {
    relationType: string;
    scale: number;
    baseTolerance: number;
  }) => number;
  defaultRelationType?: string;
};

/**
 * Connection-creation interaction runtime with hit testing and relation policy checks.
 */
export class ConnectionInteractionRuntime<
  TConnectable extends RuntimeConnectable,
  TConnection extends RuntimeConnection<TConnectable>,
> {
  private creating = false;
  private startShape: TConnectable | null = null;
  private tempLine: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null = null;
  private readonly relationPolicy: RelationPolicy<TConnectable>;
  private readonly resolveElementRef: (element: TConnectable) => string;
  private readonly notifyChanged: () => void;
  private readonly mapRelationType: (value: string | undefined) => string | null;
  private readonly normalizeConnection:
    | ((
        context: RuntimeConnectionNormalizeContext<TConnectable>
      ) => RuntimeConnectionNormalizeResult<TConnectable> | null)
    | null;
  private readonly resolveHitTolerance: (context: {
    relationType: string;
    scale: number;
    baseTolerance: number;
  }) => number;
  private readonly defaultRelationType: string;

  constructor(
    private readonly options: RuntimeConnectionInteractionOptions<
      TConnectable,
      TConnection
    >
  ) {
    this.relationPolicy =
      options.relationPolicy ?? new AllowAllRelationPolicy<TConnectable>();
    this.resolveElementRef = options.resolveElementRef ?? ((element) => element.id);
    this.notifyChanged = options.notifyChanged ?? (() => undefined);
    this.mapRelationType = options.mapRelationType ?? ((value) => value ?? null);
    this.normalizeConnection = options.normalizeConnection ?? null;
    this.resolveHitTolerance =
      options.resolveHitTolerance ??
      ((context) => context.baseTolerance);
    this.defaultRelationType =
      options.defaultRelationType ?? DefaultConnectionRelationType.RelatesTo;
  }

  /**
   * Hit-tests existing connections at scene coordinates.
   */
  public hitTest(x: number, y: number): TConnection | null {
    const connectables = this.getOrderedConnectables();
    const connections = this.options.getConnections();
    const scale = this.options.getScale();
    for (let i = connections.length - 1; i >= 0; i -= 1) {
      const connection = connections[i];
      const baseTolerance = 5 / scale;
      const tolerance = this.resolveHitTolerance({
        relationType: connection.relationType,
        scale,
        baseTolerance,
      });
      if (connection.isNearPoint(x, y, connectables, tolerance, scale)) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Starts connection creation from a connection point under pointer.
   */
  public start(x: number, y: number): boolean {
    const hit = findConnectionPointAt<
      TConnectable,
      RuntimeConnectionPoint
    >(x, y, this.getOrderedConnectables(), this.options.getScale());
    if (!hit) return false;
    this.creating = true;
    this.startShape = hit.shape;
    this.tempLine = {
      startX: hit.point.x,
      startY: hit.point.y,
      endX: x,
      endY: y,
    };
    this.notifyChanged();
    return true;
  }

  /**
   * Updates temporary connection endpoint while creating.
   */
  public update(x: number, y: number): boolean {
    if (!this.creating || !this.tempLine) return false;
    this.tempLine.endX = x;
    this.tempLine.endY = y;
    this.notifyChanged();
    return true;
  }

  /**
   * Finalizes connection creation and emits create callback when valid.
   */
  public finish(): boolean {
    if (!this.creating || !this.startShape || !this.tempLine) return false;
    const source = this.startShape;
    const target = this.findTargetAt(this.tempLine.endX, this.tempLine.endY, source);
    if (target) {
      const decision = this.relationPolicy.canConnect({ source, target });
      if (decision.allowed) {
        const mapped = this.mapRelationType(decision.relationType);
        const relationType = mapped ?? this.defaultRelationType;
        const normalized = this.normalizeConnection
          ? this.normalizeConnection({ relationType, source, target })
          : { source, target };
        if (normalized) {
          this.options.onConnectionCreate({
            fromId: this.resolveElementRef(normalized.source),
            toId: this.resolveElementRef(normalized.target),
            relationType,
            source: normalized.source,
            target: normalized.target,
          });
        }
      }
    }
    this.reset();
    this.notifyChanged();
    return true;
  }

  /**
   * Cancels current connection-creation interaction.
   */
  public cancel(): void {
    this.reset();
    this.notifyChanged();
  }

  /**
   * Returns whether connection creation mode is active.
   */
  public isCreating(): boolean {
    return this.creating;
  }

  /**
   * Returns temporary line used for preview rendering.
   */
  public getTemporaryLine(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null {
    return this.tempLine;
  }

  private findTargetAt(
    x: number,
    y: number,
    source: TConnectable
  ): TConnectable | null {
    const connectables = this.getOrderedConnectables();
    const pointHit = findConnectionPointAt<
      TConnectable,
      RuntimeConnectionPoint
    >(x, y, connectables, this.options.getScale());
    if (pointHit && pointHit.shape !== source) {
      return pointHit.shape;
    }
    for (let i = connectables.length - 1; i >= 0; i -= 1) {
      const element = connectables[i];
      if (element !== source && element.contains(x, y)) {
        return element;
      }
    }
    return null;
  }

  private getOrderedConnectables(): TConnectable[] {
    return [...this.options.getConnectables()].sort(
      (left, right) => (left.zIndex ?? 0) - (right.zIndex ?? 0)
    );
  }

  private reset(): void {
    this.creating = false;
    this.startShape = null;
    this.tempLine = null;
  }
}
