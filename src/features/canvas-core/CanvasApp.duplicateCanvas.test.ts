import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { CanvasApp } from './CanvasApp.ts';
import { TaskElement } from './elements/TaskElement.ts';
import { historyService } from './core/services/HistoryService.ts';
import { PlanningCanvasElementSemantics } from './adapters/planning/PlanningCanvasElementSemantics.ts';

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}));

vi.mock('./core/services/NotificationService.ts', () => ({
  notify: notifyMock,
}));

type CanvasDuplicateHarness = {
  authService: {
    isLoggedIn: () => boolean;
  };
  i18n: {
    t: (key: string) => string;
  };
  canvasTitle: string;
  pendingLinkDecisions: number;
  scene: {
    getElements: () => TaskElement[];
    isFocused: () => boolean;
    isHighlighted: () => boolean;
  };
  nodeSemantics: Pick<
    PlanningCanvasElementSemantics,
    'getSceneElements' | 'toNodeRecords'
  >;
  canvasManager: {
    getPanZoomManager: () => {
      scrollX: number;
      scrollY: number;
      scale: number;
    };
  };
  persistenceAdapter: {
    saveViewState: ReturnType<typeof vi.fn>;
  };
  canvasDataService: {
    createCanvas: ReturnType<typeof vi.fn>;
    ensureElementsPersisted: ReturnType<typeof vi.fn>;
  };
  saveLayoutPositions: ReturnType<typeof vi.fn>;
  setCanvasTitle: ReturnType<typeof vi.fn>;
  refreshCanvasList: ReturnType<typeof vi.fn>;
  isLinkDecisionPending: () => boolean;
  getCurrentViewState: () => {
    scrollX: number;
    scrollY: number;
    scale: number;
  };
  buildDuplicateCanvasTitle: (title: string) => string;
};

function createTask(overrides?: { id?: string; uuid?: string }): TaskElement {
  return new TaskElement({
    id: overrides?.id ?? 'task-1',
    uuid: overrides?.uuid ?? 'task-uuid-1',
    x: 120,
    y: 80,
  });
} 

function attachDuplicateHelpers<
  T extends Omit<
    CanvasDuplicateHarness,
    'isLinkDecisionPending' | 'getCurrentViewState' | 'buildDuplicateCanvasTitle'
  >,
>(app: T): CanvasDuplicateHarness {
  const target = app as T & Partial<CanvasDuplicateHarness>;
  target.isLinkDecisionPending = function (): boolean {
    return (
      CanvasApp.prototype as unknown as {
        isLinkDecisionPending: () => boolean;
      }
    ).isLinkDecisionPending.call(target);
  };
  target.getCurrentViewState = function (): {
    scrollX: number;
    scrollY: number;
    scale: number;
  } {
    return (
      CanvasApp.prototype as unknown as {
        getCurrentViewState: () => {
          scrollX: number;
          scrollY: number;
          scale: number;
        };
      }
    ).getCurrentViewState.call(target);
  };
  target.buildDuplicateCanvasTitle = function (title: string): string {
    return (
      CanvasApp.prototype as unknown as {
        buildDuplicateCanvasTitle: (inputTitle: string) => string;
      }
    ).buildDuplicateCanvasTitle.call(target, title);
  };
  return target as CanvasDuplicateHarness;
}

async function runHandleCanvasDuplicateRequested(
  app: CanvasDuplicateHarness
): Promise<void> {
  await (
    CanvasApp.prototype as unknown as {
      handleCanvasDuplicateRequested: () => Promise<void>;
    }
  ).handleCanvasDuplicateRequested.call(app);
}

