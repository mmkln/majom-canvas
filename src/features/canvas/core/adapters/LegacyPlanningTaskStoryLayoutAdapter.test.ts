import { describe, expect, it } from 'vitest';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import { LegacyPlanningTaskStoryLayoutAdapter } from './LegacyPlanningTaskStoryLayoutAdapter.ts';

describe('LegacyPlanningTaskStoryLayoutAdapter', () => {
  it('returns empty changes when dragging non-task in item mode', () => {
    const adapter = new LegacyPlanningTaskStoryLayoutAdapter(
      new StoryLayoutService()
    );
    const story = new StoryElement({ x: 100, y: 100, width: 360, height: 220 });

    const result = adapter.compute({
      mode: 'item',
      draggingItem: story as any,
      selectedElements: [story as any],
      sceneElements: [story as any],
      draggedElementIds: new Set([story.id]),
      dropPlans: new Map(),
    });

    expect(result.movedInitial.size).toBe(0);
    expect(result.resizedInitial.size).toBe(0);
  });

  it('updates task-story assignment for dragged tasks', () => {
    const adapter = new LegacyPlanningTaskStoryLayoutAdapter(
      new StoryLayoutService()
    );
    const story = new StoryElement({ x: 100, y: 100, width: 420, height: 220 });
    const task = new TaskElement({ x: 140, y: 160 });

    const result = adapter.compute({
      mode: 'item',
      draggingItem: task as any,
      selectedElements: [task as any],
      sceneElements: [story as any, task as any],
      draggedElementIds: new Set([task.id]),
      dropPlans: new Map(),
    });

    expect(story.tasks.some((candidate) => candidate.id === task.id)).toBe(true);
    expect(result).toHaveProperty('movedInitial');
    expect(result).toHaveProperty('resizedInitial');
  });
});
