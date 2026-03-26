import type {
  DuplicationResult,
  DuplicationWarning,
  TimeCluster,
  TimeClusterRecurrence,
} from './types.ts';
import { buildTimeClusterSegmentsForDate } from './projection.ts';
import {
  dateFromKey,
  dayDifference,
  differenceInMinutes,
  getDateKeyForIso,
  parseIsoToMillis,
  dayOffsetDateKey,
  shiftIsoByDays,
} from './time.ts';

export { MINUTES_PER_DAY } from './time.ts';

export const MIN_CLUSTER_DURATION_MINUTES = 15;

function fallbackStartTime(): number {
  return Date.now();
}

function normalizeIsoRange(cluster: TimeCluster): {
  startAtIso: string;
  endAtIso: string;
} {
  const rawStartMs = parseIsoToMillis(cluster.startAtIso);
  const rawEndMs = parseIsoToMillis(cluster.endAtIso);
  let startMs =
    rawStartMs ?? (rawEndMs ?? fallbackStartTime()) - MIN_CLUSTER_DURATION_MINUTES * 60_000;
  let endMs =
    rawEndMs ?? (rawStartMs ?? fallbackStartTime()) + MIN_CLUSTER_DURATION_MINUTES * 60_000;

  if (endMs - startMs < MIN_CLUSTER_DURATION_MINUTES * 60_000) {
    endMs = startMs + MIN_CLUSTER_DURATION_MINUTES * 60_000;
  }

  return {
    startAtIso: new Date(startMs).toISOString(),
    endAtIso: new Date(endMs).toISOString(),
  };
}

function normalizeRecurrence(
  recurrence: TimeCluster['recurrence'] | undefined
): TimeClusterRecurrence {
  switch (recurrence) {
    case 'daily':
    case 'weekdays':
    case 'weekly':
      return recurrence;
    default:
      return 'none';
  }
}

function getDateKeyWeekday(dateKey: string): number | null {
  const date = dateFromKey(dateKey);
  return date ? date.getDay() : null;
}

function normalizeRecurrenceEndDateKey(cluster: TimeCluster): string | null {
  if (cluster.recurrence === 'none') {
    return null;
  }
  if (
    typeof cluster.recurrenceEndDateKey !== 'string' ||
    !dateFromKey(cluster.recurrenceEndDateKey)
  ) {
    return null;
  }

  const anchorDateKey = getDateKeyForIso(cluster.startAtIso);
  if (
    anchorDateKey &&
    dayDifference(anchorDateKey, cluster.recurrenceEndDateKey) < 0
  ) {
    return anchorDateKey;
  }

  return cluster.recurrenceEndDateKey;
}

function normalizeRecurrenceWeekdays(cluster: TimeCluster): number[] | undefined {
  if (cluster.recurrence !== 'weekly') {
    return undefined;
  }

  const provided = Array.isArray(cluster.recurrenceWeekdays)
    ? [...new Set(
        cluster.recurrenceWeekdays
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
      )].sort((a, b) => a - b)
    : [];
  if (provided.length > 0) {
    return provided;
  }

  const anchorDateKey = getDateKeyForIso(cluster.startAtIso);
  const anchorWeekday = anchorDateKey
    ? getDateKeyWeekday(anchorDateKey)
    : null;
  return anchorWeekday === null ? undefined : [anchorWeekday];
}

function isRecurring(cluster: TimeCluster): boolean {
  return cluster.recurrence !== 'none';
}

function getClusterSpanDays(cluster: TimeCluster): number {
  const startMs = parseIsoToMillis(cluster.startAtIso);
  const endMs = parseIsoToMillis(cluster.endAtIso);
  if (startMs === null || endMs === null || endMs <= startMs) {
    return 1;
  }
  return Math.max(1, Math.ceil((endMs - startMs) / 86_400_000));
}

function enumerateClusterDateKeys(cluster: TimeCluster): string[] {
  const startDateKey = getDateKeyForIso(cluster.startAtIso);
  const endDateKey = getDateKeyForIso(cluster.endAtIso);
  if (!startDateKey || !endDateKey) {
    return [];
  }

  const diff = dayDifference(startDateKey, endDateKey);
  const length = Math.max(diff, 0);
  return Array.from({ length: length + 1 }, (_, index) =>
    dayOffsetDateKey(startDateKey, index)
  );
}

function compareDateKeys(a: string, b: string): number {
  const dateA = dateFromKey(a);
  const dateB = dateFromKey(b);
  if (!dateA || !dateB) return 0;
  return dateA.getTime() - dateB.getTime();
}

