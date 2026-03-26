// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTimeClusterSegmentsForDate } from '../../domain/projection.ts';
import { isoFromDateKeyMinute } from '../../domain/time.ts';
import type {
  TimeCluster,
  TimeClusteringLayoutMode,
  TimeClusteringStateSnapshot,
} from '../../domain/types.ts';
import type { TimeClusteringRepository } from '../../data/TimeClusteringRepository.ts';
import { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './TimeClusteringRootView.ts';

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
    clusters: [
      createCluster({
        id: 'cluster-1',
        title: 'Deep work',
        colorToken: 'blue',
        startDateKey: '2026-03-25',
        startMinute: 9 * 60,
        endMinute: 10 * 60 + 30,
      }),
      createCluster({
        id: 'cluster-2',
        title: 'Meetings',
        colorToken: 'green',
        startDateKey: '2026-03-26',
        startMinute: 12 * 60,
        endMinute: 13 * 60,
      }),
      createCluster({
        id: 'cluster-3',
        title: 'Review',
        colorToken: 'amber',
        startDateKey: '2026-03-27',
        startMinute: 15 * 60,
        endMinute: 16 * 60,
      }),
    ],
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

function getCluster(store: TimeClusteringStore, clusterId: string): TimeCluster {
  const cluster = store
    .getSnapshot()
    .clusters.find((entry) => entry.id === clusterId);
  expect(cluster).toBeDefined();
  return cluster!;
}

function getClusterSegment(
  store: TimeClusteringStore,
  dateKey: string,
  clusterId: string
) {
  const cluster = getCluster(store, clusterId);
  const segment = buildTimeClusterSegmentsForDate(dateKey, [cluster]).find(
    (entry) => entry.cluster.id === clusterId
  );
  expect(segment).toBeDefined();
  return segment!;
}

function mockWeekColumnRects(dateKeys: string[]): void {
  const columnWidth = 100;
  const columnHeight = 24 * 56;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function mockGetBoundingClientRect(this: HTMLElement): DOMRect {
      if (this.dataset.role === 'calendar-day-column') {
        const dateKey = this.dataset.dateKey ?? '';
        const index = dateKeys.indexOf(dateKey);
        if (index >= 0) {
          const left = index * columnWidth;
          const top = 0;
          const right = left + columnWidth;
          const bottom = top + columnHeight;
          return {
            x: left,
            y: top,
            width: columnWidth,
            height: columnHeight,
            top,
            right,
            bottom,
            left,
            toJSON: () => ({}),
          } as DOMRect;
        }
      }

      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        toJSON: () => ({}),
      } as DOMRect;
    }
  );
}

