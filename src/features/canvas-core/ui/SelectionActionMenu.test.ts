// @vitest-environment jsdom

import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { createAppRuntime } from '../../../app-runtime/index.ts';
import type { AppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasInteractionAdapter } from '../adapters/CanvasInteractionAdapter.ts';
import { StructuredCanvasNode } from '../elements/StructuredCanvasNode.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { Scene } from '../core/scene/Scene.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { SelectionActionMenu } from './SelectionActionMenu.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

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

class GenericCanvasNode extends StructuredCanvasNode {
  constructor(id: string) {
    super({
      nodeKind: 'generic',
      id,
      x: 24,
      y: 24,
      width: 160,
      height: 80,
      title: 'Generic node',
    });
  }

  public draw(): void {}

  public contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  public getBoundaryPoint(): { x: number; y: number } {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  public getConnectionPoints(): ConnectionPoint[] {
    return [
      {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
      } as ConnectionPoint,
    ];
  }

  public clone(): GenericCanvasNode {
    return new GenericCanvasNode(this.id);
  }
}

function createSelectionActionMenu(
  scene: Scene,
  interactionAdapter: CanvasInteractionAdapter | null = null,
  runtime: AppRuntime = createAppRuntime({ initialLocale: 'en' }),
  options: {
    enableLegacyPlanningActions?: boolean;
    positionStrategy?: 'below-bounds' | 'top-right-inset';
    omitDividerForInteractionActions?: boolean;
  } = {}
): SelectionActionMenu {
  return new SelectionActionMenu(
    scene,
    createCanvasManagerStub(),
    new BulkActionsController(scene),
    interactionAdapter,
    runtime,
    options
  );
}

describe('SelectionActionMenu adapter-driven actions', () => {
  it('renders adapter-provided selection actions', () => {
    const scene = new Scene();
    const task = new TaskElement({ id: 'task-1', title: 'Task 1' });
    scene.addElement(task);
    scene.setSelected([task]);

    const selectionMenu = createSelectionActionMenu(scene, {
      getSelectionActions() {
        return [
          {
            id: 'learning-selection-actions',
            title: 'Learning',
            actions: [
              {
                id: 'mark-for-review',
                label: 'Mark for review',
              },
            ],
          },
        ];
      },
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    selectionMenu.mount(container);

    try {
      const button = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Mark for review"]'
      );
      expect(button).not.toBeNull();
    } finally {
      selectionMenu.unmount();
      container.remove();
    }
  });

  it('can render adapter-only selection actions when legacy planning actions are disabled', () => {
    const scene = new Scene();
    const task = new TaskElement({ id: 'task-1', title: 'Task 1' });
    scene.addElement(task);
    scene.setSelected([task]);

    const selectionMenu = createSelectionActionMenu(
      scene,
      {
        getSelectionActions() {
          return [
            {
              id: 'learning-selection-actions',
              actions: [
                {
                  id: 'mark-for-review',
                  label: 'Mark for review',
                },
              ],
            },
          ];
        },
      },
      createAppRuntime({ initialLocale: 'en' }),
      {
        enableLegacyPlanningActions: false,
      }
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    selectionMenu.mount(container);

    try {
      const labels = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
        .map((button) => button.getAttribute('aria-label'))
        .filter((label): label is string => Boolean(label));

      expect(labels).toEqual(['Mark for review']);
    } finally {
      selectionMenu.unmount();
      container.remove();
    }
  });

  it('supports adapter-only selection actions for non-planning nodes when legacy planning actions are disabled', () => {
    const scene = new Scene();
    const node = new GenericCanvasNode('generic-1');
    scene.addElement(node);
    scene.setSelected([node]);

    const selectionMenu = createSelectionActionMenu(
      scene,
      {
        getSelectionActions() {
          return [
            {
              id: 'generic-selection-actions',
              actions: [
                {
                  id: 'inspect-generic',
                  label: 'Inspect generic node',
                },
              ],
            },
          ];
        },
      },
      createAppRuntime({ initialLocale: 'en' }),
      {
        enableLegacyPlanningActions: false,
      }
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    selectionMenu.mount(container);

    try {
      const labels = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
        .map((button) => button.getAttribute('aria-label'))
        .filter((label): label is string => Boolean(label));

      expect(labels).toEqual(['Inspect generic node']);
    } finally {
      selectionMenu.unmount();
      container.remove();
    }
  });

  it('can render adapter-only actions as a compact attached row', () => {
    const scene = new Scene();
    const node = new GenericCanvasNode('generic-1');
    scene.addElement(node);
    scene.setSelected([node]);

    const selectionMenu = createSelectionActionMenu(
      scene,
      {
        getSelectionActions() {
          return [
            {
              id: 'generic-selection-actions',
              actions: [
                {
                  id: 'inspect-generic',
                  label: 'Inspect generic node',
                },
              ],
            },
          ];
        },
      },
      createAppRuntime({ initialLocale: 'en' }),
      {
        enableLegacyPlanningActions: false,
        positionStrategy: 'top-right-inset',
        omitDividerForInteractionActions: true,
      }
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    selectionMenu.mount(container);

    try {
      const surface = container.querySelector('div');
      const dividers = Array.from(container.querySelectorAll('div')).filter((el) =>
        el.className.includes('bg-slate-200/70')
      );

      expect(surface?.className).toContain('rounded-xl');
      expect(dividers).toHaveLength(0);
      expect(surface?.style.left).not.toBe('');
      expect(surface?.style.top).not.toBe('');
    } finally {
      selectionMenu.unmount();
      container.remove();
    }
  });
});
