import { describe, expect, it } from 'vitest';
import { buildTimeClusterSegmentsForDate } from './projection.ts';
import { isoFromDateKeyMinute } from './time.ts';
import type { TimeCluster } from './types.ts';

function createCluster(params: {
  id: string;
  title: string;
  colorToken: string;
  startDateKey: string;
  startMinute: number;
  endDateKey?: string;
  endMinute: number;
  recurrence?: TimeCluster['recurrence'];
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

describe('time-clustering projection', () => {
  it('projects weekly recurring clusters onto matching weekdays', () => {
    const cluster = createCluster({
      id: 'cluster-weekly',
      title: 'Weekly review',
      colorToken: 'violet',
      startDateKey: '2026-03-18',
      startMinute: 8 * 60,
      endMinute: 9 * 60 + 30,
      recurrence: 'weekly',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-25', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 8 * 60,
        endMinute: 9 * 60 + 30,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-26', [cluster])).toEqual([]);
  });

  it('projects weekly recurring clusters onto selected weekdays', () => {
    const cluster = createCluster({
      id: 'cluster-multi-weekly',
      title: 'Review',
      colorToken: 'violet',
      startDateKey: '2026-03-18',
      startMinute: 8 * 60,
      endMinute: 9 * 60,
      recurrence: 'weekly',
      recurrenceWeekdays: [1, 3, 5],
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-20', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-20',
        startMinute: 8 * 60,
        endMinute: 9 * 60,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-21', [cluster])).toEqual([]);
  });

  it('projects daily recurring clusters onto every following day', () => {
    const cluster = createCluster({
      id: 'cluster-daily',
      title: 'Daily review',
      colorToken: 'blue',
      startDateKey: '2026-03-24',
      startMinute: 9 * 60,
      endMinute: 10 * 60,
      recurrence: 'daily',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-25', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-26', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-26',
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      }),
    ]);
  });

  it('projects weekday recurring clusters only on weekdays', () => {
    const cluster = createCluster({
      id: 'cluster-weekdays',
      title: 'Standup',
      colorToken: 'teal',
      startDateKey: '2026-03-23',
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
      recurrence: 'weekdays',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-27', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-27',
        startMinute: 10 * 60,
        endMinute: 10 * 60 + 30,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-28', [cluster])).toEqual([]);
    expect(buildTimeClusterSegmentsForDate('2026-03-29', [cluster])).toEqual([]);
  });

  it('projects daily overnight recurring clusters into both carried and same-day segments', () => {
    const cluster = createCluster({
      id: 'cluster-nightly',
      title: 'Night shift',
      colorToken: 'indigo',
      startDateKey: '2026-03-24',
      startMinute: 22 * 60,
      endDateKey: '2026-03-25',
      endMinute: 6 * 60,
      recurrence: 'daily',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-25', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 0,
        endMinute: 6 * 60,
        continuesBefore: true,
      }),
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 22 * 60,
        endMinute: 24 * 60,
        continuesAfter: true,
      }),
    ]);
  });

  it('projects weekly overnight clusters across both recurring days', () => {
    const cluster = createCluster({
      id: 'cluster-overnight',
      title: 'Night shift',
      colorToken: 'indigo',
      startDateKey: '2026-03-18',
      startMinute: 22 * 60,
      endDateKey: '2026-03-19',
      endMinute: 6 * 60,
      recurrence: 'weekly',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-25', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-25',
        startMinute: 22 * 60,
        endMinute: 24 * 60,
        continuesAfter: true,
        isStartSegment: true,
        isEndSegment: false,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-26', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-26',
        startMinute: 0,
        endMinute: 6 * 60,
        continuesBefore: true,
        isStartSegment: false,
        isEndSegment: true,
      }),
    ]);
  });

  it('stops recurring after the configured recurrence end date', () => {
    const cluster = createCluster({
      id: 'cluster-ended',
      title: 'Sprint sync',
      colorToken: 'blue',
      startDateKey: '2026-03-24',
      startMinute: 9 * 60,
      endMinute: 10 * 60,
      recurrence: 'daily',
      recurrenceEndDateKey: '2026-03-27',
    });

    expect(buildTimeClusterSegmentsForDate('2026-03-27', [cluster])).toEqual([
      expect.objectContaining({
        dateKey: '2026-03-27',
        startMinute: 9 * 60,
        endMinute: 10 * 60,
      }),
    ]);
    expect(buildTimeClusterSegmentsForDate('2026-03-28', [cluster])).toEqual([]);
  });
});
