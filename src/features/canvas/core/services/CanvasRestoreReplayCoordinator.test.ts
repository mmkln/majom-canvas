import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { Scene } from '../scene/Scene.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { CanvasPersistenceState } from './CanvasPersistenceState.ts';
import { CanvasRestoreReplayCoordinator } from './CanvasRestoreReplayCoordinator.ts';
import type { CanvasRestoreDiff } from '../../drafts/CanvasRestoreDiff.ts';

const { notifyMock } = vi.hoisted(() => ({
  notifyMock: vi.fn(),
}));

vi.mock('./NotificationService.ts', () => ({
  notify: notifyMock,
}));

function createTask(id = 'task-1', uuid = 'task-uuid-1'): TaskElement {
  return new TaskElement({
    id,
    uuid,
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
  let persistenceState: CanvasPersistenceState;

  beforeEach(() => {
    vi.clearAllMocks();
    persistenceState = new CanvasPersistenceState();
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
      persistenceState,
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

    expect(persistenceState.hasRestoredReplayPending()).toBe(true);
    expect(persistenceState.hasRestoredReplayFailed()).toBe(false);
    expect(onSettled).not.toHaveBeenCalled();

    coordinator.handleElementAutosaveStatus(
      {
        canvasId: 'canvas-1',
        status: 'saved',
      },
      'canvas-1'
    );

    expect(persistenceState.hasRestoredReplayPending()).toBe(false);
    expect(persistenceState.hasRestoredReplayFailed()).toBe(false);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('does not settle replay until all replayed element keys report saved', () => {
    const scene = new Scene();
    scene.addElement(createTask('task-1', 'task-uuid-1'));
    scene.addElement(createTask('task-2', 'task-uuid-2'));
    const onSettled = vi.fn();
    const coordinator = new CanvasRestoreReplayCoordinator({
      scene,
      canvasDataService: {
        queueElementUpdate: vi
          .fn()
          .mockReturnValueOnce('task:task-1')
          .mockReturnValueOnce('task:task-2'),
        setHabitCompletionToday: vi.fn(() => of(undefined)),
        updateHabitLifecycleStatus: vi.fn(() => of(undefined)),
        hasUnpersistedElementUpdates: vi.fn(() => false),
      },
      persistenceState,
      onSettled,
    });
    const diff: CanvasRestoreDiff = {
      hasStructuralChanges: false,
      structurallyChangedElementIds: [],
      elementPatchIntents: [
        { elementId: 'task-1', patch: { title: 'Updated task 1' } },
        { elementId: 'task-2', patch: { title: 'Updated task 2' } },
      ],
      habitMutationIntents: [],
    };

    coordinator.replay(diff);
    coordinator.handleElementAutosaveStatus(
      {
        canvasId: 'canvas-1',
        status: 'saved',
        key: 'task:task-1',
      },
      'canvas-1'
    );

    expect(persistenceState.hasRestoredReplayPending()).toBe(true);
    expect(onSettled).not.toHaveBeenCalled();

    coordinator.handleElementAutosaveStatus(
      {
        canvasId: 'canvas-1',
        status: 'saved',
        key: 'task:task-2',
      },
      'canvas-1'
    );

    expect(persistenceState.hasRestoredReplayPending()).toBe(false);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it('ignores autosave status events for non-replay element keys', () => {
    const scene = new Scene();
    scene.addElement(createTask('task-1', 'task-uuid-1'));
    const onSettled = vi.fn();
    const coordinator = new CanvasRestoreReplayCoordinator({
      scene,
      canvasDataService: {
        queueElementUpdate: vi.fn().mockReturnValue('task:task-1'),
        setHabitCompletionToday: vi.fn(() => of(undefined)),
        updateHabitLifecycleStatus: vi.fn(() => of(undefined)),
        hasUnpersistedElementUpdates: vi.fn(() => false),
      },
      persistenceState,
      onSettled,
    });
    const diff: CanvasRestoreDiff = {
      hasStructuralChanges: false,
      structurallyChangedElementIds: [],
      elementPatchIntents: [
        { elementId: 'task-1', patch: { title: 'Updated task 1' } },
      ],
      habitMutationIntents: [],
    };

    coordinator.replay(diff);
    coordinator.handleElementAutosaveStatus(
      {
        canvasId: 'canvas-1',
        status: 'saved',
        key: 'task:other-task',
      },
      'canvas-1'
    );

    expect(persistenceState.hasRestoredReplayPending()).toBe(true);
    expect(onSettled).not.toHaveBeenCalled();
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
      persistenceState,
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

    expect(persistenceState.hasRestoredReplayPending()).toBe(false);
    expect(persistenceState.hasRestoredReplayFailed()).toBe(false);
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
      persistenceState,
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

    expect(persistenceState.hasRestoredReplayFailed()).toBe(true);
    expect(setHabitCompletionToday).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith(
      'Failed to persist restored routine changes',
      'error'
    );

    coordinator.retry();

    expect(setHabitCompletionToday).toHaveBeenCalledTimes(2);
  });
});
