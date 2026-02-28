import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TaskElement } from './elements/TaskElement.ts';
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

function createTask(overrides?: { id?: string; uuid?: string }): TaskElement {
  return new TaskElement({
    id: overrides?.id ?? 'task-1',
    uuid: overrides?.uuid,
    x: 120,
    y: 80,
  });
}

function createHarness(): {
  app: SaveLayoutHarness;
  canvasDataService: {
    getRemovedPositionIds: ReturnType<typeof vi.fn>;
    needsPositionRefresh: ReturnType<typeof vi.fn>;
    hasRelationChanges: ReturnType<typeof vi.fn>;
    filterPositionUpdates: ReturnType<typeof vi.fn>;
    updateLayoutBatch: ReturnType<typeof vi.fn>;
    deletePositions: ReturnType<typeof vi.fn>;
    refreshPositions: ReturnType<typeof vi.fn>;
    updateCanvasRelations: ReturnType<typeof vi.fn>;
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
    needsPositionRefresh: vi.fn(() => false),
    hasRelationChanges: vi.fn(() => false),
    filterPositionUpdates: vi.fn(() => []),
    updateLayoutBatch: vi.fn(() => of(undefined)),
    deletePositions: vi.fn(() => of(undefined)),
    refreshPositions: vi.fn(() => of(undefined)),
    updateCanvasRelations: vi.fn(() => of(undefined)),
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
    dedupeLayoutPositions: (positions: unknown[]) => positions,
    queueUnsyncedDraft,
    removeUnsyncedDraft,
  };
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
  elements: TaskElement[],
  showNotifications: boolean
) {
  return (
    CanvasApp.prototype as unknown as {
      saveLayoutPositions: (
        inputElements: TaskElement[],
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

  it('returns false when an element has no backend uuid', async () => {
    const { app, canvasDataService } = createHarness();
    const taskWithoutUuid = createTask({ id: 'task-no-uuid' });

    const saved = await firstValueFrom(runSaveLayout(app, [taskWithoutUuid], true));

    expect(saved).toBe(false);
    expect(notify).toHaveBeenCalledWith(
      'Some elements have no backend IDs; cannot save layout.',
      'error'
    );
    expect(canvasDataService.getRemovedPositionIds).not.toHaveBeenCalled();
  });

  it('saves changed positions and marks save success', async () => {
    const { app, canvasDataService, removeUnsyncedDraft } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const changedPosition = { element_type: 'task', element_uuid: 'task-uuid-1' };
    canvasDataService.filterPositionUpdates.mockReturnValue([changedPosition]);

    const saved = await firstValueFrom(runSaveLayout(app, [task], true));

    expect(saved).toBe(true);
    expect(canvasDataService.updateLayoutBatch).toHaveBeenCalledWith([
      changedPosition,
    ]);
    expect(canvasDataService.deletePositions).toHaveBeenCalledWith([]);
    expect(canvasDataService.updateCanvasRelations).toHaveBeenCalledTimes(1);
    expect(removeUnsyncedDraft).toHaveBeenCalledWith('layout-sync');
    expect(removeUnsyncedDraft).toHaveBeenCalledWith('relations-sync');
    expect(notify).toHaveBeenCalledWith('Layout saved', 'success');
  });

  it('deletes removed positions without layout batch update when only deletions exist', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    canvasDataService.getRemovedPositionIds.mockReturnValue(['position-1']);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.updateLayoutBatch).not.toHaveBeenCalled();
    expect(canvasDataService.deletePositions).toHaveBeenCalledWith(['position-1']);
    expect(canvasDataService.updateCanvasRelations).toHaveBeenCalledTimes(1);
  });

  it('syncs relations when only relation changes exist', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    canvasDataService.hasRelationChanges.mockReturnValue(true);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.updateLayoutBatch).not.toHaveBeenCalled();
    expect(canvasDataService.deletePositions).toHaveBeenCalledWith([]);
    expect(canvasDataService.updateCanvasRelations).toHaveBeenCalledTimes(1);
  });

  it('refreshes positions when refresh is required', async () => {
    const { app, canvasDataService } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const changedPosition = { element_type: 'task', element_uuid: 'task-uuid-1' };
    canvasDataService.filterPositionUpdates.mockReturnValue([changedPosition]);
    canvasDataService.needsPositionRefresh.mockReturnValue(true);

    const saved = await firstValueFrom(runSaveLayout(app, [task], false));

    expect(saved).toBe(true);
    expect(canvasDataService.refreshPositions).toHaveBeenCalledTimes(1);
  });

  it('queues drafts and propagates error when relation save fails', async () => {
    const { app, canvasDataService, queueUnsyncedDraft } = createHarness();
    const task = createTask({ uuid: 'task-uuid-1' });
    const failure = new Error('relation-save-failed');
    canvasDataService.hasRelationChanges.mockReturnValue(true);
    canvasDataService.updateCanvasRelations.mockReturnValue(
      throwError(() => failure)
    );

    await expect(
      firstValueFrom(runSaveLayout(app, [task], true))
    ).rejects.toBe(failure);

    expect(queueUnsyncedDraft).toHaveBeenCalledWith(
      'relations-sync',
      'relations',
      expect.objectContaining({
        relationCount: 0,
        elementCount: 1,
      })
    );
    expect(queueUnsyncedDraft).toHaveBeenCalledWith(
      'layout-sync',
      'layout',
      expect.objectContaining({
        changedPositions: [],
        removedPositionIds: [],
        relationCount: 0,
      })
    );
    expect(notify).toHaveBeenCalledWith('Failed to save relations', 'error');
    expect(notify).toHaveBeenCalledWith('Failed to save layout', 'error');
  });
});
