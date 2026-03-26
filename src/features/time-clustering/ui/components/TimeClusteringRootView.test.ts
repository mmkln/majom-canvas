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

function dispatchPointerEvent(
  target: EventTarget,
  type: string,
  options: {
    button?: number;
    buttons?: number;
    clientX?: number;
    clientY?: number;
    pointerId?: number;
    pointerType?: string;
  } = {}
): void {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: options.button ?? 0,
    buttons:
      options.buttons ??
      (type === 'pointerup' || type === 'pointercancel' ? 0 : 1),
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
  });
  Object.defineProperty(event, 'pointerId', {
    configurable: true,
    value: options.pointerId ?? 1,
  });
  Object.defineProperty(event, 'pointerType', {
    configurable: true,
    value: options.pointerType ?? 'mouse',
  });
  target.dispatchEvent(event);
}

function getCluster(
  store: TimeClusteringStore,
  dateKey: string,
  clusterId: string
) {
  const cluster = store
    .getSnapshot()
    .plansByDate[dateKey]?.clusters.find((entry) => entry.id === clusterId);
  expect(cluster).toBeDefined();
  return cluster!;
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
    expect(hourSlots[0]?.className).toContain('border-t');
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

  it('keeps standalone clusters full width when another overlap exists earlier in the day', () => {
    const store = new TimeClusteringStore(
      createRepository(
        createSnapshot({
          plansByDate: {
            '2026-03-25': {
              dateKey: '2026-03-25',
              updatedAtIso: '2026-03-25T08:00:00.000Z',
              clusters: [
                {
                  id: 'cluster-overlap-a',
                  title: 'Overlap A',
                  colorToken: 'blue',
                  startMinute: 9 * 60,
                  endMinute: 10 * 60,
                },
                {
                  id: 'cluster-overlap-b',
                  title: 'Overlap B',
                  colorToken: 'green',
                  startMinute: 9 * 60 + 30,
                  endMinute: 10 * 60 + 30,
                },
                {
                  id: 'cluster-standalone',
                  title: 'Standalone',
                  colorToken: 'amber',
                  startMinute: 14 * 60,
                  endMinute: 15 * 60,
                },
              ],
            },
          },
        })
      )
    );
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const overlapA = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-overlap-a"]'
    );
    const overlapB = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-overlap-b"]'
    );
    const standalone = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-standalone"]'
    );

    expect(overlapA).not.toBeNull();
    expect(overlapB).not.toBeNull();
    expect(standalone).not.toBeNull();
    expect(overlapA?.style.width).not.toBe('100%');
    expect(overlapB?.style.width).not.toBe('100%');
    expect(standalone?.style.width).toBe('100%');
    expect(standalone?.style.left).toBe('0px');

    view.unmount();
    store.destroy();
  });

  it('selects a cluster and clears selection when the user clicks empty calendar space', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 120 });

    const selectedBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"][data-selected="true"]'
    );
    expect(selectedBlock).not.toBeNull();
    expect(
      parent.querySelectorAll('[data-role="cluster-resize-handle"]')
    ).toHaveLength(2);

    const emptyHourSlot = parent.querySelector<HTMLDivElement>(
      '[data-role="calendar-hour-slot"]'
    );
    expect(emptyHourSlot).not.toBeNull();

    dispatchPointerEvent(emptyHourSlot!, 'pointerdown', { clientY: 40 });

    expect(
      parent.querySelector(
        '[data-role="cluster-block"][data-cluster-id="cluster-1"][data-selected="true"]'
      )
    ).toBeNull();
    expect(
      parent.querySelectorAll('[data-role="cluster-resize-handle"]')
    ).toHaveLength(0);

    view.unmount();
    store.destroy();
  });

  it('opens the cluster edit modal on double click and saves edits', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    let clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 120, buttons: 0 });

    vi.advanceTimersByTime(120);

    clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 120, buttons: 0 });

    const modal = document.body.querySelector<HTMLElement>(
      '[data-role="cluster-edit-modal"]'
    );
    const titleInput = document.body.querySelector<HTMLInputElement>(
      '[data-role="cluster-edit-title-input"]'
    );
    const startInput = document.body.querySelector<HTMLSelectElement>(
      '[data-role="cluster-edit-start-input"]'
    );
    const endInput = document.body.querySelector<HTMLSelectElement>(
      '[data-role="cluster-edit-end-input"]'
    );
    const colorPicker = document.body.querySelector<HTMLElement>(
      '[data-role="cluster-edit-color-picker"]'
    );
    const roseColorOption = document.body.querySelector<HTMLButtonElement>(
      '[data-role="cluster-edit-color-picker"] [data-value="rose"]'
    );
    const saveButton = document.body.querySelector<HTMLButtonElement>(
      '[data-role="cluster-edit-save-button"]'
    );

    expect(modal).not.toBeNull();
    expect(titleInput?.value).toBe('Deep work');
    expect(startInput?.value).toBe(String(9 * 60));
    expect(endInput?.value).toBe(String(10 * 60 + 30));
    expect(colorPicker).not.toBeNull();
    expect(
      document.body.querySelector(
        '[data-role="cluster-edit-color-picker"] [data-value="blue"][data-selected="true"]'
      )
    ).not.toBeNull();

    if (titleInput) {
      titleInput.value = 'Updated cluster';
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (startInput) {
      startInput.value = String(10 * 60 + 15);
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (endInput) {
      endInput.value = String(11 * 60 + 45);
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    roseColorOption?.click();
    saveButton?.click();

    const cluster = getCluster(store, '2026-03-25', 'cluster-1');
    expect(cluster.title).toBe('Updated cluster');
    expect(cluster.colorToken).toBe('rose');
    expect(cluster.startMinute).toBe(10 * 60 + 15);
    expect(cluster.endMinute).toBe(11 * 60 + 45);
    expect(
      document.body.querySelector('[data-role="cluster-edit-modal"]')
    ).toBeNull();

    view.unmount();
    store.destroy();
  });

  it('moves a cluster in 15-minute increments when dragged', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointermove', { clientY: 134 });
    dispatchPointerEvent(window, 'pointerup', {
      clientY: 134,
      buttons: 0,
    });

    const cluster = getCluster(store, '2026-03-25', 'cluster-1');
    expect(cluster.startMinute).toBe(9 * 60 + 15);
    expect(cluster.endMinute).toBe(10 * 60 + 45);

    view.unmount();
    store.destroy();
  });

  it('resizes a selected cluster from the top handle in 15-minute increments', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 120, buttons: 0 });

    const topHandle = parent.querySelector<HTMLButtonElement>(
      '[data-role="cluster-resize-handle"][data-edge="start"]'
    );
    expect(topHandle).not.toBeNull();

    dispatchPointerEvent(topHandle!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointermove', { clientY: 134 });
    dispatchPointerEvent(window, 'pointerup', {
      clientY: 134,
      buttons: 0,
    });

    const cluster = getCluster(store, '2026-03-25', 'cluster-1');
    expect(cluster.startMinute).toBe(9 * 60 + 15);
    expect(cluster.endMinute).toBe(10 * 60 + 30);

    view.unmount();
    store.destroy();
  });

  it('resizes a selected cluster from the bottom handle in 15-minute increments', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 120, buttons: 0 });

    const bottomHandle = parent.querySelector<HTMLButtonElement>(
      '[data-role="cluster-resize-handle"][data-edge="end"]'
    );
    expect(bottomHandle).not.toBeNull();

    dispatchPointerEvent(bottomHandle!, 'pointerdown', { clientY: 120 });
    dispatchPointerEvent(window, 'pointermove', { clientY: 134 });
    dispatchPointerEvent(window, 'pointerup', {
      clientY: 134,
      buttons: 0,
    });

    const cluster = getCluster(store, '2026-03-25', 'cluster-1');
    expect(cluster.startMinute).toBe(9 * 60);
    expect(cluster.endMinute).toBe(10 * 60 + 45);

    view.unmount();
    store.destroy();
  });

  it('renders the week switcher above the day switcher in docked day mode', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const weekSwitcher = parent.querySelector<HTMLElement>(
      '[data-role="week-switcher"]'
    );
    const daySwitcher = parent.querySelector<HTMLElement>(
      '[data-role="day-switcher"]'
    );
    const secondaryNav = weekSwitcher?.parentElement;

    expect(secondaryNav?.firstElementChild).toBe(weekSwitcher);
    expect(secondaryNav?.lastElementChild).toBe(daySwitcher);
    expect(weekSwitcher?.classList.contains('hidden')).toBe(false);
    expect(daySwitcher?.classList.contains('hidden')).toBe(false);
    expect(
      daySwitcher?.querySelectorAll('[data-role="day-switch-button"]')
    ).toHaveLength(7);

    view.unmount();
    store.destroy();
  });

  it('renders the layout toggle to the left of the header actions', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const toggleButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="layout-toggle-button"]'
    );
    const addClusterButton = Array.from(
      parent.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.includes('Add cluster'));
    const headerRow = toggleButton?.parentElement;

    expect(toggleButton).not.toBeNull();
    expect(addClusterButton).not.toBeNull();
    expect(headerRow?.firstElementChild).toBe(toggleButton);
    expect(
      headerRow?.lastElementChild?.contains(addClusterButton ?? null)
    ).toBe(true);

    view.unmount();
    store.destroy();
  });

  it('moves the selected day by one week from the docked week navigation', () => {
    const store = new TimeClusteringStore(createRepository(createSnapshot()));
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    const weekLabel = parent.querySelector<HTMLElement>(
      '[data-role="week-switcher"] p'
    );
    const initialWeekLabel = weekLabel?.textContent;
    const nextWeekButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="week-switcher"] button[aria-label="Next week"]'
    );

    nextWeekButton?.click();

    expect(store.getSnapshot().selectedDateKey).toBe('2026-04-01');
    expect(store.getSnapshot().weekAnchorDateKey).toBe('2026-04-01');
    expect(weekLabel?.textContent).not.toBe(initialWeekLabel);

    const selectedButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="day-switch-button"][data-date-key="2026-04-01"]'
    );
    expect(selectedButton).not.toBeNull();
    expect(selectedButton?.className).toContain('bg-indigo-50');

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

    const weekCalendarHeader = parent.querySelector<HTMLDivElement>(
      '[data-role="week-calendar-header"]'
    );
    expect(weekCalendarHeader).not.toBeNull();
    expect(weekCalendarHeader?.className).toContain('sticky');
    expect(weekCalendarHeader?.className).toContain('top-0');

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
