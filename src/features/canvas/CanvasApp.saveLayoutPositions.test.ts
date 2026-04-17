import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TaskElement } from './elements/TaskElement.ts';
import { StoryElement } from './elements/StoryElement.ts';
import { CanvasApp } from './CanvasApp.ts';
import { notify } from './core/services/NotificationService.ts';

vi.mock('./core/services/NotificationService.ts', () => ({
  notify: vi.fn(),
}));

vi.mock('./core/managers/CommandManager.ts', () => ({
  commandManager: {
    register: vi.fn(),
    bindShortcut: vi.fn(),
  },
}));

type SaveLayoutHarness = Record<string, unknown>;

function createTask(overrides?: {
  id?: string;
  uuid?: string;
  backendId?: number;
}): TaskElement {
  return new TaskElement({
    id: overrides?.id ?? 'task-1',
    uuid: overrides?.uuid,
    backendId: overrides?.backendId,
    x: 120,
    y: 80,
  });
}

function createStory(overrides?: {
  id?: string;
  uuid?: string;
  height?: number;
}): StoryElement {
  return new StoryElement({
    id: overrides?.id ?? 'story-1',
    uuid: overrides?.uuid,
    x: 100,
    y: 120,
    width: 760,
    height: overrides?.height ?? 220,
  });
}

function createHarness(): {
  app: SaveLayoutHarness;
  canvasDataService: {
    getRemovedPositionIds: ReturnType<typeof vi.fn>;
    hasRelationChanges: ReturnType<typeof vi.fn>;
    filterPositionUpdates: ReturnType<typeof vi.fn>;
    saveCanvasSnapshot: ReturnType<typeof vi.fn>;
    getActiveCanvasMeta: ReturnType<typeof vi.fn>;
    getActiveCanvasRevision: ReturnType<typeof vi.fn>;
  };
  scene: {
    isFocused: ReturnType<typeof vi.fn>;
    isHighlighted: ReturnType<typeof vi.fn>;
    getConnections: ReturnType<typeof vi.fn>;
  };
  queueUnsyncedDraft: ReturnType<typeof vi.fn>;
  removeUnsyncedDraft: ReturnType<typeof vi.fn>;
} {
  const canvasDataService = {
    getRemovedPositionIds: vi.fn(() => []),
    hasRelationChanges: vi.fn(() => false),
    filterPositionUpdates: vi.fn(() => []),
    saveCanvasSnapshot: vi.fn(() => of({ revision: 2 })),
    getActiveCanvasMeta: vi.fn(() => null),
    getActiveCanvasRevision: vi.fn(() => 1),
  };
  const scene = {
    isFocused: vi.fn(() => false),
    isHighlighted: vi.fn(() => false),
    getConnections: vi.fn(() => []),
  };
  const queueUnsyncedDraft = vi.fn();
  const removeUnsyncedDraft = vi.fn();
  const app: SaveLayoutHarness = {
    canvasDataService,
    scene,
    canvasTitle: 'Canvas',
    dedupeLayoutPositions: (positions: unknown[]) => positions,
    queueUnsyncedDraft,
    removeUnsyncedDraft,
    i18n: {
      t: (key: string) => key,
    },
  };
  app.getLinkElementRef = function (element: {
    id: string;
    uuid?: string;
    backendId?: string | number | null;
  }): string | null {
    return (
      CanvasApp.prototype as unknown as {
        getLinkElementRef: (input: {
          id: string;
          uuid?: string;
          backendId?: string | number | null;
        }) => string | null;
      }
    ).getLinkElementRef.call(app, element);
  };
  app.getLayoutPersistenceRef = function (element: {
    uuid?: string;
    backendId?: string | number | null;
  }): string | null {
    return (
      CanvasApp.prototype as unknown as {
        getLayoutPersistenceRef: (input: {
          uuid?: string;
          backendId?: string | number | null;
        }) => string | null;
      }
    ).getLayoutPersistenceRef.call(app, element);
  };
  app.isSnapshotConflictError = (error: unknown) =>
    (
      CanvasApp.prototype as unknown as {
        isSnapshotConflictError: (input: unknown) => boolean;
      }
    ).isSnapshotConflictError.call(app, error);
  return {
    app,
    canvasDataService,
    scene,
    queueUnsyncedDraft,
    removeUnsyncedDraft,
  };
}

