import type { I18nService } from '../../../i18n/index.ts';
import { KANBAN_REFRESH_REQUEST_EVENT } from '../../kanban/kanbanEvents.ts';
import type {
  Habit,
  HabitDaySnapshot,
  HabitTrackerDay as HabitTrackerApiDay,
  HabitTrackerHabitSummary,
  HabitTrackerRow,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { HabitDay, HabitRowState } from './HabitTrackerTable.ts';

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseToDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function buildHabitDay(
  value: string | Date,
  i18n: I18nService
): HabitDay {
  const date = parseToDate(value) ?? new Date();
  return {
    date,
    key: toLocalDateKey(date),
    dayLabel: i18n.formatDate(date, { weekday: 'short' }),
    shortLabel: i18n.formatDate(date, {
      month: 'short',
      day: 'numeric',
    }),
  };
}

export function buildTrackerDays(
  days: HabitTrackerApiDay[],
  i18n: I18nService
): HabitDay[] {
  return [...days].reverse().map((day) => buildHabitDay(day.date, i18n));
}

export function emitKanbanRefreshRequest(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KANBAN_REFRESH_REQUEST_EVENT));
}

export function habitSummaryToHabit(
  summary: HabitTrackerHabitSummary,
  options: {
    isDueToday?: boolean;
  } = {}
): Habit {
  return {
    id: summary.id,
    uuid: summary.uuid,
    title: summary.title,
    description: summary.description ?? '',
    created_at: parseToDate(summary.created_at) ?? new Date(),
    priority: summary.priority,
    status: summary.status,
    last_checked: parseToDate(summary.last_checked) ?? new Date(0),
    meta: summary.meta ?? null,
    is_due_today: options.isDueToday ?? false,
    weekly_completions: [],
    completions: [],
  };
}

export function mapTrackerRowToHabitRow(
  row: HabitTrackerRow,
  todayKey: string
): HabitRowState {
  const completionByDateKey = new Map<string, boolean>();
  const todayState = row.day_states.find((item) => item.date === todayKey) ?? null;
  row.day_states.forEach((state) => {
    completionByDateKey.set(state.date, state.is_completed);
  });
  return {
    habit: habitSummaryToHabit(row.habit, {
      isDueToday: todayState?.is_due ?? false,
    }),
    completionByDateKey,
  };
}

export function mapArchivedSummaryToHabitRow(
  summary: HabitTrackerHabitSummary
): HabitRowState {
  return {
    habit: habitSummaryToHabit(summary, { isDueToday: false }),
    completionByDateKey: new Map(),
  };
}

export function mapDaySnapshotToRows(snapshot: HabitDaySnapshot): HabitRowState[] {
  return snapshot.active_habits.map((row) => {
    const completionByDateKey = new Map<string, boolean>();
    completionByDateKey.set(row.state.date, row.state.is_completed);
    return {
      habit: habitSummaryToHabit(row.habit, {
        isDueToday: row.state.is_due,
      }),
      completionByDateKey,
    };
  });
}