export function normalizeCluster(cluster: TimeCluster): TimeCluster {
  const normalizedRange = normalizeIsoRange(cluster);
  return {
    ...cluster,
    description:
      typeof cluster.description === 'string' ? cluster.description : '',
    ...normalizedRange,
    recurrence: normalizeRecurrence(cluster.recurrence),
    recurrenceEndDateKey: normalizeRecurrenceEndDateKey({
      ...cluster,
      ...normalizedRange,
      recurrence: normalizeRecurrence(cluster.recurrence),
    }),
    recurrenceWeekdays: normalizeRecurrenceWeekdays({
      ...cluster,
      ...normalizedRange,
      recurrence: normalizeRecurrence(cluster.recurrence),
    }),
  };
}

function collectCollisionDateKeys(a: TimeCluster, b: TimeCluster): string[] {
  const keys = new Set<string>();
  const clusterADateKeys = enumerateClusterDateKeys(a);
  const clusterBDateKeys = enumerateClusterDateKeys(b);
  clusterADateKeys.forEach((key) => keys.add(key));
  clusterBDateKeys.forEach((key) => keys.add(key));

  if (isRecurring(a) && !isRecurring(b)) {
    return [...keys];
  }

  if (!isRecurring(a) && isRecurring(b)) {
    return [...keys];
  }

  if (isRecurring(a) && isRecurring(b)) {
    const startA = getDateKeyForIso(a.startAtIso);
    const startB = getDateKeyForIso(b.startAtIso);
    const anchors = [startA, startB].filter(
      (value): value is string => typeof value === 'string'
    );
    if (anchors.length > 0) {
      const laterAnchor = anchors.sort(compareDateKeys)[anchors.length - 1];
      const maxSpanDays = Math.max(getClusterSpanDays(a), getClusterSpanDays(b));
      for (let offset = -maxSpanDays; offset <= 13; offset += 1) {
        keys.add(dayOffsetDateKey(laterAnchor, offset));
      }
    }
  }

  return [...keys];
}

export function hasTimeIntersection(a: TimeCluster, b: TimeCluster): boolean {
  const normalizedA = normalizeCluster(a);
  const normalizedB = normalizeCluster(b);
  const dateKeys = collectCollisionDateKeys(normalizedA, normalizedB);
  for (const dateKey of dateKeys) {
    const aSegments = buildTimeClusterSegmentsForDate(dateKey, [normalizedA]);
    const bSegments = buildTimeClusterSegmentsForDate(dateKey, [normalizedB]);
    for (const aSegment of aSegments) {
      for (const bSegment of bSegments) {
        if (
          aSegment.startMinute < bSegment.endMinute &&
          bSegment.startMinute < aSegment.endMinute
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

export function validateClusterPlacement(
  candidate: TimeCluster,
  existing: TimeCluster[]
): DuplicationWarning[] {
  const normalized = normalizeCluster(candidate);
  const warnings: DuplicationWarning[] = [];

  for (const cluster of existing) {
    if (!hasTimeIntersection(normalized, cluster)) continue;
    warnings.push({
      type: 'time-collision',
      sourceClusterId: normalized.id,
      targetClusterId: cluster.id,
    });
  }

  return warnings;
}

function buildDuplicateClusterId(
  cluster: TimeCluster,
  targetDateKey: string,
  index: number
): string {
  return `${cluster.id}_${targetDateKey}_${index + 1}`;
}

export function duplicateDayClusters(params: {
  clusters: TimeCluster[];
  sourceDateKey: string;
  targetDateKey: string;
}): DuplicationResult {
  const { clusters, sourceDateKey, targetDateKey } = params;
  const dayOffset = dayDifference(sourceDateKey, targetDateKey);
  const sourceClusters = clusters.filter((cluster) => {
    const normalized = normalizeCluster(cluster);
    return (
      normalized.recurrence === 'none' &&
      getDateKeyForIso(normalized.startAtIso) === sourceDateKey
    );
  });

  const clonedClusters = sourceClusters.map((cluster, index) =>
    normalizeCluster({
      ...cluster,
      id: buildDuplicateClusterId(cluster, targetDateKey, index),
      startAtIso:
        shiftIsoByDays(cluster.startAtIso, dayOffset) ?? cluster.startAtIso,
      endAtIso: shiftIsoByDays(cluster.endAtIso, dayOffset) ?? cluster.endAtIso,
      recurrence: 'none',
    })
  );

  const warnings: DuplicationWarning[] = [];
  for (const cluster of clonedClusters) {
    warnings.push(...validateClusterPlacement(cluster, clusters));
  }

  return {
    clusters: clonedClusters,
    warnings,
  };
}

export function getClusterDurationMinutes(cluster: TimeCluster): number {
  return Math.max(
    MIN_CLUSTER_DURATION_MINUTES,
    differenceInMinutes(cluster.startAtIso, cluster.endAtIso)
  );
}
