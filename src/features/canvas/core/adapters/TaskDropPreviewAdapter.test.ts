import { describe, expect, it } from 'vitest';
import { NoopTaskDropPreviewAdapter } from './TaskDropPreviewAdapter.ts';

describe('NoopTaskDropPreviewAdapter', () => {
  it('returns empty state and does not throw on update/clear', () => {
    const adapter = new NoopTaskDropPreviewAdapter();

    adapter.update({
      sceneElements: [],
      initialPositions: new Map(),
      pointer: { x: 0, y: 0 },
    });
    adapter.clear();

    const state = adapter.getState();
    expect(state.taskDropPlaceholders).toEqual([]);
    expect(state.storyDropPlans.size).toBe(0);
    expect(state.storyResizePreviews).toEqual([]);
    expect(state.taskReflowPreviews.size).toBe(0);
  });
});
