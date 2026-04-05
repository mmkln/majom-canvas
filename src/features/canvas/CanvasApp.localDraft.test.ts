// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasApp } from './CanvasApp.ts';
import { Scene } from './core/scene/Scene.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { historyService } from './core/services/HistoryService.ts';
import { canvasPersistenceState } from './core/services/CanvasPersistenceState.ts';
import { CanvasDraftRecoveryCoordinator } from './core/services/CanvasDraftRecoveryCoordinator.ts';
import { CanvasRestoreReplayCoordinator } from './core/services/CanvasRestoreReplayCoordinator.ts';
import { isCanvasPlanningElement } from './elements/utils/planningElementCapabilities.ts';
import { CanvasDraftSerializer } from './drafts/CanvasDraftSerializer.ts';
import type {
  CanvasDraftRepository,
  CanvasDraftSnapshot,
} from './drafts/CanvasDraftRepository.ts';
import { readCanvasMetaFingerprint } from './drafts/canvasMetaFingerprint.ts';

const {
  confirmRestoreCanvasDraftModalMock,
} = vi.hoisted(() => ({
  confirmRestoreCanvasDraftModalMock: vi.fn(),
}));

vi.mock('./ui/components/ConfirmRestoreCanvasDraftModal.ts', () => ({
  confirmRestoreCanvasDraftModal: confirmRestoreCanvasDraftModalMock,
}));

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

