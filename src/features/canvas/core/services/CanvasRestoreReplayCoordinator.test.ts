import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Scene } from '../scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { canvasPersistenceState } from './CanvasPersistenceState.ts';
import { CanvasRestoreReplayCoordinator } from './CanvasRestoreReplayCoordinator.ts';
import type { CanvasRestoreDiff } from '../../drafts/CanvasRestoreDiff.ts';

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}));

vi.mock('./NotificationService.ts', () => ({
  notify: notifyMock,
}));

function createTask(): TaskElement {
  return new TaskElement({
    id: 'task-1',
    uuid: 'task-uuid-1',
    title: 'Task',
  });
}

function createHabit(): HabitElement {
  return new HabitElement({
    id: 'habit-1',
    uuid: 'habit-uuid-1',
    title: 'Habit',
    habitStatus: Status.Active,
  });
}

describe('CanvasRestoreReplayCoordinator', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasPersistenceState.reset();
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('tracks queued element replay until autosave reports saved', () => {
    const scene = new Scene();
    scene.addElement(createTask());
    const onSettled = vi.fn();
    const coordinator = new CanvasRestoreReplayCoordinator({
      scene,
      canvasDataService: {
        queueElementUpdate: vi.fn(),
        setHabitCompletionToday: vi.fn(() => of(undefined)),
        updateHabitLifecycleStatus: vi.fn(() => of(undefined)),
        hasUnpersistedElementUpdates: vi.fn(() => false),
      },
      onSettled,
    });
    const diff: CanvasRestoreDiff = {
      hasStructuralChanges: false,
      structurallyChangedElementIds: [],
      elementPatchIntents: [
        {
          elementId: 'task-1',
          patch: {
            title: 'Updated task',
            status: ElementStatus.InProgress,
          },
        },
      ],
      habitMutationIntents: [],
    };

    coordinator.replay(diff);

    expect(canvasPersistenceState.hasRestoredReplayPending()).toBe(true);
    expect(canvasPersistenceState.hasRestoredReplayFailed()).toBe(false);
    expect(onSettled).not.toHaveBeenCalled();

    coordinator.handleElementAutosaveStatus(
      {
        canvasId: 'canvas-1',
        status: 'saved',
      },
      'canvas-1'
    );

    expect(canvasPersistenceState.hasRestoredReplayPending()).toBe(false);
    expect(canvasPersistenceState.hasRestoredReplayFailed()).toBe(false);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('does not get stuck pending when replay intents target missing scene elements', () => {
    const coordinator = new CanvasRestoreReplayCoordinator({
      scene: new Scene(),
      canvasDataService: {
        queueElementUpdate: vi.fn(),
        setHabitCompletionToday: vi.fn(() => of(undefined)),
        updateHabitLifecycleStatus: vi.fn(() => of(undefined)),
        hasUnpersistedElementUpdates: vi.fn(() => false),
      },
      onSettled: vi.fn(),
    });
    const diff: CanvasRestoreDiff = {
      hasStructuralChanges: false,
      structurallyChangedElementIds: [],
      elementPatchIntents: [
        {
          elementId: 'missing-task',
          patch: { title: 'Missing' },
        },
      ],
      habitMutationIntents: [
        {
          elementId: 'missing-habit',
          action: 'archive',
        },
      ],
    };

    coordinator.replay(diff);

    expect(canvasPersistenceState.hasRestoredReplayPending()).toBe(false);
    expect(canvasPersistenceState.hasRestoredReplayFailed()).toBe(false);
  });

  it('marks replay as failed and allows retry for failed habit restore persistence', () => {
    const scene = new Scene();
    scene.addElement(createHabit());
    const setHabitCompletionToday = vi.fn(() =>
      throwError(() => new Error('habit-save-failed'))
    );
    const coordinator = new CanvasRestoreReplayCoordinator({
      scene,
      canvasDataService: {
        queueElementUpdate: vi.fn(),
        setHabitCompletionToday,
        updateHabitLifecycleStatus: vi.fn(() => of(undefined)),
        hasUnpersistedElementUpdates: vi.fn(() => false),
      },
      onSettled: vi.fn(),
    });
    const diff: CanvasRestoreDiff = {
      hasStructuralChanges: false,
      structurallyChangedElementIds: [],
      elementPatchIntents: [],
      habitMutationIntents: [
        {
          elementId: 'habit-1',
          action: 'set-completion-date',
          date: '2026-04-04',
          completed: true,
        },
      ],
    };

    coordinator.replay(diff);

    expect(canvasPersistenceState.hasRestoredReplayFailed()).toBe(true);
    expect(setHabitCompletionToday).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith(
      'Failed to persist restored routine changes',
      'error'
    );

    coordinator.retry();

    expect(setHabitCompletionToday).toHaveBeenCalledTimes(2);
  });
});
