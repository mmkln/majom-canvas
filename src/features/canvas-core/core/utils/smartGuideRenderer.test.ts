import { describe, expect, it } from 'vitest';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { drawSmartGuides } from './smartGuideRenderer.ts';

type MockContext = {
  strokeStyle: string;
  fillStyle: string;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  lineWidth: number;
  dashCalls: number[][];
  strokeSnapshots: Array<{
    strokeStyle: string;
    lineWidth: number;
    dash: number[];
  }>;
  paths: Array<Array<{ x: number; y: number }>>;
  textCalls: Array<{ text: string; x: number; y: number }>;
  fillRects: Array<{ x: number; y: number; width: number; height: number }>;
  beginCount: number;
  strokeCount: number;
  saveCount: number;
  restoreCount: number;
  save: () => void;
  restore: () => void;
  setLineDash: (dash: number[]) => void;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
  fillText: (text: string, x: number, y: number) => void;
};

function createMockContext(): MockContext {
  const paths: Array<Array<{ x: number; y: number }>> = [];
  const textCalls: Array<{ text: string; x: number; y: number }> = [];
  const fillRects: Array<{ x: number; y: number; width: number; height: number }> =
    [];
  let currentDash: number[] = [];
  const context: MockContext = {
    strokeStyle: '',
    fillStyle: '',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    lineWidth: 0,
    dashCalls: [],
    strokeSnapshots: [],
    paths,
    textCalls,
    fillRects,
    beginCount: 0,
    strokeCount: 0,
    saveCount: 0,
    restoreCount: 0,
    save: () => {
      context.saveCount += 1;
    },
    restore: () => {
      context.restoreCount += 1;
    },
    setLineDash: (dash) => {
      currentDash = [...dash];
      context.dashCalls.push([...dash]);
    },
    fillRect: (x, y, width, height) => {
      fillRects.push({ x, y, width, height });
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
      context.strokeSnapshots.push({
        strokeStyle: context.strokeStyle,
        lineWidth: context.lineWidth,
        dash: [...currentDash],
      });
      context.strokeCount += 1;
    },
    fillText: (text, x, y) => {
      textCalls.push({ text, x, y });
    },
  };
  return context;
}

describe('drawSmartGuides', () => {
  it('renders solid vertical and horizontal guide lines with scaled line width', () => {
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
      color: 'rgba(1,2,3,0.4)',
      lineWidth: 1.5,
    });

    expect(ctx.saveCount).toBe(1);
    expect(ctx.restoreCount).toBe(1);
    expect(ctx.strokeStyle).toBe('rgba(1,2,3,0.4)');
    expect(ctx.lineWidth).toBeCloseTo(0.75, 5);
    expect(ctx.dashCalls).toEqual([[]]);
    expect(ctx.beginCount).toBe(2);
    expect(ctx.strokeCount).toBe(2);
    expect(ctx.fillRects).toEqual([]);
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
      color: '#000',
      lineWidth: 2,
    });

    expect(ctx.saveCount).toBe(0);
    expect(ctx.beginCount).toBe(0);
    expect(ctx.strokeCount).toBe(0);
  });

  it('renders spacing guides with dashed styling, end caps, and a centered label', () => {
    const ctx = createMockContext();
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103 px',
        position: 525,
        start: 100,
        end: 212,
        offset: 5,
        movingAnchor: 'left',
        targetAnchor: 'left',
      },
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103 px',
        position: 797,
        start: 100,
        end: 212,
        offset: 5,
        movingAnchor: 'right',
        targetAnchor: 'right',
      },
    ];

    drawSmartGuides({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      guides,
      scale: 1,
      color: 'rgba(1,2,3,0.4)',
      spacingColor: 'rgba(4,5,6,0.8)',
      labelColor: '#111827',
      lineWidth: 1.5,
    });

    expect(ctx.saveCount).toBe(1);
    expect(ctx.restoreCount).toBe(1);
    expect(ctx.strokeStyle).toBe('rgba(4,5,6,0.8)');
    expect(ctx.fillStyle).toBe('#111827');
    expect(ctx.globalAlpha).toBe(1);
    expect(ctx.dashCalls).toEqual([[], [6, 4], [], [6, 4], [], [6, 4], []]);
    expect(ctx.fillRects).toEqual([
      { x: 525, y: 100, width: 272, height: 112 },
    ]);
    expect(ctx.textCalls).toEqual([{ text: '103 px', x: 661, y: 156 }]);
    expect(ctx.beginCount).toBe(4);
    expect(ctx.strokeCount).toBe(4);
    expect(ctx.paths).toEqual([
      [
        { x: 525, y: 100 },
        { x: 525, y: 212 },
      ],
      [
        { x: 517, y: 100 },
        { x: 533, y: 100 },
        { x: 517, y: 212 },
        { x: 533, y: 212 },
      ],
      [
        { x: 797, y: 100 },
        { x: 797, y: 212 },
      ],
      [
        { x: 789, y: 100 },
        { x: 805, y: 100 },
        { x: 789, y: 212 },
        { x: 805, y: 212 },
      ],
    ]);
  });

  it('renders container and viewport-center guides with distinct styles', () => {
    const ctx = createMockContext();
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'story-1',
        guideKind: 'container',
        position: 320,
        start: 80,
        end: 320,
        offset: -4,
        movingAnchor: 'left',
        targetAnchor: 'left',
      },
      {
        orientation: 'vertical',
        targetId: '__viewport__',
        guideKind: 'viewport-center',
        position: 600,
        start: 0,
        end: 800,
        offset: 4,
        movingAnchor: 'center',
        targetAnchor: 'center',
      },
    ];

    drawSmartGuides({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      guides,
      scale: 1,
      color: 'rgba(1,2,3,0.4)',
      containerColor: 'rgba(245,158,11,0.88)',
      viewportCenterColor: 'rgba(14,165,233,0.84)',
      lineWidth: 1.5,
    });

    expect(ctx.strokeSnapshots).toEqual([
      {
        strokeStyle: 'rgba(245,158,11,0.88)',
        lineWidth: 1.5,
        dash: [10, 4],
      },
      {
        strokeStyle: 'rgba(14,165,233,0.84)',
        lineWidth: 1.5,
        dash: [2, 5],
      },
    ]);
    expect(ctx.paths).toEqual([
      [
        { x: 320, y: 80 },
        { x: 320, y: 320 },
      ],
      [
        { x: 600, y: 0 },
        { x: 600, y: 800 },
      ],
    ]);
  });
});
