import { describe, expect, it } from 'vitest';
import { DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER } from './CanvasRuntimeSemanticsAdapter.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';

describe('DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER', () => {
  it('recognizes layout containers and layout children from node contracts', () => {
    const story = new StoryElement({});
    const task = new TaskElement({});
    const goal = new GoalElement({});

    expect(DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.isLayoutContainer(story)).toBe(
      true
    );
    expect(DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.isLayoutChild(task)).toBe(
      true
    );
    expect(DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.isLayoutChild(goal)).toBe(
      false
    );
  });

  it('prioritizes layout children over containers and containers over other nodes', () => {
    const story = new StoryElement({});
    const task = new TaskElement({});
    const goal = new GoalElement({});

    expect(
      DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.getHitTestPriority(task)
    ).toBeGreaterThan(
      DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.getHitTestPriority(story)
    );
    expect(
      DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.getHitTestPriority(story)
    ).toBeGreaterThan(
      DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER.getHitTestPriority(goal)
    );
  });
});
