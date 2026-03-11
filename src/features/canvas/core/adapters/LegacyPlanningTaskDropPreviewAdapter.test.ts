import { describe, expect, it } from 'vitest';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { LegacyPlanningTaskDropPreviewAdapter } from './LegacyPlanningTaskDropPreviewAdapter.ts';

describe('LegacyPlanningTaskDropPreviewAdapter', () => {
  it('keeps empty state when there is no drag session', () => {
    const adapter = new LegacyPlanningTaskDropPreviewAdapter();
    adapter.update({
      sceneElements: [],
      initialPositions: new Map(),
      pointer: { x: 0, y: 0 },
    });

    expect(adapter.getState().taskDropPlaceholders).toEqual([]);
    expect(adapter.getState().storyDropPlans.size).toBe(0);
  });

  it('computes placeholders for dragged tasks inside stories', () => {
    const adapter = new LegacyPlanningTaskDropPreviewAdapter();
    const story = new StoryElement({ x: 100, y: 100, width: 420, height: 220 });
    const task = new TaskElement({ x: 140, y: 160 });
    story.addTask(task);

    adapter.update({
      sceneElements: [story, task] as any,
      initialPositions: new Map([[task.id, { x: task.x, y: task.y }]]),
      pointer: { x: task.x, y: task.y },
    });

    const state = adapter.getState();
    expect(state.storyDropPlans.size).toBeGreaterThan(0);
    expect(state.taskDropPlaceholders.length).toBeGreaterThan(0);
  });
});
