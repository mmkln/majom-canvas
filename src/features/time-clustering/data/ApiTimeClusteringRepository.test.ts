import { describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import type { TimeClusteringStateSnapshot } from '../domain/types.ts';
import { TimeClusteringApiService } from '../../../majom-wrapper/data-access/time-clustering-api-service.ts';
import { ApiTimeClusteringRepository } from './ApiTimeClusteringRepository.ts';

function createSnapshot(
  overrides: Partial<TimeClusteringStateSnapshot> = {}
): TimeClusteringStateSnapshot {
  return {
    selectedDateKey: '2026-03-28',
    weekAnchorDateKey: '2026-03-24',
    clusters: [
      {
        id: 'cluster-1',
        title: 'Focus',
        colorToken: 'blue',
        startAtIso: '2026-03-28T08:00:00.000Z',
        endAtIso: '2026-03-28T09:00:00.000Z',
        recurrence: 'none',
      },
    ],
    lastWarnings: [],
    ...overrides,
  };
}

describe('ApiTimeClusteringRepository', () => {
  it('loads snapshot from backend api', async () => {
    const snapshot = createSnapshot();
    const api = {
      loadSnapshot: vi.fn(() => of(snapshot)),
      saveSnapshot: vi.fn(() => of(snapshot)),
      clearSnapshot: vi.fn(() => of(undefined)),
    } as unknown as TimeClusteringApiService;

    const repository = new ApiTimeClusteringRepository(api);

    await expect(repository.load()).resolves.toEqual(snapshot);
  });

  it('returns null when backend load fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const api = {
      loadSnapshot: vi.fn(() =>
        throwError(() => new Error('backend unavailable'))
      ),
      saveSnapshot: vi.fn(() => of(createSnapshot())),
      clearSnapshot: vi.fn(() => of(undefined)),
    } as unknown as TimeClusteringApiService;

    const repository = new ApiTimeClusteringRepository(api);

    try {
      await expect(repository.load()).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('saves snapshot through backend api', async () => {
    const snapshot = createSnapshot();
    const api = {
      loadSnapshot: vi.fn(() => of(snapshot)),
      saveSnapshot: vi.fn(() => of(snapshot)),
      clearSnapshot: vi.fn(() => of(undefined)),
    } as unknown as TimeClusteringApiService;

    const repository = new ApiTimeClusteringRepository(api);

    await repository.save(snapshot);

    expect(api.saveSnapshot).toHaveBeenCalledWith(snapshot);
  });
});
