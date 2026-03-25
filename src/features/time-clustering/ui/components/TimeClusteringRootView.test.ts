// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  TimeClusteringLayoutMode,
  TimeClusteringStateSnapshot,
} from '../../domain/types.ts';
import type { TimeClusteringRepository } from '../../data/TimeClusteringRepository.ts';
import { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './TimeClusteringRootView.ts';

function createRepository(
  snapshot: TimeClusteringStateSnapshot
): TimeClusteringRepository {
  return {
    load: () => snapshot,
    save: vi.fn(),
    clear: vi.fn(),
  };
}

function createSnapshot(
  overrides: Partial<TimeClusteringStateSnapshot> = {}
): TimeClusteringStateSnapshot {
  return {
    selectedDateKey: '2026-03-25',
    weekAnchorDateKey: '2026-03-25',
    lastWarnings: [],
    plansByDate: {
      '2026-03-24': {
        dateKey: '2026-03-24',
        updatedAtIso: '2026-03-24T08:00:00.000Z',
        clusters: [],
      },
      '2026-03-25': {
        dateKey: '2026-03-25',
        updatedAtIso: '2026-03-25T08:00:00.000Z',
        clusters: [
          {
            id: 'cluster-1',
            title: 'Deep work',
            colorToken: 'blue',
            startMinute: 9 * 60,
            endMinute: 10 * 60 + 30,
            parallelizable: false,
          },
        ],
      },
      '2026-03-26': {
        dateKey: '2026-03-26',
        updatedAtIso: '2026-03-26T08:00:00.000Z',
        clusters: [
          {
            id: 'cluster-2',
            title: 'Meetings',
            colorToken: 'green',
            startMinute: 12 * 60,
            endMinute: 13 * 60,
            parallelizable: false,
          },
        ],
      },
      '2026-03-27': {
        dateKey: '2026-03-27',
        updatedAtIso: '2026-03-27T08:00:00.000Z',
        clusters: [
          {
            id: 'cluster-3',
            title: 'Review',
            colorToken: 'amber',
            startMinute: 15 * 60,
            endMinute: 16 * 60,
            parallelizable: false,
          },
        ],
      },
    },
    ...overrides,
  };
}

function createView(
  store: TimeClusteringStore,
  layoutMode: TimeClusteringLayoutMode = 'docked-left'
): {
  view: TimeClusteringRootView;
  onLayoutModeChange: ReturnType<typeof vi.fn>;
} {
  const onLayoutModeChange = vi.fn((mode: TimeClusteringLayoutMode) => {
    view.setLayoutMode(mode);
  });
  const view = new TimeClusteringRootView({
    store,
    layoutMode,
    onLayoutModeChange,
    onRefreshSuggestions: () => Promise.resolve([]),
  });
  return { view, onLayoutModeChange };
}

describe('TimeClusteringRootView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('switches the selected day from the day strip and rerenders the day column', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const initialBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(initialBlock?.style.top).toBe('504px');
    expect(initialBlock?.style.height).toBe('84px');
    expect(initialBlock?.style.left).toBe('0px');
    expect(initialBlock?.style.width).toBe('100%');

    const hourSlots = parent.querySelectorAll<HTMLDivElement>(
      '[data-role="calendar-column"][data-date-key="2026-03-25"] [data-role="calendar-hour-slot"]'
    );
    expect(hourSlots).toHaveLength(24);
    expect(hourSlots[0]?.className).not.toContain('border-t');
    expect(hourSlots[1]?.className).toContain('border-t');

    const nextDayButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="day-switch-button"][data-date-key="2026-03-26"]'
    );
    nextDayButton?.click();

    expect(store.getSnapshot().selectedDateKey).toBe('2026-03-26');
    expect(
      parent.querySelector(
        '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
      )
    ).toBeNull();
    expect(
      parent.querySelector(
        '[data-role="cluster-block"][data-cluster-id="cluster-2"]'
      )
    ).not.toBeNull();

    view.unmount();
    store.destroy();
  });

  it('renders seven day columns in week mode and keeps week navigation visible', () => {
    const store = new TimeClusteringStore(
      createRepository(
        createSnapshot({
          selectedDateKey: '2026-03-23',
          weekAnchorDateKey: '2026-03-23',
        })
      )
    );
    const { view } = createView(store, 'fullscreen');
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const buttonLabels = Array.from(parent.querySelectorAll('button')).map(
      (button) => button.textContent?.trim() ?? ''
    );
    expect(buttonLabels).not.toContain('Day');
    expect(buttonLabels).not.toContain('Week');

    const weekSwitcher = parent.querySelector<HTMLDivElement>(
      '[data-role="week-switcher"]'
    );
    expect(weekSwitcher).not.toBeNull();
    expect(weekSwitcher?.className).not.toContain('hidden');

    const dayColumns = parent.querySelectorAll(
      '[data-role="calendar-day-column"]'
    );
    expect(dayColumns).toHaveLength(7);
    const weekDayHeaders = parent.querySelectorAll(
      '[data-role="week-day-header"]'
    );
    expect(weekDayHeaders).toHaveLength(7);
    expect(
      Array.from(weekDayHeaders).every((element) => element.tagName === 'DIV')
    ).toBe(true);
    expect(
      parent.querySelectorAll('button[data-role="week-day-header"]')
    ).toHaveLength(0);
    expect(
      Array.from(weekDayHeaders).every(
        (element) =>
          !element.textContent?.includes('Day') &&
          !element.textContent?.includes('Today')
      )
    ).toBe(true);

    const todayHeader = Array.from(weekDayHeaders).find((element) =>
      element.textContent?.includes('25')
    );
    expect(todayHeader).toBeDefined();
    expect(
      Array.from(todayHeader?.querySelectorAll('p') ?? []).every((node) =>
        node.className.includes('text-sky-600')
      )
    ).toBe(true);

    const mondayHeader = Array.from(weekDayHeaders).find((element) =>
      element.textContent?.includes('23')
    );
    expect(mondayHeader).toBeDefined();
    expect(
      Array.from(mondayHeader?.querySelectorAll('p') ?? []).some((node) =>
        node.className.includes('text-sky-600')
      )
    ).toBe(false);

    const todayColumn = parent.querySelector(
      '[data-role="calendar-day-column"][data-date-key="2026-03-25"]'
    ) as HTMLDivElement | null;
    const mondayColumn = parent.querySelector(
      '[data-role="calendar-day-column"][data-date-key="2026-03-23"]'
    ) as HTMLDivElement | null;
    expect(todayColumn?.className).toContain('bg-sky-50/40');
    expect(mondayColumn?.className).not.toContain('bg-sky-50/40');

    view.unmount();
    store.destroy();
  });

  it('switches between docked day view and fullscreen week view from the layout toggle', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view, onLayoutModeChange } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const initialWeekColumns = parent.querySelectorAll(
      '[data-role="calendar-day-column"]'
    );
    expect(initialWeekColumns).toHaveLength(0);
    expect(parent.querySelector('[data-role="day-calendar"]')).not.toBeNull();

    const toggleButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="layout-toggle-button"]'
    );
    expect(toggleButton?.getAttribute('aria-label')).toBe('Expand');
    expect(
      toggleButton?.querySelector('svg')?.getAttribute('data-icon-name')
    ).toBe('chevron-right');
    toggleButton?.click();

    expect(onLayoutModeChange).toHaveBeenCalledWith('fullscreen');
    expect(
      parent.querySelectorAll('[data-role="calendar-day-column"]')
    ).toHaveLength(7);

    const dockButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="layout-toggle-button"]'
    );
    expect(dockButton?.getAttribute('aria-label')).toBe('Dock left');
    expect(
      dockButton?.querySelector('svg')?.getAttribute('data-icon-name')
    ).toBe('chevron-left');
    dockButton?.click();

    expect(onLayoutModeChange).toHaveBeenLastCalledWith('docked-left');
    expect(parent.querySelector('[data-role="day-calendar"]')).not.toBeNull();

    view.unmount();
    store.destroy();
  });
});
