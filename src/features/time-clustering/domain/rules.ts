import type {
  DayClusterPlan,
  DuplicationResult,
  DuplicationWarning,
  TimeCluster,
} from './types.ts';

export const MINUTES_PER_DAY = 24 * 60;

export function clampMinute(value: number): number {
  if (value < 0) return 0;
  if (value > MINUTES_PER_DAY) return MINUTES_PER_DAY;
  return value;
}

export function normalizeCluster(cluster: TimeCluster): TimeCluster {
  const startMinute = clampMinute(cluster.startMinute);
  const endMinute = clampMinute(cluster.endMinute);
  return {
    ...cluster,
    startMinute: Math.min(startMinute, endMinute),
    endMinute: Math.max(startMinute, endMinute),
  };
}

export function canClustersOverlap(a: TimeCluster, b: TimeCluster): boolean {
  // Stage 1 policy: overlap is allowed only when both clusters are explicitly marked parallelizable.
  return a.parallelizable && b.parallelizable;
}

export function hasTimeIntersection(a: TimeCluster, b: TimeCluster): boolean {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

export function validateClusterPlacement(
  candidate: TimeCluster,
  existing: TimeCluster[]
): DuplicationWarning[] {
  const normalized = normalizeCluster(candidate);
  const warnings: DuplicationWarning[] = [];

  for (const cluster of existing) {
    if (!hasTimeIntersection(normalized, cluster)) continue;
    if (canClustersOverlap(normalized, cluster)) continue;
    warnings.push({
      type: 'time-collision',
      sourceClusterId: normalized.id,
      targetClusterId: cluster.id,
    });
  }

  return warnings;
}

export function duplicateDayPlanKeepBoth(params: {
  source: DayClusterPlan;
  targetDateKey: string;
  targetExisting?: DayClusterPlan | null;
  nowIso: string;
}): DuplicationResult {
  const { nowIso, source, targetDateKey, targetExisting } = params;

  const existingClusters = targetExisting?.clusters ?? [];
  const clonedClusters = source.clusters.map((cluster) => ({ ...cluster }));
  const mergedClusters = [...existingClusters, ...clonedClusters];

  const warnings: DuplicationWarning[] = [];
  for (const cluster of clonedClusters) {
    warnings.push(...validateClusterPlacement(cluster, existingClusters));
  }

  return {
    plan: {
      dateKey: targetDateKey,
      clusters: mergedClusters,
      updatedAtIso: nowIso,
    },
    warnings,
  };
}
