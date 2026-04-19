// @vitest-environment jsdom

import { Subject } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppRuntime } from '../../../app-runtime/index.ts';
import {
  CANVAS_LINK_LIFECYCLE_EVENT,
  type CanvasLinkLifecycleDetail,
} from '../core/canvasLinkLifecycle.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';
import { ConnectionRelationType } from '../core/interfaces/connection.ts';
import Connection from '../core/shapes/Connection.ts';
import { Scene } from '../core/scene/Scene.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { SelectedConnectionActionMenu } from './SelectedConnectionActionMenu.ts';

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

function mountMenu(scene: Scene): {
  menu: SelectedConnectionActionMenu;
  container: HTMLDivElement;
} {
  const menu = new SelectedConnectionActionMenu(
    scene,
    createCanvasManagerStub(),
    new BulkActionsController(scene),
    createAppRuntime({ initialLocale: 'en' })
  );
  const container = document.createElement('div');
  document.body.appendChild(container);
  menu.mount(container);
  return { menu, container };
}

function setupSelectedGoalConnection(): {
  scene: Scene;
  connection: Connection;
} {
  const scene = new Scene();
  const from = new GoalElement({ id: 'goal-1', x: 100, y: 100 });
  const to = new GoalElement({ id: 'goal-2', x: 500, y: 120 });
  const connection = new Connection(
    from.id,
    to.id,
    'conn-1',
    undefined,
    ConnectionRelationType.LeadsTo
  );

  scene.addElement(from);
  scene.addElement(to);
  scene.addElement(connection);
  scene.setSelected([connection]);

  return { scene, connection };
}

describe('SelectedConnectionActionMenu', () => {
  afterEach(() => {
    historyService.reset();
    document.body.innerHTML = '';
  });

  it('shows action controls for a selected connection', () => {
    const { scene } = setupSelectedGoalConnection();
    const { menu, container } = mountMenu(scene);

    try {
      const hud = container.querySelector<HTMLElement>(
        '[data-selected-connection-menu="true"]'
      );
      expect(hud).not.toBeNull();
      expect(hud?.classList.contains('hidden')).toBe(false);
      expect(
        container.querySelector('[data-selected-connection-delete-fully="true"]')
      ).not.toBeNull();
      expect(
        container.querySelector(
          '[data-selected-connection-relation-trigger="true"]'
        )
      ).not.toBeNull();
    } finally {
      menu.unmount();
      container.remove();
    }
  });

  it('deletes the selected goal connection from canvas and domain', () => {
    const { scene } = setupSelectedGoalConnection();
    const { menu, container } = mountMenu(scene);
    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      container
        .querySelector<HTMLButtonElement>(
          '[data-selected-connection-delete-fully="true"]'
        )
        ?.click();

      expect(scene.getConnections()).toHaveLength(0);
      expect(lifecycleDetails).toHaveLength(1);
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'remove',
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
      menu.unmount();
      container.remove();
    }
  });

  it('deletes the selected goal connection only from canvas', () => {
    const { scene } = setupSelectedGoalConnection();
    const { menu, container } = mountMenu(scene);
    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      container
        .querySelector<HTMLButtonElement>(
          '[data-selected-connection-delete-canvas="true"]'
        )
        ?.click();

      expect(scene.getConnections()).toHaveLength(0);
      expect(lifecycleDetails).toHaveLength(0);
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
      menu.unmount();
      container.remove();
    }
  });

  it('updates the selected goal connection relation type through lifecycle events', () => {
    const { scene, connection } = setupSelectedGoalConnection();
    const { menu, container } = mountMenu(scene);
    const lifecycleDetails: CanvasLinkLifecycleDetail[] = [];
    const onLifecycle = (event: Event): void => {
      lifecycleDetails.push(
        (event as CustomEvent<CanvasLinkLifecycleDetail>).detail
      );
    };

    window.addEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
    try {
      container
        .querySelector<HTMLButtonElement>(
          '[data-selected-connection-relation-trigger="true"]'
        )
        ?.click();

      const blocksOption = document.querySelector<HTMLButtonElement>(
        '[data-dropdown-select-item="blocks"]'
      );

      expect(blocksOption).toBeTruthy();
      blocksOption?.click();

      expect(connection.relationType).toBe(ConnectionRelationType.Blocks);
      expect(lifecycleDetails).toHaveLength(1);
      expect(lifecycleDetails[0]).toMatchObject({
        kind: 'goal-link',
        action: 'update',
        currentGoalLink: { relationType: ConnectionRelationType.LeadsTo },
        nextGoalLink: { relationType: ConnectionRelationType.Blocks },
      });
    } finally {
      window.removeEventListener(CANVAS_LINK_LIFECYCLE_EVENT, onLifecycle);
      menu.unmount();
      container.remove();
    }
  });
});
