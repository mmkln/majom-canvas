import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { historyService } from './HistoryService.ts';
import { ConnectionCreationService } from './ConnectionCreationService.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  type CanvasLinkLifecycleDetail,
} from '../canvasLinkLifecycle.ts';

describe('ConnectionCreationService', () => {
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget() as Window & typeof globalThis);
    historyService.reset();
  });

  afterEach(() => {
    historyService.reset();
    vi.unstubAllGlobals();
  });

  it('normalizes story-to-goal links into goal-to-story parent-child relations', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const goal = new GoalElement({ id: 'goal-1' });
    scene.addElement(story);
    scene.addElement(goal);

    const service = new ConnectionCreationService(scene);
    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      const result = service.create(story, goal);
      expect(result.ok).toBe(true);

      const connections = scene.getConnections();
      expect(connections).toHaveLength(1);
      expect(connections[0]?.fromId).toBe(goal.id);
      expect(connections[0]?.toId).toBe(story.id);
      expect(connections[0]?.relationType).toBe(
        ConnectionRelationType.ParentChild
      );

      expect(lifecycleDetails).toHaveLength(1);
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'story-goal',
        action: 'set',
        storyGoalLink: {
          storyRef: story.id,
          storyUuid: null,
          goalRef: goal.id,
          goalUuid: null,
        },
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });

  it('creates batch links as a single undoable command', () => {
    const scene = new Scene();
    const goalRoot = new GoalElement({ id: 'goal-root' });
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goalRoot);
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    const result = service.createManyToTarget([goalA, goalB], goalRoot, {
      preventDuplicates: true,
    });

    expect(result.createdPlans).toHaveLength(2);
    expect(scene.getConnections()).toHaveLength(2);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(0);
  });

  it('does not create batch links from one story to multiple goals', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(story);
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    const result = service.createFromSourceToManyTargets(
      story,
      [goalA, goalB],
      {
        preventDuplicates: true,
      }
    );

    expect(result.createdPlans).toHaveLength(0);
    expect(result.skipped).toEqual([
      expect.objectContaining({
        source: story,
        target: goalA,
        reason: 'invalid-pair',
      }),
      expect.objectContaining({
        source: story,
        target: goalB,
        reason: 'invalid-pair',
      }),
    ]);
    expect(scene.getConnections()).toHaveLength(0);
  });

  it('creates batch links from one source to many targets', () => {
    const scene = new Scene();
    const goal = new GoalElement({ id: 'goal-root' });
    const childA = new GoalElement({ id: 'goal-a' });
    const childB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goal);
    scene.addElement(childA);
    scene.addElement(childB);

    const service = new ConnectionCreationService(scene);
    const result = service.createFromSourceToManyTargets(
      goal,
      [childA, childB],
      {
        preventDuplicates: true,
      }
    );

    expect(result.createdPlans).toHaveLength(2);
    expect(scene.getConnections()).toHaveLength(2);
    expect(
      scene
        .getConnections()
        .map((connection) => ({
          fromId: connection.fromId,
          toId: connection.toId,
          relationType: connection.relationType,
        }))
        .sort((a, b) => a.toId.localeCompare(b.toId))
    ).toEqual([
      {
        fromId: goal.id,
        toId: childA.id,
        relationType: ConnectionRelationType.LeadsTo,
      },
      {
        fromId: goal.id,
        toId: childB.id,
        relationType: ConnectionRelationType.LeadsTo,
      },
    ]);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(0);
  });

  it('treats reverse undirected creation as a duplicate for the same pair', () => {
    const scene = new Scene();
    const taskA = new TaskElement({ id: 'task-a' });
    const taskB = new TaskElement({ id: 'task-b' });
    scene.addElement(taskA);
    scene.addElement(taskB);

    const service = new ConnectionCreationService(scene);
    service.create(taskB, taskA);

    const result = service.createManyToTarget([taskA], taskB, {
      preventDuplicates: true,
    });

    expect(result.createdPlans).toHaveLength(0);
    expect(result.skipped).toEqual([
      expect.objectContaining({
        source: taskA,
        reason: 'duplicate',
      }),
    ]);
    expect(scene.getConnections()).toHaveLength(1);
  });

  it('redirects an existing directional connection instead of creating a reverse duplicate', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    service.create(goalA, goalB, { preventDuplicates: true });

    expect(service.canCreate(goalB, goalA, { preventDuplicates: true })).toBe(
      false
    );
    expect(service.canRedirect(goalB, goalA)).toBe(true);

    const redirectResult = service.redirect(goalB, goalA);

    expect(redirectResult.ok).toBe(true);
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]).toMatchObject({
      fromId: goalB.id,
      toId: goalA.id,
      relationType: ConnectionRelationType.LeadsTo,
    });
  });

  it('emits a goal-link lifecycle event for goal relations', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      const result = service.createWithRelationType(
        goalA,
        goalB,
        ConnectionRelationType.Blocks
      );
      expect(result.ok).toBe(true);

      expect(lifecycleDetails).toHaveLength(1);
      const createdConnection = scene.getConnections()[0];
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'set',
        goalLink: {
          connectionId: createdConnection?.id,
          lineType: createdConnection?.lineType,
          fromGoalRef: goalA.id,
          toGoalRef: goalB.id,
          fromGoalUuid: null,
          toGoalUuid: null,
          relationType: ConnectionRelationType.Blocks,
        },
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });

  it('emits a goal-link update lifecycle event when redirecting a goal relation', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    service.createWithRelationType(
      goalA,
      goalB,
      ConnectionRelationType.LeadsTo
    );

    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      const result = service.redirectWithRelationType(
        goalB,
        goalA,
        ConnectionRelationType.LeadsTo
      );
      expect(result.ok).toBe(true);

      expect(lifecycleDetails).toHaveLength(1);
      const redirectedConnection = scene.getConnections()[0];
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'update',
        currentGoalLink: {
          connectionId: redirectedConnection?.id,
          lineType: redirectedConnection?.lineType,
          fromGoalRef: goalA.id,
          toGoalRef: goalB.id,
          fromGoalUuid: null,
          toGoalUuid: null,
          relationType: ConnectionRelationType.LeadsTo,
        },
        nextGoalLink: {
          connectionId: redirectedConnection?.id,
          lineType: redirectedConnection?.lineType,
          fromGoalRef: goalB.id,
          toGoalRef: goalA.id,
          fromGoalUuid: null,
          toGoalUuid: null,
          relationType: ConnectionRelationType.LeadsTo,
        },
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });

  it('creates explicit non-hierarchical relations for AI-driven links', () => {
    const scene = new Scene();
    const taskA = new TaskElement({ id: 'task-a' });
    const taskB = new TaskElement({ id: 'task-b' });
    scene.addElement(taskA);
    scene.addElement(taskB);

    const service = new ConnectionCreationService(scene);
    const result = service.createWithRelationType(
      taskA,
      taskB,
      ConnectionRelationType.Blocks
    );

    expect(result.ok).toBe(true);
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]).toMatchObject({
      fromId: taskA.id,
      toId: taskB.id,
      relationType: ConnectionRelationType.Blocks,
    });
  });

  it('treats reverse relates_to requests as duplicates for the same pair', () => {
    const scene = new Scene();
    const taskA = new TaskElement({ id: 'task-a' });
    const taskB = new TaskElement({ id: 'task-b' });
    scene.addElement(taskA);
    scene.addElement(taskB);

    const service = new ConnectionCreationService(scene);
    service.createWithRelationType(
      taskA,
      taskB,
      ConnectionRelationType.RelatesTo
    );

    const reverseResult = service.createWithRelationType(
      taskB,
      taskA,
      ConnectionRelationType.RelatesTo
    );

    expect(reverseResult).toEqual({
      ok: false,
      reason: 'duplicate',
    });
    expect(scene.getConnections()).toHaveLength(1);
  });

  it('rejects explicit non-hierarchical relations for goal-story pairs', () => {
    const scene = new Scene();
    const goal = new GoalElement({ id: 'goal-a' });
    const story = new StoryElement({ id: 'story-a' });
    scene.addElement(goal);
    scene.addElement(story);

    const service = new ConnectionCreationService(scene);
    const result = service.createWithRelationType(
      goal,
      story,
      ConnectionRelationType.Blocks
    );

    expect(result).toEqual({
      ok: false,
      reason: 'invalid-pair',
    });
    expect(scene.getConnections()).toHaveLength(0);
  });

  it('prevents duplicate pairs even for direct ConnectCommand usage', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(goalA);
    scene.addElement(goalB);

    historyService.execute(
      new ConnectCommand(
        scene,
        goalA.id,
        goalB.id,
        ConnectionRelationType.LeadsTo
      )
    );
    historyService.execute(
      new ConnectCommand(
        scene,
        goalB.id,
        goalA.id,
        ConnectionRelationType.LeadsTo
      )
    );

    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]).toMatchObject({
      fromId: goalA.id,
      toId: goalB.id,
    });
  });

  it('skips links for tasks already contained by the target story', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const task = new TaskElement({ id: 'task-1' });
    story.tasks = [task];
    scene.addElement(story);
    scene.addElement(task);

    const service = new ConnectionCreationService(scene);
    const result = service.createManyToTarget([task], story, {
      preventDuplicates: true,
    });

    expect(result.createdPlans).toHaveLength(0);
    expect(result.skipped).toEqual([
      expect.objectContaining({
        source: task,
        reason: 'invalid-pair',
      }),
    ]);
    expect(scene.getConnections()).toHaveLength(0);
  });
});
