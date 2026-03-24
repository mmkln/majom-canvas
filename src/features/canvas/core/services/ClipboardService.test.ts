import { describe, expect, it } from 'vitest';
import { ClipboardService } from './ClipboardService.ts';
import { Scene } from '../scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

describe('ClipboardService', () => {
  it('keeps copied task inside copied story after paste', () => {
    const clipboard = new ClipboardService();
    const scene = new Scene();

    const story = new StoryElement({
      x: 100,
      y: 100,
      width: 500,
      height: 300,
    });
    const taskInStory = new TaskElement({ x: 160, y: 180 });
    story.addTask(taskInStory);

    clipboard.copy([story, taskInStory]);

    const pasted = clipboard.paste(scene, { x: 900, y: 700 });

    const pastedStory = pasted.find(
      (element): element is StoryElement => element instanceof StoryElement
    );
    const pastedTask = pasted.find(
      (element): element is TaskElement => element instanceof TaskElement
    );

    expect(pastedStory).toBeDefined();
    expect(pastedTask).toBeDefined();
    expect(pastedStory?.tasks.map((task) => task.id)).toContain(pastedTask?.id);
  });

  it('does not attach pasted tasks that are outside of pasted story', () => {
    const clipboard = new ClipboardService();
    const scene = new Scene();

    const story = new StoryElement({ x: 100, y: 100, width: 300, height: 220 });
    const taskOutside = new TaskElement({ x: 480, y: 360 });

    clipboard.copy([story, taskOutside]);

    const pasted = clipboard.paste(scene, { x: 900, y: 700 });

    const pastedStory = pasted.find(
      (element): element is StoryElement => element instanceof StoryElement
    );

    expect(pastedStory).toBeDefined();
    expect(pastedStory?.tasks).toHaveLength(0);
  });

  it('preserves description when copying and pasting tasks and goals', () => {
    const clipboard = new ClipboardService();
    const scene = new Scene();

    const task = new TaskElement({
      x: 100,
      y: 100,
      title: 'Task with description',
      description: 'Task description should be preserved.',
    });
    const goal = new GoalElement({
      x: 300,
      y: 300,
      title: 'Goal with description',
      description: 'Goal description should be preserved.',
    });

    clipboard.copy([task, goal]);
    const pasted = clipboard.paste(scene, { x: 700, y: 700 });

    const pastedTask = pasted.find(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const pastedGoal = pasted.find(
      (element): element is GoalElement => element instanceof GoalElement
    );

    expect(pastedTask?.description).toBe(task.description);
    expect(pastedGoal?.description).toBe(goal.description);
  });
});
