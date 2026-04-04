// @vitest-environment jsdom

import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { ContextMenu } from './ContextMenu.ts';
import { createAppRuntime, type AppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasInteractionAdapter } from '../adapters/CanvasInteractionAdapter.ts';
import type { CanvasLegacyPlanningActionsAdapter } from '../adapters/CanvasLegacyPlanningActionsAdapter.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function createContextMenu(
  scene: Scene,
  runtime: AppRuntime = createAppRuntime({ initialLocale: 'en' }),
  interactionAdapter: CanvasInteractionAdapter | null = null,
  options: { enableLegacyPlanningActions?: boolean } = {}
): ContextMenu {
  type PanZoomLike = ReturnType<CanvasManager['getPanZoomManager']>;

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
  const legacyPlanningActionsStub: CanvasLegacyPlanningActionsAdapter = {
    createElement(): void {},
    openExisting(): void {},
    createChild(): void {},
    supportsRelatedItems(): boolean {
      return true;
    },
    openRelatedItems(): void {},
  };

  return new ContextMenu(
    scene,
    canvasManagerStub,
    interactionAdapter,
    runtime,
    {
      ...options,
      legacyPlanningActionsAdapter: legacyPlanningActionsStub,
    }
  );
}

function renderMenuLabels(
  scene: Scene,
  element: StoryElement | null,
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
    document.body
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

      expect(document.body.textContent).toContain('Goal');

      runtime.setLocale('uk');

      expect(document.body.textContent).toContain('Ціль');
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('renders adapter-provided actions for blank-space context menus', () => {
    const scene = new Scene();
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const contextMenu = createContextMenu(scene, runtime, {
      getCreationActions() {
        return [
          {
            id: 'learning-create',
            title: 'Course actions',
            actions: [
              {
                id: 'create-lesson',
                label: 'Create lesson',
                description: 'Insert a lesson node',
              },
            ],
          },
        ];
      },
    });
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

      const labels = Array.from(
        document.body.querySelectorAll<HTMLButtonElement>('[role="menu"] button')
      )
        .map((button) => button.textContent?.trim())
        .filter((label): label is string => Boolean(label));

      expect(labels).toContain('Create lesson');
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });

  it('can render adapter-only blank-space actions when legacy planning actions are disabled', () => {
    const scene = new Scene();
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const contextMenu = createContextMenu(
      scene,
      runtime,
      {
        getCreationActions() {
          return [
            {
              id: 'learning-create',
              title: 'Course actions',
              actions: [
                {
                  id: 'create-module',
                  label: 'Add module',
                  icon: 'plus',
                },
              ],
            },
          ];
        },
      },
      {
        enableLegacyPlanningActions: false,
      }
    );
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

      const labels = Array.from(
        document.body.querySelectorAll<HTMLButtonElement>('[role="menu"] button')
      )
        .map((button) => button.textContent?.trim())
        .filter((label): label is string => Boolean(label));

      expect(labels).toContain('Add module');
      expect(labels).not.toContain('Goal');
      expect(labels).not.toContain('Story');
      expect(labels).not.toContain('Task');
    } finally {
      contextMenu.unmount();
      container.remove();
    }
  });
});
