import { describe, expect, it } from 'vitest';
import { resolveTopElementByZIndex } from './topElementPolicy.ts';

type TestElement = {
  id: string;
  zIndex: number;
  contains(px: number, py: number): boolean;
};

const box = (id: string, zIndex: number, x: number, y: number): TestElement => ({
  id,
  zIndex,
  contains: (px, py) => px >= x && px <= x + 100 && py >= y && py <= y + 100,
});

describe('resolveTopElementByZIndex', () => {
  it('returns highest z-index candidate that contains the point', () => {
    const low = box('low', 1, 0, 0);
    const high = box('high', 5, 0, 0);

    const result = resolveTopElementByZIndex({
      sceneX: 50,
      sceneY: 50,
      candidates: [low, high],
    });

    expect(result?.id).toBe('high');
  });

  it('breaks z-index ties by candidate order (last wins)', () => {
    const first = box('first', 3, 0, 0);
    const second = box('second', 3, 0, 0);

    const result = resolveTopElementByZIndex({
      sceneX: 20,
      sceneY: 20,
      candidates: [first, second],
    });

    expect(result?.id).toBe('second');
  });

  it('returns null when no candidate contains the point', () => {
    const only = box('only', 1, 0, 0);
    const result = resolveTopElementByZIndex({
      sceneX: 200,
      sceneY: 200,
      candidates: [only],
    });

    expect(result).toBe(null);
  });
});