type CanvasDraftHarness = Record<string, any> & {
  scene: Scene;
  draftSerializer: CanvasDraftSerializer;
  draftRepository: CanvasDraftRepository;
  draftRecoveryCoordinator: CanvasDraftRecoveryCoordinator;
  authService: {
    isLoggedIn: () => boolean;
  };
  canvasDataService: {
    getActiveCanvasId: () => string | null;
    getActiveCanvasMeta: () => Record<string, unknown> | null;
    hasUnpersistedElementUpdates: () => boolean;
    markPositionsDirty: ReturnType<typeof vi.fn>;
    queueElementUpdate: ReturnType<typeof vi.fn>;
    setHabitCompletionToday: ReturnType<typeof vi.fn>;
    updateHabitLifecycleStatus: ReturnType<typeof vi.fn>;
  };
  canvasManager: {
    clearLoadingPlaceholders: ReturnType<typeof vi.fn>;
    setLoadPhase: ReturnType<typeof vi.fn>;
    draw: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
};

function createTask(input: {
  id: string;
  uuid: string;
  title: string;
  x?: number;
  y?: number;
}): TaskElement {
  return new TaskElement({
    id: input.id,
    uuid: input.uuid,
    title: input.title,
    x: input.x ?? 120,
    y: input.y ?? 80,
  });
}

function createHarness(options?: {
  canvasId?: string;
  meta?: Record<string, unknown> | null;
  hasUnpersistedElementUpdates?: boolean;
  scene?: Scene;
  repository?: Partial<CanvasDraftRepository>;
}): CanvasDraftHarness {
  const repository: CanvasDraftRepository = {
    load: vi.fn(async () => null),
    save: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    ...options?.repository,
  };
  const app = Object.create(CanvasApp.prototype) as CanvasDraftHarness;
  app.scene = options?.scene ?? new Scene();
  app.draftSerializer = new CanvasDraftSerializer();
  app.draftRepository = repository;
  app.authService = {
    isLoggedIn: () => true,
  };
  app.canvasDataService = {
    getActiveCanvasId: () => options?.canvasId ?? 'canvas-1',
    getActiveCanvasMeta: () => options?.meta ?? { favorite: true },
    hasUnpersistedElementUpdates: () =>
      options?.hasUnpersistedElementUpdates ?? false,
    markPositionsDirty: vi.fn(),
    queueElementUpdate: vi.fn(),
    setHabitCompletionToday: vi.fn(),
    updateHabitLifecycleStatus: vi.fn(),
  };
  app.restoreReplayCoordinator = new CanvasRestoreReplayCoordinator({
    scene: app.scene,
    canvasDataService: app.canvasDataService,
    onSettled: vi.fn(),
  });
  app.draftRecoveryCoordinator = new CanvasDraftRecoveryCoordinator({
    draftRepository: app.draftRepository,
    confirmRestore: confirmRestoreCanvasDraftModalMock,
    applySnapshot: (snapshot, restoreDiff) => {
      (
        CanvasApp.prototype as unknown as {
          applyCanvasDraftSnapshot: (
            nextSnapshot: CanvasDraftSnapshot,
            nextRestoreDiff: unknown
          ) => void;
        }
      ).applyCanvasDraftSnapshot.call(app, snapshot, restoreDiff);
    },
  });
  app.canvasManager = {
    clearLoadingPlaceholders: vi.fn(),
    setLoadPhase: vi.fn(),
    draw: vi.fn(),
    destroy: vi.fn(),
  };
  app.unregisterWindowEvents = vi.fn();
  app.stopAutosave = vi.fn();
  app.clearAiAssistantContext = vi.fn();
  app.uiManager = {
    unmountAll: vi.fn(),
  };
  app.activeCanvasElementsSubscription = null;
  app.activeCanvasRelationsSubscription = null;
  app.viewChangesSubscription = null;
  app.sceneChangesSubscription = null;
  app.historyChangesSubscription = null;
  app.elementUpdateStatusSubscription = null;
  app.disposeRuntimeSubscription = null;
  app.aiAssistantViewportSyncTimer = null;
  app.replacePlanningElements = vi.fn((elements) => {
    app.scene.replaceElements(isCanvasPlanningElement, elements);
  });
  app.emitAiAssistantContext = vi.fn();
  app.isApplyingLocalDraft = false;
  app.isHydratingCanvas = false;
  app.destroyed = false;
  app.draftPersistTimer = null;
  app.draftReconciliationToken = 0;
  return app;
}

async function runReconcileActiveCanvasDraft(
  app: CanvasDraftHarness
): Promise<void> {
  await (
    CanvasApp.prototype as unknown as {
      reconcileActiveCanvasDraft: () => Promise<void>;
    }
  ).reconcileActiveCanvasDraft.call(app);
}

async function runClearActiveCanvasDraftIfSettled(
  app: CanvasDraftHarness
): Promise<void> {
  await (
    CanvasApp.prototype as unknown as {
      clearActiveCanvasDraftIfSettled: () => Promise<void>;
    }
  ).clearActiveCanvasDraftIfSettled.call(app);
}

async function runDestroy(app: CanvasDraftHarness): Promise<void> {
  (
    CanvasApp.prototype as unknown as {
      destroy: () => void;
    }
  ).destroy.call(app);
  await Promise.resolve();
}

function createSnapshot(
  canvasId: string,
  scene: Scene,
  meta?: Record<string, unknown> | null
): CanvasDraftSnapshot {
  return new CanvasDraftSerializer().capture(
    canvasId,
    scene,
    readCanvasMetaFingerprint(meta ?? { favorite: true })
  );
}

describe('CanvasApp local draft reconciliation', () => {
  let historyResetSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasPersistenceState.reset();
    historyResetSpy = vi
      .spyOn(historyService, 'reset')
      .mockImplementation(() => {});
  });

  it('clears a stored draft when it matches the hydrated canvas state', async () => {
    const scene = new Scene();
    scene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Server task',
      })
    );
    const snapshot = createSnapshot('canvas-1', scene);
    const app = createHarness({
      scene,
      repository: {
        load: vi.fn(async () => snapshot),
      },
    });

    await runReconcileActiveCanvasDraft(app);

    expect(app.draftRepository.load).toHaveBeenCalledWith('canvas-1');
    expect(app.draftRepository.clear).toHaveBeenCalledWith('canvas-1');
    expect(confirmRestoreCanvasDraftModalMock).not.toHaveBeenCalled();
    expect(scene.getElements()).toHaveLength(1);
    expect(historyResetSpy).not.toHaveBeenCalled();
  });

  it('restores the local snapshot when the user chooses restore', async () => {
    const scene = new Scene();
    scene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Server task',
      })
    );
    const localScene = new Scene();
    const restoredTask = createTask({
      id: 'task-1',
      uuid: 'task-uuid-1',
      title: 'Draft task',
      x: 240,
      y: 160,
    });
    localScene.addElement(restoredTask);
    localScene.setFocusedElement(restoredTask);
    localScene.setHighlightedElementIds([restoredTask.id]);
    const snapshot = createSnapshot('canvas-1', localScene);
    confirmRestoreCanvasDraftModalMock.mockResolvedValue('restore');
    const app = createHarness({
      scene,
      meta: { favorite: true },
      repository: {
        load: vi.fn(async () => snapshot),
      },
    });

    await runReconcileActiveCanvasDraft(app);

    const [element] = scene.getElements().filter(isCanvasPlanningElement);
    expect(confirmRestoreCanvasDraftModalMock).toHaveBeenCalledTimes(1);
    expect(confirmRestoreCanvasDraftModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasCanvasMetaChanges: false })
    );
    expect(element?.title).toBe('Draft task');
    expect(element?.x).toBe(240);
    expect(element?.y).toBe(160);
    expect(scene.getFocusedElementId()).toBe('task-1');
    expect(scene.getHighlightedElementIds()).toEqual(['task-1']);
    expect(app.canvasManager.clearLoadingPlaceholders).toHaveBeenCalledTimes(1);
    expect(app.canvasManager.setLoadPhase).toHaveBeenCalledWith(
      'elements-ready'
    );
    expect(app.canvasManager.draw).toHaveBeenCalledTimes(1);
    expect(app.canvasDataService.markPositionsDirty).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'task-1' }),
    ]);
    expect(canvasPersistenceState.hasLayoutDirty()).toBe(true);
    expect(historyResetSpy).toHaveBeenCalledTimes(1);
    expect(app.draftRepository.clear).not.toHaveBeenCalled();
  });

  it('discards the local snapshot when the user chooses the current canvas state', async () => {
    const scene = new Scene();
    const serverTask = createTask({
      id: 'task-1',
      uuid: 'task-uuid-1',
      title: 'Server task',
    });
    scene.addElement(serverTask);
    const localScene = new Scene();
    localScene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Draft task',
      })
    );
    const snapshot = createSnapshot('canvas-1', localScene);
    confirmRestoreCanvasDraftModalMock.mockResolvedValue('discard');
    const app = createHarness({
      scene,
      meta: { favorite: false, group: { id: 'g-1', name: 'Group' } },
      repository: {
        load: vi.fn(async () => snapshot),
      },
    });

    await runReconcileActiveCanvasDraft(app);

    const [element] = scene.getElements().filter(isCanvasPlanningElement);
    expect(confirmRestoreCanvasDraftModalMock).toHaveBeenCalledTimes(1);
    expect(confirmRestoreCanvasDraftModalMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasCanvasMetaChanges: true })
    );
    expect(app.draftRepository.clear).toHaveBeenCalledWith('canvas-1');
    expect(element?.title).toBe('Server task');
    expect(app.canvasManager.draw).not.toHaveBeenCalled();
    expect(historyResetSpy).not.toHaveBeenCalled();
  });

  it('replays content-only restore changes through element persistence without marking layout dirty', async () => {
    const scene = new Scene();
    scene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Server task',
      })
    );
    const localScene = new Scene();
    localScene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Draft task',
      })
    );
    const snapshot = createSnapshot('canvas-1', localScene);
    confirmRestoreCanvasDraftModalMock.mockResolvedValue('restore');
    const app = createHarness({
      scene,
      repository: {
        load: vi.fn(async () => snapshot),
      },
    });

    await runReconcileActiveCanvasDraft(app);

    expect(app.canvasDataService.markPositionsDirty).not.toHaveBeenCalled();
    expect(app.canvasDataService.queueElementUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1' }),
      expect.objectContaining({ title: 'Draft task' })
    );
    expect(canvasPersistenceState.hasLayoutDirty()).toBe(false);
    expect(canvasPersistenceState.hasRestoredReplayPending()).toBe(true);
  });

  it('clears the active draft when the canvas is fully persisted', async () => {
    const app = createHarness();

    historyResetSpy.mockRestore();
    vi.spyOn(historyService, 'hasUnsavedChanges').mockReturnValue(false);

    await runClearActiveCanvasDraftIfSettled(app);

    expect(app.draftRepository.clear).toHaveBeenCalledWith('canvas-1');
  });

  it('keeps the active draft when there are pending element updates', async () => {
    const app = createHarness({
      hasUnpersistedElementUpdates: true,
    });

    historyResetSpy.mockRestore();
    vi.spyOn(historyService, 'hasUnsavedChanges').mockReturnValue(false);

    await runClearActiveCanvasDraftIfSettled(app);

    expect(app.draftRepository.clear).not.toHaveBeenCalled();
  });

  it('keeps the active draft when restored replay is still pending or failed', async () => {
    const app = createHarness();

    canvasPersistenceState.startRestoredReplay();
    await runClearActiveCanvasDraftIfSettled(app);
    expect(app.draftRepository.clear).not.toHaveBeenCalled();

    canvasPersistenceState.markRestoredReplayFailed();
    await runClearActiveCanvasDraftIfSettled(app);
    expect(app.draftRepository.clear).not.toHaveBeenCalled();
  });

  it.fails(
    're-saves the current canvas snapshot on destroy after the user keeps current version',
    async () => {
      const scene = new Scene();
      scene.addElement(
        createTask({
          id: 'task-1',
          uuid: 'task-uuid-1',
          title: 'Server task',
        })
      );
      const localScene = new Scene();
      localScene.addElement(
        createTask({
          id: 'task-1',
          uuid: 'task-uuid-1',
          title: 'Draft task',
        })
      );
      const snapshot = createSnapshot('canvas-1', localScene);
      confirmRestoreCanvasDraftModalMock.mockResolvedValue('discard');
      const app = createHarness({
        scene,
        repository: {
          load: vi.fn(async () => snapshot),
          save: vi.fn(async () => {}),
          clear: vi.fn(async () => {}),
        },
      });

      await runReconcileActiveCanvasDraft(app);
      await runDestroy(app);

      expect(app.draftRepository.clear).toHaveBeenCalledWith('canvas-1');
      expect(app.draftRepository.save).not.toHaveBeenCalled();
    }
  );

  it('persists the current snapshot on destroy even when there are no dirty flags', async () => {
    const scene = new Scene();
    scene.addElement(
      createTask({
        id: 'task-1',
        uuid: 'task-uuid-1',
        title: 'Server task',
      })
    );
    const app = createHarness({
      scene,
      repository: {
        save: vi.fn(async () => {}),
      },
    });

    await runDestroy(app);

    expect(app.draftRepository.save).toHaveBeenCalledTimes(1);
  });
});
