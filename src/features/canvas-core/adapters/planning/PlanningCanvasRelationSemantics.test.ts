import { describe, expect, it } from 'vitest';
import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PlanningCanvasRelationSemantics } from './PlanningCanvasRelationSemantics.ts';

describe('PlanningCanvasRelationSemantics', () => {
  it('builds parent-child hierarchy for goals, stories, and tasks', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const goal = new GoalElement({ id: 'goal-1', backendId: 42 });
    const story = new StoryElement({
      id: 'story-1',
      goalBackendId: 42,
    });
    const task = new TaskElement({ id: 'task-1' });
    story.tasks = [task];
    const connections = [
      {
        id: 'goal-story-1',
        fromId: 'goal-1',
        toId: 'story-1',
        relationType: ConnectionRelationType.ParentChild,
      },
    ] as IConnection[];

    const hierarchy = semantics.buildHierarchy([goal, story, task], connections);

    expect(hierarchy.storyParentById.get('story-1')).toBe('goal-1');
    expect(hierarchy.taskParentById.get('task-1')).toBe('story-1');
    expect(hierarchy.goalChildIds.get('goal-1')).toEqual(['story-1']);
    expect(hierarchy.storyChildIds.get('story-1')).toEqual(['task-1']);
  });

  it('returns only duplicate story-goal connections for removal', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const connections = [
      {
        id: 'goal-story-1',
        fromId: 'goal-1',
        toId: 'story-1',
        relationType: ConnectionRelationType.ParentChild,
      },
      {
        id: 'goal-story-2',
        fromId: 'goal-2',
        toId: 'story-1',
        relationType: ConnectionRelationType.ParentChild,
      },
    ] as IConnection[];

    expect(
      semantics
        .getDuplicateStoryGoalConnections(connections, 'story-1', 'goal-2')
        .map((connection) => connection.id)
    ).toEqual(['goal-story-1']);
  });
});
