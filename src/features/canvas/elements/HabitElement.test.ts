import { afterEach, describe, expect, it, vi } from 'vitest';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ElementStatus } from './ElementStatus.ts';
import { HabitElement } from './HabitElement.ts';
import { PlanningElement } from './PlanningElement.ts';
import { drawStatusAnimationCircle } from './utils/statusAnimations.ts';

vi.mock('./utils/statusAnimations.ts', () => ({
  drawStatusAnimationCircle: vi.fn(),
}));

function createRenderingContextStub(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    setLineDash: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
  } as unknown as CanvasRenderingContext2D;
}

describe('HabitElement', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('draws anchors when the routine is selected', () => {
    const drawAnchorsSpy = vi.spyOn(PlanningElement.prototype, 'drawAnchors');
    const routine = new HabitElement({ selected: true });
    const ctx = createRenderingContextStub();
    const panZoom = { scale: 0.1 } as unknown as PanZoomManager;

    routine.draw(ctx, panZoom);

    expect(drawAnchorsSpy).toHaveBeenCalledWith(ctx, panZoom);
  });

  it('renders active routine status animation as an in-progress circle effect', () => {
    const routine = new HabitElement({ habitStatus: Status.Active });
    const ctx = createRenderingContextStub();
    const panZoom = {
      scale: 1,
      timeMs: 1200,
      viewBounds: null,
      renderFlags: { showAnim: true, showGoalText: true },
    } as unknown as PanZoomManager;

    routine.draw(ctx, panZoom);

    expect(drawStatusAnimationCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ElementStatus.InProgress,
        color: '#bfdbfe',
        centerX: routine.x + routine.radius,
        centerY: routine.y + routine.radius,
        radius: routine.radius,
      })
    );
  });

  it('renders archived routine status animation as a defined circle effect', () => {
    const routine = new HabitElement({ habitStatus: Status.Archived });
    const ctx = createRenderingContextStub();
    const panZoom = {
      scale: 1,
      timeMs: 1200,
      viewBounds: null,
      renderFlags: { showAnim: true, showGoalText: true },
    } as unknown as PanZoomManager;

    routine.draw(ctx, panZoom);

    expect(drawStatusAnimationCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ElementStatus.Defined,
        color: '#94a3b8',
        centerX: routine.x + routine.radius,
        centerY: routine.y + routine.radius,
        radius: routine.radius,
      })
    );
  });
});
