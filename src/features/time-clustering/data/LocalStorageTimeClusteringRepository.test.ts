import { describe, expect, it, vi } from 'vitest';
import { buildTimeClusterSegmentsForDate } from '../domain/projection.ts';
import { isoFromDateKeyMinute } from '../domain/time.ts';
import {
  LocalStorageTimeClusteringRepository,
  TIME_CLUSTERS_STORAGE_KEY,
} from './LocalStorageTimeClusteringRepository.ts';

function createStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

describe('LocalStorageTimeClusteringRepository', () => {
  it('migrates legacy day plans into interval clusters and preserves overnight spans', () => {
    const storage = createStorageMock();
    storage.setItem(
      'time_clusters_v1',
      JSON.stringify({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-24',
        plansByDate: {
          '2026-03-24': {
            dateKey: '2026-03-24',
            clusters: [
              {
                id: 'sleep',
                title: 'Sleep',
                colorToken: 'indigo',
                startMinute: 22 * 60,
                endMinute: 6 * 60,
              },
            ],
          },
          '2026-03-25': {
            dateKey: '2026-03-25',
            clusters: [
              {
                id: 'focus',
                title: 'Focus',
                colorToken: 'blue',
                startMinute: 9 * 60,
                endMinute: 10 * 60,
              },
            ],
          },
        },
        lastWarnings: [],
      })
    );

    const repository = new LocalStorageTimeClusteringRepository(
      storage as unknown as Storage
    );

    const snapshot = repository.load();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.selectedDateKey).toBe('2026-03-25');
    expect(snapshot?.clusters).toHaveLength(2);

    const sleep = snapshot?.clusters.find((cluster) => cluster.id === 'sleep');
    expect(sleep).toBeDefined();
    expect(buildTimeClusterSegmentsForDate('2026-03-24', sleep ? [sleep] : [])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-24',
        startMinute: 22 * 60,
        endMinute: 24 * 60,
        continuesAfter: true,
        isStartSegment: true,
        isEndSegment: false,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-25', sleep ? [sleep] : [])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 0,
        endMinute: 6 * 60,
        continuesBefore: true,
        isStartSegment: false,
        isEndSegment: true,
      }),
    ]);
  });

  it('deduplicates repeated legacy ids when migrating plans', () => {
    const storage = createStorageMock();
    storage.setItem(
      'time_clusters_v1',
      JSON.stringify({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-25',
        plansByDate: {
          '2026-03-25': {
            dateKey: '2026-03-25',
            clusters: [
              {
                id: 'cluster-repeat',
                title: 'First',
                colorToken: 'blue',
                startMinute: 9 * 60,
                endMinute: 10 * 60,
              },
            ],
          },
          '2026-03-26': {
            dateKey: '2026-03-26',
            clusters: [
              {
                id: 'cluster-repeat',
                title: 'Second',
                colorToken: 'green',
                startMinute: 11 * 60,
                endMinute: 12 * 60,
              },
            ],
          },
        },
        lastWarnings: [],
      })
    );

    const repository = new LocalStorageTimeClusteringRepository(
      storage as unknown as Storage
    );

    const snapshot = repository.load();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.clusters).toHaveLength(2);
    expect(new Set(snapshot?.clusters.map((cluster) => cluster.id)).size).toBe(2);
    expect(snapshot?.clusters.map((cluster) => cluster.id)).toContain('cluster-repeat');
    expect(snapshot?.clusters.map((cluster) => cluster.id)).toContain(
      'cluster-repeat_2026-03-26_2'
    );
  });

  it('saves interval snapshots under the v2 storage key', () => {
    const storage = createStorageMock();
    const repository = new LocalStorageTimeClusteringRepository(
      storage as unknown as Storage
    );

    repository.save({
      selectedDateKey: '2026-03-25',
      weekAnchorDateKey: '2026-03-25',
      lastWarnings: [],
      clusters: [
        {
          id: 'cluster-1',
          title: 'Focus',
          colorToken: 'blue',
          startAtIso: '2026-03-25T08:00:00.000Z',
          endAtIso: '2026-03-25T09:00:00.000Z',
          recurrence: 'none',
        },
      ],
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      TIME_CLUSTERS_STORAGE_KEY,
      expect.any(String)
    );
  });

  it('preserves weekly recurrence when loading v2 snapshots', () => {
    const storage = createStorageMock();
    storage.setItem(
      TIME_CLUSTERS_STORAGE_KEY,
      JSON.stringify({
        selectedDateKey: '2026-03-25',
        weekAnchorDateKey: '2026-03-25',
        lastWarnings: [],
        clusters: [
          {
            id: 'cluster-weekly',
            title: 'Weekly review',
            colorToken: 'violet',
            startAtIso: isoFromDateKeyMinute('2026-03-18', 8 * 60),
            endAtIso: isoFromDateKeyMinute('2026-03-18', 9 * 60),
            recurrence: 'weekly',
          },
        ],
      })
    );

    const repository = new LocalStorageTimeClusteringRepository(
      storage as unknown as Storage
    );

    const snapshot = repository.load();

    expect(snapshot?.clusters[0]?.recurrence).toBe('weekly');
    expect(
      buildTimeClusterSegmentsForDate('2026-03-25', snapshot?.clusters ?? [])
    ).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 8 * 60,
        endMinute: 9 * 60,
      }),
    ]);
  });

  it('preserves daily and weekday recurrence when loading v2 snapshots', () => {
    const storage = createStorageMock();
    storage.setItem(
      TIME_CLUSTERS_STORAGE_KEY,
      JSON.stringify({
        selectedDateKey: '2026-03-27',
        weekAnchorDateKey: '2026-03-23',
        lastWarnings: [],
        clusters: [
          {
            id: 'cluster-daily',
            title: 'Daily review',
            colorToken: 'blue',
            startAtIso: isoFromDateKeyMinute('2026-03-24', 8 * 60),
            endAtIso: isoFromDateKeyMinute('2026-03-24', 9 * 60),
            recurrence: 'daily',
            recurrenceEndDateKey: '2026-04-15',
          },
          {
            id: 'cluster-weekdays',
            title: 'Weekday sync',
            colorToken: 'teal',
            startAtIso: isoFromDateKeyMinute('2026-03-23', 10 * 60),
            endAtIso: isoFromDateKeyMinute('2026-03-23', 11 * 60),
            recurrence: 'weekly',
            recurrenceWeekdays: [1, 3, 5],
          },
        ],
      })
    );

    const repository = new LocalStorageTimeClusteringRepository(
      storage as unknown as Storage
    );

    const snapshot = repository.load();

    expect(snapshot?.clusters[0]?.recurrence).toBe('daily');
    expect(snapshot?.clusters[0]?.recurrenceEndDateKey).toBe('2026-04-15');
    expect(snapshot?.clusters[1]?.recurrence).toBe('weekly');
    expect(snapshot?.clusters[1]?.recurrenceWeekdays).toEqual([1, 3, 5]);
    expect(
      buildTimeClusterSegmentsForDate('2026-03-27', snapshot?.clusters ?? [])
    ).toEqual([
      expect.objectContaining({
        cluster: expect.objectContaining({ id: 'cluster-daily' }),
        dateKey: '2026-03-27',
        startMinute: 8 * 60,
        endMinute: 9 * 60,
      }),
      expect.objectContaining({
        cluster: expect.objectContaining({ id: 'cluster-weekdays' }),
        dateKey: '2026-03-27',
        startMinute: 10 * 60,
        endMinute: 11 * 60,
      }),
    ]);
  });
});
