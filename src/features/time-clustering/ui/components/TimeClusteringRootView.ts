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
  dayDifference,
  dayOffsetDateKey,
  differenceInMinutes,
  getDateKeyForIso,
  isoFromDateKeyMinute,
  minuteOfDayFromDate,
  parseIsoToMillis,
  shiftIsoByDays,
  shiftIsoByMinutes,
  startOfWeekDateKey,
  todayDateKey,
} from '../../domain/time.ts';
import type {
  TimeCluster,
  TimeClusterRecurrence,
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
  createStepPicker,
  createColorPicker,
  createField,
  createInputBase,
  createSelectionChip,
  createSegmentedControl,
  setSelectionChipState,
  createTextButton,
  type ColorPickerOption,
  type SegmentedControl,
} from '../../../../ui-lib/src/hud/index.ts';
import { I18nService, createAppI18nService } from '../../../../i18n/index.ts';

interface TimeClusteringRootViewOptions {
  i18n?: I18nService;
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
const WEEKDAY_SELECTION_ORDER = [1, 2, 3, 4, 5, 6, 0];

type SelectedClusterRef = {
  clusterId: string;
};

type ClusterGestureKind = 'move' | 'resize-start' | 'resize-end';

type ActiveClusterGesture = {
  kind: ClusterGestureKind;
  clusterId: string;
  anchorDateKey: string;
  previewDateKey: string;
  pointerId: number;
  startClientX: number;
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

function formatWeekdayLabel(i18n: I18nService, dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey;
  return i18n.formatDate(date, { weekday: 'short' });
}

function formatWeekdayInitial(i18n: I18nService, dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey.slice(0, 1);
  return i18n.formatDate(date, { weekday: 'narrow' });
}

function formatDayNumber(i18n: I18nService, dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return '--';
  return i18n.formatDate(date, { day: 'numeric' });
}

function createCalendarDayChip(params: {
  selected: boolean;
  weekdayLabel: string;
  dayLabel: string;
  onClick: () => void;
}): HTMLButtonElement {
  const chip = createSelectionChip({
    selected: params.selected,
    size: 'compact',
    className:
      '!h-auto min-h-[42px] w-full min-w-0 flex-col gap-0 rounded-xl px-2 py-1.5 text-center',
  });
  chip.onclick = params.onClick;

  const weekday = document.createElement('p');
  weekday.className = params.selected
    ? 'text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-indigo-500'
    : 'text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-400';
  weekday.textContent = params.weekdayLabel;

  const dayNumber = document.createElement('p');
  dayNumber.className = params.selected
    ? 'mt-1 text-[14px] font-semibold leading-none text-indigo-700'
    : 'mt-1 text-[14px] font-semibold leading-none text-slate-700';
  dayNumber.textContent = params.dayLabel;

  chip.append(weekday, dayNumber);
  return chip;
}

function formatWeekdayShort(i18n: I18nService, weekday: number): string {
  const normalizedWeekday =
    weekday === 0 ? 6 : Math.max(0, Math.min(6, weekday - 1));
  const date = new Date(2026, 0, 5 + normalizedWeekday, 12, 0, 0, 0);
  return i18n.formatDate(date, { weekday: 'short' });
}

function getAnchorWeekday(iso: string): number | null {
  const dateKey = getDateKeyForIso(iso);
  const date = dateKey ? dateFromKey(dateKey) : null;
  return date ? date.getDay() : null;
}

function getWeeklySelection(cluster: TimeCluster): number[] {
  if (Array.isArray(cluster.recurrenceWeekdays) && cluster.recurrenceWeekdays.length > 0) {
    return [...cluster.recurrenceWeekdays];
  }
  const anchorWeekday = getAnchorWeekday(cluster.startAtIso);
  return anchorWeekday === null ? [1] : [anchorWeekday];
}

function formatWeekRange(i18n: I18nService, dateKeys: string[]): string {
  const start = dateFromKey(dateKeys[0] ?? '');
  const end = dateFromKey(dateKeys[dateKeys.length - 1] ?? '');
  if (!start || !end) return '';

  const startLabel = i18n.formatDate(start, {
    month: 'short',
    day: 'numeric',
  });
  const endLabel = i18n.formatDate(end, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} - ${endLabel}`;
}

function formatLongDate(i18n: I18nService, dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey;
  return i18n.formatDate(date, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPeriodDate(i18n: I18nService, dateKey: string): string {
  const date = dateFromKey(dateKey);
  if (!date) return dateKey;
  return i18n.formatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatClusterDateRange(
  i18n: I18nService,
  cluster: TimeCluster
): string {
  const startDateKey = getDateKeyForIso(cluster.startAtIso);
  const endDateKey = getDateKeyForIso(cluster.endAtIso);
  if (!startDateKey || !endDateKey) {
    return i18n.t('timeClustering.selectDate');
  }
  if (startDateKey === endDateKey) {
    return formatLongDate(i18n, startDateKey);
  }
  return `${formatLongDate(i18n, startDateKey)} - ${formatLongDate(
    i18n,
    endDateKey
  )}`;
}

function formatClusterSegmentRange(cluster: TimeClusterSegment): string {
  return `${formatMinute(cluster.startMinute)} - ${formatMinute(cluster.endMinute)}`;
}

function formatDateInputValue(iso: string): string {
  return getDateKeyForIso(iso) ?? '';
}

function minuteOfDayFromIso(iso: string): number | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return minuteOfDayFromDate(date);
}

function parseTimeInputValue(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatRecurrenceLabel(
  i18n: I18nService,
  recurrence: TimeClusterRecurrence
): string {
  switch (recurrence) {
    case 'daily':
      return i18n.t('timeClustering.repeatsDaily');
    case 'weekdays':
      return i18n.t('timeClustering.repeatsWeekdays');
    case 'weekly':
      return i18n.t('timeClustering.repeatsWeekly');
    case 'none':
    default:
      return i18n.t('timeClustering.recurrence.none');
  }
}

function roundUpToStep(minute: number, step: number): number {
  return Math.ceil(minute / step) * step;
}

function deltaPixelsToSnappedMinutes(deltaPixels: number): number {
  const pixelsPerStep = (HOUR_ROW_HEIGHT_PX / 60) * CLUSTER_STEP_MINUTES;
  return Math.round(deltaPixels / pixelsPerStep) * CLUSTER_STEP_MINUTES;
}

function humanizeColorTokenLabel(colorToken: string): string {
  return colorToken
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function formatColorTokenLabel(i18n: I18nService, colorToken: string): string {
  switch (colorToken) {
    case 'blue':
      return i18n.t('timeClustering.color.blue');
    case 'green':
      return i18n.t('timeClustering.color.green');
    case 'amber':
      return i18n.t('timeClustering.color.amber');
    case 'rose':
      return i18n.t('timeClustering.color.rose');
    case 'violet':
      return i18n.t('timeClustering.color.violet');
    case 'cyan':
      return i18n.t('timeClustering.color.cyan');
    case 'orange':
      return i18n.t('timeClustering.color.orange');
    case 'teal':
      return i18n.t('timeClustering.color.teal');
    case 'indigo':
      return i18n.t('timeClustering.color.indigo');
    default:
      return humanizeColorTokenLabel(colorToken);
  }
}

function buildClusterColorPickerOptions(
  i18n: I18nService,
  colorTokens: string[]
): ColorPickerOption<string>[] {
  return colorTokens.map((colorToken) => {
    const palette = getClusterPalette(colorToken);
    return {
      id: `cluster-color-${colorToken}`,
      value: colorToken,
      label: formatColorTokenLabel(i18n, colorToken),
      swatchColor: palette.accent,
      backgroundColor: palette.background,
      borderColor: palette.border,
      title: formatColorTokenLabel(i18n, colorToken),
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

function shiftClusterRangeByDays(
  cluster: TimeCluster,
  deltaDays: number
): TimeCluster {
  if (deltaDays === 0) return cluster;
  const nextStartAtIso = shiftIsoByDays(cluster.startAtIso, deltaDays);
  const nextEndAtIso = shiftIsoByDays(cluster.endAtIso, deltaDays);
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
    startAtIso: nextStartMs > latestStartMs ? latestStartAtIso : nextStartAtIso,
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

export class TimeClusteringRootView {
  private readonly i18n: I18nService;
  private readonly store: TimeClusteringStore;
  private readonly onLayoutModeChange: (mode: TimeClusteringLayoutMode) => void;
  private readonly root: HTMLDivElement;
  private readonly addClusterButton: HTMLButtonElement;
  private readonly secondaryNav: HTMLDivElement;
  private readonly periodSwitcher: HTMLDivElement;
  private readonly periodCurrentSurface: HTMLButtonElement;
  private readonly periodLabel: HTMLSpanElement;
  private readonly periodDateInput: HTMLInputElement;
  private readonly periodPreviousButton: HTMLButtonElement;
  private readonly periodNextButton: HTMLButtonElement;
  private readonly viewModeSwitcher: HTMLDivElement;
  private readonly viewModeControl: SegmentedControl<TimeClusteringLayoutMode>;
  private readonly dayModeButton: HTMLButtonElement;
  private readonly weekModeButton: HTMLButtonElement;
  private readonly daySwitcher: HTMLDivElement;
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
    this.i18n = options.i18n ?? createAppI18nService();
    this.store = options.store;
    this.layoutMode = options.layoutMode;
    this.onLayoutModeChange = options.onLayoutModeChange;

    this.root = document.createElement('div');
    this.root.className =
      'flex h-full w-full flex-col overflow-hidden bg-slate-50 text-slate-900';

    const header = document.createElement('div');
    header.className = 'border-b border-slate-200 bg-white px-5 py-4';

    this.addClusterButton = createIconButton({
      icon: 'plus',
      size: 'sm',
      tone: 'secondary',
      title: this.i18n.t('timeClustering.addCluster'),
      ariaLabel: this.i18n.t('timeClustering.addCluster'),
      iconStrokeWidth: 1.9,
    });
    this.addClusterButton.dataset.role = 'add-cluster-button';
    this.addClusterButton.onclick = () => {
      this.createClusterForSelectedDate();
    };

    this.secondaryNav = document.createElement('div');
    this.secondaryNav.className = 'mt-4 flex flex-col gap-2.5';

    const navigationRow = document.createElement('div');
    navigationRow.className =
      'flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center';

    const periodPicker = createStepPicker({
      previousLabel: this.i18n.t('timeClustering.period.previous'),
      nextLabel: this.i18n.t('timeClustering.period.next'),
      className: 'shrink-0',
    });
    this.periodSwitcher = periodPicker.element;
    this.periodSwitcher.dataset.role = 'period-switcher';
    this.periodPreviousButton = periodPicker.previousButton;
    this.periodPreviousButton.dataset.role = 'period-previous-button';
    this.periodCurrentSurface = periodPicker.triggerButton;
    this.periodCurrentSurface.dataset.role = 'period-current-surface';
    this.periodCurrentSurface.style.minWidth = '12rem';
    this.periodCurrentSurface.style.maxWidth = '18rem';
    this.periodLabel = periodPicker.triggerLabel;
    this.periodLabel.className = 'min-w-0 flex-1 truncate text-left';
    this.periodLabel.dataset.role = 'period-label';
    this.periodNextButton = periodPicker.nextButton;
    this.periodNextButton.dataset.role = 'period-next-button';

    this.periodDateInput = document.createElement('input');
    this.periodDateInput.type = 'date';
    this.periodDateInput.dataset.role = 'period-date-input';
    this.periodDateInput.tabIndex = -1;
    this.periodDateInput.setAttribute('aria-hidden', 'true');
    this.periodDateInput.style.position = 'absolute';
    this.periodDateInput.style.opacity = '0';
    this.periodDateInput.style.pointerEvents = 'none';
    this.periodDateInput.style.width = '1px';
    this.periodDateInput.style.height = '1px';
    this.periodDateInput.style.inset = '0 auto auto 0';
    this.periodDateInput.addEventListener('change', () => {
      if (!this.periodDateInput.value) return;
      this.store.setSelectedDate(this.periodDateInput.value);
    });

    this.periodSwitcher.append(this.periodDateInput);

    this.viewModeControl = createSegmentedControl<TimeClusteringLayoutMode>({
      ariaLabel: this.i18n.t('timeClustering.viewMode'),
      size: 'sm',
      value: this.layoutMode,
      options: [
        {
          id: 'time-clustering-view-day',
          value: 'docked-left',
          label: this.i18n.t('timeClustering.view.day'),
        },
        {
          id: 'time-clustering-view-week',
          value: 'fullscreen',
          label: this.i18n.t('timeClustering.view.week'),
        },
      ],
      onChange: (mode) => this.onLayoutModeChange(mode),
    });
    this.viewModeSwitcher = this.viewModeControl.element;
    this.viewModeSwitcher.dataset.role = 'view-mode-switcher';
    const [dayModeButton, weekModeButton] = Array.from(
      this.viewModeSwitcher.querySelectorAll<HTMLButtonElement>('button')
    );
    this.dayModeButton = dayModeButton ?? document.createElement('button');
    this.weekModeButton = weekModeButton ?? document.createElement('button');
    this.dayModeButton.dataset.role = 'view-mode-button';
    this.dayModeButton.dataset.mode = 'day';
    this.weekModeButton.dataset.role = 'view-mode-button';
    this.weekModeButton.dataset.mode = 'week';

    const navigationActions = document.createElement('div');
    navigationActions.className =
      'inline-flex shrink-0 items-center gap-2 self-start';
    navigationActions.append(this.viewModeSwitcher, this.addClusterButton);
    navigationRow.append(this.periodSwitcher, navigationActions);

    this.daySwitcher = document.createElement('div');
    this.daySwitcher.className = 'grid w-full grid-cols-7 gap-0.5';
    this.daySwitcher.dataset.role = 'day-switcher';
    this.secondaryNav.append(navigationRow, this.daySwitcher);

    this.warningBanner = document.createElement('div');
    this.warningBanner.className =
      'hidden border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900';
    this.warningBanner.dataset.role = 'warning-banner';

    const body = document.createElement('div');
    body.className = 'flex min-h-0 flex-1 flex-col bg-slate-100';

    this.calendarSurface = document.createElement('div');
    this.calendarSurface.className = 'min-h-0 flex-1';
    this.calendarSurface.dataset.role = 'calendar-surface';

    header.append(this.secondaryNav);
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

    this.updateViewModeButtons();
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
    return (
      snapshot.clusters.find((cluster) => cluster.id === clusterId) ?? null
    );
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

  private updateViewModeButtons(): void {
    const isDayMode = this.layoutMode === 'docked-left';
    this.viewModeControl.setValue(this.layoutMode);
    this.dayModeButton.dataset.selected = isDayMode ? 'true' : 'false';
    this.weekModeButton.dataset.selected = isDayMode ? 'false' : 'true';
  }

  private renderSecondaryNavigation(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[]
  ): void {
    const isWeekMode = this.layoutMode === 'fullscreen';
    const periodOffsetDays = isWeekMode ? 7 : 1;

    this.periodLabel.textContent = isWeekMode
      ? formatWeekRange(this.i18n, weekDateKeys)
      : formatPeriodDate(this.i18n, snapshot.selectedDateKey);
    this.periodDateInput.value = snapshot.selectedDateKey;
    this.periodCurrentSurface.title = isWeekMode
      ? this.i18n.t('timeClustering.period.jumpToWeek')
      : this.i18n.t('timeClustering.period.jumpToDate');
    this.periodCurrentSurface.setAttribute(
      'aria-label',
      isWeekMode
        ? this.i18n.t('timeClustering.period.jumpToWeek')
        : this.i18n.t('timeClustering.period.jumpToDate')
    );
    this.periodCurrentSurface.onclick = () => {
      this.periodDateInput.value = snapshot.selectedDateKey;
      const pickerInput = this.periodDateInput as HTMLInputElement & {
        showPicker?: () => void;
      };
      if (typeof pickerInput.showPicker === 'function') {
        pickerInput.showPicker();
        return;
      }
      this.periodDateInput.focus();
      this.periodDateInput.click();
    };
    this.periodPreviousButton.title = isWeekMode
      ? this.i18n.t('timeClustering.previousWeek')
      : this.i18n.t('timeClustering.previousDay');
    this.periodPreviousButton.setAttribute(
      'aria-label',
      isWeekMode
        ? this.i18n.t('timeClustering.previousWeek')
        : this.i18n.t('timeClustering.previousDay')
    );
    this.periodPreviousButton.onclick = () =>
      this.store.setSelectedDate(
        dayOffsetDateKey(snapshot.selectedDateKey, -periodOffsetDays)
      );
    this.periodNextButton.title = isWeekMode
      ? this.i18n.t('timeClustering.nextWeek')
      : this.i18n.t('timeClustering.nextDay');
    this.periodNextButton.setAttribute(
      'aria-label',
      isWeekMode
        ? this.i18n.t('timeClustering.nextWeek')
        : this.i18n.t('timeClustering.nextDay')
    );
    this.periodNextButton.onclick = () =>
      this.store.setSelectedDate(
        dayOffsetDateKey(snapshot.selectedDateKey, periodOffsetDays)
      );

    this.daySwitcher.classList.toggle('hidden', isWeekMode);

    if (isWeekMode) {
      return;
    }

    this.daySwitcher.innerHTML = '';
    weekDateKeys.forEach((dateKey) => {
      const isSelected = dateKey === snapshot.selectedDateKey;
      const button = createCalendarDayChip({
        selected: isSelected,
        weekdayLabel: formatWeekdayInitial(this.i18n, dateKey),
        dayLabel: formatDayNumber(this.i18n, dateKey),
        onClick: () => this.store.setSelectedDate(dateKey),
      });
      button.dataset.role = 'day-switch-button';
      button.dataset.dateKey = dateKey;
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
        ? this.i18n.t('timeClustering.overlap.one')
        : this.i18n.t('timeClustering.overlap.many', { count });
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
      surface.appendChild(
        this.renderDayCalendar(snapshot, renderedClustersByDate)
      );
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
      this.renderCalendarColumn(dateKey, clusters, {
        isToday,
        isSelectedDate: true,
        calendarMode: 'day',
      })
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
      'sticky top-0 z-40 flex min-w-0 items-end bg-white px-4 py-1.5 shadow-[0_1px_0_rgba(226,232,240,0.95)]';
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
        isToday: dateKey === todayKey,
        isSelectedDate: dateKey === snapshot.selectedDateKey,
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
      const column = this.renderCalendarColumn(dateKey, clusters, {
        isToday: dateKey === todayKey,
        isSelectedDate: dateKey === snapshot.selectedDateKey,
        calendarMode: 'week',
      });
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

  private clearSelectedCluster(shouldRender: boolean = true): void {
    if (!this.selectedCluster) return;
    this.recentClusterClick = null;
    this.selectedCluster = null;
    if (shouldRender) {
      this.requestRender();
    }
  }

  private handleCalendarBackgroundPointerDown(
    event: PointerEvent,
    dateKey: string,
    calendarMode: 'day' | 'week'
  ): void {
    if (event.button !== 0) return;
    if (this.activeClusterGesture) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('[data-role="cluster-block"]')) return;
    const shouldUpdateDate =
      calendarMode === 'week' &&
      this.store.getSnapshot().selectedDateKey !== dateKey;
    this.clearSelectedCluster(!shouldUpdateDate);
    if (shouldUpdateDate) {
      this.store.setSelectedDate(dateKey);
    }
  }

  private beginClusterGesture(params: {
    cluster: TimeCluster;
    anchorDateKey: string;
    event: PointerEvent;
    kind: ClusterGestureKind;
  }): void {
    const { cluster, anchorDateKey, event, kind } = params;
    if (event.button !== 0) return;

    this.cancelActiveClusterGesture(true);

    event.preventDefault();
    event.stopPropagation();

    const gesture: ActiveClusterGesture = {
      kind,
      clusterId: cluster.id,
      anchorDateKey,
      previewDateKey: anchorDateKey,
      pointerId:
        typeof event.pointerId === 'number' && !Number.isNaN(event.pointerId)
          ? event.pointerId
          : 1,
      startClientX: event.clientX,
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
          Math.max(
            Math.abs(moveEvent.clientX - gesture.startClientX),
            Math.abs(moveEvent.clientY - gesture.startClientY)
          ) < CLUSTER_DRAG_THRESHOLD_PX
        ) {
          return;
        }
        gesture.started = true;
      }

      moveEvent.preventDefault();

      const nextPreview = this.buildPreviewCluster(
        gesture,
        moveEvent.clientX,
        moveEvent.clientY
      );
      if (
        gesture.previewDateKey === nextPreview.previewDateKey &&
        haveSameClusterRange(gesture.previewCluster, nextPreview.previewCluster)
      ) {
        return;
      }
      gesture.previewDateKey = nextPreview.previewDateKey;
      gesture.previewCluster = nextPreview.previewCluster;
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
    clientX: number,
    clientY: number
  ): {
    previewDateKey: string;
    previewCluster: TimeCluster;
  } {
    const deltaMinutes = deltaPixelsToSnappedMinutes(
      clientY - gesture.startClientY
    );

    if (gesture.kind === 'move') {
      const previewDateKey =
        this.layoutMode === 'fullscreen'
          ? this.resolveWeekGestureDateKey(clientX, gesture.previewDateKey)
          : gesture.anchorDateKey;
      const deltaDays = dayDifference(gesture.anchorDateKey, previewDateKey);
      return {
        previewDateKey,
        previewCluster: shiftClusterRange(
          shiftClusterRangeByDays(gesture.initialCluster, deltaDays),
          deltaMinutes
        ),
      };
    }

    if (gesture.kind === 'resize-start') {
      return {
        previewDateKey: gesture.anchorDateKey,
        previewCluster: resizeClusterStart(
          gesture.initialCluster,
          deltaMinutes
        ),
      };
    }

    return {
      previewDateKey: gesture.anchorDateKey,
      previewCluster: resizeClusterEnd(gesture.initialCluster, deltaMinutes),
    };
  }

  private resolveWeekGestureDateKey(
    clientX: number,
    fallbackDateKey: string
  ): string {
    const dayColumns = Array.from(
      this.root.querySelectorAll<HTMLElement>(
        '[data-role="calendar-day-column"]'
      )
    );
    for (const column of dayColumns) {
      const rect = column.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return column.dataset.dateKey ?? fallbackDateKey;
      }
    }
    return fallbackDateKey;
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

  private handleClusterTap(clusterId: string, event: PointerEvent): void {
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
      cluster.title.trim() || this.i18n.t('timeClustering.untitledCluster'),
      {
        subtitle: formatClusterDateRange(this.i18n, cluster),
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
    titleLabel.textContent = this.i18n.t('timeClustering.edit.title');

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

    const startField = createField({
      label: this.i18n.t('timeClustering.edit.start'),
    });
    const startControls = document.createElement('div');
    startControls.className = 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]';

    const startDateInput = createInputBase({
      type: 'date',
      value: formatDateInputValue(cluster.startAtIso),
      className: 'w-full',
    });
    startDateInput.dataset.role = 'cluster-edit-start-date-input';

    const startTimeInput = createInputBase({
      type: 'time',
      value: formatMinute(
        minuteOfDayFromIso(cluster.startAtIso) ?? DEFAULT_VISIBLE_START_MINUTE
      ),
      className: 'w-full font-mono',
    });
    startTimeInput.step = String(CLUSTER_STEP_MINUTES * 60);
    startTimeInput.dataset.role = 'cluster-edit-start-time-input';

    startControls.append(startDateInput, startTimeInput);
    startField.setControl(startControls);

    const endField = createField({
      label: this.i18n.t('timeClustering.edit.end'),
    });
    const endControls = document.createElement('div');
    endControls.className = 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]';

    const endDateInput = createInputBase({
      type: 'date',
      value: formatDateInputValue(cluster.endAtIso),
      className: 'w-full',
    });
    endDateInput.dataset.role = 'cluster-edit-end-date-input';

    const endTimeInput = createInputBase({
      type: 'time',
      value: formatMinute(
        minuteOfDayFromIso(cluster.endAtIso) ??
          DEFAULT_VISIBLE_START_MINUTE + DEFAULT_CLUSTER_DURATION_MINUTES
      ),
      className: 'w-full font-mono',
    });
    endTimeInput.step = String(CLUSTER_STEP_MINUTES * 60);
    endTimeInput.dataset.role = 'cluster-edit-end-time-input';

    endControls.append(endDateInput, endTimeInput);
    endField.setControl(endControls);
    timeGrid.append(startField.element, endField.element);

    const recurrenceControl = createSegmentedControl<TimeClusterRecurrence>({
      size: 'md',
      fullWidth: true,
      ariaLabel: this.i18n.t('timeClustering.recurrence.aria'),
      value: cluster.recurrence,
      options: [
        {
          id: 'cluster-recurrence-none',
          value: 'none',
          label: this.i18n.t('timeClustering.recurrence.none'),
          title: this.i18n.t('timeClustering.recurrence.noneDescription'),
        },
        {
          id: 'cluster-recurrence-daily',
          value: 'daily',
          label: this.i18n.t('timeClustering.recurrence.daily'),
          title: this.i18n.t('timeClustering.recurrence.dailyDescription'),
        },
        {
          id: 'cluster-recurrence-weekdays',
          value: 'weekdays',
          label: this.i18n.t('timeClustering.recurrence.weekdays'),
          title: this.i18n.t('timeClustering.recurrence.weekdaysDescription'),
        },
        {
          id: 'cluster-recurrence-weekly',
          value: 'weekly',
          label: this.i18n.t('timeClustering.recurrence.weekly'),
          title: this.i18n.t('timeClustering.recurrence.weeklyDescription'),
        },
      ],
    });
    recurrenceControl.element.dataset.role = 'cluster-edit-recurrence-control';
    const recurrenceField = createField({
      label: this.i18n.t('timeClustering.recurrence'),
      control: recurrenceControl.element,
      hint: formatRecurrenceLabel(this.i18n, cluster.recurrence),
    });

    const recurrenceOptions = document.createElement('div');
    recurrenceOptions.className = 'flex flex-col gap-3';
    recurrenceOptions.dataset.role = 'cluster-edit-recurrence-options';

    const recurrenceEndField = createField({
      label: this.i18n.t('timeClustering.recurrence.endsOn'),
    });
    const recurrenceEndInput = createInputBase({
      type: 'date',
      value: cluster.recurrenceEndDateKey ?? '',
      className: 'w-full',
    });
    recurrenceEndInput.dataset.role = 'cluster-edit-recurrence-end-date-input';
    recurrenceEndField.setControl(recurrenceEndInput);
    recurrenceEndField.setState({
      hint: this.i18n.t('timeClustering.recurrence.endsOnHint'),
    });

    const weeklySelectorField = createField({
      label: this.i18n.t('timeClustering.recurrence.weeklyDays'),
    });
    const weeklySelector = document.createElement('div');
    weeklySelector.className = 'grid grid-cols-7 gap-1';
    weeklySelector.dataset.role = 'cluster-edit-weekday-selector';

    const selectedWeeklyDays = new Set<number>(getWeeklySelection(cluster));
    const weekdayButtons = new Map<number, HTMLButtonElement>();
    const updateWeekdayButtonState = (): void => {
      weekdayButtons.forEach((button, weekday) => {
        setSelectionChipState(button, {
          selected: selectedWeeklyDays.has(weekday),
        });
      });
    };

    WEEKDAY_SELECTION_ORDER.forEach((weekday) => {
      const button = createSelectionChip({
        selected: selectedWeeklyDays.has(weekday),
        size: 'compact',
      });
      button.dataset.role = 'cluster-edit-weekday-button';
      button.dataset.weekday = String(weekday);
      button.textContent = formatWeekdayShort(this.i18n, weekday);
      button.onclick = () => {
        if (selectedWeeklyDays.has(weekday)) {
          selectedWeeklyDays.delete(weekday);
        } else {
          selectedWeeklyDays.add(weekday);
        }
        updateWeekdayButtonState();
        setError(null);
      };
      weekdayButtons.set(weekday, button);
      weeklySelector.appendChild(button);
    });
    updateWeekdayButtonState();
    weeklySelectorField.setControl(weeklySelector);
    weeklySelectorField.setState({
      hint: this.i18n.t('timeClustering.recurrence.weeklyDaysHint'),
    });

    const updateRecurrenceOptionsVisibility = (): void => {
      const value = recurrenceControl.getValue() ?? 'none';
      recurrenceOptions.classList.toggle('hidden', value === 'none');
      recurrenceEndField.element.classList.toggle('hidden', value === 'none');
      weeklySelectorField.element.classList.toggle('hidden', value !== 'weekly');
    };

    recurrenceOptions.append(
      recurrenceEndField.element,
      weeklySelectorField.element
    );
    updateRecurrenceOptionsVisibility();

    const colorField = document.createElement('label');
    colorField.className = 'flex flex-col gap-1.5';

    const colorLabel = document.createElement('span');
    colorLabel.className =
      'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    colorLabel.textContent = this.i18n.t('timeClustering.edit.color');

    const colorOptions = CLUSTER_COLOR_TOKENS.includes(cluster.colorToken)
      ? CLUSTER_COLOR_TOKENS
      : [cluster.colorToken, ...CLUSTER_COLOR_TOKENS];
    const colorPicker = createColorPicker({
      options: buildClusterColorPickerOptions(this.i18n, colorOptions),
      value: cluster.colorToken,
      ariaLabel: this.i18n.t('timeClustering.clusterColor'),
    });
    colorPicker.element.dataset.role = 'cluster-edit-color-picker';

    colorField.append(colorLabel, colorPicker.element);

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
        setError(this.i18n.t('timeClustering.error.titleRequired'));
        return;
      }

      const nextStartDateKey = startDateInput.value;
      const nextEndDateKey = endDateInput.value;
      const nextStartMinute = parseTimeInputValue(startTimeInput.value);
      const nextEndMinute = parseTimeInputValue(endTimeInput.value);
      if (
        !nextStartDateKey ||
        !nextEndDateKey ||
        nextStartMinute === null ||
        nextEndMinute === null
      ) {
        setError(this.i18n.t('timeClustering.error.invalidDateRange'));
        return;
      }
      const nextStartAtIso = isoFromDateKeyMinute(
        nextStartDateKey,
        nextStartMinute
      );
      const nextEndAtIso = isoFromDateKeyMinute(nextEndDateKey, nextEndMinute);
      const nextRecurrence = recurrenceControl.getValue() ?? 'none';
      if (
        differenceInMinutes(nextStartAtIso, nextEndAtIso) <
        MIN_CLUSTER_DURATION_MINUTES
      ) {
        setError(
          this.i18n.t('timeClustering.error.minDuration', {
            minutes: MIN_CLUSTER_DURATION_MINUTES,
          })
        );
        return;
      }
      if (
        nextRecurrence !== 'none' &&
        recurrenceEndInput.value &&
        dayDifference(nextStartDateKey, recurrenceEndInput.value) < 0
      ) {
        setError(this.i18n.t('timeClustering.error.invalidRecurrenceEnd'));
        return;
      }
      if (nextRecurrence === 'weekly' && selectedWeeklyDays.size === 0) {
        setError(this.i18n.t('timeClustering.error.recurrenceWeekdayRequired'));
        return;
      }

      setError(null);
      this.store.updateCluster(clusterId, {
        title: nextTitle,
        colorToken: colorPicker.getValue() ?? cluster.colorToken,
        startAtIso: nextStartAtIso,
        endAtIso: nextEndAtIso,
        recurrence: nextRecurrence,
        recurrenceEndDateKey:
          nextRecurrence === 'none' ? null : recurrenceEndInput.value || null,
        recurrenceWeekdays:
          nextRecurrence === 'weekly'
            ? [...selectedWeeklyDays].sort((a, b) => a - b)
            : undefined,
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
    startDateInput.addEventListener('keydown', handleInputKeyDown);
    startTimeInput.addEventListener('keydown', handleInputKeyDown);
    endDateInput.addEventListener('keydown', handleInputKeyDown);
    endTimeInput.addEventListener('keydown', handleInputKeyDown);
    startDateInput.addEventListener('change', () => setError(null));
    startTimeInput.addEventListener('change', () => setError(null));
    endDateInput.addEventListener('change', () => setError(null));
    endTimeInput.addEventListener('change', () => setError(null));
    recurrenceEndInput.addEventListener('change', () => setError(null));
    recurrenceControl.element.addEventListener('click', () => {
      recurrenceField.setState({
        hint: formatRecurrenceLabel(
          this.i18n,
          recurrenceControl.getValue() ?? 'none'
        ),
      });
      updateRecurrenceOptionsVisibility();
      setError(null);
    });
    colorPicker.element.addEventListener('click', () => setError(null));

    const footerActions = createModalActionRow({ variant: 'form' });

    const cancelButton = createTextButton({
      text: this.i18n.t('common.cancel'),
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
    });
    cancelButton.dataset.role = 'cluster-edit-cancel-button';
    cancelButton.onclick = () => this.closeClusterEditModal();

    const saveButton = createTextButton({
      text: this.i18n.t('common.save'),
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
    });
    saveButton.dataset.role = 'cluster-edit-save-button';
    saveButton.onclick = () => submit();

    footerActions.append(cancelButton, saveButton);

    content.append(
      titleField,
      timeGrid,
      recurrenceField.element,
      recurrenceOptions,
      colorField,
      errorMessage
    );
    body.appendChild(content);
    footer.appendChild(footerActions);
  }

  private renderClusterResizeHandle(options: {
    cluster: TimeCluster;
    dateKey: string;
    edge: 'start' | 'end';
    palette: ClusterPalette;
  }): HTMLButtonElement {
    const { cluster, dateKey, edge, palette } = options;
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className =
      'absolute left-1/2 z-20 flex h-4 min-w-[2.75rem] -translate-x-1/2 items-center justify-center rounded-full border px-1.5 transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70';
    handle.dataset.role = 'cluster-resize-handle';
    handle.dataset.edge = edge;
    handle.style.top = edge === 'start' ? '-6px' : '';
    handle.style.bottom = edge === 'end' ? '-6px' : '';
    handle.style.touchAction = 'none';
    handle.style.background = mixHexWithWhite(palette.accent, 0.97);
    handle.style.borderColor = mixHexWithWhite(palette.accent, 0.82);
    handle.style.boxShadow = '0 6px 14px rgba(15, 23, 42, 0.12)';
    handle.setAttribute(
      'aria-label',
      edge === 'start'
        ? this.i18n.t('timeClustering.resizeStart', {
            title: cluster.title,
          })
        : this.i18n.t('timeClustering.resizeEnd', {
            title: cluster.title,
          })
    );

    const grip = document.createElement('span');
    grip.className =
      'pointer-events-none flex flex-col items-center justify-center gap-[2px]';

    const topBar = document.createElement('span');
    topBar.className = 'block h-px w-3 rounded-full';
    topBar.style.background = mixHexWithWhite(palette.accent, 0.2);

    const bottomBar = document.createElement('span');
    bottomBar.className = 'block h-px w-2 rounded-full';
    bottomBar.style.background = palette.accent;

    grip.append(topBar, bottomBar);
    handle.appendChild(grip);
    handle.onpointerdown = (event) =>
      this.beginClusterGesture({
        cluster,
        anchorDateKey: dateKey,
        event,
        kind: edge === 'start' ? 'resize-start' : 'resize-end',
      });

    return handle;
  }

  private renderCalendarColumn(
    dateKey: string,
    clusters: TimeClusterSegment[],
    options: {
      isToday: boolean;
      isSelectedDate: boolean;
      calendarMode: 'day' | 'week';
    }
  ): HTMLDivElement {
    const { isToday, isSelectedDate, calendarMode } = options;
    const column = document.createElement('div');
    const columnClassNames = ['relative'];
    if (isToday) {
      columnClassNames.push('bg-sky-50/40');
    } else if (calendarMode === 'week' && isSelectedDate) {
      columnClassNames.push('bg-slate-50/80');
    }
    column.className = columnClassNames.join(' ');
    column.style.height = `${HOUR_ROW_HEIGHT_PX * 24}px`;
    column.style.width = '100%';
    column.dataset.role = 'calendar-column';
    column.dataset.dateKey = dateKey;
    column.dataset.selectedDate = isSelectedDate ? 'true' : 'false';
    column.onpointerdown = (event) =>
      this.handleCalendarBackgroundPointerDown(event, dateKey, calendarMode);

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
      'absolute box-border overflow-visible rounded-md px-3 py-2 transition-shadow';
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
      ? mixHexWithWhite(palette.accent, 0.3)
      : palette.background;
    block.style.boxShadow = isSelected
      ? '0 10px 18px rgba(15, 23, 42, 0.08)'
      : 'none';
    block.style.cursor =
      isActiveGesture && this.activeClusterGesture?.kind === 'move'
        ? 'grabbing'
        : 'grab';
    block.style.touchAction = 'none';
    block.onpointerdown = (event) =>
      this.beginClusterGesture({
        cluster,
        anchorDateKey: dateKey,
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
    title.className = isSelected
      ? 'truncate text-[13px] font-medium text-white'
      : 'truncate text-[13px] font-medium text-slate-900';
    title.textContent = cluster.title;

    const details = document.createElement('p');
    details.className = isSelected
      ? 'mt-0.5 truncate text-[11px] text-white'
      : 'mt-0.5 truncate text-[11px] text-slate-500';
    details.textContent = formatClusterSegmentRange(clusterSegment);

    content.append(title, details);
    header.append(content);
    block.append(accentRail, header);
    if (isSelected) {
      if (clusterSegment.isStartSegment) {
        block.append(
          this.renderClusterResizeHandle({
            cluster,
            dateKey,
            edge: 'start',
            palette,
          })
        );
      }
      if (clusterSegment.isEndSegment) {
        block.append(
          this.renderClusterResizeHandle({
            cluster,
            dateKey,
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
    isToday: boolean;
    isSelectedDate: boolean;
  }): HTMLDivElement {
    const { dateKey, isToday, isSelectedDate } = options;
    const cell = document.createElement('div');
    cell.dataset.selected = isSelectedDate ? 'true' : 'false';
    cell.className =
      isToday && isSelectedDate
        ? 'px-2 py-1.5 text-left text-slate-900 rounded-lg bg-sky-50/80 ring-1 ring-sky-100'
        : isToday
          ? 'px-2 py-1.5 text-left text-slate-900 rounded-lg bg-sky-50/60'
          : isSelectedDate
            ? 'px-2 py-1.5 text-left text-slate-900 rounded-lg bg-slate-100/90 ring-1 ring-slate-200/80'
            : 'px-2 py-1.5 text-left text-slate-700';

    const weekday = document.createElement('p');
    weekday.className = isToday
      ? 'text-[11px] font-semibold text-sky-600'
      : isSelectedDate
        ? 'text-[11px] font-semibold text-slate-500'
        : 'text-[11px] font-semibold';
    weekday.textContent = formatWeekdayLabel(this.i18n, dateKey);

    const date = document.createElement('p');
    date.className = isToday
      ? 'mt-0.5 text-base font-semibold text-sky-600'
      : 'mt-0.5 text-base font-semibold text-slate-900';
    date.textContent = formatDayNumber(this.i18n, dateKey);

    cell.append(weekday, date);
    if (isSelectedDate) {
      const marker = document.createElement('span');
      marker.className =
        'mt-1 block h-0.5 w-7 rounded-full bg-indigo-300/80';
      marker.dataset.role = 'week-day-selected-marker';
      marker.setAttribute('aria-hidden', 'true');
      cell.appendChild(marker);
    }
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
      recurrence: 'none',
    });
  }
}
