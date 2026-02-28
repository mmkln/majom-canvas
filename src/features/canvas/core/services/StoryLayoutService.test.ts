import { describe, expect, it } from 'vitest';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from './StoryLayoutService.ts';

describe('StoryLayoutService.getLayoutTasks', () => {
  it('normalizes task order by canvas coordinates even when story.tasks order differs', () => {
    const service = new StoryLayoutService();
    const story = new StoryElement({ x: 0, y: 0, width: 760, height: 420 });

    const leftTask = new TaskElement({ id: 'left', x: 36, y: 92 });
    const rightTask = new TaskElement({ id: 'right', x: 336, y: 92 });

    // Simulate backend/restored relation order that does not match coordinates.
    story.tasks = [rightTask, leftTask];

    const layoutTasks = service.getLayoutTasks(story, [leftTask, rightTask]);

    expect(layoutTasks.map((task) => task.id)).toEqual(['left', 'right']);
  });

  it('includes missing in-story tasks and keeps resulting list coordinate-sorted', () => {
    const service = new StoryLayoutService();
    const story = new StoryElement({ x: 0, y: 0, width: 760, height: 420 });

    const leftTask = new TaskElement({ id: 'left', x: 36, y: 92 });
    const middleTask = new TaskElement({ id: 'middle', x: 186, y: 92 });
    const rightTask = new TaskElement({ id: 'right', x: 336, y: 92 });

    // `middleTask` is inside story by coordinates but absent in story.tasks refs.
    story.tasks = [rightTask, leftTask];

    const layoutTasks = service.getLayoutTasks(story, [leftTask, middleTask, rightTask]);

    expect(layoutTasks.map((task) => task.id)).toEqual([
      'left',
      'middle',
      'right',
    ]);
  });
});
