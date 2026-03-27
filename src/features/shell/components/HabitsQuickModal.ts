import { createModalShell } from '../../../ui-lib/src/components/Modal.ts';
import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createInputBase,
  createSurface,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../canvas/ui/icons.ts';
import {
  Status,
  type DateCompletion,
  type Habit,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { AppTranslationKey, I18nService } from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { KANBAN_REFRESH_REQUEST_EVENT } from '../../kanban/kanbanEvents.ts';
import { ShellHabitsService } from '../services/ShellHabitsService.ts';
import { confirmDeleteRoutineModal } from './ConfirmDeleteRoutineModal.ts';

const DAY_WINDOW_SIZE = 10;
// Keep streak visuals aligned with Checkbox checked indicator (indigo-600, 20px).
const STREAK_LINE_COLOR = '#EEF2FF';
const STREAK_LINE_THICKNESS = 14;

type HabitDay = {
  date: Date;
  key: string;
  dayLabel: string;
  shortLabel: string;
};

type HabitRowState = {
  habit: Habit;
  completionByDateKey: Map<string, boolean>;
};

type StreakRowOverlayMeta = {
  dayAnchors: Array<{ xAnchor: HTMLElement; yAnchor: HTMLElement }>;
  checkedStates: boolean[];
};

export type HabitsQuickStatusSnapshot = {
  openCount: number;
  completedCount: number;
  totalDue: number;
  archivedCount: number;
  activeCount: number;
};

type HabitsQuickModalOptions = {
  onOpenChange?: (open: boolean) => void;
  onStatusChange?: (snapshot: HabitsQuickStatusSnapshot) => void;
};

export type HabitsQuickModalService = Pick<
  ShellHabitsService,
  | 'loadHabits'
  | 'toggleHabitCompletion'
  | 'createHabit'
  | 'patchHabitTitle'
  | 'archiveHabit'
  | 'deleteHabit'
>;

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseToDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildRecentDays(i18n: I18nService, size: number): HabitDay[] {
  const now = new Date();
  const days: HabitDay[] = [];
  for (let offset = 0; offset < size; offset += 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - offset
    );
    days.push({
      date,
      key: toLocalDateKey(date),
      dayLabel: i18n.formatDate(date, { weekday: 'short' }),
      shortLabel: i18n.formatDate(date, {
        month: 'short',
        day: 'numeric',
      }),
    });
  }
  return days;
}

function appendCompletionEntries(
  map: Map<string, boolean>,
  entries: DateCompletion[] | null | undefined
): void {
  if (!Array.isArray(entries)) return;
  entries.forEach(([value, completed]) => {
    const parsed = parseToDate(value);
    if (!parsed) return;
    map.set(toLocalDateKey(parsed), completed === true);
  });
}

function emitKanbanRefreshRequest(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(KANBAN_REFRESH_REQUEST_EVENT));
}

export class HabitsQuickModal {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private overlay: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private createOverlay: HTMLDivElement | null = null;
  private createHeader: HTMLDivElement | null = null;
  private createBody: HTMLDivElement | null = null;
  private createFooter: HTMLDivElement | null = null;
  private readonly service: HabitsQuickModalService;
  private readonly onOpenChange?: (open: boolean) => void;
  private readonly onStatusChange?: (
    snapshot: HabitsQuickStatusSnapshot
  ) => void;
  private days: HabitDay[];
  private rows: HabitRowState[] = [];
  private loading = false;
  private errorKey: AppTranslationKey | null = null;
  private createErrorKey: AppTranslationKey | null = null;
  private refreshVersion = 0;
  private createTitle = '';
  private createPending = false;
  private focusCreateInputOnRender = false;
  private readonly pendingCellKeys = new Set<string>();
  private readonly pendingHabitIds = new Set<number>();
  private readonly rowMenuControllers = new Set<AnchoredMenu>();
  private streakOverlayWrap: HTMLDivElement | null = null;
  private streakOverlayRows: StreakRowOverlayMeta[] = [];
  private streakOverlayRafId: number | null = null;
  private streakOverlayObserver: ResizeObserver | null = null;
  private readonly handleStreakOverlayScroll = (): void => {
    this.scheduleStreakOverlayRender();
  };
  private readonly handleStreakOverlayWindowResize = (): void => {
    this.scheduleStreakOverlayRender();
  };
  private readonly disposeRuntimeSubscription: () => void;

