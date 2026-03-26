import { describe, expect, it, vi } from 'vitest';
import { buildTimeClusterSegmentsForDate } from '../domain/projection.ts';
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
        },
      ],
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      TIME_CLUSTERS_STORAGE_KEY,
      expect.any(String)
    );
  });
});
