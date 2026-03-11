import { describe, expect, it } from 'vitest';
import { NoopStoryResizeLayoutAdapter } from './StoryResizeLayoutAdapter.ts';
import { StoryElement } from '../../elements/StoryElement.ts';

describe('NoopStoryResizeLayoutAdapter', () => {
  it('returns input size and no moved tasks', () => {
    const adapter = new NoopStoryResizeLayoutAdapter();
    const story = new StoryElement({ x: 10, y: 20, width: 200, height: 120 });
    adapter.onResizeStart({ story, sceneElements: [story as any] });

    const updated = adapter.onResizeUpdate({
      story,
      sceneElements: [story as any],
      nextWidth: 320,
      nextHeight: 180,
    });
    const moved = adapter.collectMovedTasks([story as any]);

    expect(updated).toEqual({ nextWidth: 320, nextHeight: 180 });
    expect(moved.initial.size).toBe(0);
    expect(moved.final.size).toBe(0);
  });
});
