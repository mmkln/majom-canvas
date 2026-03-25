import { createModalShell } from '../../../ui-lib/src/components/Modal.ts';
import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createSurface,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../canvas/ui/icons.ts';
import {
  Status,
  type DateCompletion,
  type Habit,
} from '../../../majom-wrapper/interfaces/index.ts';
import { KANBAN_REFRESH_REQUEST_EVENT } from '../../kanban/kanbanEvents.ts';
import { ShellHabitsService } from '../services/ShellHabitsService.ts';
import { confirmDeleteRoutineModal } from './ConfirmDeleteRoutineModal.ts';

const DAY_WINDOW_SIZE = 10;
// Keep streak visuals aligned with Checkbox checked indicator (indigo-600, 20px).
const STREAK_LINE_COLOR = '#EEF2FF';
const STREAK_LINE_THICKNESS = 14;
const UNCHECKED_INDICATOR_BORDER_COLOR = '#b7c4d6';
const UNCHECKED_INDICATOR_HOVER_BORDER_COLOR = '#95a9c3';
const UNCHECKED_PENDING_INDICATOR_BORDER_COLOR = '#c7cfda';
const UNCHECKED_DISABLED_INDICATOR_BORDER_COLOR = '#cfd8e3';
const UNCHECKED_DISABLED_INDICATOR_BACKGROUND_COLOR = '#f8fafc';
const UNCHECKED_PENDING_INDICATOR_BACKGROUND_COLOR = '#f1f5f9';

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

