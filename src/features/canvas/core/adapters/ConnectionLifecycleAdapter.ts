import type { IConnectable } from '../interfaces/connectable.ts';
import type { ConnectionRelationType } from '../interfaces/connection.ts';

export type ConnectionCreatedContext = {
  relationType: ConnectionRelationType;
  from: IConnectable;
  to: IConnectable;
};

export interface ConnectionLifecycleAdapter {
  normalizeConnectionRefs(
    relationType: ConnectionRelationType,
    from: IConnectable,
    to: IConnectable
  ): { from: IConnectable; to: IConnectable } | null;
  onConnectionCreated?(context: ConnectionCreatedContext): void;
}

export const noopConnectionLifecycleAdapter: ConnectionLifecycleAdapter = {
  normalizeConnectionRefs: (_relationType, from, to) => ({ from, to }),
  onConnectionCreated: () => undefined,
};
