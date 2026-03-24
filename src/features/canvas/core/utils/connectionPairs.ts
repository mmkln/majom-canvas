import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';

export type PairConnectionMatch = {
  connection: IConnection;
  reversed: boolean;
};

export function getConnectionPairKey(fromId: string, toId: string): string {
  const [a, b] = [fromId, toId].sort();
  return `${a}:${b}`;
}

export function isSameConnectionPair(
  fromId: string,
  toId: string,
  otherFromId: string,
  otherToId: string
): boolean {
  return getConnectionPairKey(fromId, toId) === getConnectionPairKey(otherFromId, otherToId);
}

export function findConnectionForPair(
  connections: ReadonlyArray<IConnection>,
  fromId: string,
  toId: string
): PairConnectionMatch | null {
  const directConnection =
    connections.find(
      (connection) =>
        connection.fromId === fromId && connection.toId === toId
    ) ?? null;
  if (directConnection) {
    return {
      connection: directConnection,
      reversed: false,
    };
  }

  const reverseConnection =
    connections.find(
      (connection) =>
        connection.fromId === toId && connection.toId === fromId
    ) ?? null;
  if (!reverseConnection) {
    return null;
  }

  return {
    connection: reverseConnection,
    reversed: true,
  };
}

export function isDirectionalConnectionRelation(
  relationType: ConnectionRelationType
): boolean {
  return relationType !== ConnectionRelationType.RelatesTo;
}
