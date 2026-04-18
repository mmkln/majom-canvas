// @vitest-environment jsdom

import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import type { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import type { AddExistingHabitService } from '../core/services/AddExistingHabitService.ts';
import type { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';
import type { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import type { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import type { ExistingHabitPicker } from './components/ExistingHabitPicker.ts';
import type { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import type { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ContextMenu } from './ContextMenu.ts';
import { createAppRuntime, type AppRuntime } from '../../../app-runtime/index.ts';

const { backlogLoadSnapshotMock, backlogSaveSnapshotMock } = vi.hoisted(() => ({
  backlogLoadSnapshotMock: vi.fn(),
  backlogSaveSnapshotMock: vi.fn(),
}));

vi.mock('../../../majom-wrapper/data-access/backlog-api-service.ts', () => ({
  BacklogApiService: class {
    public loadSnapshot = backlogLoadSnapshotMock;
    public saveSnapshot = backlogSaveSnapshotMock;
  },
}));

afterEach(() => {
  document.body.innerHTML = '';
  backlogLoadSnapshotMock.mockReset();
  backlogSaveSnapshotMock.mockReset();
  backlogLoadSnapshotMock.mockReturnValue(of({ taskUuids: [] }));
  backlogSaveSnapshotMock.mockReturnValue(of({ taskUuids: [] }));
});

function createContextMenu(
  scene: Scene,
  runtime: AppRuntime = createAppRuntime({ initialLocale: 'en' })
): ContextMenu {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;

  const pickerStub = {
    close(): void {},
  };
  const panZoomChanges = new Subject<IViewState>();
  const panZoomStub = {
    scrollX: 0,
    scrollY: 0,
    scale: 1,
    viewChanges: panZoomChanges,
  } as unknown as PanZoomLike;
  const canvasManagerStub = {
    draw(): void {},
    getCanvas: () =>
      ({
        getBoundingClientRect: () => new DOMRect(0, 0, 1200, 800),
      }) as unknown as HTMLCanvasElement,
    getPanZoomManager: () => panZoomStub,
  } as unknown as CanvasManager;

  return new ContextMenu(
    scene,
    canvasManagerStub,
    pickerStub as unknown as ExistingTaskPicker,
    pickerStub as unknown as ExistingGoalPicker,
    pickerStub as unknown as ExistingStoryPicker,
    pickerStub as unknown as ExistingHabitPicker,
    {} as unknown as AddExistingTaskService,
    {} as unknown as AddExistingGoalService,
    {} as unknown as AddExistingStoryService,
    {} as unknown as AddExistingHabitService,
    {},
    runtime
  );
}

function renderMenuLabels(
  scene: Scene,
  element: ICanvasElement | null,
  runtime: AppRuntime = createAppRuntime({ initialLocale: 'en' })
): string[] {
  const contextMenu = createContextMenu(scene, runtime);
  const container = document.createElement('div');
  document.body.appendChild(container);
  contextMenu.mount(container);

  try {
    window.dispatchEvent(
      new CustomEvent('contextMenuRequested', {
        detail: {
          element,
          sceneX: 0,
          sceneY: 0,
        },
      })
    );

    const labels: string[] = [];
    container
      .querySelectorAll<HTMLButtonElement>('[role="menu"] button')
      .forEach((button) => {
        const label = button.textContent?.trim();
        if (label) {
          labels.push(label);
        }
      });
    return labels;
  } finally {
    contextMenu.unmount();
    container.remove();
  }
}

function mountContextMenu(
  scene: Scene,
  element: ICanvasElement | null,
  runtime: AppRuntime = createAppRuntime({ initialLocale: 'en' })
): {
  contextMenu: ContextMenu;
  container: HTMLDivElement;
} {
  const contextMenu = createContextMenu(scene, runtime);
  const container = document.createElement('div');
  document.body.appendChild(container);
  contextMenu.mount(container);
  window.dispatchEvent(
    new CustomEvent('contextMenuRequested', {
      detail: {
        element,
        sceneX: 0,
        sceneY: 0,
      },
    })
  );
  return { contextMenu, container };
}

describe('ContextMenu selection connection actions', () => {
  it('does not show "Connect to Goals" when multiple goals are selected and the user opens a story context menu', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const goalA = new GoalElement({ id: 'goal-a' });
    const goalB = new GoalElement({ id: 'goal-b' });
    scene.addElement(story);
    scene.addElement(goalA);
    scene.addElement(goalB);
    scene.setSelected([goalA, goalB]);

    expect(renderMenuLabels(scene, story)).not.toContain('Connect to Goals');
  });

  it('shows "Connect to Goal" when a single goal is selected and the user opens a story context menu', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    const goal = new GoalElement({ id: 'goal-1' });
    scene.addElement(story);
    scene.addElement(goal);
    scene.setSelected([goal]);

    expect(renderMenuLabels(scene, story)).toContain('Connect to Goal');
  });

  it('renders localized add-item labels for Ukrainian locale', () => {
    const scene = new Scene();
    const runtime = createAppRuntime({ initialLocale: 'uk' });

    expect(renderMenuLabels(scene, null, runtime)).toContain('Ціль');
  });

  it('re-renders an open menu when locale changes at runtime', () => {
    const scene = new Scene();
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const contextMenu = createContextMenu(scene, runtime);
    const container = document.createElement('div');
    document.body.appendChild(container);
    contextMenu.mount(container);

    try {
      window.dispatchEvent(
        new CustomEvent('contextMenuRequested', {
          detail: {
            element: null,
            sceneX: 0,
            sceneY: 0,
          },
        })
      );

      expect(container.textContent).toContain('Goal');

      runtime.setLocale('uk');

      expect(container.textContent).toContain('Ціль');
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('shows a plus icon for the story add-task primary action', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    scene.addElement(story);
    const { contextMenu, container } = mountContextMenu(scene, story);

    try {
      const addTaskButton = Array.from(
        container.querySelectorAll<HTMLButtonElement>(
          '[data-component="HudSplitDropdownItem"] button[role="menuitem"]'
        )
      ).find((button) => button.textContent?.trim() === 'Task');

      expect(addTaskButton).toBeTruthy();
      expect(addTaskButton?.querySelector('svg')).toBeTruthy();
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('renders lifecycle statuses in described-to-done order inside the context menu', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      x: 100,
      y: 120,
      title: 'Task in canvas',
    });
    scene.addElement(task);

    const { contextMenu, container } = mountContextMenu(scene, task);

    try {
      const statusButtons = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button[aria-label]')
      ).filter((button) =>
        ['Defined', 'Pending', 'In progress', 'Done'].includes(
          button.getAttribute('aria-label') ?? ''
        )
      );

      expect(statusButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
        'Defined',
        'Pending',
        'In progress',
        'Done',
      ]);
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('renders a divider between AI assist and the backlog item when both are available', () => {
    const scene = new Scene();
    const task = new TaskElement({
      id: 'task-1',
      uuid: '00000000-0000-0000-0000-000000000001',
      x: 100,
      y: 120,
      title: 'Task in canvas',
    });
    scene.addElement(task);

    const { contextMenu, container } = mountContextMenu(scene, task);

    try {
      const mainMenu = container.querySelector<HTMLElement>('[role="menu"]');
      expect(mainMenu).not.toBeNull();

      const aiAssistButton = Array.from(
        mainMenu?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') ?? []
      ).find((button) => button.textContent?.trim() === 'AI assist');
      const backlogButton = Array.from(
        mainMenu?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]') ?? []
      ).find((button) => button.textContent?.trim() === 'To backlog');

      expect(aiAssistButton).not.toBeNull();
      expect(backlogButton).not.toBeNull();
      expect(
        aiAssistButton?.nextElementSibling?.getAttribute('data-component')
      ).toBe('HudDivider');
      expect(aiAssistButton?.nextElementSibling?.nextElementSibling).toBe(
        backlogButton
      );
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('adds a task uuid to backlog from a dedicated context menu item', async () => {
    const scene = new Scene();
    const taskUuid = '00000000-0000-0000-0000-000000000001';
    const task = new TaskElement({
      id: taskUuid,
      uuid: taskUuid,
      x: 100,
      y: 120,
      title: 'Task in canvas',
    });
    scene.addElement(task);
    backlogLoadSnapshotMock.mockReturnValue(
      of({ taskUuids: ['00000000-0000-0000-0000-000000000002'] })
    );
    backlogSaveSnapshotMock.mockReturnValue(
      of({
        taskUuids: ['00000000-0000-0000-0000-000000000002', taskUuid],
      })
    );

    const { contextMenu, container } = mountContextMenu(scene, task);

    try {
      const addToBacklogButton = Array.from(
        container.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')
      ).find((button) => button.textContent?.trim() === 'To backlog');
      expect(addToBacklogButton).not.toBeNull();

      addToBacklogButton?.click();
      await Promise.resolve();
      await Promise.resolve();

      expect(backlogLoadSnapshotMock).toHaveBeenCalledTimes(1);
      expect(backlogSaveSnapshotMock).toHaveBeenCalledWith({
        taskUuids: ['00000000-0000-0000-0000-000000000002', taskUuid],
      });
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

});
