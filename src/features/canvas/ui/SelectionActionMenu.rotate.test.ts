// @vitest-environment jsdom

import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../majom-wrapper/data-access/tasks-api-service.ts', () => ({
  TasksApiService: class {
    public getTags() {
      return of([]);
    }

    public createTag() {
      return of({ id: 1, title: 'Focus', color: '#2563eb' });
    }
  },
}));

import { createAppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { SelectionActionMenu } from './SelectionActionMenu.ts';

function createCanvasManagerStub(): CanvasManager {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;
  const panZoomChanges = new Subject<IViewState>();
  const panZoomStub = {
    scrollX: 0,
    scrollY: 0,
    scale: 1,
    viewBounds: {
      minX: -100,
      minY: -100,
      maxX: 2000,
      maxY: 2000,
    },
    viewChanges: panZoomChanges,
  } as unknown as PanZoomLike;

  return {
    draw(): void {},
    getCanvas: () =>
      ({
        getBoundingClientRect: () => new DOMRect(0, 0, 1200, 800),
      }) as unknown as HTMLCanvasElement,
    getPanZoomManager: () => panZoomStub,
    isDraggingElements: false,
    isResizingStory: false,
  } as unknown as CanvasManager;
}

describe('SelectionActionMenu rotate action', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the rotate action for rotatable multi-selection', () => {
    const scene = new Scene();
    const left = new GoalElement({ id: 'goal-1', x: 100, y: 100 });
    const right = new GoalElement({ id: 'goal-2', x: 500, y: 100 });

    scene.addElement(left);
    scene.addElement(right);
    scene.setSelected([left, right]);

    const menu = new SelectionActionMenu(
      scene,
      createCanvasManagerStub(),
      new BulkActionsController(scene),
      createAppRuntime({ initialLocale: 'en' })
    );
    const container = document.createElement('div');
    document.body.appendChild(container);
    menu.mount(container);

    try {
      const button = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Rotate 90°"]'
      );
      expect(button).not.toBeNull();
      expect(button?.style.display).not.toBe('none');
    } finally {
      menu.unmount();
      container.remove();
    }
  });

  it('hides the rotate action when selection includes a child task without its story', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1', x: 100, y: 100 });
    const storyTask = new TaskElement({ id: 'task-1', x: 136, y: 192 });
    const goal = new GoalElement({ id: 'goal-1', x: 600, y: 100 });

    story.addTask(storyTask);
    scene.addElement(story);
    scene.addElement(storyTask);
    scene.addElement(goal);
    scene.setSelected([storyTask, goal]);

    const menu = new SelectionActionMenu(
      scene,
      createCanvasManagerStub(),
      new BulkActionsController(scene),
      createAppRuntime({ initialLocale: 'en' })
    );
    const container = document.createElement('div');
    document.body.appendChild(container);
    menu.mount(container);

    try {
      const button = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Rotate 90°"]'
      );
      expect(button).not.toBeNull();
      expect(button?.style.display).toBe('none');
    } finally {
      menu.unmount();
      container.remove();
    }
  });
});
