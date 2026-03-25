import type { TimeClusteringStateSnapshot, TimeClusteringViewMode } from '../domain/types.ts';
import type { TimeClusteringRepository } from '../data/TimeClusteringRepository.ts';

export type TimeClusteringStoreListener = (snapshot: TimeClusteringStateSnapshot) => void;

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultSnapshot(): TimeClusteringStateSnapshot {
  return {
    selectedDateKey: todayDateKey(),
    viewMode: 'day-compact',
    plansByDate: {},
  };
}

export class TimeClusteringStore {
  private snapshot: TimeClusteringStateSnapshot;
  private readonly listeners = new Set<TimeClusteringStoreListener>();

  constructor(private readonly repository: TimeClusteringRepository) {
    this.snapshot = repository.load() ?? createDefaultSnapshot();
  }

  public getSnapshot(): TimeClusteringStateSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: TimeClusteringStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSelectedDate(dateKey: string): void {
    this.snapshot = {
      ...this.snapshot,
      selectedDateKey: dateKey,
    };
    this.publish();
  }

  public setViewMode(mode: TimeClusteringViewMode): void {
    this.snapshot = {
      ...this.snapshot,
      viewMode: mode,
    };
    this.publish();
  }

  public upsertDayPlan(next: TimeClusteringStateSnapshot['plansByDate'][string]): void {
    this.snapshot = {
      ...this.snapshot,
      plansByDate: {
        ...this.snapshot.plansByDate,
        [next.dateKey]: next,
      },
    };
    this.publish();
  }

  private publish(): void {
    this.repository.save(this.snapshot);
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }
}