describe('TimeClusteringRootView', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 10, 0, 0));
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
          clusters: [
            createCluster({
              id: 'cluster-overlap-a',
              title: 'Overlap A',
              colorToken: 'blue',
              startDateKey: '2026-03-25',
              startMinute: 9 * 60,
              endMinute: 10 * 60,
            }),
            createCluster({
              id: 'cluster-overlap-b',
              title: 'Overlap B',
              colorToken: 'green',
              startDateKey: '2026-03-25',
              startMinute: 9 * 60 + 30,
              endMinute: 10 * 60 + 30,
            }),
            createCluster({
              id: 'cluster-standalone',
              title: 'Standalone',
              colorToken: 'amber',
              startDateKey: '2026-03-25',
              startMinute: 14 * 60,
              endMinute: 15 * 60,
            }),
          ],
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
    const startInput = document.body.querySelector<HTMLInputElement>(
      '[data-role="cluster-edit-start-input"]'
    );
    const endInput = document.body.querySelector<HTMLInputElement>(
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
    expect(startInput?.value).toBe('2026-03-25T09:00');
    expect(endInput?.value).toBe('2026-03-25T10:30');
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
      startInput.value = '2026-03-25T10:15';
      startInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (endInput) {
      endInput.value = '2026-03-25T11:45';
      endInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    roseColorOption?.click();
    saveButton?.click();

    const cluster = getCluster(store, 'cluster-1');
    expect(cluster.title).toBe('Updated cluster');
    expect(cluster.colorToken).toBe('rose');
    expect(getClusterSegment(store, '2026-03-25', 'cluster-1').startMinute).toBe(
      10 * 60 + 15
    );
    expect(getClusterSegment(store, '2026-03-25', 'cluster-1').endMinute).toBe(
      11 * 60 + 45
    );
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

    const segment = getClusterSegment(store, '2026-03-25', 'cluster-1');
    expect(segment.startMinute).toBe(9 * 60 + 15);
    expect(segment.endMinute).toBe(10 * 60 + 45);

    view.unmount();
    store.destroy();
  });

  it('moves a cluster to another day in fullscreen week mode when dragged horizontally', () => {
    const weekDateKeys = [
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
    ];
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

    mockWeekColumnRects(weekDateKeys);
    view.mount(parent);

    const clusterBlock = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-1"][data-date-key="2026-03-25"]'
    );
    expect(clusterBlock).not.toBeNull();

    dispatchPointerEvent(clusterBlock!, 'pointerdown', {
      clientX: 250,
      clientY: 520,
    });
    dispatchPointerEvent(window, 'pointermove', {
      clientX: 350,
      clientY: 520,
    });

    expect(
      parent.querySelector(
        '[data-role="cluster-block"][data-cluster-id="cluster-1"][data-date-key="2026-03-26"]'
      )
    ).not.toBeNull();
    expect(
      parent.querySelector(
        '[data-role="cluster-block"][data-cluster-id="cluster-1"][data-date-key="2026-03-25"]'
      )
    ).toBeNull();

    dispatchPointerEvent(window, 'pointerup', {
      clientX: 350,
      clientY: 520,
      buttons: 0,
    });

    expect(
      buildTimeClusterSegmentsForDate('2026-03-25', [getCluster(store, 'cluster-1')])
    ).toHaveLength(0);
    expect(getClusterSegment(store, '2026-03-26', 'cluster-1').startMinute).toBe(
      9 * 60
    );
    expect(getClusterSegment(store, '2026-03-26', 'cluster-1').endMinute).toBe(
      10 * 60 + 30
    );

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

    const segment = getClusterSegment(store, '2026-03-25', 'cluster-1');
    expect(segment.startMinute).toBe(9 * 60 + 15);
    expect(segment.endMinute).toBe(10 * 60 + 30);

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

    const segment = getClusterSegment(store, '2026-03-25', 'cluster-1');
    expect(segment.startMinute).toBe(9 * 60);
    expect(segment.endMinute).toBe(10 * 60 + 45);

    view.unmount();
    store.destroy();
  });

  it('renders overnight clusters across both days and keeps handles on true interval edges', () => {
    const store = new TimeClusteringStore(
      createRepository(
        createSnapshot({
          clusters: [
            createCluster({
              id: 'cluster-sleep',
              title: 'Sleep',
              colorToken: 'indigo',
              startDateKey: '2026-03-25',
              startMinute: 22 * 60 + 30,
              endDateKey: '2026-03-26',
              endMinute: 6 * 60 + 45,
            }),
          ],
        })
      )
    );
    const { view } = createView(store);
    const parent = document.createElement('div');
    document.body.appendChild(parent);

    view.mount(parent);

    let block = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-sleep"]'
    );
    expect(block?.style.top).toBe('1260px');
    expect(block?.style.height).toBe('84px');

    dispatchPointerEvent(block!, 'pointerdown', { clientY: 1260 });
    dispatchPointerEvent(window, 'pointerup', { clientY: 1260, buttons: 0 });

    let handles = Array.from(
      parent.querySelectorAll<HTMLButtonElement>('[data-role="cluster-resize-handle"]')
    );
    expect(handles).toHaveLength(1);
    expect(handles[0]?.dataset.edge).toBe('start');

    const nextDayButton = parent.querySelector<HTMLButtonElement>(
      '[data-role="day-switch-button"][data-date-key="2026-03-26"]'
    );
    nextDayButton?.click();

    block = parent.querySelector<HTMLDivElement>(
      '[data-role="cluster-block"][data-cluster-id="cluster-sleep"]'
    );
    expect(block?.style.top).toBe('0px');
    expect(block?.style.height).toBe('378px');

    handles = Array.from(
      parent.querySelectorAll<HTMLButtonElement>('[data-role="cluster-resize-handle"]')
    );
    expect(handles).toHaveLength(1);
    expect(handles[0]?.dataset.edge).toBe('end');

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
