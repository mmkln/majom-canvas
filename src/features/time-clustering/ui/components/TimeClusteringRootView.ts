import { MINUTES_PER_DAY } from '../../domain/rules.ts';
import type {
  TimeCluster,
  TimeClusteringLayoutMode,
  TimeClusteringStateSnapshot,
} from '../../domain/types.ts';
import type { TimeClusteringSuggestion } from '../../services/TimeClusteringSuggestionService.ts';
import type { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';
import {
  createIconButton,
  createTextButton,
  type TextButtonElement,
  type TextButtonTone,
} from '../../../../ui-lib/src/hud/index.ts';
import {
  createIcon,
  type IconName,
} from '../../../../ui-lib/src/hud/icons.ts';

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
const HOUR_ROW_HEIGHT_PX = 56;
const TIME_GUTTER_WIDTH_PX = 56;
const DAY_VIEW_MIN_WIDTH_PX = 300;
const WEEK_VIEW_DAY_WIDTH_PX = 136;

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

function dateFromKey(dateKey: string): Date | null {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayDateKey(): string {
  return dateKeyFromDate(new Date());
}

function dayOffsetDateKey(baseDateKey: string, offset: number): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  date.setDate(date.getDate() + offset);
  return dateKeyFromDate(date);
}

function startOfWeekDateKey(baseDateKey: string): string {
  const date = dateFromKey(baseDateKey);
  if (!date) return baseDateKey;
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  return dateKeyFromDate(date);
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

function roundUpToStep(minute: number, step: number): number {
  return Math.ceil(minute / step) * step;
}

function buildClusterLanes(clusters: TimeCluster[]): TimeCluster[][] {
  const lanes: TimeCluster[][] = [];
  const sorted = clusters.slice().sort((a, b) => {
    if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute;
    return a.endMinute - b.endMinute;
  });

  sorted.forEach((cluster) => {
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

  return lanes;
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

function createButton(
  label: string,
  variant: 'secondary' | 'primary' | 'ghost' | 'accent' = 'secondary',
  iconName?: IconName
): TextButtonElement {
  const tone: TextButtonTone =
    variant === 'primary'
      ? 'primary'
      : variant === 'ghost'
        ? 'text'
        : 'soft';
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
  private disposeStoreSubscription: (() => void) | null = null;
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
    headerRow.className = 'flex flex-wrap items-center justify-end gap-2';

    const actionGroup = document.createElement('div');
    actionGroup.className = 'flex flex-wrap items-center justify-end gap-2';

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

    actionGroup.append(
      this.addClusterButton,
      this.layoutToggleButton
    );

    headerRow.append(actionGroup);

    this.secondaryNav = document.createElement('div');
    this.secondaryNav.className = 'mt-4 overflow-auto';

    this.daySwitcher = document.createElement('div');
    this.daySwitcher.className = 'grid w-full grid-cols-7 gap-0.5';
    this.daySwitcher.dataset.role = 'day-switcher';

    this.weekSwitcher = document.createElement('div');
    this.weekSwitcher.className =
      'hidden items-center justify-center gap-1.5 px-0 py-0';
    this.weekSwitcher.dataset.role = 'week-switcher';
    this.weekSwitcher.style.minWidth = '360px';

    this.weekRangeLabel = document.createElement('p');
    this.weekRangeLabel.className =
      'min-w-[168px] text-center text-sm font-medium text-slate-500';

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
    this.secondaryNav.append(this.daySwitcher, this.weekSwitcher);

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
  }

  public unmount(): void {
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
    const weekDateKeys = buildWeekDateKeys(selectedDateKey);
    const isWeekMode = this.layoutMode === 'fullscreen';

    this.updateLayoutToggleButton();

    if (isWeekMode) {
      this.weekRangeLabel.textContent = formatWeekRange(weekDateKeys);
      this.weekPreviousButton.onclick = () =>
        this.store.setSelectedDate(dayOffsetDateKey(selectedDateKey, -7));
      this.weekNextButton.onclick = () =>
        this.store.setSelectedDate(dayOffsetDateKey(selectedDateKey, 7));
    }

    this.renderSecondaryNavigation(snapshot, weekDateKeys);
    this.renderWarnings(snapshot);
    this.renderCalendar(snapshot, weekDateKeys);
  }

  private updateLayoutToggleButton(): void {
    const isDocked = this.layoutMode === 'docked-left';
    const label = isDocked ? 'Expand' : 'Dock left';
    const iconName: IconName = isDocked
      ? 'chevron-right'
      : 'chevron-left';
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
    this.weekSwitcher.classList.toggle('hidden', !isWeekMode);
    this.weekSwitcher.classList.toggle('flex', isWeekMode);

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
    weekDateKeys: string[]
  ): void {
    this.calendarSurface.innerHTML = '';
    const isWeekMode = this.layoutMode === 'fullscreen';
    const container = document.createElement('div');
    container.className = 'h-full overflow-auto';

    const surface = document.createElement('div');
    surface.className =
      'min-h-full bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]';
    surface.style.minHeight = '100%';

    if (isWeekMode) {
      surface.appendChild(this.renderWeekCalendar(snapshot, weekDateKeys));
    } else {
      surface.appendChild(this.renderDayCalendar(snapshot));
    }

    container.appendChild(surface);
    this.calendarSurface.appendChild(container);
  }

  private renderDayCalendar(
    snapshot: TimeClusteringStateSnapshot
  ): HTMLDivElement {
    const dateKey = snapshot.selectedDateKey;
    const clusters = (snapshot.plansByDate[dateKey]?.clusters ?? []).slice();
    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-full';
    wrapper.dataset.role = 'day-calendar';

    const body = document.createElement('div');
    body.className = 'flex';
    body.style.minWidth = `${TIME_GUTTER_WIDTH_PX + DAY_VIEW_MIN_WIDTH_PX}px`;

    body.append(
      this.renderTimeGutter(),
      this.renderCalendarColumn(dateKey, clusters, true, true, 'day')
    );
    wrapper.append(body);
    return wrapper;
  }

  private renderWeekCalendar(
    snapshot: TimeClusteringStateSnapshot,
    weekDateKeys: string[]
  ): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-full';
    wrapper.dataset.role = 'week-calendar';

    const header = document.createElement('div');
    header.className =
      'flex min-w-0 items-end bg-white px-4 py-1.5';
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
      const clusters = snapshot.plansByDate[dateKey]?.clusters ?? [];
      const column = this.renderCalendarColumn(
        dateKey,
        clusters,
        dateKey === todayKey,
        false,
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
      slot.className =
        'px-2 text-right text-[11px] font-medium text-slate-400';
      slot.style.height = `${HOUR_ROW_HEIGHT_PX}px`;
      slot.textContent = `${hour.toString().padStart(2, '0')}:00`;
      gutter.appendChild(slot);
    }

    return gutter;
  }

  private renderCalendarColumn(
    dateKey: string,
    clusters: TimeCluster[],
    highlighted: boolean,
    showEmptyState: boolean,
    calendarMode: 'day' | 'week'
  ): HTMLDivElement {
    const column = document.createElement('div');
    column.className = highlighted
      ? 'relative bg-sky-50/40'
      : 'relative';
    column.style.height = `${HOUR_ROW_HEIGHT_PX * 24}px`;
    column.dataset.role = 'calendar-column';
    column.dataset.dateKey = dateKey;

    for (let hour = 0; hour < 24; hour += 1) {
      const hourSlot = document.createElement('div');
      hourSlot.className =
        hour === 0 ? '' : 'border-t border-slate-200/80';
      hourSlot.style.height = `${HOUR_ROW_HEIGHT_PX}px`;
      hourSlot.dataset.role = 'calendar-hour-slot';
      column.appendChild(hourSlot);
    }

    const lanes = buildClusterLanes(clusters);
    const laneCount = Math.max(lanes.length, 1);
    const laneWidthPercent = 100 / laneCount;

    lanes.forEach((lane, laneIndex) => {
      lane.forEach((cluster) => {
        const eventBlock = this.renderClusterBlock(
          cluster,
          laneIndex,
          laneWidthPercent,
          laneCount,
          dateKey,
          calendarMode
        );
        column.appendChild(eventBlock);
      });
    });

    if (showEmptyState && clusters.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className =
        'pointer-events-none absolute inset-x-4 top-8 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-400';
      emptyState.textContent = 'No clusters scheduled.';
      column.appendChild(emptyState);
    }

    return column;
  }

  private renderClusterBlock(
    cluster: TimeCluster,
    laneIndex: number,
    laneWidthPercent: number,
    laneCount: number,
    dateKey: string,
    calendarMode: 'day' | 'week'
  ): HTMLDivElement {
    const palette = getClusterPalette(cluster.colorToken);
    const top = (cluster.startMinute / 60) * HOUR_ROW_HEIGHT_PX;
    const isDayMode = calendarMode === 'day';
    const verticalInsetPx = isDayMode ? 0 : 4;
    const horizontalInsetPx = isDayMode ? (laneCount > 1 ? 4 : 0) : 8;
    const baseHeight =
      ((cluster.endMinute - cluster.startMinute) / 60) * HOUR_ROW_HEIGHT_PX;
    const height = Math.max(
      baseHeight - verticalInsetPx * 2,
      32
    );
    const widthPercent = Math.max(
      laneWidthPercent - 1.5,
      laneCount > 1 ? laneWidthPercent - 2.5 : 97
    );
    const leftPercent = laneCount > 1 ? laneIndex * laneWidthPercent : 0;

    const block = document.createElement('div');
    block.className =
      'absolute overflow-hidden rounded-xl border px-2.5 py-2';
    block.dataset.role = 'cluster-block';
    block.dataset.clusterId = cluster.id;
    block.dataset.dateKey = dateKey;
    block.style.top = `${top + verticalInsetPx}px`;
    block.style.height = `${height}px`;
    block.style.left =
      laneCount > 1
        ? `calc(${leftPercent}% + ${horizontalInsetPx}px)`
        : `${horizontalInsetPx}px`;
    block.style.width =
      laneCount > 1
        ? `calc(${widthPercent}% - ${isDayMode ? 6 : 12}px)`
        : horizontalInsetPx === 0
          ? '100%'
          : `calc(100% - ${horizontalInsetPx * 2}px)`;
    block.style.background = 'rgba(255,255,255,0.96)';
    block.style.borderColor = palette.border;
    block.style.boxShadow = `inset 3px 0 0 0 ${palette.accent}`;

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-2';

    const content = document.createElement('div');
    content.className = 'min-w-0 flex-1';

    const title = document.createElement('p');
    title.className = 'truncate text-[13px] font-medium text-slate-900';
    title.textContent = cluster.title;

    const details = document.createElement('p');
    details.className = 'mt-0.5 truncate text-[11px] text-slate-500';
    details.textContent = `${formatMinute(cluster.startMinute)} - ${formatMinute(cluster.endMinute)} • ${cluster.parallelizable ? 'Parallel' : 'Focus'}`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className =
      'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-400 transition hover:text-rose-600';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${cluster.title}`);
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      this.store.deleteCluster(dateKey, cluster.id);
    };

    content.append(title, details);
    header.append(content, deleteButton);
    block.append(header);
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
    const existingClusters = (
      snapshot.plansByDate[selectedDateKey]?.clusters ?? []
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

    this.store.createCluster(selectedDateKey, {
      id: uniqueId(),
      title: `Cluster ${existingClusters.length + 1}`,
      colorToken: tokens[existingClusters.length % tokens.length] ?? 'blue',
      startMinute,
      endMinute,
      parallelizable: false,
    });
  }
}
