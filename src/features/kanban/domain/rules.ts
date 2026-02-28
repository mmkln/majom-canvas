import {
  Status,
  type Habit,
  type PlatformEvent,
  type PlatformTask,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { KanbanColumnId } from '../types.ts';
import { KANBAN_SOON_DAY_LIMIT } from './constants.ts';
import { dayDiff, isSameLocalDay, parseToDate } from './dateUtils.ts';

export function isCompletedStatus(status: Status): boolean {
  return status === Status.Completed || status === Status.Archived;
}

export function isCancelledStatus(status: Status): boolean {
  return status === Status.Cancelled;
}

function isTodoFallbackStatus(status: Status): boolean {
  return (
    status === Status.Active ||
    status === Status.Draft ||
    status === Status.Described
  );
}

function isPast(dueDate: Date, now: Date): boolean {
  return dueDate.getTime() < now.getTime();
}

function isToday(dueDate: Date, now: Date): boolean {
  return isSameLocalDay(dueDate, now);
}

function isTomorrow(diff: number): boolean {
  return diff === 1;
}

function isWithinRange(diff: number, from: number, to: number): boolean {
  return diff >= from && diff <= to;
}

export function categorizeDueDate(
  value: Date | string | null | undefined,
  now: Date
): KanbanColumnId | null {
  const dueDate = parseToDate(value);
  if (!dueDate) return null;
  if (isPast(dueDate, now)) return 'overdue';
  if (isToday(dueDate, now)) return 'today';
  const diff = dayDiff(dueDate, now);
  if (isTomorrow(diff)) return 'tomorrow';
  if (isWithinRange(diff, 2, KANBAN_SOON_DAY_LIMIT)) return 'soon';
  if (diff > KANBAN_SOON_DAY_LIMIT) return 'planned';
  return null;
}

export function resolveTaskColumn(
  task: PlatformTask,
  now: Date
): KanbanColumnId | null {
  const dueDate = parseToDate(task.due_date);
  const isCancelled = isCancelledStatus(task.status);
  const isArchived = task.status === Status.Archived;

  // Rule 1: due today stays in "today" unless cancelled/archived.
  if (dueDate && isToday(dueDate, now) && !isCancelled && !isArchived) {
    return 'today';
  }

  // Rule 2: status mapping.
  if (task.status === Status.Completed) return 'done';
  if (isCancelled) return 'cancelled';

  // Rule 3: due-date mapping.
  const dueDateCategory = categorizeDueDate(dueDate, now);
  if (dueDateCategory) return dueDateCategory;

  // Rule 4: active-like fallback.
  if (isTodoFallbackStatus(task.status)) return 'todo';

  return null;
}

export function shouldIncludeChallengeTask(
  task: PlatformTask,
  column: KanbanColumnId
): boolean {
  if (!task.challenge) return true;
  return column === 'today' || column === 'tomorrow';
}

export function resolveEventColumn(
  event: PlatformEvent,
  now: Date
): KanbanColumnId | null {
  if (isCompletedStatus(event.status) || isCancelledStatus(event.status)) {
    return null;
  }

  const start = parseToDate(event.start_time);
  const end = parseToDate(event.end_time);
  if (!start) return null;

  const diff = dayDiff(start, now);
  if (diff === 0) {
    if (!end || end.getTime() > now.getTime()) {
      return 'today';
    }
    return null;
  }
  if (diff === 1) return 'tomorrow';
  if (diff >= 2 && diff <= KANBAN_SOON_DAY_LIMIT) return 'soon';
  if (diff > KANBAN_SOON_DAY_LIMIT) return 'planned';
  return null;
}

export function isActiveHabit(habit: Habit): boolean {
  return habit.status === Status.Active;
}

export function isHabitCompletedToday(habit: Habit, now: Date): boolean {
  const lastChecked = parseToDate(habit.last_checked);
  if (lastChecked && isSameLocalDay(lastChecked, now)) {
    return true;
  }

  const completions = [
    ...(habit.completions ?? []),
    ...(habit.weekly_completions ?? []),
  ];
  return completions.some(([value, done]) => {
    if (!done) return false;
    const date = parseToDate(value);
    return !!date && isSameLocalDay(date, now);
  });
}
