import { firstValueFrom, forkJoin } from 'rxjs';
import type { BacklogApiService } from '../../../majom-wrapper/data-access/backlog-api-service.ts';
import type { FocusBoardApiService } from '../../../majom-wrapper/data-access/focus-board-api-service.ts';
import type { GoalsApiService } from '../../../majom-wrapper/data-access/goals-api-service.ts';
import type { HabitsApiService } from '../../../majom-wrapper/data-access/habits-api-service.ts';
import type { StoriesApiService } from '../../../majom-wrapper/data-access/stories-api-service.ts';
import type { TasksApiService } from '../../../majom-wrapper/data-access/tasks-api-service.ts';
import type {
  Goal,
  Habit,
  PlatformTask,
  Status,
  Story,
} from '../../../majom-wrapper/interfaces/index.ts';
import { normalizeUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import {
  FOCUS_BOARD_CYCLE_LENGTH_OPTIONS,
  type BacklogApiSnapshot,
  type FocusBoardGoalFilterOption,
  type FocusBoardApiDaySnapshot,
  type FocusBoardApiSnapshot,
  type FocusBoardCycleLength,
  type FocusBoardHabit,
  type FocusBoardSnapshot,
  type FocusBoardStoryFilterOption,
  type FocusBoardTask,
  type FocusBoardTaskSearchItem,
} from '../domain/types.ts';
import type { FocusBoardRepository } from './FocusBoardRepository.ts';

const HABIT_PALETTE = [
  '#60a5fa',
  '#34d399',
  '#f59e0b',
  '#fb7185',
  '#818cf8',
  '#22c55e',
  '#f97316',
  '#14b8a6',
] as const;

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return dateKeyFromDate(date);
}

function todayDateKey(): string {
  return dateKeyFromDate(new Date());
}

function isCycleLength(value: number | null | undefined): value is FocusBoardCycleLength {
  return FOCUS_BOARD_CYCLE_LENGTH_OPTIONS.includes(
    value as FocusBoardCycleLength
  );
}

function createTask(task: PlatformTask, isFocus: boolean): FocusBoardTask {
  return {
    id: task.uuid ?? String(task.id),
    text: task.title,
    completed: Boolean(task.is_completed),
    isFocus,
  };
}

function createTaskSearchItem(task: PlatformTask): FocusBoardTaskSearchItem {
  return {
    id: task.uuid ?? String(task.id),
    text: task.title,
    completed: Boolean(task.is_completed),
  };
}

function createGoalFilterOption(goal: Goal): FocusBoardGoalFilterOption {
  return {
    id: goal.id,
    title: goal.title,
  };
}

function createStoryFilterOption(story: Story): FocusBoardStoryFilterOption {
  return {
    id: story.id,
    title: story.title,
    goalId: story.goal_id ?? story.goal?.id ?? null,
  };
}

function createHabit(habit: Habit, index: number): FocusBoardHabit {
  const badge = habit.title.trim().charAt(0).toUpperCase() || '+';
  return {
    id: habit.uuid,
    text: habit.title,
    accent: HABIT_PALETTE[index % HABIT_PALETTE.length],
    badge,
    priority: normalizeUiPriority(habit.priority, 'low'),
  };
}

function hasCompletionForDate(habit: Habit, dateKey: string): boolean {
  return habit.completions.some(
    ([completionDate, completed]) => completionDate === dateKey && completed
  );
}

function createDefaultBoardApiSnapshot(): FocusBoardApiSnapshot {
  return {
    cycleStartDateKey: null,
    cycleLength: null,
    goal: '',
    days: [],
  };
}

function createDefaultBacklogApiSnapshot(): BacklogApiSnapshot {
  return {
    taskUuids: [],
  };
}

function normalizeBoardApiSnapshot(
  snapshot: FocusBoardApiSnapshot | null | undefined
): FocusBoardApiSnapshot {
  if (!snapshot) return createDefaultBoardApiSnapshot();
  return {
    cycleStartDateKey: snapshot.cycleStartDateKey ?? null,
    cycleLength: isCycleLength(snapshot.cycleLength) ? snapshot.cycleLength : null,
    goal: snapshot.goal ?? '',
    days: Array.isArray(snapshot.days) ? snapshot.days : [],
  };
}

function normalizeBacklogApiSnapshot(
  snapshot: BacklogApiSnapshot | null | undefined
): BacklogApiSnapshot {
  if (!snapshot) return createDefaultBacklogApiSnapshot();
  return {
    taskUuids: Array.isArray(snapshot.taskUuids) ? snapshot.taskUuids : [],
  };
}