function runSaveLayout(
  app: SaveLayoutHarness,
  elements: Array<TaskElement | StoryElement>,
  showNotifications: boolean
) {
  return (
    CanvasApp.prototype as unknown as {
      saveLayoutPositions: (
        inputElements: Array<TaskElement | StoryElement>,
        inputShowNotifications: boolean
      ) => import('rxjs').Observable<boolean>;
    }
  ).saveLayoutPositions.call(app, elements, showNotifications);
}

describe('CanvasApp.saveLayoutPositions', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns true and shows info when there is nothing to save', async () => {
    const { app } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });

    const result$ = runSaveLayout(app, [task], true);

    const saved = await firstValueFrom(result$);

    expect(saved).toBe(true);
    expect(notify).toHaveBeenCalledWith('No changes to save.', 'info');
  });

  it('returns true without notification when there is nothing to save and notifications are off', async () => {
    const { app } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('returns false when an element has no persisted reference at all', async () => {
    const { app, canvasDataService } = createHarness();
    const taskWithoutRef = createTask({ id: 'task-no-ref' });
    taskWithoutRef.id = '';
    taskWithoutRef.uuid = undefined;
    taskWithoutRef.backendId = undefined;

    const saved = await firstValueFrom(
      runSaveLayout(app, [taskWithoutRef], true)
    );

    expect(saved).toBe(false);
    expect(notify).toHaveBeenCalledWith(
      'Some elements have no backend IDs; cannot save layout.',
      'error'
    );
    expect(canvasDataService.getRemovedPositionIds).not.toHaveBeenCalled();
  });

  it('saves layout using backend id fallback when uuid is missing', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ id: 'task-legacy', backendId: 42 });
    canvasDataService.filterPositionUpdates.mockReturnValue([
      {
        element_type: 'task',
        element_uuid: '42',
      },
    ]);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [
          expect.objectContaining({
            element_type: 'task',
            element_uuid: '42',
          }),
        ],
      })
    );
  });

  it('saves a mixed layout batch when one persisted element only has backend id', async () => {
    const { app, canvasDataService } = createHarness();
    const legacyTask = createTask({ id: 'task-legacy', backendId: 42 });
    const uuidTask = createTask({ id: 'task-uuid', uuid: 'task-uuid-1' });
    canvasDataService.filterPositionUpdates.mockReturnValue([
      {
        element_type: 'task',
        element_uuid: '42',
      },
      {
        element_type: 'task',
        element_uuid: 'task-uuid-1',
      },
    ]);

    const saved = await firstValueFrom(
      runSaveLayout(app, [legacyTask, uuidTask], false)
    );

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: expect.arrayContaining([
          expect.objectContaining({
            element_type: 'task',
            element_uuid: '42',
          }),
          expect.objectContaining({
            element_type: 'task',
            element_uuid: 'task-uuid-1',
          }),
        ]),
      })
    );
  });

  it('saves changed positions and marks save success', async () => {
    const { app, canvasDataService, removeUnsyncedDraft } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const changedPosition = {
      element_type: 'task',
      element_uuid: 'task-uuid-1',
    };
    canvasDataService.filterPositionUpdates.mockReturnValue([changedPosition]);

    const saved = await firstValueFrom(runSaveLayout(app, [task], true));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'manual-save',
        positions: [
          expect.objectContaining({
            element_type: 'task',
            element_uuid: 'task-uuid-1',
          }),
        ],
        connections: [],
        elements: [task],
      })
    );
    expect(removeUnsyncedDraft).toHaveBeenCalledWith('layout-sync');
    expect(removeUnsyncedDraft).toHaveBeenCalledWith('relations-sync');
    expect(notify).toHaveBeenCalledWith('Layout saved', 'success');
  });

  it('saves a full snapshot when only deletions exist', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    canvasDataService.getRemovedPositionIds.mockReturnValue(['position-1']);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledTimes(1);
  });

  it('saves a full snapshot when only relation changes exist', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    canvasDataService.hasRelationChanges.mockReturnValue(true);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledTimes(1);
  });

  it('treats a dropped existing layout change as no-op and skips snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const story = createStory({ uuid: 'story-uuid-1', height: 320 });
    canvasDataService.filterPositionUpdates.mockReturnValue([]);

    const saved = await firstValueFrom(runSaveLayout(app, [story], true));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('No changes to save.', 'info');
  });

  it('still persists the same dropped layout change when relation changes force a snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const story = createStory({ uuid: 'story-uuid-1', height: 320 });
    canvasDataService.filterPositionUpdates.mockReturnValue([]);
    canvasDataService.hasRelationChanges.mockReturnValue(true);

    const saved = await firstValueFrom(runSaveLayout(app, [story], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [
          expect.objectContaining({
            element_type: 'story',
            element_uuid: 'story-uuid-1',
            meta: expect.objectContaining({
              height: 320,
            }),
          }),
        ],
      })
    );
  });

  it('still persists the same dropped layout change when deletions force a snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const story = createStory({ uuid: 'story-uuid-1', height: 320 });
    canvasDataService.filterPositionUpdates.mockReturnValue([]);
    canvasDataService.getRemovedPositionIds.mockReturnValue(['position-1']);

    const saved = await firstValueFrom(runSaveLayout(app, [story], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [
          expect.objectContaining({
            element_type: 'story',
            element_uuid: 'story-uuid-1',
            meta: expect.objectContaining({
              height: 320,
            }),
          }),
        ],
      })
    );
  });

  it('treats a dropped existing task coordinate change as no-op and skips snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    task.x = 180;
    task.y = 220;
    canvasDataService.filterPositionUpdates.mockReturnValue([]);

    const saved = await firstValueFrom(runSaveLayout(app, [task], true));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('No changes to save.', 'info');
  });

  it('still persists the same dropped task coordinate change when relation changes force a snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    task.x = 180;
    task.y = 220;
    canvasDataService.filterPositionUpdates.mockReturnValue([]);
    canvasDataService.hasRelationChanges.mockReturnValue(true);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [
          expect.objectContaining({
            element_type: 'task',
            element_uuid: 'task-uuid-1',
            x: 180,
            y: 220,
          }),
        ],
      })
    );
  });

  it('still persists the same dropped task coordinate change when deletions force a snapshot save', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    task.x = 180;
    task.y = 220;
    canvasDataService.filterPositionUpdates.mockReturnValue([]);
    canvasDataService.getRemovedPositionIds.mockReturnValue(['position-1']);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.saveCanvasSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        positions: [
          expect.objectContaining({
            element_type: 'task',
            element_uuid: 'task-uuid-1',
            x: 180,
            y: 220,
          }),
        ],
      })
    );
  });

  it('queues a layout draft and propagates error when snapshot save fails', async () => {
    const { app, canvasDataService, queueUnsyncedDraft } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const failure = new Error('snapshot-save-failed');
    canvasDataService.hasRelationChanges.mockReturnValue(true);
    canvasDataService.saveCanvasSnapshot.mockReturnValue(throwError(() => failure));

    await expect(firstValueFrom(runSaveLayout(app, [task], true))).rejects.toBe(
      failure
    );

    expect(queueUnsyncedDraft).toHaveBeenCalledWith(
      'layout-sync',
      'layout',
      expect.objectContaining({
        positions: [expect.objectContaining({ element_uuid: 'task-uuid-1' })],
        removedPositionIds: [],
        relationCount: 0,
        baseRevision: 1,
      })
    );
    expect(notify).toHaveBeenCalledWith('Failed to save layout', 'error');
  });

  it('shows a conflict message when snapshot revision is stale', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const conflictError = { status: 409 };
    canvasDataService.hasRelationChanges.mockReturnValue(true);
    canvasDataService.saveCanvasSnapshot.mockReturnValue(
      throwError(() => conflictError)
    );
    app.i18n = {
      t: (key: string) =>
        key === 'canvas.snapshotOutOfDate' ? 'Snapshot conflict.' : key,
    };
    app.isSnapshotConflictError = function (error: unknown): boolean {
      return (
        CanvasApp.prototype as unknown as {
          isSnapshotConflictError: (input: unknown) => boolean;
        }
      ).isSnapshotConflictError.call(app, error);
    };

    await expect(firstValueFrom(runSaveLayout(app, [task], true))).rejects.toBe(
      conflictError
    );

    expect(notify).toHaveBeenCalledWith('Snapshot conflict.', 'error');
  });
});
