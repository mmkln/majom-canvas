// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { Scene } from '../scene/Scene.ts';
import { BulkActionsController } from './BulkActionsController.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

function collectEditedPatches(): {
  patches: number[][];
  dispose: () => void;
} {
  const patches: number[][] = [];
  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<{ patch?: { tagIds?: number[] } }>).detail;
    if (detail.patch?.tagIds) {
      patches.push(detail.patch.tagIds);
    }
  };
  window.addEventListener('elementDetailsEdited', handler);
  return {
    patches,
    dispose: () => window.removeEventListener('elementDetailsEdited', handler),
  };
}

describe('BulkActionsController goal tags', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds, removes, and replaces tags for goal-only selections', () => {
    const scene = new Scene();
    const controller = new BulkActionsController(scene);
    const goalA = new GoalElement({
      id: 'goal-a',
      title: 'Goal A',
      tags: ['Focus'],
      tagIds: [1],
    });
    const goalB = new GoalElement({
      id: 'goal-b',
      title: 'Goal B',
      tags: ['Focus', 'Strategy'],
      tagIds: [1, 2],
    });
    const { patches, dispose } = collectEditedPatches();

    controller.updateGoalTags([goalA, goalB], {
      mode: 'add',
      tagIds: [2, 3],
      tagCatalog: [
        { id: 1, title: 'Focus' },
        { id: 2, title: 'Strategy' },
        { id: 3, title: 'Vision' },
      ],
    });
    expect(goalA.tagIds).toEqual([1, 2, 3]);
    expect(goalA.tags).toEqual(['Focus', 'Strategy', 'Vision']);
    expect(goalB.tagIds).toEqual([1, 2, 3]);

    controller.updateGoalTags([goalA, goalB], {
      mode: 'remove',
      tagIds: [1, 3],
      tagCatalog: [
        { id: 1, title: 'Focus' },
        { id: 2, title: 'Strategy' },
        { id: 3, title: 'Vision' },
      ],
    });
    expect(goalA.tagIds).toEqual([2]);
    expect(goalA.tags).toEqual(['Strategy']);
    expect(goalB.tagIds).toEqual([2]);

    controller.updateGoalTags([goalA, goalB], {
      mode: 'replace',
      tagIds: [3],
      tagCatalog: [
        { id: 1, title: 'Focus' },
        { id: 2, title: 'Strategy' },
        { id: 3, title: 'Vision' },
      ],
    });
    expect(goalA.tagIds).toEqual([3]);
    expect(goalA.tags).toEqual(['Vision']);
    expect(goalB.tagIds).toEqual([3]);
    expect(patches).toHaveLength(6);

    dispose();
  });

  it('ignores mixed selections that include non-goal elements', () => {
    const scene = new Scene();
    const controller = new BulkActionsController(scene);
    const goal = new GoalElement({
      id: 'goal-a',
      title: 'Goal A',
      tags: ['Focus'],
      tagIds: [1],
    });
    const task = new TaskElement({
      id: 'task-a',
      title: 'Task A',
    });
    const { patches, dispose } = collectEditedPatches();

    controller.updateGoalTags([goal, task], {
      mode: 'add',
      tagIds: [2],
      tagCatalog: [
        { id: 1, title: 'Focus' },
        { id: 2, title: 'Strategy' },
      ],
    });

    expect(goal.tagIds).toEqual([1]);
    expect(goal.tags).toEqual(['Focus']);
    expect(patches).toHaveLength(0);

    dispose();
  });
});
