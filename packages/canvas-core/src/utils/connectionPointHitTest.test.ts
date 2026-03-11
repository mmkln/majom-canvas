import { describe, expect, it } from 'vitest';
import { findConnectionPointAt } from './connectionPointHitTest.ts';

type TestPoint = { x: number; y: number };
type TestShape = {
  id: string;
  getConnectionPoints(): TestPoint[];
};

const createShape = (id: string, points: TestPoint[]): TestShape => ({
  id,
  getConnectionPoints: () => points,
});

describe('findConnectionPointAt', () => {
  it('returns null when no point is inside tolerance', () => {
    const shape = createShape('a', [{ x: 100, y: 100 }]);
    expect(findConnectionPointAt(10, 10, [shape], 1)).toBeNull();
  });

  it('returns top-most hit by scanning from the end', () => {
    const first = createShape('first', [{ x: 50, y: 50 }]);
    const last = createShape('last', [{ x: 50, y: 50 }]);
    const hit = findConnectionPointAt(50, 50, [first, last], 1);
    expect(hit?.shape.id).toBe('last');
  });

  it('uses scale-aware tolerance', () => {
    const shape = createShape('scaled', [{ x: 10, y: 10 }]);
    const hitAtScale1 = findConnectionPointAt(16, 10, [shape], 1); // tol = 8
    const hitAtScale2 = findConnectionPointAt(16, 10, [shape], 2); // tol = 4
    expect(hitAtScale1).not.toBeNull();
    expect(hitAtScale2).toBeNull();
  });
});
