import { describe, expect, it } from 'vitest';
import { ClipboardService } from './ClipboardService.ts';
import { Scene } from '../scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

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
});
