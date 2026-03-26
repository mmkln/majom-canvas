export const MINUTES_PER_DAY = 24 * 60;

type ParsedDateKey = {
  year: number;
  monthIndex: number;
  day: number;
};

function parseDateKey(dateKey: string): ParsedDateKey | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    Number.isNaN(day) ||
    monthIndex < 0 ||
    monthIndex > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return { year, monthIndex, day };
}

export function dateFromKey(dateKey: string): Date | null {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  const date = new Date(
    parsed.year,
    parsed.monthIndex,
    parsed.day,
    12,
    0,
    0,
    0
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDayFromDateKey(dateKey: string): Date | null {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return null;
  const date = new Date(parsed.year, parsed.monthIndex, parsed.day, 0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateKeyForIso(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateKeyFromDate(date);
}

export function todayDateKey(): string {
  return dateKeyFromDate(new Date());
}

export function currentMinuteOfDay(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function minuteOfDayFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function dayOffsetDateKey(baseDateKey: string, offset: number): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  date.setDate(date.getDate() + offset);
  return dateKeyFromDate(date);
}

export function dayDifference(
  sourceDateKey: string,
  targetDateKey: string
): number {
  const source = dateFromKey(sourceDateKey);
  const target = dateFromKey(targetDateKey);
  if (!source || !target) return 0;
  return Math.round((target.getTime() - source.getTime()) / 86_400_000);
}

export function startOfWeekDateKey(baseDateKey: string): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return dateKeyFromDate(date);
}

export function clampMinute(minute: number): number {
  return Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minute)));
}

export function isoFromDateKeyMinute(dateKey: string, minute: number): string {
  const startOfDay = startOfDayFromDateKey(dateKey);
  if (!startOfDay) {
    return new Date().toISOString();
  }
  const clampedMinute = clampMinute(minute);
  startOfDay.setMinutes(clampedMinute, 0, 0);
  return startOfDay.toISOString();
}

export function formatDateTimeLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function isoFromLocalDateTimeInput(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseIsoToMillis(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function shiftIsoByMinutes(
  iso: string,
  deltaMinutes: number
): string | null {
  const timestamp = parseIsoToMillis(iso);
  if (timestamp === null) return null;
  return new Date(timestamp + deltaMinutes * 60_000).toISOString();
}

export function shiftIsoByDays(iso: string, deltaDays: number): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + deltaDays);
  return date.toISOString();
}

export function differenceInMinutes(startIso: string, endIso: string): number {
  const startMs = parseIsoToMillis(startIso);
  const endMs = parseIsoToMillis(endIso);
  if (startMs === null || endMs === null) return 0;
  return Math.round((endMs - startMs) / 60_000);
}
