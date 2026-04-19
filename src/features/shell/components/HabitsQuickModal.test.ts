// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Priority,
  Status,
  type DateCompletion,
  type Habit,
} from '../../../majom-wrapper/interfaces/index.ts';
import { KANBAN_REFRESH_REQUEST_EVENT } from '../../kanban/kanbanEvents.ts';
import * as confirmDeleteRoutineModalModule from './ConfirmDeleteRoutineModal.ts';
import {
  HabitsQuickModal,
  type HabitsQuickModalService,
} from './HabitsQuickModal.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function habitIdFromUuid(habitUuid: string): string {
  return habitUuid;
}

function makeHabit(
  overrides: Partial<Habit> = {},
  completions: DateCompletion[] = []
): Habit {
  const id = overrides.id ?? 'habit-uuid-1';
  return {
    id,
    uuid: overrides.uuid ?? String(id),
    title: 'Morning Routine',
    description: '',
    created_at: new Date(2026, 2, 1),
    priority: Priority.Low,
    status: Status.Active,
    last_checked: new Date(2026, 2, 10),
    meta: null,
    is_due_today: true,
    weekly_completions: [],
    completions,
    ...overrides,
  };
}

function createService(
  habits: Habit[],
  toggleImpl: (habitUuid: string, date: Date) => Promise<Habit>,
  options?: {
    createImpl?: (title: string, priority: UiPriority) => Promise<Habit>;
    patchTitleImpl?: (habitUuid: string, title: string) => Promise<Habit>;
    patchPriorityImpl?: (
      habitUuid: string,
      priority: UiPriority
    ) => Promise<Habit>;
    archiveImpl?: (habitUuid: string) => Promise<Habit>;
    restoreImpl?: (habitUuid: string) => Promise<Habit>;
    deleteImpl?: (habitUuid: string) => Promise<void>;
  }
): {
  service: HabitsQuickModalService;
  loadTracker: ReturnType<typeof vi.fn>;
  loadDay: ReturnType<typeof vi.fn>;
  setHabitCompletion: ReturnType<typeof vi.fn>;
  createHabit: ReturnType<typeof vi.fn>;
  patchHabitTitle: ReturnType<typeof vi.fn>;
  patchHabitPriority: ReturnType<typeof vi.fn>;
  archiveHabit: ReturnType<typeof vi.fn>;
  restoreHabit: ReturnType<typeof vi.fn>;
  deleteHabit: ReturnType<typeof vi.fn>;
} {
  let currentHabits = [...habits];
  const loadTracker = vi.fn(async (start: Date | string, days = 10) => {
    const startDate =
      typeof start === 'string'
        ? new Date(`${start}T12:00:00`)
        : new Date(start.getTime());
    const dayItems = Array.from({ length: days }, (_, index) => {
      const date = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + index
      );
      return {
        date: toLocalDateKey(date),
        is_today: index === days - 1,
      };
    });
    return {
      start_date: dayItems[0]?.date ?? '',
      end_date: dayItems[dayItems.length - 1]?.date ?? '',
      days: dayItems,
      active_habits: currentHabits
        .filter((habit) => habit.status === Status.Active)
        .map((habit) => ({
          habit: {
            id: habit.id,
            uuid: habit.uuid,
            title: habit.title,
            description: habit.description,
            created_at: habit.created_at.toISOString(),
            priority: habit.priority,
            status: habit.status,
            last_checked: Number.isNaN(habit.last_checked.getTime())
              ? null
              : habit.last_checked.toISOString(),
            meta: habit.meta,
          },
          day_states: [...dayItems].map((day) => {
            const completed =
              (habit.completions ?? []).find(([value]) => value === day.date)?.[1] ===
              true;
            return {
              date: day.date,
              is_due: day.is_today ? habit.is_due_today : !completed,
              is_completed: completed,
            };
          }),
        })),
      archived_habits: currentHabits
        .filter((habit) => habit.status === Status.Archived)
        .map((habit) => ({
          id: habit.id,
          uuid: habit.uuid,
          title: habit.title,
          description: habit.description,
          created_at: habit.created_at.toISOString(),
          priority: habit.priority,
          status: habit.status,
          last_checked: Number.isNaN(habit.last_checked.getTime())
            ? null
            : habit.last_checked.toISOString(),
          meta: habit.meta,
        })),
      summary: {
        today: {
          date: dayItems[dayItems.length - 1]?.date ?? '',
          total: currentHabits.filter((habit) => habit.status === Status.Active).length,
          completed: currentHabits.filter(
            (habit) => habit.status === Status.Active && !habit.is_due_today
          ).length,
          open: currentHabits.filter(
            (habit) => habit.status === Status.Active && habit.is_due_today
          ).length,
        },
      },
    };
  });
  const loadDay = vi.fn(async (date: Date | string) => {
    const key =
      typeof date === 'string'
        ? date
        : toLocalDateKey(date);
    return {
      day: {
        date: key,
        is_today: key === toLocalDateKey(new Date(2026, 2, 15)),
      },
      active_habits: currentHabits
        .filter((habit) => habit.status === Status.Active)
        .map((habit) => ({
          habit: {
            id: habit.id,
            uuid: habit.uuid,
            title: habit.title,
            description: habit.description,
            created_at: habit.created_at.toISOString(),
            priority: habit.priority,
            status: habit.status,
            last_checked: Number.isNaN(habit.last_checked.getTime())
              ? null
              : habit.last_checked.toISOString(),
            meta: habit.meta,
          },
          state: {
            date: key,
            is_due: habit.is_due_today,
            is_completed:
              (habit.completions ?? []).find(([value]) => value === key)?.[1] === true,
          },
        })),
      archived_habits: currentHabits
        .filter((habit) => habit.status === Status.Archived)
        .map((habit) => ({
          id: habit.id,
          uuid: habit.uuid,
          title: habit.title,
          description: habit.description,
          created_at: habit.created_at.toISOString(),
          priority: habit.priority,
          status: habit.status,
          last_checked: Number.isNaN(habit.last_checked.getTime())
            ? null
            : habit.last_checked.toISOString(),
          meta: habit.meta,
        })),
      summary: {
        date: key,
        total: currentHabits.filter((habit) => habit.status === Status.Active).length,
        completed: currentHabits.filter(
          (habit) =>
            habit.status === Status.Active &&
            (habit.completions ?? []).find(([value]) => value === key)?.[1] === true
        ).length,
        open: currentHabits.filter(
          (habit) =>
            habit.status === Status.Active &&
            (habit.completions ?? []).find(([value]) => value === key)?.[1] !== true
        ).length,
      },
    };
  });
  const setHabitCompletion = vi.fn(async (habitUuid: string, date: Date | string) => {
    const resolvedDate =
      typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
    const updated = await toggleImpl(habitUuid, resolvedDate);
    currentHabits = currentHabits.map((habit) =>
      habit.uuid === habitUuid ? updated : habit
    );
    return updated;
  });
  const createHabit = vi.fn(
    options?.createImpl ??
      (async (title: string, priority: UiPriority) =>
        makeHabit({ id: 'habit-uuid-999', title, priority: priority as Priority }))
  );
  const patchHabitTitle = vi.fn(
    options?.patchTitleImpl ??
      (async (habitUuid: string, title: string) =>
        makeHabit({
          id: habitIdFromUuid(habitUuid),
          uuid: habitUuid,
          title,
        }))
  );
  const patchHabitPriority = vi.fn(
    options?.patchPriorityImpl ??
      (async (habitUuid: string, priority: UiPriority) =>
        makeHabit({
          id: habitIdFromUuid(habitUuid),
          uuid: habitUuid,
          priority: priority as Priority,
        }))
  );
  const archiveHabit = vi.fn(
    options?.archiveImpl ??
      (async (habitUuid: string) =>
        makeHabit({
          id: habitIdFromUuid(habitUuid),
          uuid: habitUuid,
          status: Status.Archived,
        }))
  );
  const restoreHabit = vi.fn(
    options?.restoreImpl ??
      (async (habitUuid: string) =>
        makeHabit({
          id: habitIdFromUuid(habitUuid),
          uuid: habitUuid,
          status: Status.Active,
        }))
  );
  const deleteHabit = vi.fn(
    options?.deleteImpl ?? (async () => Promise.resolve())
  );
  createHabit.mockImplementation(async (title: string, priority: UiPriority) => {
    const created = await (
      options?.createImpl ??
      (async (value: string, nextPriority: UiPriority) =>
        makeHabit({
          id: 'habit-uuid-999',
          title: value,
          priority: nextPriority as Priority,
        }))
    )(title, priority);
    currentHabits = [...currentHabits, created];
    return created;
  });
  patchHabitTitle.mockImplementation(async (habitUuid: string, title: string) => {
    const updated = await (
      options?.patchTitleImpl ??
      (async (uuid: string, value: string) =>
        makeHabit({
          id: habitIdFromUuid(uuid),
          uuid,
          title: value,
        }))
    )(habitUuid, title);
    currentHabits = currentHabits.map((habit) =>
      habit.uuid === habitUuid ? updated : habit
    );
    return updated;
  });
  patchHabitPriority.mockImplementation(
    async (habitUuid: string, priority: UiPriority) => {
      const updated = await (
        options?.patchPriorityImpl ??
        (async (uuid: string, value: UiPriority) =>
          makeHabit({
            id: habitIdFromUuid(uuid),
            uuid,
            priority: value as Priority,
          }))
      )(habitUuid, priority);
      currentHabits = currentHabits.map((habit) =>
        habit.uuid === habitUuid ? updated : habit
      );
      return updated;
    }
  );
  archiveHabit.mockImplementation(async (habitUuid: string) => {
    const updated = await (
      options?.archiveImpl ??
      (async (uuid: string) =>
        makeHabit({
          id: habitIdFromUuid(uuid),
          uuid,
          status: Status.Archived,
        }))
    )(habitUuid);
    currentHabits = currentHabits.map((habit) =>
      habit.uuid === habitUuid ? updated : habit
    );
    return updated;
  });
  restoreHabit.mockImplementation(async (habitUuid: string) => {
    const updated = await (
      options?.restoreImpl ??
      (async (uuid: string) =>
        makeHabit({
          id: habitIdFromUuid(uuid),
          uuid,
          status: Status.Active,
        }))
    )(habitUuid);
    currentHabits = currentHabits.map((habit) =>
      habit.uuid === habitUuid ? updated : habit
    );
    return updated;
  });
  deleteHabit.mockImplementation(async (habitUuid: string) => {
    await (options?.deleteImpl ?? (async () => Promise.resolve()))(habitUuid);
    currentHabits = currentHabits.filter((habit) => habit.uuid !== habitUuid);
  });
  const service: HabitsQuickModalService = {
    loadTracker,
    loadDay,
    setHabitCompletion,
    createHabit,
    patchHabitTitle,
    patchHabitPriority,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  };
  return {
    service,
    loadTracker,
    loadDay,
    setHabitCompletion,
    createHabit,
    patchHabitTitle,
    patchHabitPriority,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  };
}

