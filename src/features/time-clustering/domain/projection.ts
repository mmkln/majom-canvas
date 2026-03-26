import type { TimeCluster, TimeClusterSegment } from './types.ts';
import {
  MINUTES_PER_DAY,
  minuteOfDayFromDate,
  parseIsoToMillis,
  startOfDayFromDateKey,
} from './time.ts';

function buildTimeClusterSegment(
  dateKey: string,
  cluster: TimeCluster
): TimeClusterSegment | null {
  const startMs = parseIsoToMillis(cluster.startAtIso);
  const endMs = parseIsoToMillis(cluster.endAtIso);
  const dayStart = startOfDayFromDateKey(dateKey);
  if (startMs === null || endMs === null || !dayStart || endMs <= startMs) {
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

export function buildTimeClusterSegmentsForDate(
  dateKey: string,
  clusters: TimeCluster[]
): TimeClusterSegment[] {
  return clusters
    .map((cluster) => buildTimeClusterSegment(dateKey, cluster))
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
  return buildTimeClusterSegment(dateKey, cluster) !== null;
}
