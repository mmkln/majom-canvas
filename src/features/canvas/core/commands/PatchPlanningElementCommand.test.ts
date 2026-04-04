// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { PatchPlanningElementCommand } from './PatchPlanningElementCommand.ts';

describe('PatchPlanningElementCommand', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('patches undoable element fields without affecting layout save-state tracking', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      title: 'Before',
    });
    const detailsEdited = vi.fn();
    window.addEventListener('elementDetailsEdited', detailsEdited as EventListener);
    const command = new PatchPlanningElementCommand(scene, task, {
      title: 'After',
    });

    command.execute();

    expect(task.title).toBe('After');
    expect(command.affectsUnsavedChanges()).toBe(false);
    expect(detailsEdited).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          patch: { title: 'After' },
        }),
      })
    );

    command.undo();

    expect(task.title).toBe('Before');
    window.removeEventListener(
      'elementDetailsEdited',
      detailsEdited as EventListener
    );
  });

  it('tracks scale changes as layout-affecting and emits canvas position dirty events', () => {
    const scene = new Scene();
    const goal = new GoalElement({
      id: 'goal-1',
      uuid: 'goal-uuid-1',
      title: 'Goal',
      scale: 1,
    });
    const positionsDirty = vi.fn();
    window.addEventListener('canvasPositionsDirty', positionsDirty as EventListener);
    const command = new PatchPlanningElementCommand(scene, goal, {
      scale: 3,
    });

    command.execute();

    expect(goal.scale).toBe(3);
    expect(command.affectsUnsavedChanges()).toBe(true);
    expect(positionsDirty).toHaveBeenCalledTimes(1);

    command.undo();

    expect(goal.scale).toBe(1);
    expect(positionsDirty).toHaveBeenCalledTimes(2);
    window.removeEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );
  });
});
