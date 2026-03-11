import { describe, expect, it } from 'vitest';
import {
  ConnectionInteractionRuntime,
  type RuntimeConnectable,
  type RuntimeConnection,
} from './ConnectionInteractionRuntime.ts';
import type { RelationPolicy } from '../policies/relationPolicy.ts';

type TestConnectable = RuntimeConnectable & {
  points: Array<{ x: number; y: number }>;
};

type TestConnection = RuntimeConnection<TestConnectable>;

const createNode = (
  id: string,
  x: number,
  y: number,
  zIndex = 0
): TestConnectable => ({
  id,
  x,
  y,
  zIndex,
  points: [{ x, y }],
  contains: (px, py) => Math.abs(px - x) <= 10 && Math.abs(py - y) <= 10,
  getConnectionPoints: function getConnectionPoints() {
    return this.points;
  },
});

describe('canvas-core ConnectionInteractionRuntime', () => {
  it('creates connection using policy decision and adapters', () => {
    const nodes = [createNode('a', 100, 100, 1), createNode('b', 200, 100, 2)];
    const edges: TestConnection[] = [];
    const created: Array<{ fromId: string; toId: string; relationType: string }> = [];

    const runtime = new ConnectionInteractionRuntime<TestConnectable, TestConnection>(
      {
        getConnectables: () => nodes,
        getConnections: () => edges,
        getScale: () => 1,
        onConnectionCreate: (payload) => {
          created.push({
            fromId: payload.fromId,
            toId: payload.toId,
            relationType: payload.relationType,
          });
        },
      }
    );

    expect(runtime.start(100, 100)).toBe(true);
    expect(runtime.update(200, 100)).toBe(true);
    expect(runtime.finish()).toBe(true);
    expect(created).toEqual([
      { fromId: 'a', toId: 'b', relationType: 'relates_to' },
    ]);
  });

  it('supports custom relation mapping, normalization and hit tolerance', () => {
    const nodes = [createNode('left', 50, 50, 1), createNode('right', 150, 50, 2)];
    const edge: TestConnection = {
      relationType: 'strong',
      isNearPoint: (_x, _y, _elements, tolerance) =>
        typeof tolerance === 'number' && tolerance >= 8,
    };
    const created: Array<{ fromId: string; toId: string; relationType: string }> = [];

    const policy: RelationPolicy<TestConnectable> = {
      canConnect: () => ({ allowed: true, relationType: 'parent_child' }),
    };

    const runtime = new ConnectionInteractionRuntime<TestConnectable, TestConnection>(
      {
        getConnectables: () => nodes,
        getConnections: () => [edge],
        getScale: () => 1,
        relationPolicy: policy,
        mapRelationType: (value) => (value === 'parent_child' ? 'pc' : null),
        normalizeConnection: ({ source, target }) => ({
          source: target,
          target: source,
        }),
        resolveElementRef: (node) => `ref:${node.id}`,
        resolveHitTolerance: ({ baseTolerance }) => baseTolerance + 3,
        onConnectionCreate: (payload) => {
          created.push({
            fromId: payload.fromId,
            toId: payload.toId,
            relationType: payload.relationType,
          });
        },
      }
    );

    expect(runtime.hitTest(10, 10)).toBe(edge);
    expect(runtime.start(50, 50)).toBe(true);
    expect(runtime.update(150, 50)).toBe(true);
    expect(runtime.finish()).toBe(true);
    expect(created).toEqual([
      { fromId: 'ref:right', toId: 'ref:left', relationType: 'pc' },
    ]);
  });
});

