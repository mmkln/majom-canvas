import { BehaviorSubject } from 'rxjs';
import {
  FOCUS_BOARD_CYCLE_LENGTH_OPTIONS,
  type FocusBoardCycleLength,
  type FocusBoardGoalFilterOption,
  type FocusBoardSnapshot,
  type FocusBoardStoryFilterOption,
  type FocusBoardTask,
  type FocusBoardTaskSearchItem,
  type FocusBoardTaskContainerId,
} from '../domain/types.ts';
import type { Status } from '../../../majom-wrapper/interfaces/index.ts';
import type {
  FocusBoardRepository,
  FocusBoardRepositoryResult,
} from '../data/FocusBoardRepository.ts';

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

function createTask(
  id: string,
  text: string,
  options: Partial<Pick<FocusBoardTask, 'completed' | 'isFocus'>> = {}
): FocusBoardTask {
  return {
    id,
    text,
    completed: options.completed ?? false,
    isFocus: options.isFocus ?? false,
  };
}

function cloneTask(task: FocusBoardTask): FocusBoardTask {
  return { ...task };
}

function cloneTaskList(tasks: FocusBoardTask[] = []): FocusBoardTask[] {
  return tasks.map(cloneTask);
}

function cloneDays(
  days: Record<number, FocusBoardTask[]>
): Record<number, FocusBoardTask[]> {
  const nextDays: Record<number, FocusBoardTask[]> = {};
  Object.entries(days).forEach(([day, tasks]) => {
    nextDays[Number(day)] = cloneTaskList(tasks);
  });
  return nextDays;
}

function normalizeFocus(tasks: FocusBoardTask[]): FocusBoardTask[] {
  if (tasks.length === 0) return [];

  const focusIndex = tasks.findIndex((task) => task.isFocus);
  return tasks.map((task, index) => ({
    ...task,
    isFocus: focusIndex === -1 ? index === 0 : index === focusIndex,
  }));
}

function filterDayRecord<T>(
  record: Record<number, T>,
  cycleLength: FocusBoardCycleLength
): Record<number, T> {
  const nextRecord: Record<number, T> = {};
  Object.entries(record).forEach(([key, value]) => {
    const day = Number(key);
    if (day <= cycleLength) {
      nextRecord[day] = value;
    }
  });
  return nextRecord;
}

function todayDateKey(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromDateKey(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, 12);
}

