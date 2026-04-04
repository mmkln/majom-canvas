import { describe, expect, it } from 'vitest';
import { Scene } from '../../core/scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PlanningLinkResolver } from './PlanningLinkResolver.ts';

describe('PlanningLinkResolver', () => {
  it('resolves task-story snapshots against scene elements', () => {
    const resolver = new PlanningLinkResolver();
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', uuid: 'story-uuid-1' });
    const task = new TaskElement({ id: 'task-1', uuid: 'task-uuid-1' });
    scene.addElement(story);
    scene.addElement(task);

    expect(
      resolver.resolveTaskStoryLink(
        {
          taskRef: task.id,
          taskUuid: task.uuid ?? null,
          storyRef: story.id,
          storyUuid: story.uuid ?? null,
        },
        scene
      )
    ).toEqual({
      task,
      story,
    });
  });

});
