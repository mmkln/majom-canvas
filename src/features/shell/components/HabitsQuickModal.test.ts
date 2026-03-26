// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
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

function makeHabit(
  overrides: Partial<Habit> = {},
  completions: DateCompletion[] = []
): Habit {
  return {
    id: 1,
    title: 'Morning Routine',
    description: '',
    created_at: new Date(2026, 2, 1),
    status: Status.Active,
    last_checked: new Date(2026, 2, 10),
    is_due_today: true,
    weekly_completions: [],
    completions,
    ...overrides,
  };
}

function createService(
  habits: Habit[],
  toggleImpl: (habitId: number, date: Date) => Promise<Habit>,
  options?: {
    createImpl?: (title: string) => Promise<Habit>;
    patchTitleImpl?: (habitId: number, title: string) => Promise<Habit>;
    archiveImpl?: (habitId: number) => Promise<Habit>;
    deleteImpl?: (habitId: number) => Promise<void>;
  }
): {
  service: HabitsQuickModalService;
  loadHabits: ReturnType<typeof vi.fn>;
  toggleHabitCompletion: ReturnType<typeof vi.fn>;
  createHabit: ReturnType<typeof vi.fn>;
  patchHabitTitle: ReturnType<typeof vi.fn>;
  archiveHabit: ReturnType<typeof vi.fn>;
  deleteHabit: ReturnType<typeof vi.fn>;
} {
  const loadHabits = vi.fn(async () => habits);
  const toggleHabitCompletion = vi.fn(toggleImpl);
  const createHabit = vi.fn(options?.createImpl ?? (async (title: string) => makeHabit({ id: 999, title })));
  const patchHabitTitle = vi.fn(
    options?.patchTitleImpl ??
      (async (habitId: number, title: string) => makeHabit({ id: habitId, title }))
  );
  const archiveHabit = vi.fn(
    options?.archiveImpl ??
      (async (habitId: number) =>
        makeHabit({ id: habitId, status: Status.Archived }))
  );
  const deleteHabit = vi.fn(
    options?.deleteImpl ?? (async () => Promise.resolve())
  );
  const service: HabitsQuickModalService = {
    loadHabits,
    toggleHabitCompletion,
    createHabit,
    patchHabitTitle,
    archiveHabit,
    deleteHabit,
  };
  return {
    service,
    loadHabits,
    toggleHabitCompletion,
    createHabit,
    patchHabitTitle,
    archiveHabit,
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
    const { service, toggleHabitCompletion } = createService(
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

    expect(toggleHabitCompletion).toHaveBeenCalledTimes(1);
    const [habitId, calledDate] = toggleHabitCompletion.mock.calls[0] as [
      number,
      Date,
    ];
    expect(habitId).toBe(1);
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
    const { service, toggleHabitCompletion } = createService(
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

    expect(toggleHabitCompletion).toHaveBeenCalledTimes(1);
    deferred.resolve(updatedHabit);
    await firstCall;
    await secondCall;

    expect(row.completionByDateKey.get(yesterdayKey)).toBe(true);
  });

  it('creates new routine and dispatches kanban refresh', async () => {
    const created = makeHabit({ id: 2, title: 'Workout' });
    const { service, createHabit } = createService([], async () => created, {
      createImpl: async () => created,
    });
    const modal = new HabitsQuickModal(service) as any;
    modal.createTitle = 'Workout';

    await modal.createHabit();

    expect(createHabit).toHaveBeenCalledWith('Workout');
    expect(modal.rows).toHaveLength(1);
    expect(modal.rows[0].habit.title).toBe('Workout');
    expect(modal.createTitle).toBe('');
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

    const headers = Array.from(
      modal.body.querySelectorAll('thead th')
    ) as HTMLTableCellElement[];
    expect(headers).toHaveLength(12);
    expect(headers[0].getAttribute('scope')).toBe('col');
    expect(headers[0].className).toContain('h-11');
    expect(headers[0].className).toContain('z-20');
    expect(headers[1].className).toContain('px-3');
    expect(headers[1].className).toContain('text-[12px]');
    expect(headers[1].className).toContain('bg-indigo-50');
    expect(headers[1].style.background).toBe('');
    expect(headers[11].className).toContain('sticky');
    expect(headers[11].className).toContain('right-0');
    expect(headers[11].className).toContain('z-20');
    expect(headers[11].className).not.toContain('border-l');

    const shortLabel = headers[1].children[1] as HTMLElement;
    expect(shortLabel.className).toContain('text-[12px]');

    const row = modal.body.querySelector('tbody tr') as HTMLTableRowElement | null;
    expect(row).not.toBeNull();
    expect(row?.className).toContain('group');

    const titleCell = row?.querySelector('td') as HTMLTableCellElement | null;
    expect(titleCell).not.toBeNull();
    expect(titleCell?.className).toContain('z-10');
    expect(titleCell?.className).toContain('group-hover:bg-slate-50');
    expect(titleCell?.className).toContain('group-focus-within:bg-slate-50');
    expect(titleCell?.className).not.toContain('group-hover:bg-slate-50/70');

    const bodyCells = Array.from(row?.querySelectorAll('td') ?? []) as
      HTMLTableCellElement[];
    expect(bodyCells).toHaveLength(12);
    expect(bodyCells[11].className).toContain('sticky');
    expect(bodyCells[11].className).toContain('right-0');
    expect(bodyCells[11].className).toContain('z-10');
    expect(bodyCells[11].className).toContain('group-hover:bg-slate-50');
    expect(bodyCells[11].className).toContain('group-focus-within:bg-slate-50');
    expect(bodyCells[11].className).not.toContain('border-l');

    const titleInput = row?.querySelector('input[type="text"]') as
      | HTMLInputElement
      | null;
    expect(titleInput).not.toBeNull();
    expect(titleInput?.getAttribute('data-component')).toBe('HudInputBase');
    expect(titleInput?.className).toContain('text-base');
    expect(titleInput?.className).toContain('md:text-sm');
    expect(titleInput?.className).toContain('focus-visible:ring-2');

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

  it('renames routine and keeps sorted rows', async () => {
    const first = makeHabit({ id: 1, title: 'Alpha' });
    const second = makeHabit({ id: 2, title: 'Beta' });
    const updated = makeHabit({ id: 2, title: 'Aardvark' });
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

    expect(patchHabitTitle).toHaveBeenCalledWith(2, 'Aardvark');
    expect(modal.rows.map((item: any) => item.habit.title)).toEqual([
      'Aardvark',
      'Alpha',
    ]);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('removes routine from list when archive succeeds', async () => {
    const base = makeHabit({ id: 9, title: 'Archive me' });
    const { service, archiveHabit } = createService([base], async () => base);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.archiveHabit(modal.rows[0]);

    expect(archiveHabit).toHaveBeenCalledWith(9);
    expect(modal.rows).toHaveLength(0);
    const eventArg = (globalThis as any).window.dispatchEvent.mock.calls[0][0] as {
      type: string;
    };
    expect(eventArg.type).toBe(KANBAN_REFRESH_REQUEST_EVENT);
  });

  it('stores error and keeps routine when delete fails', async () => {
    const base = makeHabit({ id: 11, title: 'Fragile' });
    const { service, deleteHabit } = createService([base], async () => base, {
      deleteImpl: async () => {
        throw new Error('delete failed');
      },
    });
    vi.spyOn(confirmDeleteRoutineModalModule, 'confirmDeleteRoutineModal').mockResolvedValue(true);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.deleteHabit(modal.rows[0]);

    expect(deleteHabit).toHaveBeenCalledWith(11);
    expect(modal.rows).toHaveLength(1);
    expect(modal.errorKey).toBe('habits.error.delete');
  });

  it('does not delete routine when confirmation is cancelled', async () => {
    const base = makeHabit({ id: 12, title: 'Keep me' });
    const { service, deleteHabit } = createService([base], async () => base);
    vi.spyOn(confirmDeleteRoutineModalModule, 'confirmDeleteRoutineModal').mockResolvedValue(false);
    const modal = new HabitsQuickModal(service) as any;
    modal.rows = [modal.mapHabitToRow(base)];

    await modal.deleteHabit(modal.rows[0]);

    expect(deleteHabit).not.toHaveBeenCalled();
    expect(modal.rows).toHaveLength(1);
  });
});
