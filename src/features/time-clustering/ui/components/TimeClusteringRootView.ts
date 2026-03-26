import { MIN_CLUSTER_DURATION_MINUTES } from '../../domain/rules.ts';
import {
  buildTimeClusterSegmentsByDate,
  buildTimeClusterSegmentsForDate,
  clusterIntersectsDateKey,
} from '../../domain/projection.ts';
import {
  MINUTES_PER_DAY,
  currentMinuteOfDay,
  dateFromKey,
  dayOffsetDateKey,
  differenceInMinutes,
  formatDateTimeLocalInputValue,
  isoFromDateKeyMinute,
  isoFromLocalDateTimeInput,
  parseIsoToMillis,
  shiftIsoByMinutes,
  startOfWeekDateKey,
  todayDateKey,
} from '../../domain/time.ts';
import type {
  TimeCluster,
  TimeClusterSegment,
  TimeClusteringLayoutMode,
  TimeClusteringStateSnapshot,
} from '../../domain/types.ts';
import type { TimeClusteringSuggestion } from '../../services/TimeClusteringSuggestionService.ts';
import type { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import {
  createIconButton,
  createColorPicker,
  createInputBase,
  createTextButton,
  type ColorPickerOption,
  type TextButtonElement,
  type TextButtonTone,
} from '../../../../ui-lib/src/hud/index.ts';
import { createIcon, type IconName } from '../../../../ui-lib/src/hud/icons.ts';

interface TimeClusteringRootViewOptions {
  store: TimeClusteringStore;
  layoutMode: TimeClusteringLayoutMode;
  onLayoutModeChange: (mode: TimeClusteringLayoutMode) => void;
  onRefreshSuggestions: () => Promise<TimeClusteringSuggestion[]>;
}

type ClusterPalette = {
  accent: string;
  background: string;
  border: string;
  text: string;
  mutedText: string;
};

const DEFAULT_CLUSTER_DURATION_MINUTES = 90;
const DEFAULT_VISIBLE_START_MINUTE = 7 * 60;
const HOUR_ROW_HEIGHT_PX = 56;
const TIME_GUTTER_WIDTH_PX = 56;
const DAY_VIEW_MIN_WIDTH_PX = 300;
const WEEK_VIEW_DAY_WIDTH_PX = 136;
const CLUSTER_STEP_MINUTES = MIN_CLUSTER_DURATION_MINUTES;
const CLUSTER_DRAG_THRESHOLD_PX = 4;
const CLUSTER_DOUBLE_CLICK_WINDOW_MS = 300;
const CLUSTER_COLOR_TOKENS = [
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'cyan',
  'orange',
  'teal',
  'indigo',
];

type SelectedClusterRef = {
  clusterId: string;
};

type ClusterGestureKind = 'move' | 'resize-start' | 'resize-end';

type ActiveClusterGesture = {
  kind: ClusterGestureKind;
  clusterId: string;
  pointerId: number;
  startClientY: number;
  initialCluster: TimeCluster;
  previewCluster: TimeCluster;
  started: boolean;
  cleanup: () => void;
};

type RecentClusterClick = {
  clusterId: string;
  timestamp: number;
};

const CLUSTER_PALETTES: ClusterPalette[] = [
  {
    accent: '#2563eb',
    background: '#dbeafe',
    border: '#93c5fd',
    text: '#1d4ed8',
    mutedText: '#1e40af',
  },
  {
    accent: '#059669',
    background: '#d1fae5',
    border: '#86efac',
    text: '#047857',
    mutedText: '#065f46',
  },
  {
    accent: '#d97706',
    background: '#fef3c7',
    border: '#fcd34d',
    text: '#b45309',
    mutedText: '#92400e',
  },
  {
    accent: '#db2777',
    background: '#fce7f3',
    border: '#f9a8d4',
    text: '#be185d',
    mutedText: '#9d174d',
  },
  {
    accent: '#7c3aed',
    background: '#ede9fe',
    border: '#c4b5fd',
    text: '#6d28d9',
    mutedText: '#5b21b6',
  },
  {
    accent: '#0891b2',
    background: '#cffafe',
    border: '#67e8f9',
    text: '#0e7490',
    mutedText: '#155e75',
  },
];

function uniqueId(): string {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `cluster_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`;
}

function buildWeekDateKeys(baseDateKey: string): string[] {
  const weekStart = startOfWeekDateKey(baseDateKey);
  return Array.from({ length: 7 }, (_, index) =>
    dayOffsetDateKey(weekStart, index)
  );
}

function formatMinute(minute: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, minute));
  const hours = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}`;
}

function formatWeekdayLabel(dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
}

function formatWeekdayInitial(dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey.slice(0, 1);
  return new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date);
}

function formatDayNumber(dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return '--';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date);
}

function formatWeekRange(dateKeys: string[]): string {
  const start = dateFromKey(dateKeys[0] ?? '');
  const end = dateFromKey(dateKeys[dateKeys.length - 1] ?? '');
  if (!start || !end) return '';

  const startLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end);
  return `${startLabel} - ${endLabel}`;
}

function formatLongDate(dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatClusterDateTimeRange(cluster: TimeCluster): string {
  const start = new Date(cluster.startAtIso);
  const end = new Date(cluster.endAtIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Select start and end date/time.';
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatClusterSegmentRange(cluster: TimeClusterSegment): string {
  return `${formatMinute(cluster.startMinute)} - ${formatMinute(cluster.endMinute)}`;
}

function roundUpToStep(minute: number, step: number): number {
  return Math.ceil(minute / step) * step;
}

function deltaPixelsToSnappedMinutes(deltaPixels: number): number {
  const pixelsPerStep = (HOUR_ROW_HEIGHT_PX / 60) * CLUSTER_STEP_MINUTES;
  return Math.round(deltaPixels / pixelsPerStep) * CLUSTER_STEP_MINUTES;
}

function formatColorTokenLabel(colorToken: string): string {
  return colorToken
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function buildClusterColorPickerOptions(
  colorTokens: string[]
): ColorPickerOption<string>[] {
  return colorTokens.map((colorToken) => {
    const palette = getClusterPalette(colorToken);
    return {
      id: `cluster-color-${colorToken}`,
      value: colorToken,
      label: formatColorTokenLabel(colorToken),
      swatchColor: palette.accent,
      backgroundColor: palette.background,
      borderColor: palette.border,
      title: formatColorTokenLabel(colorToken),
    };
  });
}

function haveSameClusterRange(a: TimeCluster, b: TimeCluster): boolean {
  return a.startAtIso === b.startAtIso && a.endAtIso === b.endAtIso;
}

function shiftClusterRange(
  cluster: TimeCluster,
  deltaMinutes: number
): TimeCluster {
  const nextStartAtIso = shiftIsoByMinutes(cluster.startAtIso, deltaMinutes);
  const nextEndAtIso = shiftIsoByMinutes(cluster.endAtIso, deltaMinutes);
  if (!nextStartAtIso || !nextEndAtIso) return cluster;
  return {
    ...cluster,
    startAtIso: nextStartAtIso,
    endAtIso: nextEndAtIso,
  };
}

function resizeClusterStart(
  cluster: TimeCluster,
  deltaMinutes: number
): TimeCluster {
  const nextStartAtIso = shiftIsoByMinutes(cluster.startAtIso, deltaMinutes);
  const latestStartAtIso = shiftIsoByMinutes(
    cluster.endAtIso,
    -MIN_CLUSTER_DURATION_MINUTES
  );
  const nextStartMs = nextStartAtIso ? parseIsoToMillis(nextStartAtIso) : null;
  const latestStartMs = latestStartAtIso
    ? parseIsoToMillis(latestStartAtIso)
    : null;
  if (
    !nextStartAtIso ||
    !latestStartAtIso ||
    nextStartMs === null ||
    latestStartMs === null
  ) {
    return cluster;
  }
  return {
    ...cluster,
    startAtIso:
      nextStartMs > latestStartMs ? latestStartAtIso : nextStartAtIso,
  };
}

function resizeClusterEnd(
  cluster: TimeCluster,
  deltaMinutes: number
): TimeCluster {
  const nextEndAtIso = shiftIsoByMinutes(cluster.endAtIso, deltaMinutes);
  const earliestEndAtIso = shiftIsoByMinutes(
    cluster.startAtIso,
    MIN_CLUSTER_DURATION_MINUTES
  );
  const nextEndMs = nextEndAtIso ? parseIsoToMillis(nextEndAtIso) : null;
  const earliestEndMs = earliestEndAtIso
    ? parseIsoToMillis(earliestEndAtIso)
    : null;
  if (
    !nextEndAtIso ||
    !earliestEndAtIso ||
    nextEndMs === null ||
    earliestEndMs === null
  ) {
    return cluster;
  }
  return {
    ...cluster,
    endAtIso: nextEndMs < earliestEndMs ? earliestEndAtIso : nextEndAtIso,
  };
}

type ClusterLayoutEntry = {
  cluster: TimeClusterSegment;
  laneIndex: number;
  laneCount: number;
};

function buildClusterLayoutEntries(
  clusters: TimeClusterSegment[]
): ClusterLayoutEntry[] {
  const sorted = clusters.slice().sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.endMinute - b.endMinute;
  });

  const groups: TimeClusterSegment[][] = [];
  let currentGroup: TimeClusterSegment[] = [];
  let currentGroupEndMinute = -1;

  sorted.forEach((cluster) => {
    if (
      currentGroup.length === 0 ||
      cluster.startMinute < currentGroupEndMinute
    ) {
      currentGroup.push(cluster);
      currentGroupEndMinute = Math.max(
        currentGroupEndMinute,
        cluster.endMinute
      );
      return;
    }

    groups.push(currentGroup);
    currentGroup = [cluster];
    currentGroupEndMinute = cluster.endMinute;
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const layoutEntries: ClusterLayoutEntry[] = [];
  groups.forEach((group) => {
    const lanes: TimeClusterSegment[][] = [];

    group.forEach((cluster) => {
      const lane = lanes.find((candidate) => {
        const lastCluster = candidate[candidate.length - 1];
        return !lastCluster || lastCluster.endMinute <= cluster.startMinute;
      });
      if (lane) {
        lane.push(cluster);
        return;
      }
      lanes.push([cluster]);
    });

    const laneCount = Math.max(lanes.length, 1);
    lanes.forEach((lane, laneIndex) => {
      lane.forEach((cluster) => {
        layoutEntries.push({
          cluster,
          laneIndex,
          laneCount,
        });
      });
    });
  });

  return layoutEntries;
}

function hashString(value: string): number {
  return value
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function getClusterPalette(colorToken: string): ClusterPalette {
  const paletteIndex =
    Math.abs(hashString(colorToken || 'cluster')) % CLUSTER_PALETTES.length;
  return CLUSTER_PALETTES[paletteIndex];
}

function mixHexWithWhite(hex: string, ratio: number): string {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : normalized;
  if (expanded.length !== 6) return 'rgb(241, 245, 249)';
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return 'rgb(241, 245, 249)';
  }
  const weight = Math.max(0, Math.min(1, ratio));
  const blend = (channel: number) =>
    Math.round(channel + (255 - channel) * weight);
  return `rgb(${blend(red)}, ${blend(green)}, ${blend(blue)})`;
}

function createButton(
  label: string,
  variant: 'secondary' | 'primary' | 'ghost' | 'accent' = 'secondary',
  iconName?: IconName
): TextButtonElement {
  const tone: TextButtonTone =
    variant === 'primary' ? 'primary' : variant === 'ghost' ? 'text' : 'soft';
  const className =
    variant === 'primary'
      ? 'rounded-full !bg-slate-900 !text-white hover:!bg-slate-700'
      : variant === 'accent'
        ? 'rounded-full bg-indigo-50 !text-indigo-700 hover:!bg-indigo-100 hover:!text-indigo-800'
        : variant === 'ghost'
          ? 'rounded-full !text-slate-600 hover:!bg-slate-100 hover:!text-slate-900'
          : 'rounded-full border border-slate-200 bg-white !text-slate-700 hover:border-slate-300 hover:!bg-white hover:!text-slate-900';
  const button = createTextButton({
    text: iconName ? undefined : label,
    tone,
    size: 'md',
    className,
  });
  if (iconName) {
    const content = document.createElement('span');
    content.className = 'inline-flex items-center gap-2';

    const icon = createIcon(iconName, { size: 14, strokeWidth: 2 });
    icon.classList.add('shrink-0');
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = label;

    content.append(icon, text);
    button.replaceChildren(content);
  }

  return button;
}

export class TimeClusteringRootView {
  private readonly store: TimeClusteringStore;
  private readonly onLayoutModeChange: (mode: TimeClusteringLayoutMode) => void;
  private readonly root: HTMLDivElement;
  private readonly addClusterButton: TextButtonElement;
  private readonly layoutToggleButton: HTMLButtonElement;
  private readonly secondaryNav: HTMLDivElement;
  private readonly daySwitcher: HTMLDivElement;
  private readonly weekSwitcher: HTMLDivElement;
  private readonly weekRangeLabel: HTMLParagraphElement;
  private readonly weekPreviousButton: HTMLButtonElement;
  private readonly weekNextButton: HTMLButtonElement;
  private readonly warningBanner: HTMLDivElement;
  private readonly calendarSurface: HTMLDivElement;
  private calendarScrollContainer: HTMLDivElement | null = null;
  private disposeStoreSubscription: (() => void) | null = null;
  private nowIndicatorTimerId: number | null = null;
  private pendingScrollFrameId: number | null = null;
  private clusterEditModalOverlay: HTMLDivElement | null = null;
  private editingCluster: SelectedClusterRef | null = null;
  private recentClusterClick: RecentClusterClick | null = null;
  private selectedCluster: SelectedClusterRef | null = null;
  private activeClusterGesture: ActiveClusterGesture | null = null;
  private layoutMode: TimeClusteringLayoutMode;

  constructor(options: TimeClusteringRootViewOptions) {
    this.store = options.store;
    this.layoutMode = options.layoutMode;
    this.onLayoutModeChange = options.onLayoutModeChange;

    this.root = document.createElement('div');
    this.root.className =
      'flex h-full w-full flex-col overflow-hidden bg-slate-50 text-slate-900';

    const header = document.createElement('div');
    header.className = 'border-b border-slate-200 bg-white px-5 py-4';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex flex-wrap items-center gap-2';

    const actionGroup = document.createElement('div');
    actionGroup.className =
      'ml-auto flex flex-wrap items-center justify-end gap-2';

    this.addClusterButton = createButton('Add cluster', 'accent', 'plus');
    this.addClusterButton.onclick = () => {
      this.createClusterForSelectedDate();
    };

    this.layoutToggleButton = createIconButton({
      icon: 'chevron-right',
      tone: 'text',
      title: 'Expand',
      ariaLabel: 'Expand',
      iconStrokeWidth: 1.5,
      className: 'rounded-full',
    });
    this.layoutToggleButton.dataset.role = 'layout-toggle-button';
    this.layoutToggleButton.onclick = () => {
      this.onLayoutModeChange(
        this.layoutMode === 'docked-left' ? 'fullscreen' : 'docked-left'
      );
    };

    actionGroup.append(this.addClusterButton);

    headerRow.append(this.layoutToggleButton, actionGroup);

    this.secondaryNav = document.createElement('div');
    this.secondaryNav.className = 'mt-4 flex flex-col gap-2 overflow-auto';

    this.daySwitcher = document.createElement('div');
    this.daySwitcher.className = 'grid w-full grid-cols-7 gap-0.5';
    this.daySwitcher.dataset.role = 'day-switcher';

    this.weekSwitcher = document.createElement('div');
    this.weekSwitcher.className =
      'flex w-full items-center justify-between gap-1.5 px-0 py-0';
    this.weekSwitcher.dataset.role = 'week-switcher';

    this.weekRangeLabel = document.createElement('p');
    this.weekRangeLabel.className =
      'min-w-0 flex-1 text-center text-sm font-medium text-slate-500';

    this.weekPreviousButton = createIconButton({
      icon: 'chevron-left',
      tone: 'text',
      title: 'Previous week',
      ariaLabel: 'Previous week',
      iconStrokeWidth: 1.5,
      className: 'rounded-full',
    });
    this.weekNextButton = createIconButton({
      icon: 'chevron-right',
      tone: 'text',
      title: 'Next week',
      ariaLabel: 'Next week',
      iconStrokeWidth: 1.5,
      className: 'rounded-full',
    });

    this.weekSwitcher.append(
      this.weekPreviousButton,
      this.weekRangeLabel,
      this.weekNextButton
    );
    this.secondaryNav.append(this.weekSwitcher, this.daySwitcher);

    this.warningBanner = document.createElement('div');
    this.warningBanner.className =
      'hidden border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900';
    this.warningBanner.dataset.role = 'warning-banner';

    const body = document.createElement('div');
    body.className = 'flex min-h-0 flex-1 flex-col bg-slate-100';

    this.calendarSurface = document.createElement('div');
    this.calendarSurface.className = 'min-h-0 flex-1';
    this.calendarSurface.dataset.role = 'calendar-surface';

    header.append(headerRow, this.secondaryNav);
    body.append(this.calendarSurface);
    this.root.append(header, this.warningBanner, body);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
    this.disposeStoreSubscription = this.store.subscribe((snapshot) => {
      this.renderSnapshot(snapshot);
    });
    this.renderSnapshot(this.store.getSnapshot());
    this.scheduleNowIndicatorRefresh();
  }

  public unmount(): void {
    this.cancelActiveClusterGesture(true, false);
    this.closeClusterEditModal();
    this.clearNowIndicatorRefresh();
    this.clearPendingScrollFrame();
    this.disposeStoreSubscription?.();
    this.disposeStoreSubscription = null;
    this.root.remove();
  }

  public setLayoutMode(layoutMode: TimeClusteringLayoutMode): void {
    if (this.layoutMode === layoutMode) return;
    this.layoutMode = layoutMode;
    if (this.root.isConnected) {
      this.renderSnapshot(this.store.getSnapshot());
    }
  }

  private renderSnapshot(snapshot: TimeClusteringStateSnapshot): void {
    const selectedDateKey = snapshot.selectedDateKey;
    const weekDateKeys = buildWeekDateKeys(
      snapshot.weekAnchorDateKey || selectedDateKey
    );
    const visibleDateKeys =
      this.layoutMode === 'fullscreen' ? weekDateKeys : [selectedDateKey];
    const renderedClustersByDate = buildTimeClusterSegmentsByDate(
      visibleDateKeys,
      this.getRenderableClusters(snapshot)
    );
    const contextKey = this.getCalendarContextKey(snapshot, weekDateKeys);
    const previousScrollContainer = this.calendarScrollContainer;
    const previousScrollState = previousScrollContainer
      ? {
          contextKey: previousScrollContainer.dataset.contextKey ?? '',
          scrollTop: previousScrollContainer.scrollTop,
          scrollLeft: previousScrollContainer.scrollLeft,
        }
      : null;

    this.reconcileTransientState(snapshot, visibleDateKeys);

    this.updateLayoutToggleButton();
    this.weekRangeLabel.textContent = formatWeekRange(weekDateKeys);
    this.weekPreviousButton.onclick = () =>
      this.store.setSelectedDate(dayOffsetDateKey(selectedDateKey, -7));
    this.weekNextButton.onclick = () =>
      this.store.setSelectedDate(dayOffsetDateKey(selectedDateKey, 7));

    this.renderSecondaryNavigation(snapshot, weekDateKeys);
    this.renderWarnings(snapshot);
    this.renderCalendar(
      snapshot,
      weekDateKeys,
      contextKey,
      renderedClustersByDate
    );
    if (
      previousScrollState &&
      previousScrollState.contextKey === contextKey &&
      this.calendarScrollContainer
    ) {
      const { scrollLeft, scrollTop } = previousScrollState;
      this.clearPendingScrollFrame();
      this.pendingScrollFrameId = window.requestAnimationFrame(() => {
        if (!this.calendarScrollContainer) return;
        this.calendarScrollContainer.scrollTop = scrollTop;
        this.calendarScrollContainer.scrollLeft = scrollLeft;
        this.pendingScrollFrameId = null;
      });
      return;
    }
    this.syncCalendarScroll(snapshot, weekDateKeys);
  }

  private scheduleNowIndicatorRefresh(): void {
    this.clearNowIndicatorRefresh();
    const scheduleNextTick = () => {
      const now = new Date();
      const millisecondsUntilNextMinute =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 16;
      this.nowIndicatorTimerId = window.setTimeout(
        () => {
          if (this.root.isConnected) {
            this.renderSnapshot(this.store.getSnapshot());
            scheduleNextTick();
          }
        },
        Math.max(millisecondsUntilNextMinute, 1000)
      );
    };
    scheduleNextTick();
  }

  private clearNowIndicatorRefresh(): void {
    if (this.nowIndicatorTimerId === null) return;
    window.clearTimeout(this.nowIndicatorTimerId);
    this.nowIndicatorTimerId = null;
  }

  private clearPendingScrollFrame(): void {
    if (this.pendingScrollFrameId === null) return;
    window.cancelAnimationFrame(this.pendingScrollFrameId);
    this.pendingScrollFrameId = null;
  }

  private getCalendarContextKey(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[]
  ): string {
    return this.layoutMode === 'fullscreen'
      ? `week:${weekDateKeys.join('|')}`
      : `day:${snapshot.selectedDateKey}`;
  }

  private requestRender(): void {
    if (!this.root.isConnected) return;
    this.renderSnapshot(this.store.getSnapshot());
  }

  private getRenderableClusters(
    snapshot: TimeClusteringStateSnapshot
  ): TimeCluster[] {
    if (!this.activeClusterGesture) {
      return snapshot.clusters;
    }
    return snapshot.clusters.map((cluster) =>
      cluster.id === this.activeClusterGesture?.clusterId
        ? this.activeClusterGesture.previewCluster
        : cluster
    );
  }

  private isClusterSelected(clusterId: string): boolean {
    return this.selectedCluster?.clusterId === clusterId;
  }

  private isClusterVisible(
    snapshot: TimeClusteringStateSnapshot,
    visibleDateKeys: string[],
    clusterId: string
  ): boolean {
    const cluster = this.findCluster(snapshot, clusterId);
    if (!cluster) return false;
    return visibleDateKeys.some((dateKey) =>
      clusterIntersectsDateKey(cluster, dateKey)
    );
  }

  private findCluster(
    snapshot: TimeClusteringStateSnapshot,
    clusterId: string
  ): TimeCluster | null {
    return snapshot.clusters.find((cluster) => cluster.id === clusterId) ?? null;
  }

  private reconcileTransientState(
    snapshot: TimeClusteringStateSnapshot,
    visibleDateKeys: string[]
  ): void {
    if (this.selectedCluster) {
      const { clusterId } = this.selectedCluster;
      if (!this.isClusterVisible(snapshot, visibleDateKeys, clusterId)) {
        this.selectedCluster = null;
      }
    }

    if (this.activeClusterGesture) {
      const { clusterId } = this.activeClusterGesture;
      if (!this.isClusterVisible(snapshot, visibleDateKeys, clusterId)) {
        const gesture = this.activeClusterGesture;
        this.activeClusterGesture = null;
        gesture.cleanup();
      }
    }

    if (this.editingCluster) {
      const { clusterId } = this.editingCluster;
      if (!this.isClusterVisible(snapshot, visibleDateKeys, clusterId)) {
        this.closeClusterEditModal();
      }
    }
  }

  private updateLayoutToggleButton(): void {
    const isDocked = this.layoutMode === 'docked-left';
    const label = isDocked ? 'Expand' : 'Dock left';
    const iconName: IconName = isDocked ? 'chevron-right' : 'chevron-left';
    const icon = createIcon(iconName, { size: 16, strokeWidth: 1.5 });
    icon.setAttribute('aria-hidden', 'true');
    this.layoutToggleButton.title = label;
    this.layoutToggleButton.setAttribute('aria-label', label);
    this.layoutToggleButton.replaceChildren(icon);
  }

  private renderSecondaryNavigation(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[]
  ): void {
    const isWeekMode = this.layoutMode === 'fullscreen';

    this.daySwitcher.classList.toggle('hidden', isWeekMode);

    if (isWeekMode) {
      return;
    }

    this.daySwitcher.innerHTML = '';
    weekDateKeys.forEach((dateKey) => {
      const button = document.createElement('button');
      const isSelected = dateKey === snapshot.selectedDateKey;
      button.type = 'button';
      button.dataset.role = 'day-switch-button';
      button.dataset.dateKey = dateKey;
      button.className = isSelected
        ? 'rounded-lg bg-indigo-50 px-1 py-1 text-center text-indigo-700 transition'
        : 'rounded-lg bg-transparent px-1 py-1 text-center text-slate-500 transition hover:bg-slate-100/80 hover:text-slate-900';
      button.onclick = () => this.store.setSelectedDate(dateKey);

      const weekday = document.createElement('p');
      weekday.className = isSelected
        ? 'text-[8px] font-semibold uppercase tracking-[0.06em] text-indigo-500'
        : 'text-[8px] font-semibold uppercase tracking-[0.06em] text-slate-400';
      weekday.textContent = formatWeekdayInitial(dateKey);

      const dayNumber = document.createElement('p');
      dayNumber.className = isSelected
        ? 'mt-px text-[13px] font-semibold text-indigo-700'
        : 'mt-px text-[13px] font-semibold text-slate-700';
      dayNumber.textContent = formatDayNumber(dateKey);

      button.append(weekday, dayNumber);
      this.daySwitcher.appendChild(button);
    });
  }

  private renderWarnings(snapshot: TimeClusteringStateSnapshot): void {
    if (snapshot.lastWarnings.length === 0) {
      this.warningBanner.classList.add('hidden');
      this.warningBanner.textContent = '';
      return;
    }

    const count = snapshot.lastWarnings.length;
    this.warningBanner.classList.remove('hidden');
    this.warningBanner.textContent =
      count === 1
        ? '1 time overlap was detected. The overlapping blocks were kept visible.'
        : `${count} time overlaps were detected. The overlapping blocks were kept visible.`;
  }

  private renderCalendar(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[],
    contextKey: string,
    renderedClustersByDate: Record<string, TimeClusterSegment[]>
  ): void {
    this.calendarSurface.innerHTML = '';
    const isWeekMode = this.layoutMode === 'fullscreen';
    const container = document.createElement('div');
    container.className = 'h-full overflow-auto';
    container.dataset.contextKey = contextKey;
    this.calendarScrollContainer = container;

    const surface = document.createElement('div');
    surface.className =
      'min-h-full bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]';
    surface.style.minHeight = '100%';

    if (isWeekMode) {
      surface.appendChild(
        this.renderWeekCalendar(snapshot, weekDateKeys, renderedClustersByDate)
      );
    } else {
      surface.appendChild(this.renderDayCalendar(snapshot, renderedClustersByDate));
    }

    container.appendChild(surface);
    this.calendarSurface.appendChild(container);
  }

  private syncCalendarScroll(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[]
  ): void {
    const container = this.calendarScrollContainer;
    if (!container) return;

    const shouldTrackNow =
      this.layoutMode === 'fullscreen'
        ? weekDateKeys.includes(todayDateKey())
        : snapshot.selectedDateKey === todayDateKey();
    const targetTop = shouldTrackNow
      ? Math.max(
          0,
          (currentMinuteOfDay() / 60) * HOUR_ROW_HEIGHT_PX -
            HOUR_ROW_HEIGHT_PX * 3
        )
      : Math.max(
          0,
          (DEFAULT_VISIBLE_START_MINUTE / 60) * HOUR_ROW_HEIGHT_PX -
            HOUR_ROW_HEIGHT_PX
        );

    this.clearPendingScrollFrame();
    this.pendingScrollFrameId = window.requestAnimationFrame(() => {
      container.scrollTop = targetTop;
      this.pendingScrollFrameId = null;
    });
  }

  private renderDayCalendar(
    snapshot: TimeClusteringStateSnapshot,
    renderedClustersByDate: Record<string, TimeClusterSegment[]>
  ): HTMLDivElement {
    const dateKey = snapshot.selectedDateKey;
    const clusters = (renderedClustersByDate[dateKey] ?? []).slice();
    const isToday = dateKey === todayDateKey();
    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-full';
    wrapper.dataset.role = 'day-calendar';

    const body = document.createElement('div');
    body.className = 'flex';
    body.style.minWidth = `${TIME_GUTTER_WIDTH_PX + DAY_VIEW_MIN_WIDTH_PX}px`;

    body.append(
      this.renderTimeGutter(),
      this.renderCalendarColumn(dateKey, clusters, isToday, 'day')
    );
    wrapper.append(body);
    return wrapper;
  }

  private renderWeekCalendar(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[],
    renderedClustersByDate: Record<string, TimeClusterSegment[]>
  ): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative min-h-full';
    wrapper.dataset.role = 'week-calendar';

    const header = document.createElement('div');
    header.className =
      'sticky top-0 z-30 flex min-w-0 items-end bg-white px-4 py-1.5 shadow-[0_1px_0_rgba(226,232,240,0.95)]';
    header.dataset.role = 'week-calendar-header';
    header.style.minWidth = `${TIME_GUTTER_WIDTH_PX + WEEK_VIEW_DAY_WIDTH_PX * 7}px`;

    const spacer = document.createElement('div');
    spacer.style.width = `${TIME_GUTTER_WIDTH_PX}px`;
    spacer.style.flex = '0 0 auto';

    const headerGrid = document.createElement('div');
    headerGrid.className = 'grid flex-1 gap-0';
    headerGrid.style.gridTemplateColumns = `repeat(7, minmax(${WEEK_VIEW_DAY_WIDTH_PX}px, 1fr))`;
    headerGrid.dataset.role = 'week-header-grid';
    const todayKey = todayDateKey();

    weekDateKeys.forEach((dateKey) => {
      const cell = this.createCalendarHeaderCell({
        dateKey,
        highlighted: dateKey === todayKey,
      });
      cell.dataset.role = 'week-day-header';
      cell.dataset.dateKey = dateKey;
      headerGrid.appendChild(cell);
    });

    header.append(spacer, headerGrid);

    const body = document.createElement('div');
    body.className = 'flex';
    body.style.minWidth = `${TIME_GUTTER_WIDTH_PX + WEEK_VIEW_DAY_WIDTH_PX * 7}px`;

    const columnsGrid = document.createElement('div');
    columnsGrid.className = 'grid flex-1 gap-0';
    columnsGrid.style.gridTemplateColumns = `repeat(7, minmax(${WEEK_VIEW_DAY_WIDTH_PX}px, 1fr))`;
    columnsGrid.dataset.role = 'week-columns-grid';

    weekDateKeys.forEach((dateKey) => {
      const clusters = renderedClustersByDate[dateKey] ?? [];
      const column = this.renderCalendarColumn(
        dateKey,
        clusters,
        dateKey === todayKey,
        'week'
      );
      column.dataset.role = 'calendar-day-column';
      column.dataset.dateKey = dateKey;
      columnsGrid.appendChild(column);
    });

    body.append(this.renderTimeGutter(), columnsGrid);
    wrapper.append(header, body);
    return wrapper;
  }

  private renderTimeGutter(): HTMLDivElement {
    const gutter = document.createElement('div');
    gutter.className = 'relative';
    gutter.style.width = `${TIME_GUTTER_WIDTH_PX}px`;
    gutter.style.flex = `0 0 ${TIME_GUTTER_WIDTH_PX}px`;
    gutter.style.height = `${HOUR_ROW_HEIGHT_PX * 24}px`;

    for (let hour = 0; hour < 24; hour += 1) {
      const slot = document.createElement('div');
      slot.className = 'px-2 text-right text-[11px] font-medium text-slate-400';
      slot.style.height = `${HOUR_ROW_HEIGHT_PX}px`;
      slot.textContent = `${hour.toString().padStart(2, '0')}:00`;
      gutter.appendChild(slot);
    }

    return gutter;
  }

  private clearSelectedCluster(): void {
    if (!this.selectedCluster) return;
    this.recentClusterClick = null;
    this.selectedCluster = null;
    this.requestRender();
  }

  private handleCalendarBackgroundPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    if (this.activeClusterGesture) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('[data-role="cluster-block"]')) return;
    this.clearSelectedCluster();
  }

  private beginClusterGesture(params: {
    cluster: TimeCluster;
    event: PointerEvent;
    kind: ClusterGestureKind;
  }): void {
    const { cluster, event, kind } = params;
    if (event.button !== 0) return;

    this.cancelActiveClusterGesture(true);

    event.preventDefault();
    event.stopPropagation();

    const gesture: ActiveClusterGesture = {
      kind,
      clusterId: cluster.id,
      pointerId:
        typeof event.pointerId === 'number' && !Number.isNaN(event.pointerId)
          ? event.pointerId
          : 1,
      startClientY: event.clientY,
      initialCluster: cluster,
      previewCluster: cluster,
      started: kind !== 'move',
      cleanup: (): void => {},
    };

    const finishGesture = (
      pointerEvent: PointerEvent,
      cancelled: boolean
    ): void => {
      if (this.activeClusterGesture !== gesture) return;
      if (pointerEvent.pointerId !== gesture.pointerId) return;

      this.activeClusterGesture = null;
      gesture.cleanup();

      if (cancelled) {
        if (gesture.started) {
          this.requestRender();
        }
        return;
      }

      if (
        gesture.started &&
        !haveSameClusterRange(gesture.initialCluster, gesture.previewCluster)
      ) {
        this.recentClusterClick = null;
        this.store.updateCluster(cluster.id, {
          startAtIso: gesture.previewCluster.startAtIso,
          endAtIso: gesture.previewCluster.endAtIso,
        });
        return;
      }

      if (!gesture.started && gesture.kind === 'move') {
        this.handleClusterTap(cluster.id, pointerEvent);
        return;
      }

      if (gesture.started) {
        this.recentClusterClick = null;
        this.requestRender();
      }
    };

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      if (this.activeClusterGesture !== gesture) return;
      if (moveEvent.pointerId !== gesture.pointerId) return;

      if (!gesture.started) {
        if (
          Math.abs(moveEvent.clientY - gesture.startClientY) <
          CLUSTER_DRAG_THRESHOLD_PX
        ) {
          return;
        }
        gesture.started = true;
      }

      moveEvent.preventDefault();

      const nextPreviewCluster = this.buildPreviewCluster(
        gesture,
        moveEvent.clientY
      );
      if (haveSameClusterRange(gesture.previewCluster, nextPreviewCluster)) {
        return;
      }
      gesture.previewCluster = nextPreviewCluster;
      this.requestRender();
    };

    const handlePointerUp = (pointerEvent: PointerEvent): void => {
      finishGesture(pointerEvent, false);
    };

    const handlePointerCancel = (pointerEvent: PointerEvent): void => {
      finishGesture(pointerEvent, true);
    };

    gesture.cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      document.body.style.userSelect = '';
    };

    this.selectedCluster = { clusterId: cluster.id };
    this.activeClusterGesture = gesture;
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
    this.requestRender();
  }

  private buildPreviewCluster(
    gesture: ActiveClusterGesture,
    clientY: number
  ): TimeCluster {
    const deltaMinutes = deltaPixelsToSnappedMinutes(
      clientY - gesture.startClientY
    );

    if (gesture.kind === 'move') {
      return shiftClusterRange(gesture.initialCluster, deltaMinutes);
    }

    if (gesture.kind === 'resize-start') {
      return resizeClusterStart(gesture.initialCluster, deltaMinutes);
    }

    return resizeClusterEnd(gesture.initialCluster, deltaMinutes);
  }

  private cancelActiveClusterGesture(
    cancelled: boolean,
    shouldRender: boolean = true
  ): void {
    const activeGesture = this.activeClusterGesture;
    if (!activeGesture) return;

    this.activeClusterGesture = null;
    activeGesture.cleanup();

    if (cancelled && activeGesture.started && shouldRender) {
      this.requestRender();
    }
  }

  private closeClusterEditModal(): void {
    if (this.clusterEditModalOverlay) {
      this.clusterEditModalOverlay.remove();
      this.clusterEditModalOverlay = null;
    }
    this.editingCluster = null;
  }

  private handleClusterTap(
    clusterId: string,
    event: PointerEvent
  ): void {
    const eventTimestamp =
      typeof event.timeStamp === 'number' && event.timeStamp > 0
        ? event.timeStamp
        : Date.now();
    const previousClick = this.recentClusterClick;
    const isDoubleClick =
      previousClick &&
      previousClick.clusterId === clusterId &&
      eventTimestamp - previousClick.timestamp <=
        CLUSTER_DOUBLE_CLICK_WINDOW_MS;

    if (isDoubleClick) {
      this.recentClusterClick = null;
      this.openClusterEditModal(clusterId);
      return;
    }

    this.recentClusterClick = {
      clusterId,
      timestamp: eventTimestamp,
    };
  }

  private openClusterEditModal(clusterId: string): void {
    const snapshot = this.store.getSnapshot();
    const cluster = this.findCluster(snapshot, clusterId);
    if (!cluster) return;

    this.closeClusterEditModal();
    this.selectedCluster = { clusterId };
    this.editingCluster = { clusterId };
    this.requestRender();

    const { overlay, container, body, footer } = createModalShell(
      'Edit cluster',
      {
        subtitle: formatClusterDateTimeRange(cluster),
        onClose: () => this.closeClusterEditModal(),
        intent: 'form',
        zIndex: 240,
      }
    );
    this.clusterEditModalOverlay = overlay;
    overlay.dataset.role = 'cluster-edit-modal';
    container.dataset.role = 'cluster-edit-modal-container';
    container.style.width = 'min(32rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(32rem, calc(100vw - 2rem))';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-4';

    const titleField = document.createElement('label');
    titleField.className = 'flex flex-col gap-1.5';

    const titleLabel = document.createElement('span');
    titleLabel.className =
      'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    titleLabel.textContent = 'Title';

    const titleInput = createInputBase({
      value: cluster.title,
      autoFocus: true,
      autoComplete: 'off',
      className: 'w-full',
    });
    titleInput.dataset.role = 'cluster-edit-title-input';

    titleField.append(titleLabel, titleInput);

    const timeGrid = document.createElement('div');
    timeGrid.className = 'grid gap-3 sm:grid-cols-2';

    const startField = document.createElement('label');
    startField.className = 'flex flex-col gap-1.5';

    const startLabel = document.createElement('span');
    startLabel.className =
      'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    startLabel.textContent = 'Start';

    const startInput = createInputBase({
      type: 'datetime-local',
      value: formatDateTimeLocalInputValue(cluster.startAtIso),
      className: 'w-full font-mono',
    });
    startInput.step = String(CLUSTER_STEP_MINUTES * 60);
    startInput.dataset.role = 'cluster-edit-start-input';

    startField.append(startLabel, startInput);

    const endField = document.createElement('label');
    endField.className = 'flex flex-col gap-1.5';

    const endLabel = document.createElement('span');
    endLabel.className =
      'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    endLabel.textContent = 'End';

    const endInput = createInputBase({
      type: 'datetime-local',
      value: formatDateTimeLocalInputValue(cluster.endAtIso),
      className: 'w-full font-mono',
    });
    endInput.step = String(CLUSTER_STEP_MINUTES * 60);
    endInput.dataset.role = 'cluster-edit-end-input';

    endField.append(endLabel, endInput);
    timeGrid.append(startField, endField);

    const colorField = document.createElement('label');
    colorField.className = 'flex flex-col gap-1.5';

    const colorLabel = document.createElement('span');
    colorLabel.className =
      'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    colorLabel.textContent = 'Color';

    const colorOptions = CLUSTER_COLOR_TOKENS.includes(cluster.colorToken)
      ? CLUSTER_COLOR_TOKENS
      : [cluster.colorToken, ...CLUSTER_COLOR_TOKENS];
    const colorPicker = createColorPicker({
      options: buildClusterColorPickerOptions(colorOptions),
      value: cluster.colorToken,
      ariaLabel: 'Cluster color',
    });
    colorPicker.element.dataset.role = 'cluster-edit-color-picker';

    colorField.append(colorLabel, colorPicker.element);

    const helperText = document.createElement('p');
    helperText.className = 'text-xs text-slate-500';
    helperText.textContent = `Use local date/time values and ${CLUSTER_STEP_MINUTES}-minute steps.`;

    const errorMessage = document.createElement('p');
    errorMessage.className = 'hidden text-sm text-rose-600';
    errorMessage.dataset.role = 'cluster-edit-error';

    const setError = (message: string | null): void => {
      if (!message) {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
        return;
      }
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    };

    const submit = (): void => {
      const nextTitle = titleInput.value.trim();
      if (!nextTitle) {
        setError('Title is required.');
        return;
      }

      const nextStartAtIso = isoFromLocalDateTimeInput(startInput.value);
      const nextEndAtIso = isoFromLocalDateTimeInput(endInput.value);
      if (!nextStartAtIso || !nextEndAtIso) {
        setError('Select both start and end date/time values.');
        return;
      }
      if (
        differenceInMinutes(nextStartAtIso, nextEndAtIso) <
        MIN_CLUSTER_DURATION_MINUTES
      ) {
        setError(
          `End time must be at least ${MIN_CLUSTER_DURATION_MINUTES} minutes after start time.`
        );
        return;
      }

      setError(null);
      this.store.updateCluster(clusterId, {
        title: nextTitle,
        colorToken: colorPicker.getValue() ?? cluster.colorToken,
        startAtIso: nextStartAtIso,
        endAtIso: nextEndAtIso,
      });
      this.closeClusterEditModal();
    };

    const handleInputKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      submit();
    };

    titleInput.addEventListener('keydown', handleInputKeyDown);
    titleInput.addEventListener('input', () => setError(null));
    startInput.addEventListener('change', () => setError(null));
    endInput.addEventListener('change', () => setError(null));
    colorPicker.element.addEventListener('click', () => setError(null));

    const footerActions = createModalActionRow({ variant: 'form' });

    const cancelButton = createTextButton({
      text: 'Cancel',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
    });
    cancelButton.dataset.role = 'cluster-edit-cancel-button';
    cancelButton.onclick = () => this.closeClusterEditModal();

    const saveButton = createTextButton({
      text: 'Save',
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
    });
    saveButton.dataset.role = 'cluster-edit-save-button';
    saveButton.onclick = () => submit();

    footerActions.append(cancelButton, saveButton);

    content.append(titleField, timeGrid, colorField, helperText, errorMessage);
    body.appendChild(content);
    footer.appendChild(footerActions);
  }

  private renderClusterResizeHandle(options: {
    cluster: TimeCluster;
    edge: 'start' | 'end';
    palette: ClusterPalette;
  }): HTMLButtonElement {
    const { cluster, edge, palette } = options;
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className =
      'absolute left-1/2 z-20 flex h-3 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white';
    handle.dataset.role = 'cluster-resize-handle';
    handle.dataset.edge = edge;
    handle.style.top = edge === 'start' ? '0px' : '';
    handle.style.bottom = edge === 'end' ? '0px' : '';
    handle.style.touchAction = 'none';
    handle.setAttribute(
      'aria-label',
      edge === 'start'
        ? `Resize start for ${cluster.title}`
        : `Resize end for ${cluster.title}`
    );

    const grip = document.createElement('span');
    grip.className = 'pointer-events-none block h-[3px] w-5 rounded-full';
    grip.style.background = palette.accent;

    handle.appendChild(grip);
    handle.onpointerdown = (event) =>
      this.beginClusterGesture({
        cluster,
        event,
        kind: edge === 'start' ? 'resize-start' : 'resize-end',
      });

    return handle;
  }

  private renderCalendarColumn(
    dateKey: string,
    clusters: TimeClusterSegment[],
    highlighted: boolean,
    calendarMode: 'day' | 'week'
  ): HTMLDivElement {
    const column = document.createElement('div');
    column.className = highlighted ? 'relative bg-sky-50/40' : 'relative';
    column.style.height = `${HOUR_ROW_HEIGHT_PX * 24}px`;
    column.style.width = '100%';
    column.dataset.role = 'calendar-column';
    column.dataset.dateKey = dateKey;
    column.onpointerdown = (event) => this.handleCalendarBackgroundPointerDown(event);

    for (let hour = 0; hour < 24; hour += 1) {
      const hourSlot = document.createElement('div');
      hourSlot.className = 'box-border border-t border-slate-300/90';
      hourSlot.style.height = `${HOUR_ROW_HEIGHT_PX}px`;
      hourSlot.dataset.role = 'calendar-hour-slot';
      column.appendChild(hourSlot);
    }

    const layoutEntries = buildClusterLayoutEntries(clusters);

    layoutEntries.forEach(({ cluster, laneCount, laneIndex }) => {
      const eventBlock = this.renderClusterBlock(
        cluster,
        laneIndex,
        100 / laneCount,
        laneCount,
        dateKey,
        calendarMode
      );
      column.appendChild(eventBlock);
    });

    if (dateKey === todayDateKey()) {
      column.appendChild(this.renderCurrentTimeIndicator());
    }

    return column;
  }

  private renderCurrentTimeIndicator(): HTMLDivElement {
    const indicatorColor = '#2563eb';
    const indicator = document.createElement('div');
    indicator.className = 'pointer-events-none absolute inset-x-0 z-20';
    indicator.dataset.role = 'current-time-indicator';
    indicator.style.top = `${(currentMinuteOfDay() / 60) * HOUR_ROW_HEIGHT_PX}px`;

    const line = document.createElement('div');
    line.style.borderTop = `2px solid ${indicatorColor}`;

    const dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.left = '-4px';
    dot.style.top = '-4px';
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '999px';
    dot.style.background = indicatorColor;

    indicator.append(dot, line);
    return indicator;
  }

  private renderClusterBlock(
    clusterSegment: TimeClusterSegment,
    laneIndex: number,
    laneWidthPercent: number,
    laneCount: number,
    dateKey: string,
    calendarMode: 'day' | 'week'
  ): HTMLDivElement {
    const { cluster } = clusterSegment;
    const palette = getClusterPalette(cluster.colorToken);
    const isSelected = this.isClusterSelected(cluster.id);
    const isActiveGesture = this.activeClusterGesture?.clusterId === cluster.id;
    const top = (clusterSegment.startMinute / 60) * HOUR_ROW_HEIGHT_PX;
    const isDayMode = calendarMode === 'day';
    const verticalInsetPx = isDayMode ? 0 : 4;
    const horizontalInsetPx = isDayMode ? (laneCount > 1 ? 4 : 0) : 8;
    const baseHeight =
      ((clusterSegment.endMinute - clusterSegment.startMinute) / 60) *
      HOUR_ROW_HEIGHT_PX;
    const height = Math.max(baseHeight - verticalInsetPx * 2, 32);
    const widthPercent = Math.max(
      laneWidthPercent - 1.5,
      laneCount > 1 ? laneWidthPercent - 2.5 : 97
    );
    const leftPercent = laneCount > 1 ? laneIndex * laneWidthPercent : 0;

    const block = document.createElement('div');
    block.className =
      'absolute box-border overflow-hidden rounded-md px-3 py-2 transition-shadow';
    block.dataset.role = 'cluster-block';
    block.dataset.clusterId = cluster.id;
    block.dataset.dateKey = dateKey;
    block.dataset.selected = isSelected ? 'true' : 'false';
    block.style.top = `${top + verticalInsetPx}px`;
    block.style.height = `${height}px`;
    block.style.zIndex = isActiveGesture ? '30' : isSelected ? '20' : '10';
    block.style.left =
      laneCount > 1
        ? `calc(${leftPercent}% + ${horizontalInsetPx}px)`
        : `${horizontalInsetPx}px`;
    if (laneCount > 1) {
      block.style.width = `calc(${widthPercent}% - ${isDayMode ? 6 : 12}px)`;
    } else {
      block.style.width =
        horizontalInsetPx === 0
          ? '100%'
          : `calc(100% - ${horizontalInsetPx * 2}px)`;
    }
    block.style.background = isSelected
      ? palette.background
      : mixHexWithWhite(palette.accent, 0.92);
    block.style.boxShadow = isSelected
      ? '0 16px 24px rgba(15, 23, 42, 0.16)'
      : '0 10px 18px rgba(15, 23, 42, 0.08)';
    block.style.cursor =
      isActiveGesture && this.activeClusterGesture?.kind === 'move'
        ? 'grabbing'
        : 'grab';
    block.style.touchAction = 'none';
    block.onpointerdown = (event) =>
      this.beginClusterGesture({
        cluster,
        event,
        kind: 'move',
      });

    const accentRail = document.createElement('div');
    accentRail.className = 'pointer-events-none absolute';
    accentRail.setAttribute('aria-hidden', 'true');
    accentRail.style.left = '0px';
    accentRail.style.top = '0px';
    accentRail.style.bottom = '0px';
    accentRail.style.width = '3px';
    accentRail.style.background = palette.accent;

    const header = document.createElement('div');
    header.className = 'relative';
    header.style.paddingLeft = '10px';

    const content = document.createElement('div');
    content.className = 'min-w-0 flex-1';

    const title = document.createElement('p');
    title.className = 'truncate text-[13px] font-medium text-slate-900';
    title.textContent = cluster.title;

    const details = document.createElement('p');
    details.className = 'mt-0.5 truncate text-[11px] text-slate-500';
    details.textContent = formatClusterSegmentRange(clusterSegment);

    content.append(title, details);
    header.append(content);
    block.append(accentRail, header);
    if (isSelected) {
      if (clusterSegment.isStartSegment) {
        block.append(
          this.renderClusterResizeHandle({
            cluster,
            edge: 'start',
            palette,
          })
        );
      }
      if (clusterSegment.isEndSegment) {
        block.append(
          this.renderClusterResizeHandle({
            cluster,
            edge: 'end',
            palette,
          })
        );
      }
    }
    return block;
  }

  private createCalendarHeaderCell(options: {
    dateKey: string;
    highlighted: boolean;
  }): HTMLDivElement {
    const { dateKey, highlighted } = options;
    const cell = document.createElement('div');
    cell.className = highlighted
      ? 'px-2 py-1 text-left text-slate-900'
      : 'px-2 py-1 text-left text-slate-700';

    const weekday = document.createElement('p');
    weekday.className = highlighted
      ? 'text-[11px] font-semibold text-sky-600'
      : 'text-[11px] font-semibold';
    weekday.textContent = formatWeekdayLabel(dateKey);

    const date = document.createElement('p');
    date.className = highlighted
      ? 'mt-0.5 text-base font-semibold text-sky-600'
      : 'mt-0.5 text-base font-semibold text-slate-900';
    date.textContent = formatDayNumber(dateKey);

    cell.append(weekday, date);
    return cell;
  }

  private createClusterForSelectedDate(): void {
    const snapshot = this.store.getSnapshot();
    const selectedDateKey = snapshot.selectedDateKey;
    const existingClusters = buildTimeClusterSegmentsForDate(
      selectedDateKey,
      snapshot.clusters
    )
      .slice()
      .sort((a, b) => a.startMinute - b.startMinute);

    let startMinute = 9 * 60;
    for (const cluster of existingClusters) {
      if (
        startMinute + DEFAULT_CLUSTER_DURATION_MINUTES <=
        cluster.startMinute
      ) {
        break;
      }
      startMinute = roundUpToStep(cluster.endMinute, 30);
    }

    if (startMinute + DEFAULT_CLUSTER_DURATION_MINUTES > MINUTES_PER_DAY) {
      startMinute = Math.max(
        0,
        MINUTES_PER_DAY - DEFAULT_CLUSTER_DURATION_MINUTES
      );
    }

    const endMinute = Math.min(
      MINUTES_PER_DAY,
      startMinute + DEFAULT_CLUSTER_DURATION_MINUTES
    );
    const tokens = ['blue', 'green', 'amber', 'rose', 'violet', 'cyan'];

    this.store.createCluster({
      id: uniqueId(),
      title: `Cluster ${existingClusters.length + 1}`,
      colorToken: tokens[existingClusters.length % tokens.length] ?? 'blue',
      startAtIso: isoFromDateKeyMinute(selectedDateKey, startMinute),
      endAtIso: isoFromDateKeyMinute(selectedDateKey, endMinute),
    });
  }
}
