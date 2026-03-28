import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { historyService } from './HistoryService.ts';
import { ConnectionCreationService } from './ConnectionCreationService.ts';
import { ConnectionRemovalService } from './ConnectionRemovalService.ts';

describe('ConnectionRemovalService', () => {
  beforeEach(() => {
    historyService.reset();
  });

  afterEach(() => {
    historyService.reset();
  });

  it('removes all connections related to the context element', () => {
    const scene = new Scene();
    const goal = new GoalElement({ id: 'goal-root' });
    const goalChild = new GoalElement({ id: 'goal-child' });
    const story = new StoryElement({ id: 'story-1' });
    const task = new TaskElement({ id: 'task-1' });
    scene.addElement(goal);
    scene.addElement(goalChild);
    scene.addElement(story);
    scene.addElement(task);

    const creationService = new ConnectionCreationService(scene);
    creationService.create(goal, goalChild);
    creationService.create(goal, story);
    creationService.create(task, goal);
    historyService.reset();

    const removalService = new ConnectionRemovalService(scene);
    const result = removalService.removeConnectionsForElement(goal);

    expect(result.removedConnections).toHaveLength(3);
    expect(scene.getConnections()).toHaveLength(0);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(3);
  });

  it('removes only connections between the context element and the selected elements', () => {
    const scene = new Scene();
    const goal = new GoalElement({ id: 'goal-root' });
    const selectedGoal = new GoalElement({ id: 'goal-selected' });
    const selectedStory = new StoryElement({ id: 'story-selected' });
    const unrelatedTask = new TaskElement({ id: 'task-unrelated' });
    scene.addElement(goal);
    scene.addElement(selectedGoal);
    scene.addElement(selectedStory);
    scene.addElement(unrelatedTask);

    const creationService = new ConnectionCreationService(scene);
    creationService.create(goal, selectedGoal);
    creationService.create(goal, selectedStory);
    creationService.create(goal, unrelatedTask);
    historyService.reset();

    const removalService = new ConnectionRemovalService(scene);
    const result = removalService.removeConnectionsBetweenElementAndTargets(
      goal,
      [selectedGoal, selectedStory]
    );

    expect(result.removedConnections).toHaveLength(2);
    expect(scene.getConnections()).toHaveLength(1);
    expect(scene.getConnections()[0]?.fromId).toBe(goal.id);
    expect(scene.getConnections()[0]?.toId).toBe(unrelatedTask.id);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(3);
  });

  it('removes all connections related to multiple selected elements without duplicates', () => {
    const scene = new Scene();
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    const story = new StoryElement({ id: 'story-1' });
    const task = new TaskElement({ id: 'task-1' });
    scene.addElement(goalA);
    scene.addElement(goalB);
    scene.addElement(story);
    scene.addElement(task);

    const creationService = new ConnectionCreationService(scene);
    creationService.create(goalA, goalB);
    creationService.create(goalA, story);
    creationService.create(task, goalB);
    historyService.reset();

    const removalService = new ConnectionRemovalService(scene);
    const result = removalService.removeConnectionsForElements([goalA, goalB]);

    expect(result.removedConnections).toHaveLength(3);
    expect(scene.getConnections()).toHaveLength(0);

    historyService.undo();

    expect(scene.getConnections()).toHaveLength(3);
  });
});
