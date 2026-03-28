import { describe, expect, it } from 'vitest';
import { GoalElement } from './GoalElement.ts';
import { StoryElement } from './StoryElement.ts';
import { TaskElement } from './TaskElement.ts';
import { isCanvasLayoutContainer } from './utils/typeGuards.ts';

describe('planning canvas node contracts', () => {
  it('assigns stable node kinds to planning nodes', () => {
    expect(new GoalElement({}).nodeKind).toBe('goal');
    expect(new StoryElement({}).nodeKind).toBe('story');
    expect(new TaskElement({}).nodeKind).toBe('task');
  });

  it('exposes story as a generic layout container', () => {
    const story = new StoryElement({});
    const task = new TaskElement({ id: 'task-1' });

    story.replaceOrderedLayoutChildren([task]);

    expect(isCanvasLayoutContainer(story)).toBe(true);
    expect(story.getOrderedLayoutChildren().map((child) => child.id)).toEqual([
      'task-1',
    ]);
    expect(story.acceptsLayoutChild(task)).toBe(true);
    expect(story.getLayoutMetrics().childWidth).toBe(TaskElement.width);
    expect(story.getLayoutMetrics().childHeight).toBe(TaskElement.height);
  });
});