function shiftDateKey(dateKey: string, days: number): string {
  const date = dateFromDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

function getAssignedTaskIds(snapshot: FocusBoardSnapshot): Set<string> {
  const ids = new Set<string>();
  snapshot.backlog.forEach((task) => ids.add(task.id));
  Object.values(snapshot.days).forEach((tasks) => {
    tasks.forEach((task) => ids.add(task.id));
  });
  return ids;
}

function mergeSearchItems(
  current: FocusBoardTaskSearchItem[],
  incoming: FocusBoardTaskSearchItem[]
): FocusBoardTaskSearchItem[] {
  const byId = new Map<string, FocusBoardTaskSearchItem>();
  current.forEach((item) => byId.set(item.id, item));
  incoming.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

function createTaskListWithInsertedTask(
  tasks: FocusBoardTask[],
  task: FocusBoardTask
): FocusBoardTask[] {
  return normalizeFocus(
    cloneTaskList(tasks).concat({
      ...task,
      isFocus: tasks.length === 0,
    })
  );
}

function createNoopRepository(): FocusBoardRepository {
  return {
    load: () => null,
    save: () => undefined,
    searchTasks: () => ({ items: [], nextPage: null, total: 0 }),
    searchGoals: () => ({ items: [], nextPage: null }),
    searchStories: () => ({ items: [], nextPage: null }),
    createTask: (title) => createTask(`noop-${title}`, title),
    setTaskCompleted: () => undefined,
    toggleHabitCompletion: () => undefined,
  };
}

export function createInitialFocusBoardSnapshot(): FocusBoardSnapshot {
  return {
    title: 'Focus Board',
    hasActiveCycle: false,
    cycleStartDateKey: todayDateKey(),
    goal: '',
    tempGoal: '',
    cycleLength: 3,
    tempCycleLength: 3,
    cycleLengthOptions: FOCUS_BOARD_CYCLE_LENGTH_OPTIONS,
    habits: [],
    habitChecks: {},
    dailyGoals: {},
    days: {},
    backlog: [],
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
}

export class FocusBoardStore {
  private readonly stateSubject: BehaviorSubject<FocusBoardSnapshot>;
  private hasLocalChanges = false;
  private nextHabitId = 100;
  private writeQueue = Promise.resolve();
  private taskPickerRequestId = 0;
  private static readonly TASK_PICKER_PAGE_SIZE = 20;

  public readonly state$;

  constructor(
    initialState: FocusBoardSnapshot = createInitialFocusBoardSnapshot(),
    private readonly repository: FocusBoardRepository = createNoopRepository()
  ) {
    this.stateSubject = new BehaviorSubject(initialState);
    this.state$ = this.stateSubject.asObservable();
    void this.hydrateFromRepository();
  }

  public getSnapshot(): FocusBoardSnapshot {
    return this.stateSubject.getValue();
  }

  public destroy(): void {
    this.stateSubject.complete();
  }

  private async hydrateFromRepository(): Promise<void> {
    try {
      const snapshot = await this.resolveRepositoryResult(
        this.repository.load()
      );
      if (!snapshot || this.hasLocalChanges) return;
      const current = this.getSnapshot();
      this.stateSubject.next({
        ...snapshot,
        tempGoal: current.goalModalOpen ? current.tempGoal : snapshot.tempGoal,
        tempCycleLength: current.goalModalOpen
          ? current.tempCycleLength
          : snapshot.tempCycleLength,
        backlogSearchQuery: current.backlogSearchQuery,
        backlogOpen: current.backlogOpen,
        goalModalOpen: current.goalModalOpen,
        habitManagerOpen: current.habitManagerOpen,
        activeHabitDay: current.activeHabitDay,
        taskPicker: current.taskPicker.open
          ? current.taskPicker
          : snapshot.taskPicker,
        taskComposer: current.taskComposer.open
          ? current.taskComposer
          : snapshot.taskComposer,
      });
    } catch (error) {
      console.warn('Failed to hydrate focus board snapshot.', error);
    }
  }

  private enqueueSave(snapshot: FocusBoardSnapshot): void {
    this.hasLocalChanges = true;
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          await this.resolveRepositoryResult(this.repository.save(snapshot));
        } catch (error) {
          console.warn('Failed to persist focus board snapshot.', error);
        }
      });
  }

  private enqueueTaskCompletion(taskId: string, completed: boolean): void {
    this.hasLocalChanges = true;
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          await this.resolveRepositoryResult(
            this.repository.setTaskCompleted(taskId, completed)
          );
        } catch (error) {
          console.warn(
            'Failed to update task completion from focus board.',
            error
          );
        }
      });
  }

  private enqueueHabitToggle(habitId: string, date: Date): void {
    this.hasLocalChanges = true;
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          await this.resolveRepositoryResult(
            this.repository.toggleHabitCompletion(habitId, date)
          );
        } catch (error) {
          console.warn(
            'Failed to toggle habit completion from focus board.',
            error
          );
        }
      });
  }

  private resolveRepositoryResult<T>(
    value: FocusBoardRepositoryResult<T>
  ): Promise<T> {
    if (value instanceof Promise) return value;
    return Promise.resolve(value);
  }

  public toggleBacklog(): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      backlogOpen: !current.backlogOpen,
    });
  }

  public closeBacklog(): void {
    const current = this.getSnapshot();
    if (!current.backlogOpen) return;
    this.stateSubject.next({
      ...current,
      backlogOpen: false,
    });
  }

  public setBacklogSearchQuery(query: string): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      backlogSearchQuery: query,
    });
  }

  public openGoalModal(): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      goalModalOpen: true,
      tempGoal: current.goal,
      tempCycleLength: current.cycleLength,
    });
  }

  public closeGoalModal(): void {
    const current = this.getSnapshot();
    if (!current.goalModalOpen) return;
    this.stateSubject.next({
      ...current,
      goalModalOpen: false,
      tempGoal: current.goal,
      tempCycleLength: current.cycleLength,
    });
  }

  public setGoalModalDraft(
    goal: string,
    cycleLength: FocusBoardCycleLength
  ): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      tempGoal: goal,
      tempCycleLength: cycleLength,
    });
  }

  public saveGoalAndCycle(goal: string): void {
    const current = this.getSnapshot();
    const nextCycleLength = current.tempCycleLength;
    const nextGoal = goal.trim();
    const days = cloneDays(current.days);
    let backlog = cloneTaskList(current.backlog);

    Object.entries(days).forEach(([dayKey, tasks]) => {
      const day = Number(dayKey);
      if (day <= nextCycleLength) return;
      backlog = backlog.concat(
        tasks.map((task) => ({
          ...task,
          isFocus: false,
        }))
      );
      delete days[day];
    });

    const nextSnapshot = {
      ...current,
      hasActiveCycle: true,
      goal: nextGoal,
      tempGoal: nextGoal,
      cycleLength: nextCycleLength,
      days: filterDayRecord(days, nextCycleLength),
      dailyGoals: filterDayRecord(current.dailyGoals, nextCycleLength),
      habitChecks: filterDayRecord(current.habitChecks, nextCycleLength),
      backlog,
      goalModalOpen: false,
    };
    this.stateSubject.next(nextSnapshot);
    this.enqueueSave(nextSnapshot);
  }

  public updateCycleGoal(goal: string): void {
    const current = this.getSnapshot();
    const nextGoal = goal.trim();
    if (current.goal === nextGoal) return;
    if (!current.hasActiveCycle && nextGoal.length === 0) return;

    const nextSnapshot = {
      ...current,
      hasActiveCycle: true,
      goal: nextGoal,
      tempGoal: current.goalModalOpen ? current.tempGoal : nextGoal,
    };
    this.stateSubject.next(nextSnapshot);
    this.enqueueSave(nextSnapshot);
  }

  public openHabitManager(): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      habitManagerOpen: true,
    });
  }

  public closeHabitManager(): void {
    const current = this.getSnapshot();
    if (!current.habitManagerOpen) return;
    this.stateSubject.next({
      ...current,
      habitManagerOpen: false,
    });
  }

  public openHabitDay(dayIndex: number): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      activeHabitDay: dayIndex,
    });
  }

  public closeHabitDay(): void {
    const current = this.getSnapshot();
    if (current.activeHabitDay === null) return;
    this.stateSubject.next({
      ...current,
      activeHabitDay: null,
    });
  }

  public updateDailyGoal(dayIndex: number, goal: string): void {
    const current = this.getSnapshot();
    const nextSnapshot = {
      ...current,
      dailyGoals: {
        ...current.dailyGoals,
        [dayIndex]: goal,
      },
    };
    this.stateSubject.next(nextSnapshot);
    this.enqueueSave(nextSnapshot);
  }

  public addTask(dayIndex: number, text: string): void {
    void this.createTaskInTarget(text, dayIndex);
  }

  public openTaskComposer(target: FocusBoardTaskContainerId): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      taskComposer: {
        open: true,
        target,
        title: '',
        saving: false,
        error: null,
      },
    });
  }

  public closeTaskComposer(): void {
    const current = this.getSnapshot();
    if (!current.taskComposer.open) return;
    this.stateSubject.next({
      ...current,
      taskComposer: {
        open: false,
        target: null,
        title: '',
        saving: false,
        error: null,
      },
    });
  }

  public setTaskComposerTitle(title: string): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      taskComposer: {
        ...current.taskComposer,
        title,
        error: null,
      },
    });
  }

  public submitTaskComposer(): void {
    const current = this.getSnapshot();
    if (current.taskComposer.saving || current.taskComposer.target === null)
      return;
    void this.createTaskInTarget(
      current.taskComposer.title,
      current.taskComposer.target
    );
  }

  public openTaskPicker(): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        open: true,
        error: null,
      },
    });
    if (current.taskPicker.items.length === 0) {
      void this.loadTaskPickerPage(true);
    }
  }

  public closeTaskPicker(): void {
    const current = this.getSnapshot();
    if (!current.taskPicker.open) return;
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        open: false,
        loading: false,
        error: null,
      },
    });
  }

  public setTaskPickerQuery(query: string): void {
    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        query,
        error: null,
      },
    });
    void this.loadTaskPickerPage(true);
  }

  public setTaskPickerStatus(status: Status | null): void {
    const current = this.getSnapshot();
    if (current.taskPicker.status === status) return;
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        status,
        error: null,
      },
    });
    void this.loadTaskPickerPage(true);
  }

  public setTaskPickerGoal(goal: FocusBoardGoalFilterOption | null): void {
    const current = this.getSnapshot();
    const currentGoalId = current.taskPicker.goal?.id ?? null;
    const nextGoalId = goal?.id ?? null;
    if (currentGoalId === nextGoalId) return;
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        goal,
        story: null,
        error: null,
      },
    });
    void this.loadTaskPickerPage(true);
  }

  public setTaskPickerStory(story: FocusBoardStoryFilterOption | null): void {
    const current = this.getSnapshot();
    const currentStoryId = current.taskPicker.story?.id ?? null;
    const nextStoryId = story?.id ?? null;
    if (currentStoryId === nextStoryId) return;
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        story,
        error: null,
      },
    });
    void this.loadTaskPickerPage(true);
  }

  public loadMoreTaskPicker(): void {
    void this.loadTaskPickerPage(false);
  }

  public addTaskToBacklog(taskId: string): void {
    const current = this.getSnapshot();
    if (getAssignedTaskIds(current).has(taskId)) return;

    const task = current.taskPicker.items.find((item) => item.id === taskId);
    if (!task) return;

    const nextSnapshot = {
      ...current,
      backlog: current.backlog.concat({
        id: task.id,
        text: task.text,
        completed: task.completed,
        isFocus: false,
      }),
    };
    this.stateSubject.next(nextSnapshot);
    this.enqueueSave(nextSnapshot);
  }

  public toggleTask(
    containerId: FocusBoardTaskContainerId,
    taskId: string
  ): void {
    const current = this.getSnapshot();
    const days = cloneDays(current.days);
    let backlog = cloneTaskList(current.backlog);

    if (containerId === 'backlog') {
      backlog = backlog.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      this.stateSubject.next({
        ...current,
        backlog,
      });
      const nextTask = backlog.find((task) => task.id === taskId);
      if (nextTask) {
        this.enqueueTaskCompletion(taskId, nextTask.completed);
      }
      return;
    }

    const nextList = cloneTaskList(days[containerId] ?? []).map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    days[containerId] = nextList;
    this.stateSubject.next({
      ...current,
      days,
    });
    const nextTask = nextList.find((task) => task.id === taskId);
    if (nextTask) {
      this.enqueueTaskCompletion(taskId, nextTask.completed);
    }
  }

  public moveTask(
    sourceId: FocusBoardTaskContainerId,
    targetId: FocusBoardTaskContainerId,
    taskId: string
  ): void {
    if (sourceId === targetId) return;

    const current = this.getSnapshot();
    const days = cloneDays(current.days);
    let backlog = cloneTaskList(current.backlog);

    const sourceTasks =
      sourceId === 'backlog' ? backlog : cloneTaskList(days[sourceId] ?? []);

    const sourceIndex = sourceTasks.findIndex((task) => task.id === taskId);
    if (sourceIndex === -1) return;

    const [movedTask] = sourceTasks.splice(sourceIndex, 1);

    if (sourceId === 'backlog') {
      backlog = sourceTasks;
    } else {
      days[sourceId] = normalizeFocus(sourceTasks);
    }

    if (targetId === 'backlog') {
      backlog.push({
        ...movedTask,
        isFocus: false,
      });
    } else {
      const targetTasks = cloneTaskList(days[targetId] ?? []);
      targetTasks.push({
        ...movedTask,
        isFocus: targetTasks.length === 0,
      });
      days[targetId] = normalizeFocus(targetTasks);
    }

    const nextSnapshot = {
      ...current,
      days,
      backlog,
    };
    this.stateSubject.next(nextSnapshot);
    this.enqueueSave(nextSnapshot);
  }

  private async loadTaskPickerPage(reset: boolean): Promise<void> {
    const current = this.getSnapshot();
    if (!current.taskPicker.open && !reset) return;
    if (current.taskPicker.loading) return;

    const page = reset ? 1 : current.taskPicker.nextPage;
    if (page === null) return;

    const requestId = ++this.taskPickerRequestId;
    this.stateSubject.next({
      ...current,
      taskPicker: {
        ...current.taskPicker,
        loading: true,
        error: null,
        ...(reset
          ? {
              items: [],
              nextPage: 1,
              total: 0,
            }
          : {}),
      },
    });

    try {
      const result = await this.resolveRepositoryResult(
        this.repository.searchTasks({
          query: this.getSnapshot().taskPicker.query.trim(),
          page,
          pageSize: FocusBoardStore.TASK_PICKER_PAGE_SIZE,
          status: this.getSnapshot().taskPicker.status,
          goalId: this.getSnapshot().taskPicker.goal?.id ?? null,
          storyId: this.getSnapshot().taskPicker.story?.id ?? null,
        })
      );
      if (requestId !== this.taskPickerRequestId) return;

      const latest = this.getSnapshot();
      this.stateSubject.next({
        ...latest,
        taskPicker: {
          ...latest.taskPicker,
          loading: false,
          error: null,
          items: reset
            ? result.items
            : mergeSearchItems(latest.taskPicker.items, result.items),
          nextPage: result.nextPage,
          total: result.total,
        },
      });
    } catch (error) {
      if (requestId !== this.taskPickerRequestId) return;
      const latest = this.getSnapshot();
      this.stateSubject.next({
        ...latest,
        taskPicker: {
          ...latest.taskPicker,
          loading: false,
          error: 'Не вдалося завантажити задачі.',
        },
      });
      console.warn('Failed to search tasks for focus board.', error);
    }
  }

  private async createTaskInTarget(
    text: string,
    target: FocusBoardTaskContainerId
  ): Promise<void> {
    const title = text.trim();
    if (title.length === 0) {
      const current = this.getSnapshot();
      this.stateSubject.next({
        ...current,
        taskComposer: {
          ...current.taskComposer,
          error: 'Вкажи назву задачі.',
        },
      });
      return;
    }

    const current = this.getSnapshot();
    this.stateSubject.next({
      ...current,
      taskComposer: {
        ...current.taskComposer,
        open: true,
        target,
        title,
        saving: true,
        error: null,
      },
    });

    try {
      const task = await this.resolveRepositoryResult(
        this.repository.createTask(title)
      );
      const latest = this.getSnapshot();
      const days = cloneDays(latest.days);
      let backlog = cloneTaskList(latest.backlog);

      if (target === 'backlog') {
        backlog = backlog.concat({
          ...task,
          isFocus: false,
        });
      } else {
        days[target] = createTaskListWithInsertedTask(days[target] ?? [], task);
      }

      const nextSnapshot = {
        ...latest,
        days,
        backlog,
        taskComposer: {
          open: false,
          target: null,
          title: '',
          saving: false,
          error: null,
        },
      };
      this.stateSubject.next(nextSnapshot);
      this.enqueueSave(nextSnapshot);
    } catch (error) {
      const latest = this.getSnapshot();
      this.stateSubject.next({
        ...latest,
        taskComposer: {
          ...latest.taskComposer,
          open: true,
          target,
          title,
          saving: false,
          error: 'Не вдалося створити задачу.',
        },
      });
      console.warn('Failed to create task from focus board.', error);
    }
  }

  public toggleHabit(dayIndex: number, habitId: string): void {
    const current = this.getSnapshot();
    const nextDayChecks = {
      ...(current.habitChecks[dayIndex] ?? {}),
    };
    nextDayChecks[habitId] = !nextDayChecks[habitId];

    this.stateSubject.next({
      ...current,
      habitChecks: {
        ...current.habitChecks,
        [dayIndex]: nextDayChecks,
      },
    });

    const dateKey = shiftDateKey(current.cycleStartDateKey, dayIndex - 1);
    const date = dateFromDateKey(dateKey);
    if (date) {
      this.enqueueHabitToggle(habitId, date);
    }
  }

  public addHabit(text: string): void {
    const title = text.trim();
    if (title.length === 0) return;

    const current = this.getSnapshot();
    const accent = HABIT_PALETTE[current.habits.length % HABIT_PALETTE.length];
    const badge = title.charAt(0).toUpperCase() || '+';

    this.stateSubject.next({
      ...current,
      habits: current.habits.concat({
        id: `habit-${this.nextHabitId++}`,
        text: title,
        accent,
        badge,
        priority: 'low',
      }),
    });
  }

  public removeHabit(habitId: string): void {
    const current = this.getSnapshot();
    const habitChecks: Record<number, Record<string, boolean>> = {};
    Object.entries(current.habitChecks).forEach(([dayKey, checks]) => {
      const nextChecks = { ...checks };
      delete nextChecks[habitId];
      habitChecks[Number(dayKey)] = nextChecks;
    });

    this.stateSubject.next({
      ...current,
      habits: current.habits.filter((habit) => habit.id !== habitId),
      habitChecks,
    });
  }
}
