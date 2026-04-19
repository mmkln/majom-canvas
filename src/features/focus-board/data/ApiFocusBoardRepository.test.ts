import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import type { BacklogApiService } from '../../../majom-wrapper/data-access/backlog-api-service.ts';
import type { FocusBoardApiService } from '../../../majom-wrapper/data-access/focus-board-api-service.ts';
import type { GoalsApiService } from '../../../majom-wrapper/data-access/goals-api-service.ts';
import type { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import type { StoriesApiService } from '../../../majom-wrapper/data-access/stories-api-service.ts';
import type { TasksApiService } from '../../../majom-wrapper/data-access/tasks-api-service.ts';
import type {
  Habit,
  PlatformTask,
} from '../../../majom-wrapper/interfaces/index.ts';
import { ApiFocusBoardRepository } from './ApiFocusBoardRepository.ts';

describe('ApiFocusBoardRepository', () => {
  it('maps backend snapshots into focus-board view state', async () => {
    const focusBoardApi = {
      loadSnapshot: vi.fn(() =>
        of({
          cycleStartDateKey: '2026-04-20',
          cycleLength: 3,
          goal: 'Ship the flow',
          days: [
            {
              dayNumber: 1,
              goal: 'Lock scope',
              focusTaskUuid: 'task-1',
              supportTaskUuids: ['task-2'],
            },
          ],
        })
      ),
      saveSnapshot: vi.fn(() => of(undefined)),
      clearSnapshot: vi.fn(() => of(undefined)),
    } as unknown as FocusBoardApiService;

    const backlogApi = {
      loadSnapshot: vi.fn(() =>
        of({
          taskUuids: ['task-3'],
        })
      ),
      saveSnapshot: vi.fn(() => of(undefined)),
      clearSnapshot: vi.fn(() => of(undefined)),
    } as unknown as BacklogApiService;

    const tasksApi = {
      fetchTasksByUuids: vi.fn(() =>
        of([
          {
            id: 1,
            uuid: 'task-1',
            title: 'Focus task',
            description: '',
            created_at: new Date(),
            start_date: null,
            due_date: null,
            resolved_date: null,
            estimate: 0,
            subtasks: [],
            priority: 'low',
            status: 'todo',
            tags: [],
            challenge: null,
            goal: null,
            strategy: null,
            is_completed: false,
            is_standalone: true,
            relations: [],
            flows: [],
            story: null,
          },
          {
            id: 2,
            uuid: 'task-2',
            title: 'Support task',
            description: '',
            created_at: new Date(),
            start_date: null,
            due_date: null,
            resolved_date: null,
            estimate: 0,
            subtasks: [],
            priority: 'low',
            status: 'todo',
            tags: [],
            challenge: null,
            goal: null,
            strategy: null,
            is_completed: true,
            is_standalone: true,
            relations: [],
            flows: [],
            story: null,
          },
          {
            id: 3,
            uuid: 'task-3',
            title: 'Backlog task',
            description: '',
            created_at: new Date(),
            start_date: null,
            due_date: null,
            resolved_date: null,
            estimate: 0,
            subtasks: [],
            priority: 'low',
            status: 'todo',
            tags: [],
            challenge: null,
            goal: null,
            strategy: null,
            is_completed: false,
            is_standalone: true,
            relations: [],
            flows: [],
            story: null,
          },
        ] as PlatformTask[])
      ),
      patchTask: vi.fn(() => of(undefined)),
    } as unknown as TasksApiService;

    const habitsApi = {
      getHabits: vi.fn(() =>
        of([
          {
            id: 'habit-1',
            uuid: 'habit-1',
            title: 'Water',
            description: '',
            created_at: new Date(),
            priority: 'low',
            status: 'active',
            last_checked: new Date(),
            meta: null,
            is_due_today: false,
            weekly_completions: [],
            completions: [['2026-04-20', true]],
          },
        ] as Habit[])
      ),
      toggleHabitCompletion: vi.fn(() => of(undefined)),
    } as unknown as HabitsApiService;

    const repository = new ApiFocusBoardRepository({
      focusBoardApi,
      backlogApi,
      tasksApi,
      goalsApi: {
        searchGoalsForPicker: vi.fn(() => of({ count: 0, next: null, previous: null, results: [] })),
      } as unknown as GoalsApiService,
      storiesApi: {
        fetchStories: vi.fn(() => of({ count: 0, next: null, previous: null, results: [] })),
      } as unknown as StoriesApiService,
      habitsApi,
    });

    const snapshot = await repository.load();

    expect(snapshot?.goal).toBe('Ship the flow');
    expect(snapshot?.days[1]?.[0]).toMatchObject({
      id: 'task-1',
      text: 'Focus task',
      isFocus: true,
    });
    expect(snapshot?.days[1]?.[1]).toMatchObject({
      id: 'task-2',
      completed: true,
      isFocus: false,
    });
    expect(snapshot?.backlog[0]?.id).toBe('task-3');
    expect(snapshot?.habitChecks[1]?.['habit-1']).toBe(true);
    expect(snapshot?.habits[0]?.priority).toBe('low');
  });

  it('returns null when backend load fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const repository = new ApiFocusBoardRepository({
      focusBoardApi: {
        loadSnapshot: vi.fn(() =>
          throwError(() => new Error('backend unavailable'))
        ),
        saveSnapshot: vi.fn(() => of(undefined)),
        clearSnapshot: vi.fn(() => of(undefined)),
      } as unknown as FocusBoardApiService,
      backlogApi: {
        loadSnapshot: vi.fn(() => of({ taskUuids: [] })),
        saveSnapshot: vi.fn(() => of(undefined)),
        clearSnapshot: vi.fn(() => of(undefined)),
      } as unknown as BacklogApiService,
      tasksApi: {
        fetchTasksByUuids: vi.fn(() => of([])),
        patchTask: vi.fn(() => of(undefined)),
      } as unknown as TasksApiService,
      goalsApi: {
        searchGoalsForPicker: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as GoalsApiService,
      storiesApi: {
        fetchStories: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as StoriesApiService,
      habitsApi: {
        getHabits: vi.fn(() => of([])),
        toggleHabitCompletion: vi.fn(() => of(undefined)),
      } as unknown as HabitsApiService,
    });

    try {
      await expect(repository.load()).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('saves both focus-board and backlog snapshots', async () => {
    const focusBoardLoadSnapshot = vi.fn(() => of(undefined));
    const focusBoardSaveSnapshot = vi.fn(() => of(undefined));
    const focusBoardClearSnapshot = vi.fn(() => of(undefined));
    const focusBoardApi = {
      loadSnapshot: focusBoardLoadSnapshot,
      saveSnapshot: focusBoardSaveSnapshot,
      clearSnapshot: focusBoardClearSnapshot,
    } as unknown as FocusBoardApiService;
    const backlogLoadSnapshot = vi.fn(() => of(undefined));
    const backlogSaveSnapshot = vi.fn(() => of(undefined));
    const backlogClearSnapshot = vi.fn(() => of(undefined));
    const backlogApi = {
      loadSnapshot: backlogLoadSnapshot,
      saveSnapshot: backlogSaveSnapshot,
      clearSnapshot: backlogClearSnapshot,
    } as unknown as BacklogApiService;

    const repository = new ApiFocusBoardRepository({
      focusBoardApi,
      backlogApi,
      tasksApi: {
        fetchTasksByUuids: vi.fn(() => of([])),
        patchTask: vi.fn(() => of(undefined)),
      } as unknown as TasksApiService,
      goalsApi: {
        searchGoalsForPicker: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as GoalsApiService,
      storiesApi: {
        fetchStories: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as StoriesApiService,
      habitsApi: {
        getHabits: vi.fn(() => of([])),
        toggleHabitCompletion: vi.fn(() => of(undefined)),
      } as unknown as HabitsApiService,
    });

    await repository.save({
      title: 'Focus Board',
      hasActiveCycle: true,
      cycleStartDateKey: '2026-04-20',
      goal: 'Ship',
      tempGoal: 'Ship',
      cycleLength: 3,
      tempCycleLength: 3,
      cycleLengthOptions: [3, 4, 5, 6, 7],
      habits: [],
      habitChecks: {},
      dailyGoals: {
        1: 'One',
      },
      days: {
        1: [
          {
            id: 'task-1',
            text: 'Focus',
            completed: false,
            isFocus: true,
          },
        ],
      },
      backlog: [
        {
          id: 'task-2',
          text: 'Backlog',
          completed: false,
          isFocus: false,
        },
      ],
      backlogSearchQuery: '',
      backlogOpen: false,
      goalModalOpen: false,
      habitManagerOpen: false,
      activeHabitDay: null,
      taskPicker: {
        open: false,
        query: '',
        items: [],
        loading: false,
        error: null,
        nextPage: 1,
        total: 0,
        status: null,
        goal: null,
        story: null,
      },
      taskComposer: {
        open: false,
        target: null,
        title: '',
        saving: false,
        error: null,
      },
    });

    expect(focusBoardSaveSnapshot).toHaveBeenCalledWith({
      cycleStartDateKey: '2026-04-20',
      cycleLength: 3,
      goal: 'Ship',
      days: [
        {
          dayNumber: 1,
          goal: 'One',
          focusTaskUuid: 'task-1',
          supportTaskUuids: [],
        },
        {
          dayNumber: 2,
          goal: '',
          focusTaskUuid: null,
          supportTaskUuids: [],
        },
        {
          dayNumber: 3,
          goal: '',
          focusTaskUuid: null,
          supportTaskUuids: [],
        },
      ],
    });
    expect(backlogSaveSnapshot).toHaveBeenCalledWith({
      taskUuids: ['task-2'],
    });
  });

  it('passes task filters into the task search endpoint', async () => {
    const fetchTasks = vi.fn(() =>
      of({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 5,
            uuid: 'task-5',
            title: 'Filtered task',
            description: '',
            created_at: new Date(),
            start_date: null,
            due_date: null,
            resolved_date: null,
            estimate: 0,
            subtasks: [],
            priority: 'low',
            status: 'completed',
            tags: [],
            challenge: null,
            goal: null,
            strategy: null,
            is_completed: true,
            is_standalone: true,
            relations: [],
            flows: [],
            story: null,
          },
        ],
      })
    );
    const repository = new ApiFocusBoardRepository({
      focusBoardApi: {
        loadSnapshot: vi.fn(() => of(undefined)),
        saveSnapshot: vi.fn(() => of(undefined)),
        clearSnapshot: vi.fn(() => of(undefined)),
      } as unknown as FocusBoardApiService,
      backlogApi: {
        loadSnapshot: vi.fn(() => of(undefined)),
        saveSnapshot: vi.fn(() => of(undefined)),
        clearSnapshot: vi.fn(() => of(undefined)),
      } as unknown as BacklogApiService,
      tasksApi: {
        fetchTasks,
        fetchTasksByUuids: vi.fn(() => of([])),
        patchTask: vi.fn(() => of(undefined)),
      } as unknown as TasksApiService,
      goalsApi: {
        searchGoalsForPicker: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as GoalsApiService,
      storiesApi: {
        fetchStories: vi.fn(() =>
          of({ count: 0, next: null, previous: null, results: [] })
        ),
      } as unknown as StoriesApiService,
      habitsApi: {
        getHabits: vi.fn(() => of([])),
        toggleHabitCompletion: vi.fn(() => of(undefined)),
      } as unknown as HabitsApiService,
    });

    const result = await repository.searchTasks({
      query: 'focus',
      page: 2,
      pageSize: 15,
      status: 'completed',
      goalId: 11,
      storyId: 22,
    });

    expect(fetchTasks).toHaveBeenCalledWith({
      search: 'focus',
      page: 2,
      pageSize: 15,
      status: 'completed',
      goal: 11,
      story: 22,
    });
    expect(result.items[0]).toEqual({
      id: 'task-5',
      text: 'Filtered task',
      completed: true,
    });
  });
});