describe('HabitsQuickModal routines management', () => {
  let originalWindow: unknown;
  let originalCustomEvent: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
    originalWindow = (globalThis as any).window;
    originalCustomEvent = (globalThis as any).CustomEvent;
    (globalThis as any).window = {
      addEventListener: vi.fn(),
      cancelAnimationFrame: vi.fn(),
      dispatchEvent: vi.fn(),
      confirm: vi.fn(() => true),
      removeEventListener: vi.fn(),
      requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    };
    if (typeof (globalThis as any).CustomEvent === 'undefined') {
      (globalThis as any).CustomEvent = class TestCustomEvent {
        public readonly type: string;
        public readonly detail: unknown;
        constructor(type: string, init?: { detail?: unknown }) {
          this.type = type;
          this.detail = init?.detail;
        }
      };
    }
  });

  afterEach(() => {
    if (typeof originalWindow === 'undefined') {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
    if (typeof originalCustomEvent === 'undefined') {
      delete (globalThis as any).CustomEvent;
    } else {
      (globalThis as any).CustomEvent = originalCustomEvent;
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not override explicit today=false completion with last_checked fallback', () => {
    const today = new Date(2026, 2, 15);
    const todayKey = toLocalDateKey(today);
    const habit = makeHabit({ last_checked: today }, [[todayKey, false]]);
    const { service } = createService([habit], async () => habit);
    const modal = new HabitsQuickModal(service) as any;

    const map = modal.buildCompletionMap(habit) as Map<string, boolean>;

    expect(map.get(todayKey)).toBe(false);
  });

  it('toggles non-today day, applies updated server state, and emits kanban refresh', async () => {
    const today = new Date(2026, 2, 15);
    const yesterday = new Date(2026, 2, 14);
    const todayKey = toLocalDateKey(today);
    const yesterdayKey = toLocalDateKey(yesterday);
    const baseHabit = makeHabit({}, [[todayKey, false], [yesterdayKey, false]]);
    const updatedHabit = makeHabit({}, [[todayKey, false], [yesterdayKey, true]]);
    const { service, setHabitCompletion } = createService(
      [baseHabit],
      async () => updatedHabit
    );
    const modal = new HabitsQuickModal(service) as any;
    const row = {
      habit: baseHabit,
      completionByDateKey: modal.buildCompletionMap(baseHabit),
    };
    const day = modal.days[1];

    expect(row.completionByDateKey.get(yesterdayKey)).toBe(false);
    await modal.toggleCell(row, day, false);

    expect(setHabitCompletion).toHaveBeenCalledTimes(1);
    const [habitUuid, calledDate] = setHabitCompletion.mock.calls[0] as [
      string,
      Date,
    ];
    expect(habitUuid).toBe('habit-uuid-1');
    expect(toLocalDateKey(calledDate)).toBe(yesterdayKey);
    expect(row.completionByDateKey.get(yesterdayKey)).toBe(true);
    expect((globalThis as any).window.dispatchEvent).toHaveBeenCalledTimes(1);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('reverts optimistic state and stores error when toggle request fails', async () => {
    const today = new Date(2026, 2, 15);
    const yesterday = new Date(2026, 2, 14);
    const todayKey = toLocalDateKey(today);
    const yesterdayKey = toLocalDateKey(yesterday);
    const baseHabit = makeHabit({}, [[todayKey, false], [yesterdayKey, false]]);
    const { service } = createService([baseHabit], async () => {
      throw new Error('toggle failed');
    });
    const modal = new HabitsQuickModal(service) as any;
    const row = {
      habit: baseHabit,
      completionByDateKey: modal.buildCompletionMap(baseHabit),
    };
    const day = modal.days[1];

    expect(row.completionByDateKey.get(yesterdayKey)).toBe(false);
    await modal.toggleCell(row, day, false);

    expect(row.completionByDateKey.get(yesterdayKey)).toBe(false);
    expect(modal.errorKey).toBe('habits.error.toggleCompletion');
  });

  it('ignores repeated toggle calls while the same cell request is pending', async () => {
    const today = new Date(2026, 2, 15);
    const yesterday = new Date(2026, 2, 14);
    const todayKey = toLocalDateKey(today);
    const yesterdayKey = toLocalDateKey(yesterday);
    const baseHabit = makeHabit({}, [[todayKey, false], [yesterdayKey, false]]);
    const updatedHabit = makeHabit({}, [[todayKey, false], [yesterdayKey, true]]);
    const deferred = createDeferred<Habit>();
    const { service, setHabitCompletion } = createService(
      [baseHabit],
      async () => deferred.promise
    );
    const modal = new HabitsQuickModal(service) as any;
    const row = {
      habit: baseHabit,
      completionByDateKey: modal.buildCompletionMap(baseHabit),
    };
    const day = modal.days[1];

    const firstCall = modal.toggleCell(row, day, false);
    const secondCall = modal.toggleCell(row, day, false);

    expect(setHabitCompletion).toHaveBeenCalledTimes(1);
    deferred.resolve(updatedHabit);
    await firstCall;
    await secondCall;

    expect(row.completionByDateKey.get(yesterdayKey)).toBe(true);
  });

  it('creates new routine and dispatches kanban refresh', async () => {
    const created = makeHabit({
      id: 'habit-uuid-2',
      title: 'Workout',
      priority: Priority.High,
    });
    const { service, createHabit } = createService([], async () => created, {
      createImpl: async () => created,
    });
    const modal = new HabitsQuickModal(service) as any;
    modal.createTitle = 'Workout';
    modal.createPriority = 'high';

    await modal.createHabit();

    expect(createHabit).toHaveBeenCalledWith('Workout', 'high');
    expect(modal.rows).toHaveLength(1);
    expect(modal.rows[0].habit.title).toBe('Workout');
    expect(modal.rows[0].habit.priority).toBe(Priority.High);
    expect(modal.createTitle).toBe('');
    expect(modal.createPriority).toBe('low');
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('computes create button disabled state from title/loading/pending', () => {
    const { service } = createService([], async () => makeHabit());
    const modal = new HabitsQuickModal(service) as any;

    modal.createTitle = '   ';
    modal.loading = false;
    modal.createPending = false;
    expect(modal.isCreateSubmitDisabled()).toBe(true);

    modal.createTitle = 'Workout';
    expect(modal.isCreateSubmitDisabled()).toBe(false);

    modal.loading = true;
    expect(modal.isCreateSubmitDisabled()).toBe(true);

    modal.loading = false;
    modal.createPending = true;
    expect(modal.isCreateSubmitDisabled()).toBe(true);
  });

  it('renders a priority selector in the create routine modal', () => {
    const { service } = createService([], async () => makeHabit());
    const modal = new HabitsQuickModal(service) as any;

    modal.openCreateModal();

    const prioritySelect = document.querySelector(
      '[data-create-routine-priority="true"]'
    ) as HTMLDivElement | null;
    expect(prioritySelect).not.toBeNull();
    expect(prioritySelect?.textContent).toContain('Low');
    expect(
      prioritySelect?.querySelector('svg[data-icon-name="chevron-down"]')
    ).not.toBeNull();
  });

  it('renders the routines table with the documented table contract', () => {
    const habit = makeHabit();
    const { service } = createService([habit], async () => habit);
    const modal = new HabitsQuickModal(service) as any;
    modal.body = document.createElement('div');
    modal.rows = [modal.mapHabitToRow(habit)];
    modal.loading = false;

    modal.renderBody();

    const table = modal.body.querySelector('table') as HTMLTableElement | null;
    expect(table).not.toBeNull();
    expect(table?.className).toContain('border-separate');
    expect(table?.className).toContain('border-spacing-0');

    const tableWrap = table?.parentElement as HTMLDivElement | null;
    expect(tableWrap).not.toBeNull();
    const assuredTableWrap = tableWrap as HTMLDivElement;
    expect(assuredTableWrap.className).toContain('w-full');
    expect(assuredTableWrap.className).toContain('rounded-xl');
    expect(assuredTableWrap.className).toContain('border-slate-200/80');
    expect(assuredTableWrap.className).toContain('overflow-auto');
    expect(assuredTableWrap.style.maxHeight).toBe('min(56vh, 34rem)');

    const headers = Array.from(
      modal.body.querySelectorAll('thead th')
    ) as HTMLTableCellElement[];
    expect(headers).toHaveLength(13);
    expect(headers[0].getAttribute('scope')).toBe('col');
    expect(headers[0].className).toContain('h-11');
    expect(headers[0].className).toContain('w-[44px]');
    expect(headers[0].className).toContain('text-center');
    expect(headers[0].className).toContain('sticky');
    expect(headers[0].className).toContain('left-0');
    expect(headers[0].className).toContain('z-20');
    expect(headers[0].className).toContain('top-0');
    expect(headers[1].className).toContain('sticky');
    expect(headers[1].className).toContain('text-left');
    expect(headers[1].className).toContain('z-20');
    expect(headers[1].style.left).toBe('44px');
    expect(headers[2].className).toContain('px-3');
    expect(headers[2].className).toContain('text-[12px]');
    expect(headers[2].className).toContain('bg-indigo-50');
    expect(headers[2].className).toContain('sticky');
    expect(headers[2].className).toContain('top-0');
    expect(headers[2].className).toContain('z-20');
    expect(headers[2].style.background).toBe('');
    expect(headers[12].className).toContain('sticky');
    expect(headers[12].className).toContain('right-0');
    expect(headers[12].className).toContain('z-20');
    expect(headers[12].className).toContain('top-0');
    expect(headers[12].className).not.toContain('border-l');

    const priorityHeaderButton = headers[0].querySelector('button');
    expect(priorityHeaderButton?.textContent?.trim()).toBe('');
    expect(priorityHeaderButton?.getAttribute('aria-label')).toBe('Priority');
    expect(
      priorityHeaderButton?.querySelector('svg')?.getAttribute('data-icon-name')
    ).toBe('arrow-down');
    expect(modal.body.textContent).toContain('0 done');
    expect(modal.body.textContent).toContain('1 left');

    const dayHeaderButton = headers[2].querySelector('button') as
      HTMLButtonElement | null;
    expect(dayHeaderButton?.dataset.habitDayOpen).toBeTruthy();
    const shortLabel = dayHeaderButton?.children[1] as HTMLElement;
    expect(shortLabel.className).toContain('text-[12px]');

    const row = modal.body.querySelector('tbody tr') as HTMLTableRowElement | null;
    expect(row).not.toBeNull();
    expect(row?.className).toContain('group');

    const bodyCells = Array.from(row?.querySelectorAll('td') ?? []) as
      HTMLTableCellElement[];
    expect(bodyCells).toHaveLength(13);

    const priorityCell = bodyCells[0] ?? null;
    const titleCell = bodyCells[1] ?? null;
    expect(priorityCell).not.toBeNull();
    expect(priorityCell?.className).toContain('sticky');
    expect(priorityCell?.className).toContain('left-0');
    expect(priorityCell?.className).toContain('z-10');
    expect(titleCell).not.toBeNull();
    expect(titleCell?.className).toContain('z-10');
    expect(titleCell?.style.left).toBe('44px');
    expect(titleCell?.className).toContain('group-hover:bg-slate-50');
    expect(titleCell?.className).toContain('group-focus-within:bg-slate-50');
    expect(titleCell?.className).not.toContain('group-hover:bg-slate-50/70');
    expect(bodyCells[12].className).toContain('sticky');
    expect(bodyCells[12].className).toContain('right-0');
    expect(bodyCells[12].className).toContain('z-10');
    expect(bodyCells[12].className).toContain('group-hover:bg-slate-50');
    expect(bodyCells[12].className).toContain('group-focus-within:bg-slate-50');
    expect(bodyCells[12].className).not.toContain('border-l');

    const priorityCellButton = bodyCells[0]?.querySelector(
      `[data-habit-priority-trigger="${habit.uuid}"]`
    ) as HTMLButtonElement | null;
    expect(priorityCellButton).not.toBeNull();
    expect(priorityCellButton?.textContent?.trim()).toBe('');

    const titleLabel = row?.querySelector(
      `[data-habit-title-label="${habit.uuid}"]`
    ) as HTMLButtonElement | null;
    expect(titleLabel).not.toBeNull();
    expect(titleLabel?.textContent).toBe('Morning Routine');
    expect(titleLabel?.className).toContain('truncate');
    expect(titleLabel?.className).toContain('text-base');
    expect(titleLabel?.tagName).toBe('BUTTON');
    expect(titleLabel?.getAttribute('aria-label')).toBeTruthy();
    expect(row?.querySelector(`[data-habit-title-input="${habit.uuid}"]`)).toBeNull();

    const checkboxRoot = row?.querySelector(
      '[data-component="Checkbox"]'
    ) as HTMLLabelElement | null;
    expect(checkboxRoot).not.toBeNull();
    const indicator = checkboxRoot?.querySelector('div') as HTMLDivElement | null;
    expect(indicator).not.toBeNull();
    expect(indicator?.className).toContain('hover:border-slate-400');
    expect(indicator?.style.borderColor).toBe('');
    expect(indicator?.style.backgroundColor).toBe('');
  });

  it('opens the day modal from a day header and loads that day snapshot', async () => {
    const habit = makeHabit({
      completions: [['2026-03-15', true]],
    });
    const { service, loadDay } = createService([habit], async () => habit);
    const modal = new HabitsQuickModal(service);

    await modal.open();

    expect(loadDay).not.toHaveBeenCalled();

    const dayHeaderButton = modal.body.querySelector(
      '[data-habit-day-open]'
    ) as HTMLButtonElement | null;
    expect(dayHeaderButton).not.toBeNull();

    dayHeaderButton?.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(loadDay).toHaveBeenCalledTimes(1);
    expect(loadDay).toHaveBeenCalledWith(expect.any(Date));
    expect(document.body.textContent).toContain('Morning Routine');
  });

  it('groups day-modal routines by priority from highest to lowest without card styling', async () => {
    const low = makeHabit({
      id: 'habit-low',
      uuid: 'habit-low',
      title: 'Low routine',
      priority: Priority.Low,
    });
    const highest = makeHabit({
      id: 'habit-highest',
      uuid: 'habit-highest',
      title: 'Highest routine',
      priority: Priority.Highest,
    });
    const medium = makeHabit({
      id: 'habit-medium',
      uuid: 'habit-medium',
      title: 'Medium routine',
      priority: Priority.Medium,
    });
    const { service } = createService([low, highest, medium], async () => highest);
    const modal = new HabitsQuickModal(service);

    await modal.open();

    const dayHeaderButton = modal.body.querySelector(
      '[data-habit-day-open]'
    ) as HTMLButtonElement | null;
    dayHeaderButton?.click();
    await Promise.resolve();
    await Promise.resolve();

    const titleLabels = Array.from(
      document.body.querySelectorAll('[data-habit-title-label]')
    ) as HTMLButtonElement[];
    const dayModalTitles = titleLabels.slice(-3).map((node) => node.textContent);
    expect(dayModalTitles).toEqual([
      'Highest routine',
      'Medium routine',
      'Low routine',
    ]);

    const dayModalRow = titleLabels[titleLabels.length - 1]
      ?.parentElement
      ?.parentElement as HTMLDivElement | null;
    expect(dayModalRow).not.toBeNull();
    expect(dayModalRow?.className).toContain('hover:bg-slate-100/80');
    expect(dayModalRow?.className).not.toContain('bg-white');
    expect(dayModalRow?.className).not.toContain('border');
    expect(dayModalRow?.className).not.toContain('shadow');

    expect(document.body.textContent).toContain('Highest');
    expect(document.body.textContent).toContain('Medium');
    expect(document.body.textContent).toContain('Low');
  });

  it('sorts routines by priority when the priority header is clicked', () => {
    const low = makeHabit({
      id: 'habit-uuid-1',
      title: 'Low routine',
      priority: Priority.Low,
    });
    const highest = makeHabit({
      id: 'habit-uuid-2',
      title: 'Highest routine',
      priority: Priority.Highest,
    });
    const medium = makeHabit({
      id: 'habit-uuid-3',
      title: 'Medium routine',
      priority: Priority.Medium,
    });
    const { service } = createService([low, highest, medium], async () => low);
    const modal = new HabitsQuickModal(service) as any;
    modal.body = document.createElement('div');
    modal.rows = [
      modal.mapHabitToRow(low),
      modal.mapHabitToRow(highest),
      modal.mapHabitToRow(medium),
    ];
    modal.loading = false;

    modal.renderBody();

    expect(modal.rows.map((item: any) => item.habit.title)).toEqual([
      'Highest routine',
      'Medium routine',
      'Low routine',
    ]);

    const tableWrapBefore = modal.body.querySelector(
      'div.w-full.overflow-auto.rounded-xl.border.border-slate-200\\/80.bg-white'
    ) as HTMLDivElement | null;
    const priorityHeaderButton = modal.body.querySelector(
      'thead th:nth-child(1) button'
    ) as HTMLButtonElement | null;
    priorityHeaderButton?.click();

    const tableWrapAfterDesc = modal.body.querySelector(
      'div.w-full.overflow-auto.rounded-xl.border.border-slate-200\\/80.bg-white'
    ) as HTMLDivElement | null;
    const sortedDescHeaderButton = modal.body.querySelector(
      'thead th:nth-child(1) button'
    ) as HTMLButtonElement | null;

    expect(tableWrapAfterDesc).toBe(tableWrapBefore);
    expect(modal.rows.map((item: any) => item.habit.title)).toEqual([
      'Low routine',
      'Medium routine',
      'Highest routine',
    ]);
    expect(
      sortedDescHeaderButton?.querySelector('svg')?.getAttribute('data-icon-name')
    ).toBe('arrow-up');

    sortedDescHeaderButton?.click();

    const sortedAscHeaderButton = modal.body.querySelector(
      'thead th:nth-child(1) button'
    ) as HTMLButtonElement | null;
    const tableWrapAfterAsc = modal.body.querySelector(
      'div.w-full.overflow-auto.rounded-xl.border.border-slate-200\\/80.bg-white'
    ) as HTMLDivElement | null;

    expect(modal.rows.map((item: any) => item.habit.title)).toEqual([
      'Highest routine',
      'Medium routine',
      'Low routine',
    ]);
    expect(tableWrapAfterAsc).toBe(tableWrapBefore);
    expect(
      sortedAscHeaderButton?.querySelector('svg')?.getAttribute('data-icon-name')
    ).toBe('arrow-down');
  });

  it('renames routine and keeps sorted rows', async () => {
    const first = makeHabit({ id: 'habit-uuid-1', title: 'Alpha' });
    const second = makeHabit({ id: 'habit-uuid-2', title: 'Beta' });
    const updated = makeHabit({ id: 'habit-uuid-2', title: 'Aardvark' });
    const { service, patchHabitTitle } = createService(
      [first, second],
      async () => first,
      {
        patchTitleImpl: async () => updated,
      }
    );
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(first), modal.mapHabitToRow(second)];
    const row = modal.rows[1];

    await modal.renameHabit(row, 'Aardvark');

    expect(patchHabitTitle).toHaveBeenCalledWith(
      'habit-uuid-2',
      'Aardvark'
    );
    expect(modal.rows.map((item: any) => item.habit.title)).toEqual([
      'Aardvark',
      'Alpha',
    ]);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('opens the routine title editor only on demand', () => {
    const habit = makeHabit();
    const { service } = createService([habit], async () => habit);
    const modal = new HabitsQuickModal(service) as any;
    modal.body = document.createElement('div');
    modal.rows = [modal.mapHabitToRow(habit)];
    modal.loading = false;

    modal.renderBody();

    const editTrigger = modal.body.querySelector(
      `[data-habit-title-label="${habit.uuid}"]`
    ) as HTMLButtonElement | null;
    expect(editTrigger).not.toBeNull();

    editTrigger?.click();

    const titleInput = modal.body.querySelector(
      `[data-habit-title-input="${habit.uuid}"]`
    ) as HTMLInputElement | null;
    expect(titleInput).not.toBeNull();
    expect(titleInput?.getAttribute('data-component')).toBe('HudInputBase');
    expect(titleInput?.value).toBe('Morning Routine');
  });

  it('renders a compact priority selector in the dedicated priority column', () => {
    const habit = makeHabit({ priority: Priority.High });
    const { service } = createService([habit], async () => habit);
    const modal = new HabitsQuickModal(service) as any;
    modal.body = document.createElement('div');
    modal.rows = [modal.mapHabitToRow(habit)];
    modal.loading = false;

    modal.renderBody();

    const trigger = modal.body.querySelector(
      `[data-habit-priority-trigger="${habit.uuid}"]`
    ) as HTMLButtonElement | null;
    const icon = trigger?.querySelector('svg');

    expect(trigger).not.toBeNull();
    expect(trigger?.getAttribute('aria-label')).toContain('Priority');
    expect(trigger?.textContent?.trim()).toBe('');
    expect(icon?.getAttribute('data-icon-name')).toBe('chevron-up');
    expect(icon?.classList.contains('text-red-500')).toBe(true);
  });

  it('updates routine priority and keeps the returned server state', async () => {
    const base = makeHabit({ id: 'habit-uuid-7', priority: Priority.Low });
    const updated = makeHabit({ id: 'habit-uuid-7', priority: Priority.High });
    const { service, patchHabitPriority } = createService(
      [base],
      async () => base,
      {
        patchPriorityImpl: async () => updated,
      }
    );
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.updateHabitPriority(modal.rows[0], 'high');

    expect(patchHabitPriority).toHaveBeenCalledWith('habit-uuid-7', 'high');
    expect(modal.rows[0].habit.priority).toBe(Priority.High);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('removes routine from list when archive succeeds', async () => {
    const base = makeHabit({ id: 'habit-uuid-9', title: 'Archive me' });
    const { service, archiveHabit } = createService([base], async () => base);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.archiveHabit(modal.rows[0]);

    expect((globalThis as any).window.confirm).not.toHaveBeenCalled();
    expect(archiveHabit).toHaveBeenCalledWith('habit-uuid-9');
    expect(modal.rows).toHaveLength(0);
    expect(modal.archivedRows).toHaveLength(1);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('restores archived routine back into the active list', async () => {
    const archived = makeHabit({
      id: 'habit-uuid-13',
      uuid: 'habit-uuid-13',
      title: 'Archived routine',
      status: Status.Archived,
    });
    const restored = makeHabit({
      id: 'habit-uuid-13',
      title: 'Archived routine',
      status: Status.Active,
    });
    const { service, restoreHabit } = createService([], async () => restored, {
      restoreImpl: async () => restored,
    });
    const modal = new HabitsQuickModal(service) as any;
    modal.archivedRows = [modal.mapHabitToRow(archived)];
    modal.showArchived = true;

    await modal.restoreHabit(modal.archivedRows[0]);

    expect(restoreHabit).toHaveBeenCalledWith('habit-uuid-13');
    expect(modal.rows).toHaveLength(1);
    expect(modal.archivedRows).toHaveLength(0);
    expect(modal.showArchived).toBe(false);
  });

  it('renders archived disclosure and shows archived routines on demand', () => {
    const active = makeHabit({ id: 'habit-uuid-1', title: 'Active routine' });
    const archived = makeHabit({
      id: 'habit-uuid-2',
      title: 'Archived routine',
      status: Status.Archived,
    });
    const { service } = createService([active, archived], async () => active);
    const modal = new HabitsQuickModal(service) as any;
    modal.body = document.createElement('div');
    modal.rows = [modal.mapHabitToRow(active)];
    modal.archivedRows = [modal.mapHabitToRow(archived)];
    modal.loading = false;
    modal.showArchived = false;

    modal.renderBody();

    const archivedButtons = Array.from(
      (modal.body as HTMLDivElement).querySelectorAll('button')
    ) as HTMLButtonElement[];
    const archivedToggles = archivedButtons.filter((button) =>
      button.textContent?.includes('Archived (1)')
    );
    expect(archivedToggles).toHaveLength(1);
    expect(modal.body.textContent).not.toContain('Archived routine');

    archivedToggles[0]?.click();

    expect(modal.body.textContent).toContain('Archived routine');
    expect(
      modal.body.querySelector('button[aria-label="Restore"]')
    ).not.toBeNull();
    expect(
      modal.body.querySelector('button[aria-label="Delete"]')
    ).not.toBeNull();
  });

  it('stores error and keeps routine when delete fails', async () => {
    const base = makeHabit({ id: 'habit-uuid-11', title: 'Fragile' });
    const { service, deleteHabit } = createService([base], async () => base, {
      deleteImpl: async () => {
        throw new Error('delete failed');
      },
    });
    vi.spyOn(confirmDeleteRoutineModalModule, 'confirmDeleteRoutineModal').mockResolvedValue(true);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.deleteHabit(modal.rows[0]);

    expect(deleteHabit).toHaveBeenCalledWith('habit-uuid-11');
    expect(modal.rows).toHaveLength(1);
    expect(modal.errorKey).toBe('habits.error.delete');
  });

  it('does not delete routine when confirmation is cancelled', async () => {
    const base = makeHabit({ id: 'habit-uuid-12', title: 'Keep me' });
    const { service, deleteHabit } = createService([base], async () => base);
    vi.spyOn(confirmDeleteRoutineModalModule, 'confirmDeleteRoutineModal').mockResolvedValue(false);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.deleteHabit(modal.rows[0]);

    expect(deleteHabit).not.toHaveBeenCalled();
    expect(modal.rows).toHaveLength(1);
  });
});
