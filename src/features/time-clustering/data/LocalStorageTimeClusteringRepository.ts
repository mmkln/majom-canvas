import { normalizeCluster } from '../domain/rules.ts';
import { dayOffsetDateKey, isoFromDateKeyMinute } from '../domain/time.ts';
import type {
  DuplicationWarning,
  TimeCluster,
  TimeClusteringStateSnapshot,
} from '../domain/types.ts';
import type { TimeClusteringRepository } from './TimeClusteringRepository.ts';

const LEGACY_TIME_CLUSTERS_STORAGE_KEY = 'time_clusters_v1';
export const TIME_CLUSTERS_STORAGE_KEY = 'time_clusters_v2';

type LegacyTimeCluster = {
  id?: unknown;
  title?: unknown;
  colorToken?: unknown;
  startMinute?: unknown;
  endMinute?: unknown;
};

type LegacyDayClusterPlan = {
  dateKey?: unknown;
  clusters?: unknown;
};

type LegacySnapshot = {
  selectedDateKey?: unknown;
  weekAnchorDateKey?: unknown;
  plansByDate?: unknown;
  clusters?: unknown;
  lastWarnings?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeWarnings(value: unknown): DuplicationWarning[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is DuplicationWarning =>
      isRecord(entry) &&
      entry.type === 'time-collision' &&
      typeof entry.sourceClusterId === 'string' &&
      typeof entry.targetClusterId === 'string'
  );
}

function uniqueClusterId(
  rawId: string,
  dateKey: string,
  seenIds: Set<string>
): string {
  let candidate = rawId;
  let suffix = 1;
  while (seenIds.has(candidate)) {
    suffix += 1;
    candidate = `${rawId}_${dateKey}_${suffix}`;
  }
  seenIds.add(candidate);
  return candidate;
}

function normalizeClusterRecord(
  value: unknown,
  fallbackId: string
): TimeCluster | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.colorToken !== 'string' ||
    typeof value.startAtIso !== 'string' ||
    typeof value.endAtIso !== 'string'
  ) {
    return null;
  }

  return normalizeCluster({
    id: value.id || fallbackId,
    title: value.title,
    colorToken: value.colorToken,
    startAtIso: value.startAtIso,
    endAtIso: value.endAtIso,
  });
}

function migrateLegacyPlans(
  plansByDate: Record<string, unknown>
): TimeCluster[] {
  const migratedClusters: TimeCluster[] = [];
  const seenIds = new Set<string>();

  Object.entries(plansByDate).forEach(([fallbackDateKey, rawPlan]) => {
    if (!isRecord(rawPlan)) return;
    const plan = rawPlan as LegacyDayClusterPlan;
    const dateKey =
      typeof plan.dateKey === 'string' && plan.dateKey.length > 0
        ? plan.dateKey
        : fallbackDateKey;
    if (!Array.isArray(plan.clusters)) return;

    plan.clusters.forEach((rawCluster, index) => {
      const cluster = rawCluster as LegacyTimeCluster;
      const rawId =
        typeof cluster.id === 'string' && cluster.id.length > 0
          ? cluster.id
          : `cluster_${dateKey}_${index + 1}`;
      const uniqueId = uniqueClusterId(rawId, dateKey, seenIds);
      const title =
        typeof cluster.title === 'string' && cluster.title.length > 0
          ? cluster.title
          : `Cluster ${index + 1}`;
      const colorToken =
        typeof cluster.colorToken === 'string' && cluster.colorToken.length > 0
          ? cluster.colorToken
          : 'blue';
      const startMinute = Number(cluster.startMinute ?? 9 * 60);
      const endMinute = Number(cluster.endMinute ?? 10 * 60);
      const endDateKey =
        endMinute < startMinute ? dayOffsetDateKey(dateKey, 1) : dateKey;
      migratedClusters.push(
        normalizeCluster({
          id: uniqueId,
          title,
          colorToken,
          startAtIso: isoFromDateKeyMinute(dateKey, startMinute),
          endAtIso: isoFromDateKeyMinute(endDateKey, endMinute),
        })
      );
    });
  });

  return migratedClusters;
}

function normalizeSnapshot(raw: unknown): TimeClusteringStateSnapshot | null {
  if (!isRecord(raw)) return null;
  const parsed = raw as LegacySnapshot;
  if (typeof parsed.selectedDateKey !== 'string') return null;

  const weekAnchorDateKey =
    typeof parsed.weekAnchorDateKey === 'string'
      ? parsed.weekAnchorDateKey
      : parsed.selectedDateKey;
  const lastWarnings = normalizeWarnings(parsed.lastWarnings);

  if (Array.isArray(parsed.clusters)) {
    const clusters = parsed.clusters
      .map((cluster, index) =>
        normalizeClusterRecord(cluster, `cluster_${index + 1}`)
      )
      .filter((cluster): cluster is TimeCluster => cluster !== null);

    return {
      selectedDateKey: parsed.selectedDateKey,
      weekAnchorDateKey,
      clusters,
      lastWarnings,
    };
  }

  if (isRecord(parsed.plansByDate)) {
    return {
      selectedDateKey: parsed.selectedDateKey,
      weekAnchorDateKey,
      clusters: migrateLegacyPlans(parsed.plansByDate),
      lastWarnings,
    };
  }

  return null;
}

export class LocalStorageTimeClusteringRepository
  implements TimeClusteringRepository
{
  constructor(private readonly storage: Storage = window.localStorage) {}

  public load(): TimeClusteringStateSnapshot | null {
    const raw =
      this.storage.getItem(TIME_CLUSTERS_STORAGE_KEY) ??
      this.storage.getItem(LEGACY_TIME_CLUSTERS_STORAGE_KEY);
    if (!raw) return null;

    try {
      return normalizeSnapshot(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  public save(snapshot: TimeClusteringStateSnapshot): void {
    this.storage.setItem(TIME_CLUSTERS_STORAGE_KEY, JSON.stringify(snapshot));
  }

  public clear(): void {
    this.storage.removeItem(TIME_CLUSTERS_STORAGE_KEY);
    this.storage.removeItem(LEGACY_TIME_CLUSTERS_STORAGE_KEY);
  }
}
