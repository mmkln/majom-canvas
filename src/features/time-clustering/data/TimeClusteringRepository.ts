import type { TimeClusteringStateSnapshot } from '../domain/types.ts';

export type TimeClusteringRepositoryResult<T> = T | Promise<T>;

export interface TimeClusteringRepository {
  load(): TimeClusteringRepositoryResult<TimeClusteringStateSnapshot | null>;
  save(
    snapshot: TimeClusteringStateSnapshot
  ): TimeClusteringRepositoryResult<void>;
  clear(): TimeClusteringRepositoryResult<void>;
}