function buildBoardSnapshotPayload(
  snapshot: FocusBoardSnapshot
): FocusBoardApiSnapshot {
  const days: FocusBoardApiDaySnapshot[] = [];

  for (let dayNumber = 1; dayNumber <= snapshot.cycleLength; dayNumber += 1) {
    const tasks = snapshot.days[dayNumber] ?? [];
    const focusTask = tasks.find((task) => task.isFocus) ?? null;
    const supportTaskUuids = tasks
      .filter((task) => !task.isFocus)
      .map((task) => task.id);

    days.push({
      dayNumber,
      goal: snapshot.dailyGoals[dayNumber] ?? '',
      focusTaskUuid: focusTask?.id ?? null,
      supportTaskUuids,
    });
  }

  return {
    cycleStartDateKey: snapshot.cycleStartDateKey,
    cycleLength: snapshot.cycleLength,
    goal: snapshot.goal,
    days,
  };
}

function buildBacklogSnapshotPayload(
  snapshot: FocusBoardSnapshot
): BacklogApiSnapshot {
  return {
    taskUuids: snapshot.backlog.map((task) => task.id),
  };
}

export class ApiFocusBoardRepository implements FocusBoardRepository {
  constructor(
    private readonly deps: {
      focusBoardApi: FocusBoardApiService;
      backlogApi: BacklogApiService;
      tasksApi: TasksApiService;
      goalsApi: GoalsApiService;
      storiesApi: StoriesApiService;
      habitsApi: HabitsApiService;
    }
  ) {}

  public async load(): Promise<FocusBoardSnapshot | null> {
    try {
      const [boardSnapshot, backlogSnapshot, habits] = await Promise.all([
        firstValueFrom(this.deps.focusBoardApi.loadSnapshot()),
        firstValueFrom(this.deps.backlogApi.loadSnapshot()),
        firstValueFrom(this.deps.habitsApi.getHabits()),
      ]);

      const board = normalizeBoardApiSnapshot(boardSnapshot);
      const backlog = normalizeBacklogApiSnapshot(backlogSnapshot);
      const hasActiveCycle =
        isCycleLength(board.cycleLength) && typeof board.cycleStartDateKey === 'string';
      const cycleLength = board.cycleLength ?? 3;
      const cycleStartDateKey = board.cycleStartDateKey ?? todayDateKey();
      const boardDays: FocusBoardApiDaySnapshot[] = board.days;
      const referencedTaskUuids = [...backlog.taskUuids];
      boardDays.forEach((day) => {
        if (day.focusTaskUuid) {
          referencedTaskUuids.push(day.focusTaskUuid);
        }
        referencedTaskUuids.push(...day.supportTaskUuids);
      });
      const uniqueTaskUuids = [...new Set(referencedTaskUuids)];
      const tasks =
        uniqueTaskUuids.length > 0
          ? await firstValueFrom(this.deps.tasksApi.fetchTasksByUuids(uniqueTaskUuids))
          : [];
      const taskByUuid = new Map<string, PlatformTask>();

      tasks.forEach((task) => {
        const key = task.uuid ?? String(task.id);
        taskByUuid.set(key, task);
      });

      const days: Record<number, FocusBoardTask[]> = {};
      const dailyGoals: Record<number, string> = {};
      const assignedTaskIds = new Set<string>();

      for (let dayNumber = 1; dayNumber <= cycleLength; dayNumber += 1) {
        days[dayNumber] = [];
      }

      board.days.forEach((day) => {
        if (day.dayNumber < 1 || day.dayNumber > cycleLength) return;
        dailyGoals[day.dayNumber] = day.goal ?? '';

        if (day.focusTaskUuid) {
          const focusTask = taskByUuid.get(day.focusTaskUuid);
          if (focusTask) {
            assignedTaskIds.add(day.focusTaskUuid);
            days[day.dayNumber] = days[day.dayNumber].concat(
              createTask(focusTask, true)
            );
          }
        }

        const supportTaskUuids = Array.isArray(day.supportTaskUuids)
          ? day.supportTaskUuids
          : [];
        supportTaskUuids.forEach((taskUuid) => {
          const task = taskByUuid.get(taskUuid);
          if (!task || assignedTaskIds.has(taskUuid)) return;
          assignedTaskIds.add(taskUuid);
          days[day.dayNumber] = days[day.dayNumber].concat(createTask(task, false));
        });
      });

      const backlogTasks = backlog.taskUuids
        .filter((taskUuid) => !assignedTaskIds.has(taskUuid))
        .map((taskUuid) => taskByUuid.get(taskUuid))
        .filter((task): task is PlatformTask => Boolean(task))
        .map((task) => createTask(task, false));

      const mappedHabits = habits.map((habit, index) => createHabit(habit, index));
      const habitChecks: Record<number, Record<string, boolean>> = {};

      for (let dayNumber = 1; dayNumber <= cycleLength; dayNumber += 1) {
        const dateKey = shiftDateKey(cycleStartDateKey, dayNumber - 1);
        const dayChecks: Record<string, boolean> = {};
        habits.forEach((habit) => {
          dayChecks[habit.uuid] = hasCompletionForDate(habit, dateKey);
        });
        habitChecks[dayNumber] = dayChecks;
      }

      return {
        title: 'Focus Board',
        hasActiveCycle,
        cycleStartDateKey,
        goal: board.goal,
        tempGoal: board.goal,
        cycleLength,
        tempCycleLength: cycleLength,
        cycleLengthOptions: FOCUS_BOARD_CYCLE_LENGTH_OPTIONS,
        habits: mappedHabits,
        habitChecks,
        dailyGoals,
        days,
        backlog: backlogTasks,
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
      };
    } catch (error) {
      console.warn('Focus board snapshot load failed.', error);
      return null;
    }
  }