  constructor(
    service: HabitsQuickModalService = new ShellHabitsService(),
    runtime: AppRuntime = createAppRuntime(),
    options: HabitsQuickModalOptions = {}
  ) {
    this.service = service;
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.onOpenChange = options.onOpenChange;
    this.onStatusChange = options.onStatusChange;
    this.days = buildRecentDays(this.i18n, DAY_WINDOW_SIZE);
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.days = buildRecentDays(this.i18n, DAY_WINDOW_SIZE);
      this.refreshTranslations();
    });
  }

  public isOpen(): boolean {
    return this.overlay !== null;
  }

  public prime(): void {
    void this.refresh();
  }

  public open(): void {
    if (this.overlay) return;
    const { overlay, container, header, body, footer } = createModalShell(
      this.i18n.t('habits.modal.title'),
      {
        subtitle: this.i18n.t('habits.modal.subtitle'),
        onClose: () => this.close(),
        intent: 'form',
        zIndex: 260,
      }
    );
    container.style.width = 'min(68rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(68rem, calc(100vw - 2rem))';

    this.overlay = overlay;
    this.header = header;
    this.body = body;
    this.footer = footer;

    this.renderFooter();
    this.renderBody();
    this.onOpenChange?.(true);
    void this.refresh();
  }

  public close(): void {
    if (!this.overlay) return;
    this.detachStreakOverlay();
    this.overlay.remove();
    this.closeCreateModal();
    this.overlay = null;
    this.header = null;
    this.body = null;
    this.footer = null;
    this.rows = [];
    this.loading = false;
    this.errorKey = null;
    this.createErrorKey = null;
    this.createTitle = '';
    this.createPending = false;
    this.focusCreateInputOnRender = false;
    this.refreshVersion += 1;
    this.pendingCellKeys.clear();
    this.pendingHabitIds.clear();
    this.disposeRowMenus();
    this.onOpenChange?.(false);
  }

  public destroy(): void {
    this.close();
    this.disposeRuntimeSubscription();
  }

  private refreshTranslations(): void {
    this.updateModalHeader(
      this.header,
      this.i18n.t('habits.modal.title'),
      this.i18n.t('habits.modal.subtitle')
    );
    this.updateModalHeader(
      this.createHeader,
      this.i18n.t('habits.create.title'),
      this.i18n.t('habits.create.description')
    );
    if (this.overlay) {
      this.renderFooter();
      this.renderBody();
    }
    if (this.createOverlay) {
      this.renderCreateModal();
    }
  }

  private updateModalHeader(
    header: HTMLDivElement | null,
    title: string,
    subtitle: string
  ): void {
    if (!header) return;
    const titleElement = header.querySelector('h2');
    if (titleElement) {
      titleElement.textContent = title;
    }
    const subtitleElement = header.querySelector('p');
    if (subtitleElement) {
      subtitleElement.textContent = subtitle;
    }
  }

  private buildCompletionMap(habit: Habit): Map<string, boolean> {
    const completionByDateKey = new Map<string, boolean>();
    appendCompletionEntries(completionByDateKey, habit.weekly_completions);
    appendCompletionEntries(completionByDateKey, habit.completions);

    const lastChecked = parseToDate(habit.last_checked);
    if (lastChecked) {
      const lastCheckedKey = toLocalDateKey(lastChecked);
      // Keep explicit backend completion state when present.
      if (!completionByDateKey.has(lastCheckedKey)) {
        completionByDateKey.set(lastCheckedKey, true);
      }
    }
    return completionByDateKey;
  }

  private toCellKey(habitId: number, dateKey: string): string {
    return `${habitId}:${dateKey}`;
  }

  private isHabitPending(habitId: number): boolean {
    return this.pendingHabitIds.has(habitId);
  }

  private mapHabitToRow(habit: Habit): HabitRowState {
    return {
      habit,
      completionByDateKey: this.buildCompletionMap(habit),
    };
  }

  private getTodayDay(): HabitDay {
    return this.days[0];
  }

  private isRowCompletedOnDay(row: HabitRowState, day: HabitDay): boolean {
    return row.completionByDateKey.get(day.key) === true;
  }

  private getTodaySummary(rows: HabitRowState[]): {
    completed: number;
    open: number;
    total: number;
  } {
    const today = this.getTodayDay();
    const dueToday = rows.filter((row) => row.habit.is_due_today);
    const completed = dueToday.filter((row) =>
      this.isRowCompletedOnDay(row, today)
    ).length;
    return {
      completed,
      open: Math.max(dueToday.length - completed, 0),
      total: dueToday.length,
    };
  }

  private getStatusSnapshot(): HabitsQuickStatusSnapshot {
    const summary = this.getTodaySummary(this.rows);
    return {
      openCount: summary.open,
      completedCount: summary.completed,
      totalDue: summary.total,
      archivedCount: 0,
      activeCount: this.rows.length,
    };
  }

  private emitStatusChange(): void {
    this.onStatusChange?.(this.getStatusSnapshot());
  }

  private sortRowsByTitle(): void {
    this.rows.sort((left, right) =>
      left.habit.title.localeCompare(right.habit.title)
    );
  }

  private disposeRowMenus(): void {
    this.rowMenuControllers.forEach((controller) => controller.unmount());
    this.rowMenuControllers.clear();
  }

  private closeOtherRowMenus(activeController: AnchoredMenu): void {
    this.rowMenuControllers.forEach((controller) => {
      if (controller === activeController) return;
      controller.close();
    });
  }

  private renderStreakOverlay(
    tableWrap: HTMLDivElement,
    rows: StreakRowOverlayMeta[]
  ): void {
    const existing = tableWrap.querySelector<SVGSVGElement>(
      '[data-routine-streak-overlay="true"]'
    );
    existing?.remove();
    if (!rows.length) return;

    const width = Math.max(tableWrap.scrollWidth, tableWrap.clientWidth);
    const height = Math.max(tableWrap.scrollHeight, tableWrap.clientHeight);
    if (width <= 0 || height <= 0) return;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('data-routine-streak-overlay', 'true');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.position = 'absolute';
    svg.style.left = '0';
    svg.style.top = '0';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '0';

    const wrapRect = tableWrap.getBoundingClientRect();
    rows.forEach((row) => {
      if (row.dayAnchors.length !== row.checkedStates.length) return;
      const centers = row.dayAnchors.map((anchor) => {
        const xRect = anchor.xAnchor.getBoundingClientRect();
        const yRect = anchor.yAnchor.getBoundingClientRect();
        return {
          x:
            xRect.left -
            wrapRect.left +
            tableWrap.scrollLeft -
            tableWrap.clientLeft +
            xRect.width / 2,
          y:
            yRect.top -
            wrapRect.top +
            tableWrap.scrollTop -
            tableWrap.clientTop +
            yRect.height / 2,
        };
      });

      let runStart: number | null = null;
      for (let index = 0; index <= row.checkedStates.length; index += 1) {
        const checked =
          index < row.checkedStates.length && row.checkedStates[index];
        if (checked && runStart === null) {
          runStart = index;
          continue;
        }
        if (checked || runStart === null) continue;

        const runEnd = index - 1;
        const runLength = runEnd - runStart + 1;
        if (runLength >= 2) {
          const x1 = centers[runStart].x;
          const x2 = centers[runEnd].x;
          const y = (centers[runStart].y + centers[runEnd].y) / 2;

          const line = document.createElementNS(ns, 'line');
          line.setAttribute('x1', String(x1));
          line.setAttribute('y1', String(y));
          line.setAttribute('x2', String(x2));
          line.setAttribute('y2', String(y));
          line.setAttribute('stroke', STREAK_LINE_COLOR);
          line.setAttribute('stroke-width', String(STREAK_LINE_THICKNESS));
          line.setAttribute('stroke-linecap', 'round');
          svg.appendChild(line);
        }
        runStart = null;
      }
    });

    if (svg.childNodes.length === 0) return;
    tableWrap.appendChild(svg);
  }

  private scheduleStreakOverlayRender(): void {
    if (!this.streakOverlayWrap) return;
    if (typeof window === 'undefined') {
      this.renderStreakOverlay(this.streakOverlayWrap, this.streakOverlayRows);
      return;
    }
    if (this.streakOverlayRafId !== null) return;
    this.streakOverlayRafId = window.requestAnimationFrame(() => {
      this.streakOverlayRafId = null;
      if (!this.streakOverlayWrap || !this.streakOverlayWrap.isConnected)
        return;
      this.renderStreakOverlay(this.streakOverlayWrap, this.streakOverlayRows);
    });
  }

  private detachStreakOverlay(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'resize',
        this.handleStreakOverlayWindowResize
      );
      if (this.streakOverlayRafId !== null) {
        window.cancelAnimationFrame(this.streakOverlayRafId);
      }
    }
    this.streakOverlayRafId = null;
    this.streakOverlayObserver?.disconnect();
    this.streakOverlayObserver = null;
    this.streakOverlayWrap?.removeEventListener(
      'scroll',
      this.handleStreakOverlayScroll
    );
    this.streakOverlayWrap = null;
    this.streakOverlayRows = [];
  }

  private bindStreakOverlay(
    tableWrap: HTMLDivElement,
    table: HTMLTableElement,
    rows: StreakRowOverlayMeta[]
  ): void {
    this.detachStreakOverlay();
    this.streakOverlayWrap = tableWrap;
    this.streakOverlayRows = rows;
    tableWrap.addEventListener('scroll', this.handleStreakOverlayScroll, {
      passive: true,
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleStreakOverlayWindowResize, {
        passive: true,
      });
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.streakOverlayObserver = new ResizeObserver(() => {
        this.scheduleStreakOverlayRender();
      });
      this.streakOverlayObserver.observe(tableWrap);
      this.streakOverlayObserver.observe(table);
      const tbody = table.tBodies.item(0);
      if (tbody) {
        this.streakOverlayObserver.observe(tbody);
      }
    }
    this.scheduleStreakOverlayRender();
  }

  private renderFooter(): void {
    if (!this.footer) return;
    this.footer.replaceChildren();

    const row = document.createElement('div');
    row.className =
      'flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:flex-row md:justify-end md:border-t-0 md:pt-0 md:pb-0';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className =
      'inline-flex h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 md:h-9 md:w-auto md:min-w-[104px]';
    closeButton.textContent = this.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.close());

    row.append(closeButton);
    this.footer.appendChild(row);
  }

  private renderQuickAddToolbar(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center justify-end';

    const newRoutineButton = createTextButton({
      text: this.i18n.t('habits.newRoutine'),
      tone: 'secondary',
      size: 'sm',
      disabled: this.loading || this.createPending,
      onClick: () => {
        this.openCreateModal();
      },
    });
    const newRoutineIcon = createIcon('plus', { size: 14, strokeWidth: 1.9 });
    newRoutineIcon.setAttribute('aria-hidden', 'true');
    newRoutineButton.classList.add('inline-flex', 'items-center', 'gap-1.5');
    newRoutineButton.prepend(newRoutineIcon);
    wrap.appendChild(newRoutineButton);
    return wrap;
  }

  private openCreateModal(): void {
    if (this.createOverlay) return;
    this.focusCreateInputOnRender = true;
    this.createErrorKey = null;
    const { overlay, container, header, body, footer } = createModalShell(
      this.i18n.t('habits.create.title'),
      {
        subtitle: this.i18n.t('habits.create.description'),
        onClose: () => this.closeCreateModal(),
        intent: 'form',
        zIndex: 280,
      }
    );
    container.style.width = 'min(30rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(30rem, calc(100vw - 2rem))';
    this.createOverlay = overlay;
    this.createHeader = header;
    this.createBody = body;
    this.createFooter = footer;
    this.renderCreateModal();
  }

  private closeCreateModal(): void {
    if (!this.createOverlay) return;
    this.createOverlay.remove();
    this.createOverlay = null;
    this.createHeader = null;
    this.createBody = null;
    this.createFooter = null;
    this.createErrorKey = null;
    this.focusCreateInputOnRender = false;
  }

  private isCreateSubmitDisabled(): boolean {
    return (
      this.loading || this.createPending || this.createTitle.trim().length === 0
    );
  }

  private renderCreateModal(): void {
    if (!this.createBody || !this.createFooter) return;
    this.createBody.replaceChildren();
    this.createFooter.replaceChildren();

    const bodyWrap = document.createElement('div');
    bodyWrap.className = 'space-y-3';

    if (this.createErrorKey) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.i18n.t(this.createErrorKey);
      bodyWrap.appendChild(errorBox);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = this.i18n.t('habits.create.placeholder');
    input.value = this.createTitle;
    input.disabled = this.loading || this.createPending;
    input.className =
      'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500';
    const createButton = createTextButton({
      text: this.createPending
        ? this.i18n.t('habits.createPending')
        : this.i18n.t('common.create'),
      tone: 'primary',
      size: 'sm',
      disabled: this.isCreateSubmitDisabled(),
      onClick: () => {
        void this.createHabit();
      },
    });

    input.addEventListener('input', () => {
      this.createTitle = input.value;
      createButton.disabled = this.isCreateSubmitDisabled();
    });
    input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.createHabit();
      }
    });

    bodyWrap.appendChild(input);
    this.createBody.appendChild(bodyWrap);

    const footerRow = document.createElement('div');
    footerRow.className =
      'flex flex-col-reverse gap-2 md:flex-row md:justify-end';

    const cancelButton = createTextButton({
      text: this.i18n.t('common.cancel'),
      tone: 'text',
      size: 'sm',
      disabled: this.createPending,
      onClick: () => {
        this.closeCreateModal();
      },
    });

    footerRow.append(cancelButton, createButton);
    this.createFooter.appendChild(footerRow);

    if (this.focusCreateInputOnRender) {
      this.focusCreateInputOnRender = false;
      requestAnimationFrame(() => input.focus());
    }
  }

  private renderBody(): void {
    if (!this.body) return;
    this.disposeRowMenus();
    this.detachStreakOverlay();
    this.body.replaceChildren();

    const content = document.createElement('div');
    content.className = 'space-y-3 pb-1';

    if (this.errorKey) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.i18n.t(this.errorKey);
      content.appendChild(errorBox);
    }

    if (this.loading && this.rows.length === 0) {
      const loading = document.createElement('div');
      loading.className = 'py-6 text-sm text-slate-500';
      loading.textContent = this.i18n.t('habits.loading');
      content.appendChild(loading);
      this.body.appendChild(content);
      return;
    }

    if (!this.loading && this.rows.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className =
        'flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center';

      const empty = document.createElement('p');
      empty.className = 'max-w-sm text-sm text-slate-500';
      empty.textContent = this.i18n.t('habits.empty');

      const createFirstRoutineButton = createTextButton({
        text: this.i18n.t('habits.createFirst'),
        tone: 'primary',
        size: 'sm',
        disabled: this.createPending,
        onClick: () => {
          this.openCreateModal();
        },
      });

      emptyState.append(empty, createFirstRoutineButton);
      content.appendChild(emptyState);
      this.body.appendChild(content);
      return;
    }

    content.appendChild(this.renderQuickAddToolbar());

    const tableWrap = document.createElement('div');
    tableWrap.className =
      'w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white';
    tableWrap.style.position = 'relative';

    const table = document.createElement('table');
    table.className = 'min-w-[860px] w-full border-separate border-spacing-0';
    table.style.position = 'relative';
    table.style.zIndex = '1';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const headerCellBaseClass =
      'h-11 border-b border-slate-200/80 px-3 py-1.5 align-middle text-[12px] font-semibold leading-[1.35] text-slate-600';
    const stickyLeftHeaderClass = 'sticky left-0 z-20 bg-slate-50 text-left';
    const stickyLeftCellClass = 'sticky left-0 z-10 bg-white';
    const stickyRightHeaderClass =
      'sticky right-0 z-20 bg-slate-50 text-center';
    const stickyRightCellClass =
      'sticky right-0 z-10 bg-white';
    const titleHead = document.createElement('th');
    titleHead.className =
      `${headerCellBaseClass} ${stickyLeftHeaderClass}`;
    titleHead.setAttribute('scope', 'col');
    titleHead.textContent = this.i18n.t('habits.table.routine');
    headRow.appendChild(titleHead);

    const todayKey = toLocalDateKey(new Date());
    this.days.forEach((day) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.className =
        `${headerCellBaseClass} text-center ${day.key === todayKey ? 'bg-indigo-50' : 'bg-slate-50'}`;
      const dayLabel = document.createElement('div');
      dayLabel.className = 'text-[12px] font-semibold text-slate-600';
      dayLabel.textContent = day.dayLabel;
      const shortLabel = document.createElement('div');
      shortLabel.className = 'text-[12px] font-normal text-slate-500';
      shortLabel.textContent = day.shortLabel;
      th.append(dayLabel, shortLabel);
      headRow.appendChild(th);
    });

    const actionsHead = document.createElement('th');
    actionsHead.className =
      `${headerCellBaseClass} ${stickyRightHeaderClass} w-14`;
    actionsHead.setAttribute('scope', 'col');
    actionsHead.setAttribute('aria-label', this.i18n.t('common.actions'));
    const actionsLabel = document.createElement('span');
    actionsLabel.className = 'sr-only';
    actionsLabel.textContent = this.i18n.t('common.actions');
    actionsHead.appendChild(actionsLabel);
    headRow.appendChild(actionsHead);

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const streakRows: StreakRowOverlayMeta[] = [];
    const rowCellStateClass =
      'transition-colors group-hover:bg-slate-50/70 group-focus-within:bg-slate-50/90';
    const stickyRowCellStateClass =
      'transition-colors group-hover:bg-slate-50 group-focus-within:bg-slate-50';
    this.rows.forEach((row) => {
      const habitPending = this.isHabitPending(row.habit.id);
      const rowCheckedStates = this.days.map(
        (day) => row.completionByDateKey.get(day.key) === true
      );
      const dayAnchors: Array<{ xAnchor: HTMLElement; yAnchor: HTMLElement }> =
        [];
      const tr = document.createElement('tr');
      tr.className = 'group h-11 border-b border-slate-200/80 last:border-b-0';

      const title = document.createElement('td');
      title.className =
        `${stickyLeftCellClass} px-3 align-middle text-sm text-slate-900 ${stickyRowCellStateClass}`;

      const titleInput = createInputBase({
        value: row.habit.title,
        disabled: this.loading || this.createPending || habitPending,
        className:
          'h-[34px] min-w-0 border-transparent bg-transparent px-2 text-base font-medium leading-5 text-slate-900 shadow-none hover:border-slate-300 focus-visible:bg-white md:text-sm disabled:border-transparent disabled:bg-transparent disabled:text-slate-500',
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          titleInput.blur();
        },
      });
      titleInput.title = row.habit.title;
      titleInput.addEventListener('blur', () => {
        void this.renameHabit(row, titleInput.value);
      });
      title.appendChild(titleInput);
      tr.appendChild(title);

      this.days.forEach((day, index) => {
        const td = document.createElement('td');
        td.className = `h-11 px-3 text-center align-middle ${rowCellStateClass}`;
        const cellKey = this.toCellKey(row.habit.id, day.key);
        const pending = this.pendingCellKeys.has(cellKey);
        const checked = rowCheckedStates[index];
        const checkboxDisabled =
          pending || this.loading || this.createPending || habitPending;

        const checkbox = new Checkbox({
          checked,
          disabled: checkboxDisabled,
          ariaLabel: `${row.habit.title} ${day.shortLabel} completion`,
          className: 'inline-flex items-center justify-center',
        });
        checkbox.onChange(() => {
          void this.toggleCell(row, day, checked);
        });

        const streakCell = document.createElement('div');
        streakCell.className =
          'relative mx-auto flex h-8 w-8 items-center justify-center';

        const checkboxEl = checkbox.getElement();
        checkboxEl.style.position = 'relative';
        checkboxEl.style.zIndex = '1';
        checkboxEl.style.display = 'inline-flex';
        checkboxEl.style.alignItems = 'center';
        checkboxEl.style.justifyContent = 'center';
        const indicatorEl = checkboxEl.querySelector('div');
        streakCell.appendChild(checkboxEl);

        dayAnchors.push({
          xAnchor: streakCell,
          yAnchor:
            indicatorEl instanceof HTMLElement ? indicatorEl : streakCell,
        });

        td.appendChild(streakCell);
        tr.appendChild(td);
      });

      const actions = document.createElement('td');
      actions.className =
        `${stickyRightCellClass} w-14 px-3 text-center align-middle ${stickyRowCellStateClass}`;
      const actionsRow = document.createElement('div');
      actionsRow.className = 'relative inline-flex';

      const menuButton = createIconButton({
        icon: 'ellipsis-vertical',
        size: 'sm',
        tone: 'text',
        title: this.i18n.t('habits.rowActions'),
        ariaLabel: this.i18n.t('habits.openRowActions'),
        disabled: this.loading || this.createPending || habitPending,
      });
      menuButton.classList.add('text-slate-600');
      menuButton.setAttribute('aria-haspopup', 'menu');

      const menuPanel = createSurface({
        elevated: true,
        className: 'absolute left-0 top-0 z-30 hidden w-36 overflow-hidden',
      });
      menuPanel.setAttribute('role', 'menu');

      const menuController = new AnchoredMenu({
        container: actionsRow,
        panel: menuPanel,
        onOpenChange: (open) => {
          menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
          menuButton.classList.toggle('bg-indigo-50', open);
          menuButton.classList.toggle('text-indigo-700', open);
        },
      });
      menuController.mount();
      this.rowMenuControllers.add(menuController);

      const archiveItem = createDropdownItem({
        label: this.i18n.t('common.archive'),
        onClick: () => {
          menuController.close();
          void this.archiveHabit(row);
        },
      });
      archiveItem.setAttribute('role', 'menuitem');

      const deleteItem = createDropdownItem({
        label: this.i18n.t('common.delete'),
        variant: 'danger',
        onClick: () => {
          menuController.close();
          void this.deleteHabit(row);
        },
      });
      deleteItem.setAttribute('role', 'menuitem');

      menuPanel.append(archiveItem, deleteItem);
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (menuButton.disabled) return;
        if (menuController.isOpen()) {
          menuController.close();
          return;
        }
        this.closeOtherRowMenus(menuController);
        menuController.openAt({
          anchor: menuButton,
          placement: 'bottom-end',
          fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
          gap: 4,
          margin: 8,
          lockPlacementAfterOpen: true,
        });
      });

      actionsRow.append(menuButton, menuPanel);

      actions.appendChild(actionsRow);
      tr.appendChild(actions);

      tbody.appendChild(tr);
      streakRows.push({
        dayAnchors,
        checkedStates: rowCheckedStates,
      });
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    content.appendChild(tableWrap);
    this.body.appendChild(content);
    this.bindStreakOverlay(tableWrap, table, streakRows);
  }

  private async refresh(): Promise<void> {
    if (this.loading) return;
    const refreshVersion = this.refreshVersion + 1;
    this.refreshVersion = refreshVersion;
    this.loading = true;
    this.errorKey = null;
    this.renderFooter();
    this.renderBody();

    try {
      const habits = await this.service.loadHabits();
      if (refreshVersion === this.refreshVersion) {
        this.rows = habits
          .filter((habit) => habit.status === Status.Active)
          .map((habit) => this.mapHabitToRow(habit));
        this.sortRowsByTitle();
      }
    } catch {
      if (refreshVersion === this.refreshVersion) {
        this.errorKey = 'habits.error.load';
        this.rows = [];
      }
    } finally {
      if (refreshVersion === this.refreshVersion) {
        this.loading = false;
        this.emitStatusChange();
        this.renderFooter();
        this.renderBody();
      }
    }
  }

  private async createHabit(): Promise<void> {
    const title = this.createTitle.trim();
    if (!title || this.loading || this.createPending) return;

    this.errorKey = null;
    this.createPending = true;
    this.createErrorKey = null;
    this.renderFooter();
    this.renderBody();
    this.renderCreateModal();
    try {
      const created = await this.service.createHabit(title);
      if (created.status === Status.Active) {
        this.rows.push(this.mapHabitToRow(created));
        this.sortRowsByTitle();
      }
      this.createTitle = '';
      this.closeCreateModal();
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.createErrorKey = 'habits.error.create';
      this.errorKey = 'habits.error.create';
    } finally {
      this.createPending = false;
      this.renderFooter();
      this.renderBody();
      this.renderCreateModal();
    }
  }

  private async renameHabit(
    row: HabitRowState,
    nextTitleRaw: string
  ): Promise<void> {
    const habitId = row.habit.id;
    if (this.loading || this.createPending || this.isHabitPending(habitId)) {
      return;
    }

    const previousTitle = row.habit.title;
    const nextTitle = nextTitleRaw.trim();
    if (!nextTitle) {
      this.errorKey = 'habits.error.emptyTitle';
      this.renderBody();
      return;
    }
    if (nextTitle === previousTitle) return;

    this.errorKey = null;
    this.pendingHabitIds.add(habitId);
    row.habit = {
      ...row.habit,
      title: nextTitle,
    };
    this.sortRowsByTitle();
    this.renderFooter();
    this.renderBody();
    try {
      const updated = await this.service.patchHabitTitle(habitId, nextTitle);
      row.habit = updated;
      row.completionByDateKey = this.buildCompletionMap(updated);
      this.sortRowsByTitle();
      emitKanbanRefreshRequest();
    } catch {
      row.habit = {
        ...row.habit,
        title: previousTitle,
      };
      this.sortRowsByTitle();
      this.errorKey = 'habits.error.rename';
    } finally {
      this.pendingHabitIds.delete(habitId);
      this.renderFooter();
      this.renderBody();
    }
  }

  private confirmAction(message: string): boolean {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return true;
    }
    return window.confirm(message);
  }

  private async archiveHabit(row: HabitRowState): Promise<void> {
    const habitId = row.habit.id;
    if (this.loading || this.createPending || this.isHabitPending(habitId)) {
      return;
    }
    if (
      !this.confirmAction(
        this.i18n.t('habits.confirmArchive', { title: row.habit.title })
      )
    ) {
      return;
    }

    this.errorKey = null;
    this.pendingHabitIds.add(habitId);
    this.renderFooter();
    this.renderBody();
    try {
      await this.service.archiveHabit(habitId);
      this.rows = this.rows.filter((item) => item.habit.id !== habitId);
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.errorKey = 'habits.error.archive';
    } finally {
      this.pendingHabitIds.delete(habitId);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async deleteHabit(row: HabitRowState): Promise<void> {
    const habitId = row.habit.id;
    if (this.loading || this.createPending || this.isHabitPending(habitId)) {
      return;
    }
    const confirmed = await confirmDeleteRoutineModal({
      routineTitle: row.habit.title,
      i18n: this.i18n,
    });
    if (!confirmed) {
      return;
    }

    this.errorKey = null;
    this.pendingHabitIds.add(habitId);
    this.renderFooter();
    this.renderBody();
    try {
      await this.service.deleteHabit(habitId);
      this.rows = this.rows.filter((item) => item.habit.id !== habitId);
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.errorKey = 'habits.error.delete';
    } finally {
      this.pendingHabitIds.delete(habitId);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async toggleCell(
    row: HabitRowState,
    day: HabitDay,
    previousChecked: boolean
  ): Promise<void> {
    const habitId = row.habit.id;
    const cellKey = this.toCellKey(habitId, day.key);
    if (this.pendingCellKeys.has(cellKey) || this.isHabitPending(habitId))
      return;

    this.errorKey = null;
    row.completionByDateKey.set(day.key, !previousChecked);
    this.pendingCellKeys.add(cellKey);
    this.renderFooter();
    this.renderBody();

    try {
      const updated = await this.service.toggleHabitCompletion(
        habitId,
        day.date
      );
      row.habit = updated;
      row.completionByDateKey = this.buildCompletionMap(updated);
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      row.completionByDateKey.set(day.key, previousChecked);
      this.errorKey = 'habits.error.toggleCompletion';
    } finally {
      this.pendingCellKeys.delete(cellKey);
      this.renderFooter();
      this.renderBody();
    }
  }
}
