import type { IConnectable } from '../core/interfaces/connectable.ts';
import type { ConnectionRelationType } from '../core/interfaces/connection.ts';

export type CanvasConnectionEndpoints = {
  from: IConnectable;
  to: IConnectable;
};

export type CanvasConnectionPlanContext = CanvasConnectionEndpoints & {
  source: IConnectable;
  target: IConnectable;
  fromRef: string;
  toRef: string;
  relationType: ConnectionRelationType;
};

export interface CanvasConnectionPolicy {
  isInvalidPair(source: IConnectable, target: IConnectable): boolean;
  violatesBatchRule(
    sources: ReadonlyArray<IConnectable>,
    targets: ReadonlyArray<IConnectable>
  ): boolean;
  resolveRelationType(
    source: IConnectable,
    target: IConnectable,
    requestedRelationType?: ConnectionRelationType
  ): ConnectionRelationType | null;
  normalizeEndpoints(
    relationType: ConnectionRelationType,
    source: IConnectable,
    target: IConnectable
  ): CanvasConnectionEndpoints | null;
  onConnectionCreated?(plan: CanvasConnectionPlanContext): void;
}
