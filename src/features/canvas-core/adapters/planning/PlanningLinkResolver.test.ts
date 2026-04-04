import { describe, expect, it } from 'vitest';
import {
  ConnectionLineType,
  ConnectionRelationType,
} from '../../core/interfaces/connection.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
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

  it('resolves goal-link snapshots for supported relation types', () => {
    const resolver = new PlanningLinkResolver();
    const scene = new Scene();
    const fromGoal = new GoalElement({ id: 'goal-1', uuid: 'goal-uuid-1' });
    const toGoal = new GoalElement({ id: 'goal-2', uuid: 'goal-uuid-2' });
    scene.addElement(fromGoal);
    scene.addElement(toGoal);

    expect(
      resolver.resolveGoalLink(
        {
          connectionId: 'conn-1',
          lineType: ConnectionLineType.SShaped,
          fromGoalRef: fromGoal.id,
          toGoalRef: toGoal.id,
          fromGoalUuid: fromGoal.uuid ?? null,
          toGoalUuid: toGoal.uuid ?? null,
          relationType: ConnectionRelationType.Blocks,
        },
        scene
      )
    ).toEqual({
      fromGoal,
      toGoal,
      relationType: ConnectionRelationType.Blocks,
    });
  });

  it('recreates a connection from a goal-link snapshot', () => {
    const resolver = new PlanningLinkResolver();

    const connection = resolver.createConnectionFromGoalLink({
      connectionId: 'conn-1',
      lineType: ConnectionLineType.Straight,
      fromGoalRef: 'goal-1',
      toGoalRef: 'goal-2',
      fromGoalUuid: 'goal-uuid-1',
      toGoalUuid: 'goal-uuid-2',
      relationType: ConnectionRelationType.LeadsTo,
    });

    expect(connection).toMatchObject({
      id: 'conn-1',
      fromId: 'goal-1',
      toId: 'goal-2',
      lineType: ConnectionLineType.Straight,
      relationType: ConnectionRelationType.LeadsTo,
    });
  });
});