describe('CanvasApp.handleCanvasDuplicateRequested', () => {
  let historyResetSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    historyResetSpy = vi
      .spyOn(historyService, 'reset')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    historyResetSpy.mockRestore();
  });

  it('duplicates the current canvas layout into a new canvas', async () => {
    const task = createTask();
    const nodeSemantics = new PlanningCanvasElementSemantics();
    const createCanvas = vi.fn((name: string) =>
      of({ id: 'copy-1', name, meta: null })
    );
    const ensureElementsPersisted = vi.fn(() => of(undefined));
    const saveLayoutPositions = vi.fn(() => of(true));
    const saveViewState = vi.fn(() => Promise.resolve());
    const setCanvasTitle = vi.fn();
    const refreshCanvasList = vi.fn();
    const app = attachDuplicateHelpers({
      authService: {
        isLoggedIn: () => true,
      },
      i18n: {
        t: (key: string) => {
          if (key === 'canvas.duplicatePrefix') return 'Copy - ';
          if (key === 'canvas.duplicateSuccess') return 'Canvas duplicated.';
          if (key === 'canvas.duplicateFailed') {
            return 'Failed to duplicate canvas.';
          }
          if (key === 'canvas.finishRelationConfirmationFirst') {
            return 'Please finish relation confirmation first.';
          }
          return key;
        },
      },
      canvasTitle: 'Roadmap',
      pendingLinkDecisions: 0,
      scene: {
        getElements: () => [task],
        isFocused: () => false,
        isHighlighted: () => false,
      },
      nodeSemantics,
      canvasManager: {
        getPanZoomManager: () => ({
          scrollX: 80,
          scrollY: 120,
          scale: 1.1,
        }),
      },
      persistenceAdapter: {
        saveViewState,
      },
      canvasDataService: {
        createCanvas,
        ensureElementsPersisted,
      },
      saveLayoutPositions,
      setCanvasTitle,
      refreshCanvasList,
    });

    await runHandleCanvasDuplicateRequested(app);

    expect(createCanvas).toHaveBeenCalledWith('Copy - Roadmap');
    const expectedRecords = nodeSemantics.toNodeRecords(
      [task],
      app.scene as unknown as Parameters<
        PlanningCanvasElementSemantics['toNodeRecords']
      >[1]
    );
    expect(ensureElementsPersisted).toHaveBeenCalledWith(
      expectedRecords
    );
    expect(saveLayoutPositions).toHaveBeenCalledWith([task], false);
    expect(saveViewState).toHaveBeenCalledWith(
      {
        scrollX: 80,
        scrollY: 120,
        scale: 1.1,
      },
      'copy-1'
    );
    expect(setCanvasTitle).toHaveBeenCalledWith('Copy - Roadmap');
    expect(refreshCanvasList).toHaveBeenCalledWith('copy-1');
    expect(historyResetSpy).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith('Canvas duplicated.', 'success');
  });

  it('truncates the duplicate title to match the backend max length', () => {
    const app = attachDuplicateHelpers({
      authService: {
        isLoggedIn: () => true,
      },
      i18n: {
        t: (key: string) => {
          if (key === 'canvas.duplicatePrefix') return 'Copy - ';
          return key;
        },
      },
      canvasTitle: 'x'.repeat(100),
      pendingLinkDecisions: 0,
      scene: {
        getElements: () => [],
        isFocused: () => false,
        isHighlighted: () => false,
      },
      nodeSemantics: new PlanningCanvasElementSemantics(),
      canvasManager: {
        getPanZoomManager: () => ({
          scrollX: 0,
          scrollY: 0,
          scale: 1,
        }),
      },
      persistenceAdapter: {
        saveViewState: vi.fn(() => Promise.resolve()),
      },
      canvasDataService: {
        createCanvas: vi.fn(),
        ensureElementsPersisted: vi.fn(() => of(undefined)),
      },
      saveLayoutPositions: vi.fn(() => of(true)),
      setCanvasTitle: vi.fn(),
      refreshCanvasList: vi.fn(),
    });

    const nextTitle = app.buildDuplicateCanvasTitle('x'.repeat(100));

    expect(nextTitle).toBe(`Copy - ${'x'.repeat(93)}`);
    expect(nextTitle).toHaveLength(100);
  });

  it('shows an error when duplication fails', async () => {
    const nodeSemantics = new PlanningCanvasElementSemantics();
    const createCanvas = vi.fn(() =>
      throwError(() => new Error('duplicate-failed'))
    );
    const saveLayoutPositions = vi.fn(() => of(true));
    const app = attachDuplicateHelpers({
      authService: {
        isLoggedIn: () => true,
      },
      i18n: {
        t: (key: string) => {
          if (key === 'canvas.duplicatePrefix') return 'Copy - ';
          if (key === 'canvas.duplicateSuccess') return 'Canvas duplicated.';
          if (key === 'canvas.duplicateFailed') {
            return 'Failed to duplicate canvas.';
          }
          if (key === 'canvas.finishRelationConfirmationFirst') {
            return 'Please finish relation confirmation first.';
          }
          return key;
        },
      },
      canvasTitle: 'Roadmap',
      pendingLinkDecisions: 0,
      scene: {
        getElements: () => [createTask()],
        isFocused: () => false,
        isHighlighted: () => false,
      },
      nodeSemantics,
      canvasManager: {
        getPanZoomManager: () => ({
          scrollX: 0,
          scrollY: 0,
          scale: 1,
        }),
      },
      persistenceAdapter: {
        saveViewState: vi.fn(() => Promise.resolve()),
      },
      canvasDataService: {
        createCanvas,
        ensureElementsPersisted: vi.fn(() => of(undefined)),
      },
      saveLayoutPositions,
      setCanvasTitle: vi.fn(),
      refreshCanvasList: vi.fn(),
    });

    await runHandleCanvasDuplicateRequested(app);

    expect(saveLayoutPositions).not.toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      'Failed to duplicate canvas.',
      'error'
    );
  });
});
