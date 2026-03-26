import type {
  DuplicationResult,
  DuplicationWarning,
  TimeCluster,
} from './types.ts';
import {
  dayDifference,
  differenceInMinutes,
  getDateKeyForIso,
  parseIsoToMillis,
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

export function normalizeCluster(cluster: TimeCluster): TimeCluster {
  const normalizedRange = normalizeIsoRange(cluster);
  return {
    ...cluster,
    ...normalizedRange,
  };
}

export function hasTimeIntersection(a: TimeCluster, b: TimeCluster): boolean {
  const aStart = parseIsoToMillis(a.startAtIso);
  const aEnd = parseIsoToMillis(a.endAtIso);
  const bStart = parseIsoToMillis(b.startAtIso);
  const bEnd = parseIsoToMillis(b.endAtIso);
  if (
    aStart === null ||
    aEnd === null ||
    bStart === null ||
    bEnd === null
  ) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
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
    return getDateKeyForIso(normalized.startAtIso) === sourceDateKey;
  });

  const clonedClusters = sourceClusters.map((cluster, index) =>
    normalizeCluster({
      ...cluster,
      id: buildDuplicateClusterId(cluster, targetDateKey, index),
      startAtIso:
        shiftIsoByDays(cluster.startAtIso, dayOffset) ?? cluster.startAtIso,
      endAtIso: shiftIsoByDays(cluster.endAtIso, dayOffset) ?? cluster.endAtIso,
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
