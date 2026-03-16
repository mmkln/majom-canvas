import { describe, expect, it, vi } from 'vitest';
import { ElementStatus } from '../ElementStatus.ts';
import { drawStatusAnimationEffect } from './statusAnimationEffects.ts';
import type { OutlinePath } from './statusAnimationTypes.ts';

type CtxStub = {
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  beginPath: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  lineWidth: number;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineDashOffset: number;
  globalAlpha: number;
};

function createCtxStub(): CanvasRenderingContext2D {
  const ctx: CtxStub = {
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    lineCap: 'butt',
    lineJoin: 'miter',
    lineWidth: 1,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineDashOffset: 0,
    globalAlpha: 1,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

function createOutline(): OutlinePath {
  return {
    drawPath: vi.fn(),
    perimeter: () => 800,
    pointAt: () => ({ x: 0, y: 0 }),
  };
}

describe('statusAnimationEffects reduced detail', () => {
  it('draws fewer sweep strokes for done status in reduced mode', () => {
    const fullCtx = createCtxStub();
    drawStatusAnimationEffect({
      status: ElementStatus.Done,
      ctx: fullCtx,
      outline: createOutline(),
      lineWidth: 1,
      scale: 1,
      timeMs: 1200,
      detail: 'full',
    });
    const fullStrokeCount = (
      fullCtx.stroke as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.length;

    const reducedCtx = createCtxStub();
    drawStatusAnimationEffect({
      status: ElementStatus.Done,
      ctx: reducedCtx,
      outline: createOutline(),
      lineWidth: 1,
      scale: 1,
      timeMs: 1200,
      detail: 'reduced',
    });
    const reducedStrokeCount = (
      reducedCtx.stroke as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.length;

    expect(fullStrokeCount).toBeGreaterThan(reducedStrokeCount);
  });

  it('keeps a lighter pulse ring in reduced in-progress mode', () => {
    const fullCtx = createCtxStub();
    drawStatusAnimationEffect({
      status: ElementStatus.InProgress,
      ctx: fullCtx,
      outline: createOutline(),
      lineWidth: 1,
      scale: 1,
      color: '#1890ff',
      timeMs: 800,
      detail: 'full',
    });
    const fullFillCount = (
      fullCtx.fill as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.length;

    const reducedCtx = createCtxStub();
    drawStatusAnimationEffect({
      status: ElementStatus.InProgress,
      ctx: reducedCtx,
      outline: createOutline(),
      lineWidth: 1,
      scale: 1,
      color: '#1890ff',
      timeMs: 800,
      detail: 'reduced',
    });
    const reducedFillCount = (
      reducedCtx.fill as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.length;

    expect(fullFillCount).toBeGreaterThan(0);
    expect(reducedFillCount).toBeGreaterThan(0);
    expect(reducedFillCount).toBeLessThanOrEqual(fullFillCount);
  });
});
