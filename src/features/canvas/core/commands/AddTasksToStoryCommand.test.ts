// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { AddTasksToStoryCommand } from './AddTasksToStoryCommand.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

describe('AddTasksToStoryCommand', () => {
  it('emits layout dirty notification when it resizes the target story', () => {
    const scene = new Scene();
    const story = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 100,
      width: 760,
      height: 220,
    });
    const task = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      x: 140,
      y: 180,
      title: 'Task A',
    });
    scene.addElement(story);

    const positionsDirty = vi.fn();
    window.addEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );

    try {
      const command = new AddTasksToStoryCommand(scene, story, [task], 320);

      command.execute();

      expect(positionsDirty).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            elements: expect.arrayContaining([
              expect.objectContaining({ id: story.id }),
            ]),
          }),
        })
      );
    } finally {
      window.removeEventListener(
        'canvasPositionsDirty',
        positionsDirty as EventListener
      );
    }
  });
});
