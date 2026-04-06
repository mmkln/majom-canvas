// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasApp } from './CanvasApp.ts';

const { notifyMock, openCanvasVersionHistoryModalMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  openCanvasVersionHistoryModalMock: vi.fn(),
}));

vi.mock('./core/services/NotificationService.ts', () => ({
  notify: notifyMock,
}));

vi.mock('./ui/components/CanvasVersionHistoryModal.ts', () => ({
  openCanvasVersionHistoryModal: openCanvasVersionHistoryModalMock,
}));

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

type CanvasGuardHarness = Record<string, unknown> & {
  autosaveEnabled: boolean;
  autosaveInFlight: boolean;
  isHydratingCanvas: boolean;
  canvasManager: {
    getLoadPhase: () =>
      | 'idle'
      | 'loading'
      | 'layout-ready'
      | 'elements-partial-ready'
      | 'elements-ready';
  };
  i18n: {
    t: (key: string) => string;
  };
  persistenceState: {
    hasLayoutDirty: () => boolean;
  };
  authService: {
    isLoggedIn: () => boolean;
  };
  retryRestoreReplayPersistence: ReturnType<typeof vi.fn>;
  saveCanvasLayout: ReturnType<typeof vi.fn>;
  isLinkDecisionPending: () => boolean;
  scene: {
    removeElements: ReturnType<typeof vi.fn>;
  };
  canvasDataService: {
    deleteElement: ReturnType<typeof vi.fn>;
    createCanvas: ReturnType<typeof vi.fn>;
    getActiveCanvasId: () => string | null;
    loadCanvasHistory: ReturnType<typeof vi.fn>;
    restoreCanvasHistoryVersion: ReturnType<typeof vi.fn>;
  };
  canPersistCanvasState: () => boolean;
  canMutateCanvasStructure: () => boolean;
  notifyCanvasMutationBlocked: () => void;
  runtime: Record<string, unknown>;
  canvasTitle: string;
  persistActiveCanvasDraftNow: ReturnType<typeof vi.fn>;
  setCanvasTitle: ReturnType<typeof vi.fn>;
  canvasListCache: Map<string, unknown>;
  emitCanvasList: ReturnType<typeof vi.fn>;
  getCanvasListUiItemsFromCache: ReturnType<typeof vi.fn>;
  resetHistoryAndPersistence: ReturnType<typeof vi.fn>;
  loadActiveCanvasElements: ReturnType<typeof vi.fn>;
};

function createHarness(overrides: Partial<CanvasGuardHarness> = {}): CanvasGuardHarness {
  return {
    autosaveEnabled: true,
    autosaveInFlight: false,
    isHydratingCanvas: true,
    canvasManager: {
      getLoadPhase: () => 'elements-partial-ready',
    },
    i18n: {
      t: (key: string) => key,
    },
    persistenceState: {
      hasLayoutDirty: () => true,
    },
    authService: {
      isLoggedIn: () => true,
    },
    retryRestoreReplayPersistence: vi.fn(),
    saveCanvasLayout: vi.fn(),
    isLinkDecisionPending: () => false,
    scene: {
      removeElements: vi.fn(),
    },
    canvasDataService: {
      deleteElement: vi.fn(),
      createCanvas: vi.fn(),
      getActiveCanvasId: () => 'canvas-1',
      loadCanvasHistory: vi.fn(),
      restoreCanvasHistoryVersion: vi.fn(),
    },
    canPersistCanvasState() {
      return (
        !this.isHydratingCanvas &&
        this.canvasManager.getLoadPhase() === 'elements-ready'
      );
    },
    canMutateCanvasStructure() {
      return this.canPersistCanvasState();
    },
    notifyCanvasMutationBlocked() {
      notifyMock(this.i18n.t('canvas.waitForCanvasLoadBeforeDestructiveAction'), 'info');
    },
    runtime: {},
    canvasTitle: 'Canvas',
    persistActiveCanvasDraftNow: vi.fn(),
    setCanvasTitle: vi.fn(),
    canvasListCache: new Map(),
    emitCanvasList: vi.fn(),
    getCanvasListUiItemsFromCache: vi.fn(() => []),
    resetHistoryAndPersistence: vi.fn(),
    loadActiveCanvasElements: vi.fn(),
    ...overrides,
  } as CanvasGuardHarness;
}

describe('CanvasApp persistence guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks manual save while canvas hydration is incomplete', () => {
    const app = createHarness();

    (
      CanvasApp.prototype as unknown as {
        handleSaveCanvasLayoutRequest: () => void;
      }
    ).handleSaveCanvasLayoutRequest.call(app);

    expect(app.saveCanvasLayout).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      'canvas.waitForCanvasLoadBeforePersisting',
      'info'
    );
  });

  it('skips autosave while canvas hydration is incomplete', () => {
    const app = createHarness();

    (
      CanvasApp.prototype as unknown as {
        runAutosaveTick: () => void;
      }
    ).runAutosaveTick.call(app);

    expect(app.saveCanvasLayout).not.toHaveBeenCalled();
  });

  it('blocks permanent element deletion while canvas hydration is incomplete', () => {
    const app = createHarness();
    const element = { id: 'task-1' };

    (
      CanvasApp.prototype as unknown as {
        handleElementDeleteRequested: (event: Event) => void;
      }
    ).handleElementDeleteRequested.call(
      app,
      new CustomEvent('elementDeleteRequested', { detail: { element } })
    );

    expect(app.scene.removeElements).not.toHaveBeenCalled();
    expect(app.canvasDataService.deleteElement).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      'canvas.waitForCanvasLoadBeforeDestructiveAction',
      'info'
    );
  });

  it('blocks canvas duplication while canvas hydration is incomplete', async () => {
    const app = createHarness();

    await (
      CanvasApp.prototype as unknown as {
        handleCanvasDuplicateRequested: () => Promise<void>;
      }
    ).handleCanvasDuplicateRequested.call(app);

    expect(app.canvasDataService.createCanvas).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      'canvas.waitForCanvasLoadBeforePersisting',
      'info'
    );
  });

  it('still allows opening version history while canvas hydration is incomplete', async () => {
    const app = createHarness();

    await (
      CanvasApp.prototype as unknown as {
        handleCanvasVersionHistoryRequested: () => Promise<void>;
      }
    ).handleCanvasVersionHistoryRequested.call(app);

    expect(openCanvasVersionHistoryModalMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).not.toHaveBeenCalledWith(
      'canvas.waitForCanvasLoadBeforePersisting',
      'info'
    );
  });

  it('emits only ui state updates during hydration changes and does not trigger data refresh reloads', () => {
    const app = createHarness({
      isHydratingCanvas: false,
      isElementsHydrating: true,
      isRelationsHydrating: false,
    });
    const uiStateChanged = vi.fn();
    const refreshRequested = vi.fn();
    window.addEventListener('canvasUiStateChanged', uiStateChanged);
    window.addEventListener('refreshCanvasData', refreshRequested);

    try {
      (
        CanvasApp.prototype as unknown as {
          syncHydrationState: () => void;
        }
      ).syncHydrationState.call(app);

      expect(uiStateChanged).toHaveBeenCalledTimes(1);
      expect(refreshRequested).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('canvasUiStateChanged', uiStateChanged);
      window.removeEventListener('refreshCanvasData', refreshRequested);
    }
  });
});
