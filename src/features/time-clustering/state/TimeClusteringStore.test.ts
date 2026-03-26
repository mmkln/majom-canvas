import { describe, expect, it, vi } from 'vitest';
import { buildTimeClusterSegmentsForDate } from '../domain/projection.ts';
import { isoFromDateKeyMinute } from '../domain/time.ts';
import type { TimeCluster, TimeClusteringStateSnapshot } from '../domain/types.ts';
import type { TimeClusteringRepository } from '../data/TimeClusteringRepository.ts';
import { TimeClusteringStore } from './TimeClusteringStore.ts';

function createRepository(
  snapshot: TimeClusteringStateSnapshot
): TimeClusteringRepository {
  return {
    load: () => snapshot,
    save: vi.fn(),
    clear: vi.fn(),
  };
}

function createCluster(params: {
  id: string;
  title: string;
  colorToken: string;
  startDateKey: string;
  startMinute: number;
  endDateKey?: string;
  endMinute: number;
}): TimeCluster {
  return {
    id: params.id,
    title: params.title,
    colorToken: params.colorToken,
    startAtIso: isoFromDateKeyMinute(params.startDateKey, params.startMinute),
    endAtIso: isoFromDateKeyMinute(
      params.endDateKey ?? params.startDateKey,
      params.endMinute
    ),
  };
}

describe('TimeClusteringStore', () => {
  it('detects an overlap against a carry-over cluster from the previous day', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-25',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-sleep',
            title: 'Sleep',
            colorToken: 'indigo',
            startDateKey: '2026-03-24',
            startMinute: 22 * 60,
            endDateKey: '2026-03-25',
            endMinute: 6 * 60,
          }),
        ],
      })
    );

    store.createCluster(
      createCluster({
        id: 'cluster-standup',
        title: 'Standup',
        colorToken: 'blue',
        startDateKey: '2026-03-25',
        startMinute: 5 * 60 + 30,
        endMinute: 7 * 60,
      })
    );

    expect(store.getSnapshot().lastWarnings).toEqual([
      {
        type: 'time-collision',
        sourceClusterId: 'cluster-standup',
        targetClusterId: 'cluster-sleep',
      },
    ]);

    store.destroy();
  });

  it('duplicates a day by shifting the source cluster interval and assigning a new id', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-25',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-focus',
            title: 'Focus',
            colorToken: 'blue',
            startDateKey: '2026-03-25',
            startMinute: 9 * 60,
            endMinute: 10 * 60,
          }),
        ],
      })
    );

    store.duplicateDayOneOff('2026-03-25', '2026-03-27');

    const snapshot = store.getSnapshot();
    expect(snapshot.clusters).toHaveLength(2);
    const duplicatedCluster = snapshot.clusters.find(
      (cluster) => cluster.id !== 'cluster-focus'
    );
    expect(duplicatedCluster).toBeDefined();
    const segment = buildTimeClusterSegmentsForDate(
      '2026-03-27',
      duplicatedCluster ? [duplicatedCluster] : []
    )[0];
    expect(segment?.startMinute).toBe(9 * 60);
    expect(segment?.endMinute).toBe(10 * 60);

    store.destroy();
  });
});
