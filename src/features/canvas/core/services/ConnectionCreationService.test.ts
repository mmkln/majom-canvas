import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { historyService } from './HistoryService.ts';
import { ConnectionCreationService } from './ConnectionCreationService.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
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
        story,
        goal,
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    }
  });

  it('creates batch links as a single undoable command', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(story);
    scene.addElement(goalA);
    scene.addElement(goalB);

    const service = new ConnectionCreationService(scene);
    const result = service.createManyToTarget([goalA, goalB], story, {
      preventDuplicates: true,
    });

    expect(result.createdPlans).toHaveLength(2);
    expect(scene.getConnections()).toHaveLength(2);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(0);
  });

  it('skips reverse relates-to duplicates when duplicate prevention is enabled', () => {
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
