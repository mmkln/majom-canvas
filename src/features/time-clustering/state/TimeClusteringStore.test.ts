import { describe, expect, it, vi } from 'vitest';
import { buildTimeClusterSegmentsForDate } from '../domain/projection.ts';
import { isoFromDateKeyMinute } from '../domain/time.ts';
import type {
  TimeCluster,
  TimeClusterRecurrence,
  TimeClusteringStateSnapshot,
} from '../domain/types.ts';
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
  recurrence?: TimeClusterRecurrence;
  recurrenceEndDateKey?: string | null;
  recurrenceWeekdays?: number[];
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
    recurrence: params.recurrence ?? 'none',
    recurrenceEndDateKey: params.recurrenceEndDateKey ?? null,
    recurrenceWeekdays: params.recurrenceWeekdays,
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

  it('detects overlap between a weekly cluster and a matching one-off occurrence', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-25',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-weekly',
            title: 'Weekly sync',
            colorToken: 'teal',
            startDateKey: '2026-03-18',
            startMinute: 9 * 60,
            endMinute: 10 * 60,
            recurrence: 'weekly',
          }),
        ],
      })
    );

    store.createCluster(
      createCluster({
        id: 'cluster-one-off',
        title: 'One-off conflict',
        colorToken: 'blue',
        startDateKey: '2026-03-25',
        startMinute: 9 * 60 + 15,
        endMinute: 9 * 60 + 45,
      })
    );

    expect(store.getSnapshot().lastWarnings).toEqual([
      {
        type: 'time-collision',
        sourceClusterId: 'cluster-one-off',
        targetClusterId: 'cluster-weekly',
      },
    ]);

    store.destroy();
  });

  it('detects overlap between a daily cluster and a one-off occurrence on a later day', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-26',
        weekAnchorDateKey: '2026-03-26',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-daily',
            title: 'Daily sync',
            colorToken: 'teal',
            startDateKey: '2026-03-24',
            startMinute: 9 * 60,
            endMinute: 10 * 60,
            recurrence: 'daily',
          }),
        ],
      })
    );

    store.createCluster(
      createCluster({
        id: 'cluster-one-off',
        title: 'Conflict',
        colorToken: 'blue',
        startDateKey: '2026-03-26',
        startMinute: 9 * 60 + 15,
        endMinute: 9 * 60 + 45,
      })
    );

    expect(store.getSnapshot().lastWarnings).toEqual([
      {
        type: 'time-collision',
        sourceClusterId: 'cluster-one-off',
        targetClusterId: 'cluster-daily',
      },
    ]);

    store.destroy();
  });

  it('detects overlap between a weekday cluster and a weekday one-off occurrence', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-27',
        weekAnchorDateKey: '2026-03-27',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-weekdays',
            title: 'Weekday focus',
            colorToken: 'violet',
            startDateKey: '2026-03-23',
            startMinute: 14 * 60,
            endMinute: 15 * 60,
            recurrence: 'weekdays',
          }),
        ],
      })
    );

    store.createCluster(
      createCluster({
        id: 'cluster-friday',
        title: 'Friday conflict',
        colorToken: 'amber',
        startDateKey: '2026-03-27',
        startMinute: 14 * 60 + 15,
        endMinute: 14 * 60 + 45,
      })
    );

    expect(store.getSnapshot().lastWarnings).toEqual([
      {
        type: 'time-collision',
        sourceClusterId: 'cluster-friday',
        targetClusterId: 'cluster-weekdays',
      },
    ]);

    store.destroy();
  });

  it('detects overlap against a weekly cluster configured for multiple weekdays', () => {
    const store = new TimeClusteringStore(
      createRepository({
        selectedDateKey: '2026-03-27',
        weekAnchorDateKey: '2026-03-27',
        lastWarnings: [],
        clusters: [
          createCluster({
            id: 'cluster-review',
            title: 'Review',
            colorToken: 'violet',
            startDateKey: '2026-03-23',
            startMinute: 10 * 60,
            endMinute: 11 * 60,
            recurrence: 'weekly',
            recurrenceWeekdays: [1, 3, 5],
          }),
        ],
      })
    );

    store.createCluster(
      createCluster({
        id: 'cluster-friday-conflict',
        title: 'Friday conflict',
        colorToken: 'rose',
        startDateKey: '2026-03-27',
        startMinute: 10 * 60 + 15,
        endMinute: 10 * 60 + 45,
      })
    );

    expect(store.getSnapshot().lastWarnings).toEqual([
      {
        type: 'time-collision',
        sourceClusterId: 'cluster-friday-conflict',
        targetClusterId: 'cluster-review',
      },
    ]);

    store.destroy();
  });
});
