import type { TimeClusteringStateSnapshot } from '../domain/types.ts';

export interface TimeClusteringRepository {
  load(): TimeClusteringStateSnapshot | null;
  save(snapshot: TimeClusteringStateSnapshot): void;
  clear(): void;
}