  public async save(snapshot: FocusBoardSnapshot): Promise<void> {
    const boardPayload = buildBoardSnapshotPayload(snapshot);
    const backlogPayload = buildBacklogSnapshotPayload(snapshot);

    await firstValueFrom(
      forkJoin({
        board: this.deps.focusBoardApi.saveSnapshot(boardPayload),
        backlog: this.deps.backlogApi.saveSnapshot(backlogPayload),
      })
    );
  }

  public async searchTasks(params: {
    query: string;
    page: number;
    pageSize: number;
    status: Status | null;
    goalId: number | null;
    storyId: number | null;
  }): Promise<{
    items: FocusBoardTaskSearchItem[];
    nextPage: number | null;
    total: number;
  }> {
    const response = await firstValueFrom(
      this.deps.tasksApi.fetchTasks({
        search: params.query,
        page: params.page,
        pageSize: params.pageSize,
        ...(params.status ? { status: params.status } : {}),
        ...(params.goalId !== null ? { goal: params.goalId } : {}),
        ...(params.storyId !== null ? { story: params.storyId } : {}),
      })
    );

    return {
      items: response.results.map((task) => createTaskSearchItem(task)),
      nextPage: response.next ? params.page + 1 : null,
      total: response.count,
    };
  }

  public async searchGoals(params: {
    query: string;
    page: number;
    pageSize: number;
  }): Promise<{
    items: FocusBoardGoalFilterOption[];
    nextPage: number | null;
  }> {
    const response = await firstValueFrom(
      this.deps.goalsApi.searchGoalsForPicker({
        search: params.query,
        page: params.page,
        pageSize: params.pageSize,
      })
    );

    return {
      items: response.results.map((goal) => createGoalFilterOption(goal)),
      nextPage: response.next ? params.page + 1 : null,
    };
  }

  public async searchStories(params: {
    query: string;
    page: number;
    pageSize: number;
    goalId: number | null;
  }): Promise<{
    items: FocusBoardStoryFilterOption[];
    nextPage: number | null;
  }> {
    const response = await firstValueFrom(
      this.deps.storiesApi.fetchStories({
        search: params.query,
        page: params.page,
        pageSize: params.pageSize,
        ...(params.goalId !== null ? { goal: params.goalId } : {}),
      })
    );

    return {
      items: response.results.map((story) => createStoryFilterOption(story)),
      nextPage: response.next ? params.page + 1 : null,
    };
  }

  public async createTask(title: string): Promise<FocusBoardTask> {
    const task = await firstValueFrom(
      this.deps.tasksApi.createTask({
        title,
        description: '',
        is_standalone: true,
      })
    );

    return createTask(task, false);
  }

  public async setTaskCompleted(
    taskId: string,
    completed: boolean
  ): Promise<void> {
    await firstValueFrom(
      this.deps.tasksApi.patchTask(taskId, { is_completed: completed })
    );
  }

  public async toggleHabitCompletion(
    habitId: string,
    date: Date
  ): Promise<void> {
    await firstValueFrom(this.deps.habitsApi.toggleHabitCompletion(habitId, date));
  }
}
