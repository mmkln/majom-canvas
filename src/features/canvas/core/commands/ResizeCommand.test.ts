// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { ResizeCommand } from './ResizeCommand.ts';
import { StoryElement } from '../../elements/StoryElement.ts';

describe('ResizeCommand', () => {
  it('applies final geometry and emits layout dirty notification on execute and undo', () => {
    const scene = new Scene();
    const story = new StoryElement({
      id: 'story-1',
      uuid: 'story-uuid-1',
      x: 100,
      y: 120,
      width: 760,
      height: 220,
    });
    scene.addElement(story);

    const positionsDirty = vi.fn();
    window.addEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );

    try {
      const command = new ResizeCommand(
        scene,
        new Map([
          [story.id, { x: 100, y: 120, width: 760, height: 220 }],
        ]),
        new Map([
          [story.id, { x: 100, y: 120, width: 760, height: 320 }],
        ])
      );

      command.execute();

      expect(story.height).toBe(320);
      expect(positionsDirty).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          detail: expect.objectContaining({
            elements: expect.arrayContaining([
              expect.objectContaining({ id: story.id }),
            ]),
          }),
        })
      );

      command.undo();

      expect(story.height).toBe(220);
      expect(positionsDirty).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: expect.objectContaining({
            elements: expect.arrayContaining([
              expect.objectContaining({ id: story.id }),
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