function buildRecentDays(size: number): HabitDay[] {
  const now = new Date();
  const formatterDay = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const formatterShort = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });
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
      dayLabel: formatterDay.format(date),
      shortLabel: formatterShort.format(date),
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
  private overlay: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private createOverlay: HTMLDivElement | null = null;
  private createBody: HTMLDivElement | null = null;
  private createFooter: HTMLDivElement | null = null;
  private readonly service: HabitsQuickModalService;
  private readonly days = buildRecentDays(DAY_WINDOW_SIZE);
  private rows: HabitRowState[] = [];
  private loading = false;
  private error: string | null = null;
  private createError: string | null = null;
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

  constructor(service: HabitsQuickModalService = new ShellHabitsService()) {
    this.service = service;
  }

  public open(): void {
    if (this.overlay) return;
    const { overlay, container, body, footer } = createModalShell('Routines', {
      subtitle: 'Completion history for the last 10 days',
      onClose: () => this.close(),
      intent: 'form',
      zIndex: 260,
    });
    container.style.width = 'min(68rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(68rem, calc(100vw - 2rem))';

    this.overlay = overlay;
    this.body = body;
    this.footer = footer;

    this.renderFooter();
    this.renderBody();
    void this.refresh();
  }

  public close(): void {
    if (!this.overlay) return;
    this.detachStreakOverlay();
    this.overlay.remove();
    this.closeCreateModal();
    this.overlay = null;
    this.body = null;
    this.footer = null;
    this.rows = [];
    this.loading = false;
    this.error = null;
    this.createError = null;
    this.createTitle = '';
    this.createPending = false;
    this.focusCreateInputOnRender = false;
    this.refreshVersion += 1;
    this.pendingCellKeys.clear();
    this.pendingHabitIds.clear();
    this.disposeRowMenus();
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
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => this.close());

    row.append(closeButton);
    this.footer.appendChild(row);
  }

  private renderQuickAddToolbar(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center justify-end';

    const newRoutineButton = createTextButton({
      text: 'New routine',
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
    this.createError = null;
    const { overlay, container, body, footer } = createModalShell(
      'New routine',
      {
        subtitle: 'Add a routine you want to track daily.',
        onClose: () => this.closeCreateModal(),
        intent: 'form',
        zIndex: 280,
      }
    );
    container.style.width = 'min(30rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(30rem, calc(100vw - 2rem))';
    this.createOverlay = overlay;
    this.createBody = body;
    this.createFooter = footer;
    this.renderCreateModal();
  }

  private closeCreateModal(): void {
    if (!this.createOverlay) return;
    this.createOverlay.remove();
    this.createOverlay = null;
    this.createBody = null;
    this.createFooter = null;
    this.createError = null;
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

    if (this.createError) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.createError;
      bodyWrap.appendChild(errorBox);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Routine title';
    input.value = this.createTitle;
    input.disabled = this.loading || this.createPending;
    input.className =
      'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500';
    const createButton = createTextButton({
      text: this.createPending ? 'Creating...' : 'Create',
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
      text: 'Cancel',
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

    if (this.error) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.error;
      content.appendChild(errorBox);
    }

    if (this.loading && this.rows.length === 0) {
      const loading = document.createElement('div');
      loading.className = 'py-6 text-sm text-slate-500';
      loading.textContent = 'Loading routines...';
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
      empty.textContent = 'No active routines yet.';

      const createFirstRoutineButton = createTextButton({
        text: 'Create first routine',
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
    tableWrap.className = 'overflow-x-auto rounded-lg border border-slate-100';
    tableWrap.style.position = 'relative';

    const table = document.createElement('table');
    table.className = 'min-w-[860px] w-full border-collapse';
    table.style.position = 'relative';
    table.style.zIndex = '1';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const titleHead = document.createElement('th');
    titleHead.className =
      'sticky left-0 z-10 border-b border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
    titleHead.textContent = 'Routine';
    headRow.appendChild(titleHead);

    const todayKey = toLocalDateKey(new Date());
    this.days.forEach((day) => {
      const th = document.createElement('th');
      th.className =
        'border-b border-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-500';
      th.style.background = day.key === todayKey ? '#eef2ff' : '#f8fafc';
      const dayLabel = document.createElement('div');
      dayLabel.textContent = day.dayLabel;
      const shortLabel = document.createElement('div');
      shortLabel.className = 'text-[11px] font-normal text-slate-500';
      shortLabel.textContent = day.shortLabel;
      th.append(dayLabel, shortLabel);
      headRow.appendChild(th);
    });

    const actionsHead = document.createElement('th');
    actionsHead.className =
      'border-b border-slate-100 bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500';
    actionsHead.textContent = '';
    actionsHead.setAttribute('aria-label', 'Actions');
    headRow.appendChild(actionsHead);

    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const streakRows: StreakRowOverlayMeta[] = [];
    this.rows.forEach((row) => {
      const habitPending = this.isHabitPending(row.habit.id);
      const rowCheckedStates = this.days.map(
        (day) => row.completionByDateKey.get(day.key) === true
      );
      const dayAnchors: Array<{ xAnchor: HTMLElement; yAnchor: HTMLElement }> =
        [];
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 last:border-b-0';

      const title = document.createElement('td');
      title.className =
        'sticky left-0 z-0 bg-white px-3 py-2 text-sm text-slate-700';

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = row.habit.title;
      titleInput.disabled = this.loading || this.createPending || habitPending;
      titleInput.className =
        'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-indigo-200 focus:bg-indigo-50/40 disabled:text-slate-500';
      titleInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        titleInput.blur();
      });
      titleInput.addEventListener('blur', () => {
        void this.renameHabit(row, titleInput.value);
      });
      title.appendChild(titleInput);
      tr.appendChild(title);

      this.days.forEach((day, index) => {
        const td = document.createElement('td');
        td.className = 'px-2 py-2 text-center';
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
        if (indicatorEl instanceof HTMLElement && !checked) {
          if (checkboxDisabled) {
            indicatorEl.style.borderColor = pending
              ? UNCHECKED_PENDING_INDICATOR_BORDER_COLOR
              : UNCHECKED_DISABLED_INDICATOR_BORDER_COLOR;
            indicatorEl.style.backgroundColor = pending
              ? UNCHECKED_PENDING_INDICATOR_BACKGROUND_COLOR
              : UNCHECKED_DISABLED_INDICATOR_BACKGROUND_COLOR;
          } else {
            const baseBorderColor = UNCHECKED_INDICATOR_BORDER_COLOR;
            indicatorEl.style.borderColor = baseBorderColor;
            indicatorEl.style.backgroundColor = 'transparent';
            checkboxEl.addEventListener('mouseenter', () => {
              indicatorEl.style.borderColor =
                UNCHECKED_INDICATOR_HOVER_BORDER_COLOR;
            });
            checkboxEl.addEventListener('mouseleave', () => {
              indicatorEl.style.borderColor = baseBorderColor;
            });
          }
        }
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
      actions.className = 'px-3 py-2 align-top';
      const actionsRow = document.createElement('div');
      actionsRow.className = 'relative inline-flex';

      const menuButton = createIconButton({
        icon: 'ellipsis-vertical',
        size: 'sm',
        tone: 'text',
        title: 'Routine actions',
        ariaLabel: 'Open routine actions',
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
        label: 'Archive',
        onClick: () => {
          menuController.close();
          void this.archiveHabit(row);
        },
      });
      archiveItem.setAttribute('role', 'menuitem');

      const deleteItem = createDropdownItem({
        label: 'Delete',
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
    this.error = null;
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
        this.error = 'Failed to load routines.';
        this.rows = [];
      }
    } finally {
      if (refreshVersion === this.refreshVersion) {
        this.loading = false;
        this.renderFooter();
        this.renderBody();
      }
    }
  }

  private async createHabit(): Promise<void> {
    const title = this.createTitle.trim();
    if (!title || this.loading || this.createPending) return;

    this.error = null;
    this.createPending = true;
    this.createError = null;
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
    } catch {
      this.createError = 'Failed to create routine.';
      this.error = 'Failed to create routine.';
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
      this.error = 'Routine title cannot be empty.';
      this.renderBody();
      return;
    }
    if (nextTitle === previousTitle) return;

    this.error = null;
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
      this.error = 'Failed to rename routine.';
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
    if (!this.confirmAction(`Archive routine "${row.habit.title}"?`)) return;

    this.error = null;
    this.pendingHabitIds.add(habitId);
    this.renderFooter();
    this.renderBody();
    try {
      await this.service.archiveHabit(habitId);
      this.rows = this.rows.filter((item) => item.habit.id !== habitId);
      emitKanbanRefreshRequest();
    } catch {
      this.error = 'Failed to archive routine.';
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
    });
    if (!confirmed) {
      return;
    }

    this.error = null;
    this.pendingHabitIds.add(habitId);
    this.renderFooter();
    this.renderBody();
    try {
      await this.service.deleteHabit(habitId);
      this.rows = this.rows.filter((item) => item.habit.id !== habitId);
      emitKanbanRefreshRequest();
    } catch {
      this.error = 'Failed to delete routine.';
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

    this.error = null;
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
    } catch {
      row.completionByDateKey.set(day.key, previousChecked);
      this.error = 'Failed to update routine completion.';
    } finally {
      this.pendingCellKeys.delete(cellKey);
      this.renderFooter();
      this.renderBody();
    }
  }
}
