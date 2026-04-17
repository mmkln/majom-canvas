// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { Scene } from '../scene/Scene.ts';
import { PasteCommand } from './PasteCommand.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

function createCanvasManagerStub(
  lastMouseCoords: { x: number; y: number } | null = { x: 0, y: 0 }
): CanvasManager {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;
  return {
    getLastMouseCoords: () => lastMouseCoords,
    getCanvas: () => ({ width: 1200, height: 800 } as HTMLCanvasElement),
    getPanZoomManager: () =>
      ({ scrollX: 0, scrollY: 0, scale: 1 }) as unknown as PanZoomLike,
  } as CanvasManager;
}

describe('PasteCommand', () => {
  beforeEach(() => {
    clipboardService.clear();
  });

  it('pastes task-only clipboard items into the selected story and restores state on undo', () => {
    const scene = new Scene();
    const story = new StoryElement({ x: 100, y: 100, width: 760, height: 220 });
    scene.addElement(story);
    scene.setSelected([story]);

    clipboardService.copy([
      new TaskElement({ x: 10, y: 10, title: 'Task A' }),
      new TaskElement({ x: 40, y: 40, title: 'Task B' }),
    ]);

    const command = new PasteCommand(scene, createCanvasManagerStub());
    const initialHeight = story.height;

    command.execute();

    const pastedTasks = scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);

    expect(pastedTasks).toHaveLength(2);
    expect(story.tasks).toHaveLength(2);
    expect(new Set(story.tasks.map((task) => task.id))).toEqual(
      new Set(pastedTasks.map((task) => task.id))
    );
    pastedTasks.forEach((task) => {
      const anchorX = task.x + TaskElement.width / 2;
      const anchorY = task.y + TaskElement.height / 2;
      expect(story.contains(anchorX, anchorY)).toBe(true);
    });
    expect(story.height).toBeGreaterThanOrEqual(initialHeight);

    command.undo();

    const tasksAfterUndo = scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    expect(tasksAfterUndo).toHaveLength(0);
    expect(story.tasks).toHaveLength(0);
    expect(story.height).toBe(initialHeight);
  });

  it('emits layout dirty notification when paste changes selected story layout', () => {
    const scene = new Scene();
    const story = new StoryElement({ x: 100, y: 100, width: 760, height: 220 });
    scene.addElement(story);
    scene.setSelected([story]);

    clipboardService.copy([new TaskElement({ x: 10, y: 10, title: 'Task A' })]);

    const positionsDirty = vi.fn();
    window.addEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );

    try {
      const command = new PasteCommand(scene, createCanvasManagerStub());

      command.execute();

      expect(positionsDirty).toHaveBeenCalledWith(
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

  it('emits layout dirty notification when undo restores the original story layout', () => {
    const scene = new Scene();
    const story = new StoryElement({ x: 100, y: 100, width: 760, height: 220 });
    scene.addElement(story);
    scene.setSelected([story]);

    clipboardService.copy([new TaskElement({ x: 10, y: 10, title: 'Task A' })]);

    const positionsDirty = vi.fn();
    window.addEventListener(
      'canvasPositionsDirty',
      positionsDirty as EventListener
    );

    try {
      const command = new PasteCommand(scene, createCanvasManagerStub());

      command.execute();
      positionsDirty.mockClear();

      command.undo();

      expect(positionsDirty).toHaveBeenCalledWith(
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

  it('does not attach pasted items to selected story when clipboard contains non-task elements', () => {
    const scene = new Scene();
    const targetStory = new StoryElement({
      x: 100,
      y: 100,
      width: 760,
      height: 220,
    });
    scene.addElement(targetStory);
    scene.setSelected([targetStory]);

    clipboardService.copy([
      new StoryElement({ x: 0, y: 0, width: 500, height: 300 }),
      new TaskElement({ x: 20, y: 20 }),
    ]);

    const command = new PasteCommand(scene, createCanvasManagerStub());
    command.execute();

    expect(targetStory.tasks).toHaveLength(0);
  });
});
