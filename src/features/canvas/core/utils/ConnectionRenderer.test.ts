import { describe, expect, it, vi } from 'vitest';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { ConnectionPoint } from '../interfaces/shape.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import { connectionRenderer } from './ConnectionRenderer.ts';

type GradientStub = {
  addColorStop: ReturnType<typeof vi.fn>;
};

type CtxStub = {
  beginPath: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  bezierCurveTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  setLineDash: ReturnType<typeof vi.fn>;
  arc: ReturnType<typeof vi.fn>;
  closePath: ReturnType<typeof vi.fn>;
  createLinearGradient: ReturnType<typeof vi.fn>;
  strokeStyle: string | CanvasGradient;
  fillStyle: string | CanvasGradient;
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  lineCap: CanvasLineCap;
  lineDashOffset: number;
  globalAlpha: number;
  globalCompositeOperation: GlobalCompositeOperation;
  shadowBlur: number;
  shadowColor: string;
};

function createCtxStub(): {
  ctx: CanvasRenderingContext2D;
  gradient: GradientStub;
} {
  const gradient: GradientStub = {
    addColorStop: vi.fn(),
  };
  const stub: CtxStub = {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    createLinearGradient: vi.fn(() => gradient as unknown as CanvasGradient),
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    lineJoin: 'miter',
    lineCap: 'butt',
    lineDashOffset: 0,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: '#000000',
  };
  return {
    ctx: stub as unknown as CanvasRenderingContext2D,
    gradient,
  };
}

function createConnectable(id: string): IConnectable {
  return {
    id,
    x: 0,
    y: 0,
    selected: false,
    zIndex: 1,
    draw: vi.fn(),
    contains: () => false,
    getConnectionPoints: () => [],
    getNearestPoint: () => ({ x: 0, y: 0 }),
    drawAnchors: vi.fn(),
    drawConnectionLine: vi.fn(),
  } as unknown as IConnectable;
}

describe('ConnectionRenderer geometry reuse', () => {
  it('reuses one curve for selected non-cyber relation', () => {
    const { ctx } = createCtxStub();
    const start: ConnectionPoint = {
      x: 10,
      y: 20,
      angle: 0,
      isHovered: false,
      direction: 'right',
    };
    const end: ConnectionPoint = {
      x: 140,
      y: 120,
      angle: Math.PI,
      isHovered: false,
      direction: 'left',
    };
    const curve = {
      start,
      end,
      cp1: { x: 40, y: 20 },
      cp2: { x: 110, y: 120 },
      isBezier: true,
    };
    const connection = {
      relationType: ConnectionRelationType.RelatesTo,
      selected: true,
      getCurvePoints: vi.fn(() => curve),
      buildPath: vi.fn(),
      getClosestConnectionPoints: vi.fn(() => ({ start, end })),
      getTangentAngle: vi.fn(() => 0),
      sampleCurveWithTangent: vi.fn(() => ({ x: 0, y: 0, nx: 0, ny: 1 })),
    };
    const panZoom = { scale: 1, timeMs: 0 } as unknown as PanZoomManager;
    const from = createConnectable('from');
    const to = createConnectable('to');

    connectionRenderer.draw(
      connection,
      ctx,
      panZoom,
      from,
      to
    );

    expect(connection.getCurvePoints).toHaveBeenCalledTimes(1);
    expect(connection.getClosestConnectionPoints).not.toHaveBeenCalled();
  });

  it('reuses one closest-point computation for selected cyber relation', () => {
    const { ctx } = createCtxStub();
    const start: ConnectionPoint = {
      x: 20,
      y: 20,
      angle: 0,
      isHovered: false,
      direction: 'right',
    };
    const end: ConnectionPoint = {
      x: 220,
      y: 120,
      angle: Math.PI,
      isHovered: false,
      direction: 'left',
    };
    const connection = {
      relationType: ConnectionRelationType.LeadsTo,
      selected: true,
      getCurvePoints: vi.fn(),
      buildPath: vi.fn(),
      getClosestConnectionPoints: vi.fn(() => ({ start, end })),
      getTangentAngle: vi.fn(() => 0),
      sampleCurveWithTangent: vi.fn(() => ({ x: 0, y: 0, nx: 0, ny: 1 })),
    };
    const panZoom = { scale: 1, timeMs: 0 } as unknown as PanZoomManager;
    const from = createConnectable('from');
    const to = createConnectable('to');

    connectionRenderer.draw(
      connection,
      ctx,
      panZoom,
      from,
      to
    );

    expect(connection.getClosestConnectionPoints).toHaveBeenCalledTimes(1);
    expect(connection.getCurvePoints).not.toHaveBeenCalled();
  });

  it('reduces cyber glow work when connectionAnimDetail is reduced', () => {
    const start: ConnectionPoint = {
      x: 20,
      y: 20,
      angle: 0,
      isHovered: false,
      direction: 'right',
    };
    const end: ConnectionPoint = {
      x: 220,
      y: 120,
      angle: Math.PI,
      isHovered: false,
      direction: 'left',
    };
    const connection = {
      relationType: ConnectionRelationType.LeadsTo,
      selected: false,
      getCurvePoints: vi.fn(),
      buildPath: vi.fn(),
      getClosestConnectionPoints: vi.fn(() => ({ start, end })),
      getTangentAngle: vi.fn(() => 0),
      sampleCurveWithTangent: vi.fn(() => ({ x: 0, y: 0, nx: 0, ny: 1 })),
    };
    const from = createConnectable('from');
    const to = createConnectable('to');

    const fullCtxStub = createCtxStub();
    connectionRenderer.draw(
      connection,
      fullCtxStub.ctx,
      { scale: 1, timeMs: 0 } as unknown as PanZoomManager,
      from,
      to
    );
    const fullArcCalls = (fullCtxStub.ctx.arc as unknown as ReturnType<
      typeof vi.fn
    >).mock.calls.length;

    const reducedCtxStub = createCtxStub();
    connectionRenderer.draw(
      connection,
      reducedCtxStub.ctx,
      {
        scale: 1,
        timeMs: 0,
        renderFlags: { connectionAnimDetail: 'reduced' },
      } as unknown as PanZoomManager,
      from,
      to
    );
    const reducedArcCalls = (reducedCtxStub.ctx.arc as unknown as ReturnType<
      typeof vi.fn
    >).mock.calls.length;

    expect(fullArcCalls).toBeGreaterThan(0);
    expect(reducedArcCalls).toBe(0);
  });
});
