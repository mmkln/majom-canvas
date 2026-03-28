import { describe, expect, it } from 'vitest';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { drawSmartGuides } from './smartGuideRenderer.ts';

type MockContext = {
  strokeStyle: string;
  lineWidth: number;
  dashCalls: number[][];
  strokeCount: number;
  paths: Array<Array<{ x: number; y: number }>>;
  beginCount: number;
  saveCount: number;
  restoreCount: number;
  save: () => void;
  restore: () => void;
  setLineDash: (dash: number[]) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
};

function createMockContext(): MockContext {
  const paths: Array<Array<{ x: number; y: number }>> = [];
  const context: MockContext = {
    strokeStyle: '',
    lineWidth: 0,
    dashCalls: [],
    strokeCount: 0,
    paths,
    beginCount: 0,
    saveCount: 0,
    restoreCount: 0,
    save: () => {
      context.saveCount += 1;
    },
    restore: () => {
      context.restoreCount += 1;
    },
    setLineDash: (dash) => {
      context.dashCalls.push([...dash]);
    },
    beginPath: () => {
      context.beginCount += 1;
      paths.push([]);
    },
    moveTo: (x, y) => {
      paths[paths.length - 1].push({ x, y });
    },
    lineTo: (x, y) => {
      paths[paths.length - 1].push({ x, y });
    },
    stroke: () => {
      context.strokeCount += 1;
    },
  };
  return context;
}

describe('drawSmartGuides', () => {
  it('renders shared guide visuals through the legacy canvas shim', () => {
    const ctx = createMockContext();
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'v1',
        position: 120,
        start: 40,
        end: 220,
        offset: 2,
        movingAnchor: 'left',
        targetAnchor: 'left',
      },
      {
        orientation: 'horizontal',
        targetId: 'h1',
        position: 300,
        start: 25,
        end: 125,
        offset: -3,
        movingAnchor: 'middle',
        targetAnchor: 'middle',
      },
    ];

    drawSmartGuides({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      guides,
      scale: 2,
    });

    expect(ctx.saveCount).toBe(1);
    expect(ctx.restoreCount).toBe(1);
    expect(ctx.beginCount).toBe(2);
    expect(ctx.strokeCount).toBe(2);
    expect(ctx.paths).toEqual([
      [
        { x: 120, y: 40 },
        { x: 120, y: 220 },
      ],
      [
        { x: 25, y: 300 },
        { x: 125, y: 300 },
      ],
    ]);
  });

  it('does nothing when guide list is empty', () => {
    const ctx = createMockContext();

    drawSmartGuides({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      guides: [],
      scale: 1,
    });

    expect(ctx.saveCount).toBe(0);
    expect(ctx.beginCount).toBe(0);
    expect(ctx.strokeCount).toBe(0);
  });
});
