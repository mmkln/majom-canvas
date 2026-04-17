// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { MoveCommand } from './MoveCommand.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

describe('MoveCommand', () => {
  it('applies final coordinates and emits layout dirty notification on execute and undo', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      uuid: 'task-uuid-1',
      x: 40,
      y: 60,
    });
    scene.addElement(task);

    const positionsDirty = vi.fn();
    window.addEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );

    try {
      const command = new MoveCommand(
        scene,
        new Map([[task.id, { x: 40, y: 60 }]]),
        new Map([[task.id, { x: 180, y: 220 }]])
      );

      command.execute();

      expect(task.x).toBe(180);
      expect(task.y).toBe(220);
      expect(positionsDirty).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          detail: expect.objectContaining({
            elements: expect.arrayContaining([
              expect.objectContaining({ id: task.id }),
            ]),
          }),
        })
      );

      command.undo();

      expect(task.x).toBe(40);
      expect(task.y).toBe(60);
      expect(positionsDirty).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: expect.objectContaining({
            elements: expect.arrayContaining([
              expect.objectContaining({ id: task.id }),
            ]),
          }),
        })
      );
    } finally {
      window.removeEventListener(
        'canvasPositionsDirty',
        positionsDirty as EventListener
      );
    }
  });
});
