import { describe, expect, it } from 'vitest';
import { legacyPlanningConnectableOrderResolver } from './LegacyPlanningConnectableOrderResolver.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';

describe('legacyPlanningConnectableOrderResolver', () => {
  it('keeps list unchanged when not creating connection', () => {
    const goal = new GoalElement({ x: 10, y: 20 });
    const task = new TaskElement({ x: 40, y: 50 });
    const connectables = [goal, task];

    const result = legacyPlanningConnectableOrderResolver({
      connectables,
      isCreatingConnection: false,
    });

    expect(result).toBe(connectables);
    expect(result).toEqual(connectables);
  });

  it('moves tasks to the end while preserving relative order', () => {
    const goalA = new GoalElement({ x: 10, y: 20 });
    const taskA = new TaskElement({ x: 40, y: 50 });
    const goalB = new GoalElement({ x: 70, y: 80 });
    const taskB = new TaskElement({ x: 90, y: 100 });

    const result = legacyPlanningConnectableOrderResolver({
      connectables: [goalA, taskA, goalB, taskB],
      isCreatingConnection: true,
    });

    expect(result).toEqual([goalA, goalB, taskA, taskB]);
  });
});
