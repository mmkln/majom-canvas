import { describe, expect, it } from 'vitest';
import { DEFAULT_ALIGNMENT_PRESENTATION_THEME } from '../../alignment/index.ts';
import {
  createAlignmentRect,
  type SmartGuideLine,
} from '../services/SmartAlignmentService.ts';
import { drawSmartGuides } from './smartGuideRenderer.ts';

type StrokeSnapshot = {
  strokeStyle: string;
  lineWidth: number;
  dash: number[];
  globalAlpha: number;
};

type FillRectSnapshot = {
  x: number;
  y: number;
  width: number;
  height: number;
  fillStyle: string;
  globalAlpha: number;
};

type StrokeRectSnapshot = {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeStyle: string;
  lineWidth: number;
};

type MockContext = {
  strokeStyle: string;
  fillStyle: string;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  lineWidth: number;
  dashCalls: number[][];
  strokeSnapshots: StrokeSnapshot[];
  fillRects: FillRectSnapshot[];
  strokeRects: StrokeRectSnapshot[];
  paths: Array<Array<{ x: number; y: number }>>;
  textCalls: Array<{
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    font: string;
  }>;
  beginCount: number;
  strokeCount: number;
  saveCount: number;
  restoreCount: number;
  save: () => void;
  restore: () => void;
  setLineDash: (dash: number[]) => void;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  strokeRect: (x: number, y: number, width: number, height: number) => void;
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  stroke: () => void;
  fillText: (text: string, x: number, y: number) => void;
  measureText: (text: string) => TextMetrics;
};

function createMockContext(): MockContext {
  const paths: Array<Array<{ x: number; y: number }>> = [];
  const textCalls: Array<{
    text: string;
    x: number;
    y: number;
    textAlign: CanvasTextAlign;
    font: string;
  }> = [];
  const fillRects: FillRectSnapshot[] = [];
  const strokeRects: StrokeRectSnapshot[] = [];
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
    fillRects,
    strokeRects,
    paths,
    textCalls,
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
      fillRects.push({
        x,
        y,
        width,
        height,
        fillStyle: context.fillStyle,
        globalAlpha: context.globalAlpha,
      });
    },
    strokeRect: (x, y, width, height) => {
      strokeRects.push({
        x,
        y,
        width,
        height,
        strokeStyle: context.strokeStyle,
        lineWidth: context.lineWidth,
      });
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
        globalAlpha: context.globalAlpha,
      });
      context.strokeCount += 1;
    },
    fillText: (text, x, y) => {
      textCalls.push({
        text,
        x,
        y,
        textAlign: context.textAlign,
        font: context.font,
      });
    },
    measureText: (text) =>
      ({ width: text.length * 6 } satisfies Pick<TextMetrics, 'width'>) as TextMetrics,
  };

  return context;
}

describe('drawSmartGuides', () => {
  it('renders edge and center guides with clearer primary-secondary contrast', () => {
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
        primary: false,
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
      theme: DEFAULT_ALIGNMENT_PRESENTATION_THEME,
    });

    expect(ctx.saveCount).toBe(1);
    expect(ctx.restoreCount).toBe(1);
    expect(ctx.strokeSnapshots).toHaveLength(2);
    expect(ctx.strokeSnapshots[0]).toMatchObject({
      strokeStyle: '#2563eb',
      lineWidth: 0.45,
      dash: [],
    });
    expect(ctx.strokeSnapshots[0]!.globalAlpha).toBeCloseTo(0.4928, 6);
    expect(ctx.strokeSnapshots[1]).toEqual({
      strokeStyle: '#2563eb',
      lineWidth: 0.5,
      dash: [],
      globalAlpha: 0.68,
    });
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

  it('renders spacing as dual measurement rails without a numeric label', () => {
    const ctx = createMockContext();
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103',
        spacingDistance: 103,
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
        label: '103',
        spacingDistance: 103,
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
      movingBounds: createAlignmentRect({
        x: 525,
        y: 100,
        width: 272,
        height: 112,
      }),
      viewportBounds: createAlignmentRect({
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
      }),
      theme: DEFAULT_ALIGNMENT_PRESENTATION_THEME,
    });

    expect(ctx.strokeSnapshots).toEqual([
      {
        strokeStyle: '#2563eb',
        lineWidth: 0.9,
        dash: [],
        globalAlpha: 0.68,
      },
      {
        strokeStyle: '#2563eb',
        lineWidth: 0.9,
        dash: [],
        globalAlpha: 0.68,
      },
      {
        strokeStyle: '#2563eb',
        lineWidth: 0.9,
        dash: [],
        globalAlpha: 0.68,
      },
      {
        strokeStyle: '#2563eb',
        lineWidth: 0.9,
        dash: [],
        globalAlpha: 0.68,
      },
    ]);
    expect(ctx.fillRects).toEqual([]);
    expect(ctx.strokeRects).toEqual([]);
    expect(ctx.textCalls).toEqual([]);
    expect(ctx.beginCount).toBe(4);
    expect(ctx.strokeCount).toBe(4);
    expect(ctx.paths).toEqual([
      [
        { x: 422, y: 86 },
        { x: 525, y: 86 },
      ],
      [
        { x: 422, y: 82 },
        { x: 422, y: 90 },
        { x: 525, y: 82 },
        { x: 525, y: 90 },
      ],
      [
        { x: 797, y: 86 },
        { x: 900, y: 86 },
      ],
      [
        { x: 797, y: 82 },
        { x: 797, y: 90 },
        { x: 900, y: 82 },
        { x: 900, y: 90 },
      ],
    ]);
  });

  it('renders container and viewport-center guides as neutral structural hints', () => {
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
      theme: DEFAULT_ALIGNMENT_PRESENTATION_THEME,
    });

    expect(ctx.strokeSnapshots).toEqual([
      {
        strokeStyle: '#334155',
        lineWidth: 0.92,
        dash: [6, 4],
        globalAlpha: 0.42,
      },
      {
        strokeStyle: '#334155',
        lineWidth: 0.92,
        dash: [2, 4],
        globalAlpha: 0.28,
      },
    ]);
  });

  it('does not render a numeric label for vertical spacing rails', () => {
    const ctx = createMockContext();
    const guides: SmartGuideLine[] = [
      {
        orientation: 'horizontal',
        targetId: 'spacing-y:top:bottom',
        guideKind: 'spacing',
        label: '48',
        spacingDistance: 48,
        position: 240,
        start: 525,
        end: 797,
        offset: 6,
        movingAnchor: 'top',
        targetAnchor: 'top',
      },
      {
        orientation: 'horizontal',
        targetId: 'spacing-y:top:bottom',
        guideKind: 'spacing',
        label: '48',
        spacingDistance: 48,
        position: 400,
        start: 525,
        end: 797,
        offset: 6,
        movingAnchor: 'bottom',
        targetAnchor: 'bottom',
      },
    ];

    drawSmartGuides({
      ctx: ctx as unknown as CanvasRenderingContext2D,
      guides,
      scale: 1,
      movingBounds: createAlignmentRect({
        x: 525,
        y: 240,
        width: 272,
        height: 112,
      }),
      viewportBounds: createAlignmentRect({
        x: 0,
        y: 0,
        width: 1200,
        height: 800,
      }),
      theme: DEFAULT_ALIGNMENT_PRESENTATION_THEME,
    });

    expect(ctx.textCalls).toEqual([]);
  });
});
