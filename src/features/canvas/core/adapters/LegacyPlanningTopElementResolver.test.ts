import { describe, expect, it } from 'vitest';
import { legacyPlanningTopElementResolver } from './LegacyPlanningTopElementResolver.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

describe('legacyPlanningTopElementResolver', () => {
  it('prioritizes task over story and other elements', () => {
    const task = new TaskElement({ x: 100, y: 100 });
    const story = new StoryElement({ x: 80, y: 80, width: 300, height: 200 });
    const goal = new GoalElement({ x: 90, y: 90 });

    const result = legacyPlanningTopElementResolver({
      sceneX: 110,
      sceneY: 110,
      candidates: [story as any, goal as any, task as any],
    });

    expect(result?.id).toBe(task.id);
  });

  it('falls back to non-planning candidates when no planning element is hit', () => {
    const shape = {
      id: 'shape-1',
      zIndex: 1,
      selected: false,
      contains: () => true,
      draw: () => undefined,
    };

    const result = legacyPlanningTopElementResolver({
      sceneX: 10,
      sceneY: 20,
      candidates: [shape as any],
    });

    expect(result?.id).toBe('shape-1');
  });
});
