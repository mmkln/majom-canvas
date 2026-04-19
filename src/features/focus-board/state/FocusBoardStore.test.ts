import { describe, expect, it, vi } from 'vitest';
import {
  FocusBoardStore,
  createInitialFocusBoardSnapshot,
} from './FocusBoardStore.ts';
import type { FocusBoardSnapshot } from '../domain/types.ts';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type { FocusBoardRepository } from '../data/FocusBoardRepository.ts';

function createSnapshot(
  overrides: Partial<FocusBoardSnapshot> = {}
): FocusBoardSnapshot {
  return {
    ...createInitialFocusBoardSnapshot(),
    hasActiveCycle: true,
    habits: [
      {
        id: 'habit-1',
        text: 'Water',
        accent: '#60a5fa',
        badge: 'W',
        priority: 'low',
      },
      {
        id: 'habit-2',
        text: 'Walk',
        accent: '#34d399',
        badge: 'K',
        priority: 'medium',
      },
    ],
    habitChecks: {
      1: {
        'habit-1': true,
      },
      2: {
        'habit-1': true,
      },
    },
    days: {
      1: [
        {
          id: 'task-101',
          text: 'Focus task',
          completed: false,
          isFocus: true,
        },
        {
          id: 'task-102',
          text: 'Support task',
          completed: false,
          isFocus: false,
        },
      ],
      2: [
        {
          id: 'task-201',
          text: 'Day two focus',
          completed: false,
          isFocus: true,
        },
      ],
      3: [
        {
          id: 'task-301',
          text: 'Day three focus',
          completed: false,
          isFocus: true,
        },
      ],
    },
    backlog: [
      {
        id: 'backlog-1',
        text: 'Backlog task',
        completed: false,
        isFocus: false,
      },
    ],
    ...overrides,
  };
}

describe('FocusBoardStore', () => {
  it('promotes the first remaining task to focus when the focus task leaves a day', () => {
    const store = new FocusBoardStore(createSnapshot());

    store.moveTask(1, 'backlog', 'task-101');

    const snapshot = store.getSnapshot();
    expect(snapshot.days[1]?.[0]?.id).toBe('task-102');
    expect(snapshot.days[1]?.[0]?.isFocus).toBe(true);
    expect(snapshot.backlog.some((task) => task.id === 'task-101')).toBe(true);
    expect(
      snapshot.backlog.find((task) => task.id === 'task-101')?.isFocus
    ).toBe(false);
  });

  it('makes the first task on an empty day the focus task', async () => {
    const store = new FocusBoardStore(createSnapshot());

    store.addTask(4, 'Перший task для нового дня.');
    await Promise.resolve();
    await Promise.resolve();

    const snapshot = store.getSnapshot();
    expect(snapshot.days[4]).toHaveLength(1);
    expect(snapshot.days[4]?.[0]?.isFocus).toBe(true);
  });

  it('moves truncated-day tasks into backlog when the cycle is shortened', () => {
    const store = new FocusBoardStore(createSnapshot());

    store.openGoalModal();
    store.setGoalModalDraft('Стислий цикл.', 2);
    store.saveGoalAndCycle('Стислий цикл.');

    const snapshot = store.getSnapshot();
    expect(snapshot.cycleLength).toBe(2);
    expect(snapshot.days[3]).toBeUndefined();
    expect(snapshot.backlog.some((task) => task.id === 'task-301')).toBe(true);
  });

  it('removes habit checks for a deleted habit across all days', () => {
    const store = new FocusBoardStore(createSnapshot());

    store.removeHabit('habit-1');

    const snapshot = store.getSnapshot();
    expect(snapshot.habits.some((habit) => habit.id === 'habit-1')).toBe(false);
    expect(snapshot.habitChecks[1]?.['habit-1']).toBeUndefined();
    expect(snapshot.habitChecks[2]?.['habit-1']).toBeUndefined();
  });

  it('resets the selected story when the task-picker goal changes', async () => {
    const repository: FocusBoardRepository = {
      load: () => null,
      save: () => undefined,
      searchTasks: vi.fn(() => ({ items: [], nextPage: null, total: 0 })),
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const store = new FocusBoardStore(createSnapshot(), repository);

    store.openTaskPicker();
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerGoal({ id: 11, title: 'Goal A' });
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerStory({ id: 21, title: 'Story A', goalId: 11 });
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerGoal({ id: 12, title: 'Goal B' });
    await Promise.resolve();
    await Promise.resolve();

    const snapshot = store.getSnapshot();
    expect(snapshot.taskPicker.goal).toEqual({ id: 12, title: 'Goal B' });
    expect(snapshot.taskPicker.story).toBeNull();
  });

  it('passes task-picker filters into repository task search', async () => {
    const searchTasks = vi.fn(() => ({
      items: [],
      nextPage: null,
      total: 0,
    }));
    const repository: FocusBoardRepository = {
      load: () => null,
      save: () => undefined,
      searchTasks,
      searchGoals: () => ({ items: [], nextPage: null }),
      searchStories: () => ({ items: [], nextPage: null }),
      createTask: (title) => ({
        id: `task-${title}`,
        text: title,
        completed: false,
        isFocus: false,
      }),
      setTaskCompleted: () => undefined,
      toggleHabitCompletion: () => undefined,
    };
    const store = new FocusBoardStore(createSnapshot(), repository);

    store.openTaskPicker();
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerStatus(Status.Completed);
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerGoal({ id: 31, title: 'Goal C' });
    await Promise.resolve();
    await Promise.resolve();

    store.setTaskPickerStory({ id: 41, title: 'Story C', goalId: 31 });
    await Promise.resolve();
    await Promise.resolve();

    expect(searchTasks).toHaveBeenLastCalledWith({
      query: '',
      page: 1,
      pageSize: 20,
      status: Status.Completed,
      goalId: 31,
      storyId: 41,
    });
  });
});
