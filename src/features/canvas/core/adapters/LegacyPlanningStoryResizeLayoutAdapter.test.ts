import { describe, expect, it } from 'vitest';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import { LegacyPlanningStoryResizeLayoutAdapter } from './LegacyPlanningStoryResizeLayoutAdapter.ts';

describe('LegacyPlanningStoryResizeLayoutAdapter', () => {
  it('tracks moved tasks between resize start and finalize', () => {
    const adapter = new LegacyPlanningStoryResizeLayoutAdapter(
      new StoryLayoutService()
    );
    const story = new StoryElement({ x: 100, y: 100, width: 420, height: 220 });
    const task = new TaskElement({ x: 140, y: 160 });
    story.addTask(task);

    adapter.onResizeStart({
      story,
      sceneElements: [story as any, task as any],
    });

    task.x += 10;
    task.y += 5;
    const moved = adapter.collectMovedTasks([story as any, task as any]);

    expect(moved.initial.get(task.id)).toEqual({ x: 140, y: 160 });
    expect(moved.final.get(task.id)).toEqual({ x: 150, y: 165 });
  });

  it('returns planned dimensions on resize update', () => {
    const adapter = new LegacyPlanningStoryResizeLayoutAdapter(
      new StoryLayoutService()
    );
    const story = new StoryElement({ x: 0, y: 0, width: 300, height: 180 });
    const updated = adapter.onResizeUpdate({
      story,
      sceneElements: [story as any],
      nextWidth: 340,
      nextHeight: 210,
    });

    expect(updated.nextWidth).toBeGreaterThan(0);
    expect(updated.nextHeight).toBeGreaterThan(0);
  });
});
