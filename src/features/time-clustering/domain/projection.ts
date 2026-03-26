import type {
  TimeCluster,
  TimeClusterRecurrence,
  TimeClusterSegment,
} from './types.ts';
import {
  dateFromKey,
  dayDifference,
  dayOffsetDateKey,
  getDateKeyForIso,
  MINUTES_PER_DAY,
  minuteOfDayFromDate,
  parseIsoToMillis,
  shiftIsoByDays,
  startOfDayFromDateKey,
} from './time.ts';

const DAY_MS = 86_400_000;

function buildTimeClusterSegmentForInterval(params: {
  dateKey: string;
  cluster: TimeCluster;
  startMs: number;
  endMs: number;
}): TimeClusterSegment | null {
  const { dateKey, cluster, startMs, endMs } = params;
  const dayStart = startOfDayFromDateKey(dateKey);
  if (!dayStart || endMs <= startMs) {
    return null;
  }

  const dayStartMs = dayStart.getTime();
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const dayEndMs = dayEnd.getTime();

  if (endMs <= dayStartMs || startMs >= dayEndMs) {
    return null;
  }

  const segmentStartMs = Math.max(startMs, dayStartMs);
  const segmentEndMs = Math.min(endMs, dayEndMs);
  const segmentStartDate = new Date(segmentStartMs);
  const segmentEndDate = new Date(segmentEndMs);

  return {
    cluster,
    dateKey,
    startMinute:
      segmentStartMs <= dayStartMs
        ? 0
        : Math.max(0, Math.min(MINUTES_PER_DAY, minuteOfDayFromDate(segmentStartDate))),
    endMinute:
      segmentEndMs >= dayEndMs
        ? MINUTES_PER_DAY
        : Math.max(0, Math.min(MINUTES_PER_DAY, minuteOfDayFromDate(segmentEndDate))),
    continuesBefore: startMs < dayStartMs,
    continuesAfter: endMs > dayEndMs,
    isStartSegment: startMs >= dayStartMs && startMs < dayEndMs,
    isEndSegment: endMs > dayStartMs && endMs <= dayEndMs,
  };
}

function isWeekdayDateKey(dateKey: string): boolean {
  const date = dateFromKey(dateKey);
  if (!date) return false;
  const weekday = date.getDay();
  return weekday >= 1 && weekday <= 5;
}

function getDateKeyWeekday(dateKey: string): number | null {
  const date = dateFromKey(dateKey);
  return date ? date.getDay() : null;
}

function getRecurringWeekdaySet(
  cluster: TimeCluster,
  anchorDateKey: string
): Set<number> {
  if (cluster.recurrence === 'weekdays') {
    return new Set([1, 2, 3, 4, 5]);
  }
  if (cluster.recurrence === 'weekly') {
    if (Array.isArray(cluster.recurrenceWeekdays) && cluster.recurrenceWeekdays.length > 0) {
      return new Set(cluster.recurrenceWeekdays);
    }
    const anchorWeekday = getDateKeyWeekday(anchorDateKey);
    return anchorWeekday === null ? new Set() : new Set([anchorWeekday]);
  }
  return new Set();
}

function recurrenceOccursOnDate(
  cluster: TimeCluster,
  anchorDateKey: string,
  occurrenceDateKey: string
): boolean {
  const diff = dayDifference(anchorDateKey, occurrenceDateKey);
  if (diff < 0) return false;
  if (
    cluster.recurrenceEndDateKey &&
    dayDifference(occurrenceDateKey, cluster.recurrenceEndDateKey) < 0
  ) {
    return false;
  }

  switch (cluster.recurrence) {
    case 'none':
      return diff === 0;
    case 'daily':
      return true;
    case 'weekdays':
    case 'weekly': {
      const weekday = getDateKeyWeekday(occurrenceDateKey);
      if (weekday === null) return false;
      const recurringWeekdays = getRecurringWeekdaySet(cluster, anchorDateKey);
      return recurringWeekdays.has(weekday);
    }
    default:
      return false;
  }
}

function buildOccurrenceIntervalsForDate(
  dateKey: string,
  cluster: TimeCluster
): Array<{ startMs: number; endMs: number }> {
  const startMs = parseIsoToMillis(cluster.startAtIso);
  const endMs = parseIsoToMillis(cluster.endAtIso);
  const anchorDateKey = getDateKeyForIso(cluster.startAtIso);
  const dayStart = startOfDayFromDateKey(dateKey);
  if (
    startMs === null ||
    endMs === null ||
    endMs <= startMs ||
    !anchorDateKey ||
    !dayStart
  ) {
    return [];
  }

  if (cluster.recurrence === 'none') {
    return [{ startMs, endMs }];
  }

  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + DAY_MS;
  const spanDays = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
  const intervals: Array<{ startMs: number; endMs: number }> = [];
  const seen = new Set<string>();

  for (let offset = spanDays; offset >= 0; offset -= 1) {
    const occurrenceDateKey = dayOffsetDateKey(dateKey, -offset);
    if (
      !recurrenceOccursOnDate(cluster, anchorDateKey, occurrenceDateKey)
    ) {
      continue;
    }

    const deltaDays = dayDifference(anchorDateKey, occurrenceDateKey);
    const shiftedStartAtIso = shiftIsoByDays(cluster.startAtIso, deltaDays);
    const shiftedEndAtIso = shiftIsoByDays(cluster.endAtIso, deltaDays);
    const occurrenceStartMs = shiftedStartAtIso
      ? parseIsoToMillis(shiftedStartAtIso)
      : null;
    const occurrenceEndMs = shiftedEndAtIso
      ? parseIsoToMillis(shiftedEndAtIso)
      : null;
    if (
      occurrenceStartMs === null ||
      occurrenceEndMs === null ||
      occurrenceEndMs <= occurrenceStartMs
    ) {
      continue;
    }
    if (occurrenceEndMs <= dayStartMs || occurrenceStartMs >= dayEndMs) {
      continue;
    }

    const key = `${occurrenceStartMs}:${occurrenceEndMs}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    intervals.push({
      startMs: occurrenceStartMs,
      endMs: occurrenceEndMs,
    });
  }

  return intervals.sort((a, b) => a.startMs - b.startMs);
}

export function buildTimeClusterSegmentsForDate(
  dateKey: string,
  clusters: TimeCluster[]
): TimeClusterSegment[] {
  return clusters
    .flatMap((cluster) =>
      buildOccurrenceIntervalsForDate(dateKey, cluster).map((occurrence) =>
        buildTimeClusterSegmentForInterval({
          dateKey,
          cluster,
          startMs: occurrence.startMs,
          endMs: occurrence.endMs,
        })
      )
    )
    .filter((segment): segment is TimeClusterSegment => segment !== null);
}

export function buildTimeClusterSegmentsByDate(
  dateKeys: string[],
  clusters: TimeCluster[]
): Record<string, TimeClusterSegment[]> {
  const segmentsByDate: Record<string, TimeClusterSegment[]> = {};
  dateKeys.forEach((dateKey) => {
    segmentsByDate[dateKey] = buildTimeClusterSegmentsForDate(dateKey, clusters);
  });
  return segmentsByDate;
}

export function clusterIntersectsDateKey(
  cluster: TimeCluster,
  dateKey: string
): boolean {
  return buildTimeClusterSegmentsForDate(dateKey, [cluster]).length > 0;
}
