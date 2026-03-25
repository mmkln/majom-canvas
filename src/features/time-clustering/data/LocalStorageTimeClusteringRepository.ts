import type { TimeClusteringStateSnapshot } from '../domain/types.ts';
import type { TimeClusteringRepository } from './TimeClusteringRepository.ts';

export const TIME_CLUSTERS_STORAGE_KEY = 'time_clusters_v1';

export class LocalStorageTimeClusteringRepository implements TimeClusteringRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  public load(): TimeClusteringStateSnapshot | null {
    const raw = this.storage.getItem(TIME_CLUSTERS_STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as TimeClusteringStateSnapshot;
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.selectedDateKey !== 'string') return null;
      if (parsed.viewMode !== 'day-compact' && parsed.viewMode !== 'week-fullscreen') return null;
      if (!parsed.plansByDate || typeof parsed.plansByDate !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  public save(snapshot: TimeClusteringStateSnapshot): void {
    this.storage.setItem(TIME_CLUSTERS_STORAGE_KEY, JSON.stringify(snapshot));
  }

  public clear(): void {
    this.storage.removeItem(TIME_CLUSTERS_STORAGE_KEY);
  }
}
