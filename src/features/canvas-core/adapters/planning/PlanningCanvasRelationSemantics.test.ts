import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import {
  ConnectionRelationType,
  type IConnection,
} from '../../core/interfaces/connection.ts';
import Connection from '../../core/shapes/Connection.ts';
import { Scene } from '../../core/scene/Scene.ts';
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

  it('syncs task-story events through the planning relation adapter', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', uuid: 'story-uuid-1' });
    const task = new TaskElement({ id: 'task-1', uuid: 'task-uuid-1' });
    scene.addElement(story);
    scene.addElement(task);

    const updateTaskStoryLink = vi.fn(() => of(undefined));
    const context = {
      scene,
      canvasDataService: {
        hasRelationChanges: vi.fn(() => false),
        updateCanvasRelations: vi.fn(() => of(undefined)),
      },
      planningRelations: {
        updateTaskStoryLink,
        updateStoryGoalLink: vi.fn(),
        createGoalRelation: vi.fn(),
        updateGoalRelation: vi.fn(),
        deleteGoalRelation: vi.fn(),
      },
      beginLinkDecision: vi.fn(),
      endLinkDecision: vi.fn(),
    } as any;

    semantics.handleLinkLifecycle(
      {
        kind: 'task-story',
        action: 'set',
        taskStoryLink: {
          taskRef: task.id,
          taskUuid: task.uuid ?? null,
          storyRef: story.id,
          storyUuid: story.uuid ?? null,
        },
      },
      context
    );

    expect(updateTaskStoryLink).toHaveBeenCalledWith({
      task,
      story,
    });
  });

  it('syncs story-goal events through the planning relation adapter', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', uuid: 'story-uuid-1' });
    const goal = new GoalElement({
      id: 'goal-1',
      uuid: 'goal-uuid-1',
      backendId: 42,
    });
    scene.addElement(story);
    scene.addElement(goal);

    const updateStoryGoalLink = vi.fn(() =>
      of({
        status: 'updated' as const,
        goalId: 42,
      })
    );
    const updateCanvasRelations = vi.fn(() => of(undefined));
    const context = {
      scene,
      canvasDataService: {
        hasRelationChanges: vi.fn(() => true),
        updateCanvasRelations,
      },
      planningRelations: {
        updateTaskStoryLink: vi.fn(),
        updateStoryGoalLink,
        createGoalRelation: vi.fn(),
        updateGoalRelation: vi.fn(),
        deleteGoalRelation: vi.fn(),
      },
      beginLinkDecision: vi.fn(),
      endLinkDecision: vi.fn(),
    } as any;

    semantics.handleLinkLifecycle(
      {
        kind: 'story-goal',
        action: 'set',
        storyGoalLink: {
          storyRef: story.id,
          storyUuid: story.uuid ?? null,
          goalRef: goal.id,
          goalUuid: goal.uuid ?? null,
        },
      },
      context
    );

    expect(updateStoryGoalLink).toHaveBeenCalledWith(
      {
        story,
        goal,
      },
      {
        allowReplace: false,
      }
    );
    expect(updateCanvasRelations).toHaveBeenCalled();
  });

  it('syncs goal-link create events through the planning relation adapter', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a', uuid: 'goal-a-uuid' });
    const goalB = new GoalElement({ id: 'goal-b', uuid: 'goal-b-uuid' });
    const connection = new Connection(
      goalA.id,
      goalB.id,
      'conn-1',
      undefined,
      ConnectionRelationType.Blocks
    );
    scene.addElement(goalA);
    scene.addElement(goalB);
    scene.addElement(connection);

    const createGoalRelation = vi.fn(() =>
      of({
        id: 'rel-1',
        from_goal_uuid: 'goal-a-uuid',
        to_goal_uuid: 'goal-b-uuid',
        relation_type: 'blocks' as const,
        meta: null,
        created_at: '',
        updated_at: '',
      })
    );
    const updateCanvasRelations = vi.fn(() => of(undefined));
    const context = {
      scene,
      canvasDataService: {
        hasRelationChanges: vi.fn(() => true),
        updateCanvasRelations,
      },
      planningRelations: {
        updateTaskStoryLink: vi.fn(),
        updateStoryGoalLink: vi.fn(),
        createGoalRelation,
        updateGoalRelation: vi.fn(),
        deleteGoalRelation: vi.fn(),
      },
      beginLinkDecision: vi.fn(),
      endLinkDecision: vi.fn(),
    } as any;

    semantics.handleLinkLifecycle(
      {
        kind: 'goal-link',
        action: 'set',
        goalLink: {
          connectionId: connection.id,
          lineType: connection.lineType,
          fromGoalRef: goalA.id,
          toGoalRef: goalB.id,
          fromGoalUuid: goalA.uuid ?? null,
          toGoalUuid: goalB.uuid ?? null,
          relationType: ConnectionRelationType.Blocks,
        },
      },
      context
    );

    expect(createGoalRelation).toHaveBeenCalledWith({
      fromGoal: goalA,
      toGoal: goalB,
      relationType: ConnectionRelationType.Blocks,
    });
    expect(updateCanvasRelations).toHaveBeenCalled();
    expect(context.beginLinkDecision).toHaveBeenCalled();
    expect(context.endLinkDecision).toHaveBeenCalled();
  });

  it('rolls back a created goal-link connection when domain sync fails', () => {
    const semantics = new PlanningCanvasRelationSemantics();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a', uuid: 'goal-a-uuid' });
    const goalB = new GoalElement({ id: 'goal-b', uuid: 'goal-b-uuid' });
    const connection = new Connection(
      goalA.id,
      goalB.id,
      'conn-1',
      undefined,
      ConnectionRelationType.LeadsTo
    );
    scene.addElement(goalA);
    scene.addElement(goalB);
    scene.addElement(connection);

    const context = {
      scene,
      canvasDataService: {
        hasRelationChanges: vi.fn(() => true),
        updateCanvasRelations: vi.fn(() => of(undefined)),
      },
      planningRelations: {
        updateTaskStoryLink: vi.fn(),
        updateStoryGoalLink: vi.fn(),
        createGoalRelation: vi.fn(() =>
          throwError(() => new Error('sync failed'))
        ),
        updateGoalRelation: vi.fn(),
        deleteGoalRelation: vi.fn(),
      },
      beginLinkDecision: vi.fn(),
      endLinkDecision: vi.fn(),
    } as any;

    semantics.handleLinkLifecycle(
      {
        kind: 'goal-link',
        action: 'set',
        goalLink: {
          connectionId: connection.id,
          lineType: connection.lineType,
          fromGoalRef: goalA.id,
          toGoalRef: goalB.id,
          fromGoalUuid: goalA.uuid ?? null,
          toGoalUuid: goalB.uuid ?? null,
          relationType: ConnectionRelationType.LeadsTo,
        },
      },
      context
    );

    expect(scene.getConnections()).toHaveLength(0);
    expect(context.endLinkDecision).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
