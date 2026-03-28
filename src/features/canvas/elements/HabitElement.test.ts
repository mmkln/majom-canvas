import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { HabitElement } from './HabitElement.ts';
import { PlanningElement } from './PlanningElement.ts';

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
});
