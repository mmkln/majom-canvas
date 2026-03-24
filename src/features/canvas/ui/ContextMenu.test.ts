// @vitest-environment jsdom

import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import type { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import type { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';
import type { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import type { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import type { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import type { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ContextMenu } from './ContextMenu.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function createContextMenu(scene: Scene): ContextMenu {
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
    {} as unknown as AddExistingTaskService,
    {} as unknown as AddExistingGoalService,
    {} as unknown as AddExistingStoryService
  );
}

function renderMenuLabels(scene: Scene, element: StoryElement): string[] {
  const contextMenu = createContextMenu(scene);
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
});
