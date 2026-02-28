const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toTwoDigits(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function fromDateOnlyString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function parseToDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const fromDateOnly = fromDateOnlyString(value);
  if (fromDateOnly) return fromDateOnly;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function startOfLocalDay(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

export function dayDiff(date: Date, now: Date): number {
  const left = startOfLocalDay(date).getTime();
  const right = startOfLocalDay(now).getTime();
  return Math.floor((left - right) / MS_PER_DAY);
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function toDateInputValue(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = toTwoDigits(date.getMonth() + 1);
  const day = toTwoDigits(date.getDate());
  return `${year}-${month}-${day}`;
}

export function toShortDateLabel(date: Date | null): string {
  if (!date) return 'No date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getMsUntilNextLocalMidnight(now: Date): number {
  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(1_000, nextMidnight.getTime() - now.getTime());
}
