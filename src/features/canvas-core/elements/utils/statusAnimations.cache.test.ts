import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ElementStatus } from '../ElementStatus.ts';

vi.mock('../../core/utils/viewBounds.ts', () => ({
  isRectVisible: vi.fn(() => true),
  isCircleVisible: vi.fn(() => true),
}));

vi.mock('./statusAnimationEffects.ts', () => ({
  drawStatusAnimationEffect: vi.fn(),
  hasStatusAnimation: vi.fn(() => true),
}));

vi.mock('./statusAnimationOutlines.ts', () => ({
  createRectOutline: vi.fn(() => ({
    drawPath: vi.fn(),
    perimeter: vi.fn(() => 100),
    pointAt: vi.fn(() => ({ x: 0, y: 0 })),
  })),
  createCircleOutline: vi.fn(() => ({
    drawPath: vi.fn(),
    perimeter: vi.fn(() => 100),
    pointAt: vi.fn(() => ({ x: 0, y: 0 })),
  })),
  createHexOutline: vi.fn(() => ({
    drawPath: vi.fn(),
    perimeter: vi.fn(() => 100),
    pointAt: vi.fn(() => ({ x: 0, y: 0 })),
  })),
}));

import {
  __clearStatusOutlineCache,
  drawStatusAnimationCircle,
  drawStatusAnimationHex,
  drawStatusAnimationRect,
} from './statusAnimations.ts';
import {
  createCircleOutline,
  createHexOutline,
  createRectOutline,
} from './statusAnimationOutlines.ts';

describe('statusAnimations outline caching', () => {
  beforeEach(() => {
    __clearStatusOutlineCache();
    vi.clearAllMocks();
  });

  it('reuses cached rect outline when geometry is unchanged', () => {
    const ctx = {} as CanvasRenderingContext2D;
    drawStatusAnimationRect({
      status: ElementStatus.Done,
      ctx,
      x: 10,
      y: 20,
      width: 120,
      height: 60,
      radius: 8,
      lineWidth: 1,
      scale: 1,
      timeMs: 1000,
    });
    drawStatusAnimationRect({
      status: ElementStatus.Done,
      ctx,
      x: 10,
      y: 20,
      width: 120,
      height: 60,
      radius: 8,
      lineWidth: 1,
      scale: 1,
      timeMs: 1200,
    });
    expect(vi.mocked(createRectOutline)).toHaveBeenCalledTimes(1);
  });

  it('reuses cached circle and hex outlines when geometry is unchanged', () => {
    const ctx = {} as CanvasRenderingContext2D;
    drawStatusAnimationCircle({
      status: ElementStatus.InProgress,
      ctx,
      centerX: 50,
      centerY: 80,
      radius: 30,
      lineWidth: 1,
      scale: 1,
      timeMs: 400,
    });
    drawStatusAnimationCircle({
      status: ElementStatus.InProgress,
      ctx,
      centerX: 50,
      centerY: 80,
      radius: 30,
      lineWidth: 1,
      scale: 1,
      timeMs: 600,
    });
    drawStatusAnimationHex({
      status: ElementStatus.Pending,
      ctx,
      centerX: 150,
      centerY: 180,
      radius: 40,
      lineWidth: 1,
      scale: 1,
      timeMs: 400,
    });
    drawStatusAnimationHex({
      status: ElementStatus.Pending,
      ctx,
      centerX: 150,
      centerY: 180,
      radius: 40,
      lineWidth: 1,
      scale: 1,
      timeMs: 600,
    });

    expect(vi.mocked(createCircleOutline)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createHexOutline)).toHaveBeenCalledTimes(1);
  });
});
