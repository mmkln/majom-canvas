import { describe, expect, it } from 'vitest';
import { legacyPlanningDragGroupResolver } from './LegacyPlanningDragGroupResolver.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

describe('legacyPlanningDragGroupResolver', () => {
  it('includes tasks of selected stories', () => {
    const story = new StoryElement({ x: 100, y: 120, width: 400, height: 220 });
    const task = new TaskElement({ x: 160, y: 180 });
    story.addTask(task);

    const resolved = legacyPlanningDragGroupResolver([story]);
    const ids = resolved.map((element) => element.id);

    expect(ids).toContain(story.id);
    expect(ids).toContain(task.id);
  });

  it('keeps non-story selection unchanged', () => {
    const goal = new GoalElement({ x: 20, y: 30 });
    const resolved = legacyPlanningDragGroupResolver([goal]);
    expect(resolved).toEqual([goal]);
  });
});
