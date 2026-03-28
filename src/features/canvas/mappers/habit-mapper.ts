import { Status, type Habit } from '../../../majom-wrapper/interfaces/index.ts';
import type { CanvasPositionReadDTO } from '../../../majom-wrapper/data-access/canvas-position-dto.ts';
import { normalizeUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { HabitElement } from '../elements/HabitElement.ts';
import { getHabitLifecycleStatus } from '../elements/utils/planningElementCapabilities.ts';

const DEFAULT_X = 0;
const DEFAULT_Y = 0;

function parseToDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildHabitCompletionHistory(habit: Habit): Array<[string, boolean]> {
  const completionByDate = new Map<string, boolean>();
  const appendEntries = (entries: Array<[string, boolean]> | undefined) => {
    entries?.forEach(([value, done]) => {
      const date = parseToDate(value);
      if (!date) return;
      completionByDate.set(toDateKey(date), done);
    });
  };
  appendEntries(habit.weekly_completions);
  appendEntries(habit.completions);

  const lastChecked = parseToDate(habit.last_checked);
  if (lastChecked) {
    completionByDate.set(toDateKey(lastChecked), true);
  }

  return Array.from(completionByDate.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function isHabitCompletedToday(habit: Habit, now: Date): boolean {
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

export function mapHabit(
  dto: Habit,
  layout: CanvasPositionReadDTO[],
  now: Date = new Date()
): HabitElement {
  const pos = layout.find((entry) => {
    if (entry.element_type !== 'habit') return false;
    if (!dto.uuid) return false;
    return entry.element_uuid === dto.uuid;
  });

  return new HabitElement({
    id: dto.id,
    x: pos?.x ?? DEFAULT_X,
    y: pos?.y ?? DEFAULT_Y,
    backendId: dto.id,
    uuid: dto.uuid ?? dto.id,
    title: dto.title,
    description: dto.description,
    habitStatus: getHabitLifecycleStatus(dto.status ?? Status.Active),
    priority: normalizeUiPriority(dto.priority),
    meta: dto.meta ?? null,
    completedToday: isHabitCompletedToday(dto, now),
    isDueToday: dto.is_due_today === true,
    lastChecked: parseToDate(dto.last_checked),
    completionHistory: buildHabitCompletionHistory(dto),
  });
}
