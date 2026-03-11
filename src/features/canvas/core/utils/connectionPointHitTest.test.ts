import { describe, expect, it } from 'vitest';
import type { IConnectable } from '../interfaces/connectable.ts';
import { findConnectionPointAt } from './connectionPointHitTest.ts';

function createConnectable(
  id: string,
  points: Array<{ x: number; y: number }>
): IConnectable {
  return {
    id,
    x: 0,
    y: 0,
    zIndex: 0,
    selected: false,
    lineColor: '#000',
    lineWidth: 1,
    fillColor: '#000',
    draw: () => undefined,
    clone: () => undefined as unknown as IConnectable,
    getConnectionPoints: () => points,
    getNearestPoint: () => points[0] ?? { x: 0, y: 0 },
    contains: () => false,
    drawAnchors: () => undefined,
    drawConnectionLine: () => undefined,
  };
}

describe('findConnectionPointAt', () => {
  it('returns null when no point is within hit radius', () => {
    const shape = createConnectable('a', [{ x: 100, y: 100 }]);

    const hit = findConnectionPointAt(10, 10, [shape], 1);

    expect(hit).toBeNull();
  });

  it('returns top-most hit by scanning from the end of the list', () => {
    const first = createConnectable('first', [{ x: 50, y: 50 }]);
    const last = createConnectable('last', [{ x: 50, y: 50 }]);

    const hit = findConnectionPointAt(50, 50, [first, last], 1);

    expect(hit?.shape.id).toBe('last');
  });

  it('uses scale-aware tolerance', () => {
    const shape = createConnectable('scaled', [{ x: 10, y: 10 }]);

    const hitAtScale1 = findConnectionPointAt(16, 10, [shape], 1); // tol = 8
    const hitAtScale2 = findConnectionPointAt(16, 10, [shape], 2); // tol = 4

    expect(hitAtScale1).not.toBeNull();
    expect(hitAtScale2).toBeNull();
  });
});
