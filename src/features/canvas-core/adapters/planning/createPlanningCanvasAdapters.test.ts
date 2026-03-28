import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanningCanvasAlignmentAdapter } from './PlanningCanvasAlignmentAdapter.ts';
import { PlanningCanvasAppearanceAdapter } from './PlanningCanvasAppearanceAdapter.ts';
import { PlanningCanvasDataAdapter } from './PlanningCanvasDataAdapter.ts';
import { PlanningCanvasInteractionAdapter } from './PlanningCanvasInteractionAdapter.ts';
import { PlanningCanvasLookupAdapter } from './PlanningCanvasLookupAdapter.ts';
import { planningCanvasElementSemantics } from './PlanningCanvasElementSemantics.ts';
import { PlanningCanvasPersistenceAdapter } from './PlanningCanvasPersistenceAdapter.ts';
import { PlanningCanvasUiAdapter } from './PlanningCanvasUiAdapter.ts';
import { createPlanningCanvasAdapters } from './createPlanningCanvasAdapters.ts';

describe('createPlanningCanvasAdapters', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('assembles the planning adapter bundle for canvas-core', () => {
    const adapters = createPlanningCanvasAdapters();

    expect(adapters.alignment).toBeInstanceOf(PlanningCanvasAlignmentAdapter);
    expect(adapters.appearance).toBeInstanceOf(PlanningCanvasAppearanceAdapter);
    expect(adapters.data).toBeInstanceOf(PlanningCanvasDataAdapter);
    expect(adapters.interaction).toBeInstanceOf(
      PlanningCanvasInteractionAdapter
    );
    expect(adapters.lookup).toBeInstanceOf(PlanningCanvasLookupAdapter);
    expect(adapters.nodeSemantics).toBe(planningCanvasElementSemantics);
    expect(adapters.persistence).toBeInstanceOf(
      PlanningCanvasPersistenceAdapter
    );
    expect(adapters.planningRelations).toBe(adapters.data);
    expect(adapters.ui).toBeInstanceOf(PlanningCanvasUiAdapter);
  });
});
