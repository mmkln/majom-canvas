import { createModalShell } from '../../../ui-lib/src/components/Modal.ts';
import {
  createIconButton,
  createTextButton,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../canvas/ui/icons.ts';
import {
  Priority,
  Status,
  type DateCompletion,
  type Habit,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { AppTranslationKey, I18nService } from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { KANBAN_REFRESH_REQUEST_EVENT } from '../../kanban/kanbanEvents.ts';
import { ShellHabitsService } from '../services/ShellHabitsService.ts';
import { confirmDeleteRoutineModal } from './ConfirmDeleteRoutineModal.ts';
import {
  HabitTrackerTable,
  type HabitDay,
  type HabitPrioritySortDirection,
  type HabitRowState,
  type HabitSortMode,
} from './HabitTrackerTable.ts';
import {
  normalizeUiPriority,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';

const DAY_WINDOW_SIZE = 10;
const HABIT_PRIORITY_ORDER: readonly UiPriority[] = [
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
];

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
  | 'patchHabitPriority'
  | 'archiveHabit'
  | 'restoreHabit'
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
  private contentRoot: HTMLDivElement | null = null;
  private errorHost: HTMLDivElement | null = null;
  private stateHost: HTMLDivElement | null = null;
  private toolbarHost: HTMLDivElement | null = null;
  private noActiveHost: HTMLDivElement | null = null;
  private tableHost: HTMLDivElement | null = null;
  private archivedHost: HTMLDivElement | null = null;
  private tableComponent: HabitTrackerTable | null = null;
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
  private archivedRows: HabitRowState[] = [];
  private showArchived = false;
  private loading = false;
  private errorKey: AppTranslationKey | null = null;
  private createErrorKey: AppTranslationKey | null = null;
  private refreshVersion = 0;
  private createTitle = '';
  private createPending = false;
  private focusCreateInputOnRender = false;
  private readonly pendingCellKeys = new Set<string>();
  private readonly pendingHabitIds = new Set<string>();
  private sortMode: HabitSortMode = 'title';
  private prioritySortDirection: HabitPrioritySortDirection = 'desc';
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
    this.overlay.remove();
    this.closeCreateModal();
    this.overlay = null;
    this.header = null;
    this.body = null;
    this.footer = null;
    this.contentRoot = null;
    this.errorHost = null;
    this.stateHost = null;
    this.toolbarHost = null;
    this.noActiveHost = null;
    this.tableHost = null;
    this.archivedHost = null;
    this.tableComponent?.destroy();
    this.tableComponent = null;
    this.rows = [];
    this.archivedRows = [];
    this.showArchived = false;
    this.loading = false;
    this.errorKey = null;
    this.createErrorKey = null;
    this.createTitle = '';
    this.createPending = false;
    this.focusCreateInputOnRender = false;
    this.refreshVersion += 1;
    this.pendingCellKeys.clear();
    this.pendingHabitIds.clear();
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

  private ensureBodyShell(): void {
    if (!this.body) return;
    if (
      this.contentRoot &&
      this.errorHost &&
      this.stateHost &&
      this.toolbarHost &&
      this.noActiveHost &&
      this.tableHost &&
      this.archivedHost
    ) {
      return;
    }

    this.body.replaceChildren();

    this.contentRoot = document.createElement('div');
    this.contentRoot.className = 'space-y-3 pb-1';
    this.errorHost = document.createElement('div');
    this.stateHost = document.createElement('div');
    this.toolbarHost = document.createElement('div');
    this.noActiveHost = document.createElement('div');
    this.tableHost = document.createElement('div');
    this.archivedHost = document.createElement('div');

    this.contentRoot.append(
      this.errorHost,
      this.stateHost,
      this.toolbarHost,
      this.noActiveHost,
      this.tableHost,
      this.archivedHost
    );
    this.body.appendChild(this.contentRoot);
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

  private getHabitRef(habit: Habit): string {
    return habit.uuid;
  }

  private toCellKey(habitUuid: string, dateKey: string): string {
    return `${habitUuid}:${dateKey}`;
  }

  private isHabitPending(habitUuid: string): boolean {
    return this.pendingHabitIds.has(habitUuid);
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
      archivedCount: this.archivedRows.length,
      activeCount: this.rows.length,
    };
  }

  private emitStatusChange(): void {
    this.onStatusChange?.(this.getStatusSnapshot());
  }

  private sortRowListByTitle(rows: HabitRowState[]): void {
    rows.sort((left, right) =>
      left.habit.title.localeCompare(right.habit.title)
    );
  }

  private getPriorityRank(priority: UiPriority): number {
    return HABIT_PRIORITY_ORDER.indexOf(priority);
  }

  private compareRows(left: HabitRowState, right: HabitRowState): number {
    if (this.sortMode === 'priority') {
      const leftRank = this.getPriorityRank(this.getHabitPriority(left.habit));
      const rightRank = this.getPriorityRank(this.getHabitPriority(right.habit));
      const rankDiff =
        this.prioritySortDirection === 'desc'
          ? rightRank - leftRank
          : leftRank - rightRank;
      if (rankDiff !== 0) return rankDiff;
    }
    return left.habit.title.localeCompare(right.habit.title);
  }

  private sortRows(): void {
    this.rows.sort((left, right) => this.compareRows(left, right));
  }

  private sortArchivedRowsByTitle(): void {
    this.sortRowListByTitle(this.archivedRows);
  }

  private togglePrioritySort(): void {
    if (this.sortMode === 'priority') {
      this.prioritySortDirection =
        this.prioritySortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      this.sortMode = 'priority';
      this.prioritySortDirection = 'desc';
    }
    this.sortRows();
    this.renderBody();
  }

  private getHabitPriority(habit: Habit): UiPriority {
    return normalizeUiPriority(habit.priority, 'low');
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

  private renderArchivedSection(): HTMLElement {
    const section = document.createElement('section');
    section.className = 'overflow-hidden rounded-xl border border-slate-200/80 bg-white';

    const header = document.createElement('button');
    header.type = 'button';
    header.className =
      'flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50';
    header.setAttribute('aria-expanded', this.showArchived ? 'true' : 'false');
    header.addEventListener('click', () => {
      this.showArchived = !this.showArchived;
      this.renderBody();
    });

    const heading = document.createElement('div');
    heading.className = 'min-w-0';

    const title = document.createElement('div');
    title.className = 'text-sm font-semibold text-slate-800';
    title.textContent = this.i18n.t('habits.archivedToggle', {
      count: String(this.archivedRows.length),
    });

    const subtitle = document.createElement('div');
    subtitle.className = 'text-xs text-slate-500';
    subtitle.textContent = this.i18n.t('habits.archivedSubtitle');

    const chevron = createIcon(this.showArchived ? 'chevron-up' : 'chevron-down', {
      size: 14,
      strokeWidth: 1.9,
    });
    chevron.setAttribute('aria-hidden', 'true');
    chevron.classList.add('shrink-0', 'text-slate-500');

    heading.append(title, subtitle);
    header.append(heading, chevron);
    section.appendChild(header);

    if (!this.showArchived) {
      return section;
    }

    const list = document.createElement('div');
    list.className = 'border-t border-slate-200/80';

    this.archivedRows.forEach((row) => {
      const habitPending = this.isHabitPending(this.getHabitRef(row.habit));
      const item = document.createElement('div');
      item.className =
        'flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50';

      const label = document.createElement('div');
      label.className = 'min-w-0 text-sm font-medium text-slate-700';
      label.textContent = row.habit.title;
      label.title = row.habit.title;

      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-1.5';

      const restoreButton = createIconButton({
        icon: 'arrow-uturn-left',
        tone: 'text',
        size: 'sm',
        title: this.i18n.t('common.restore'),
        ariaLabel: this.i18n.t('common.restore'),
        disabled: this.loading || this.createPending || habitPending,
        onClick: () => {
          void this.restoreHabit(row);
        },
      });

      const deleteButton = createIconButton({
        icon: 'trash',
        tone: 'danger',
        size: 'sm',
        title: this.i18n.t('common.delete'),
        ariaLabel: this.i18n.t('common.delete'),
        disabled: this.loading || this.createPending || habitPending,
        onClick: () => {
          void this.deleteHabit(row);
        },
      });

      actions.append(restoreButton, deleteButton);
      item.append(label, actions);
      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
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
    this.ensureBodyShell();
    if (
      !this.errorHost ||
      !this.stateHost ||
      !this.toolbarHost ||
      !this.noActiveHost ||
      !this.tableHost ||
      !this.archivedHost
    ) {
      return;
    }

    this.errorHost.replaceChildren();
    this.stateHost.replaceChildren();
    this.toolbarHost.replaceChildren();
    this.noActiveHost.replaceChildren();
    this.archivedHost.replaceChildren();

    if (this.errorKey) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.i18n.t(this.errorKey);
      this.errorHost.appendChild(errorBox);
    }

    if (
      this.loading &&
      this.rows.length === 0 &&
      this.archivedRows.length === 0
    ) {
      const loading = document.createElement('div');
      loading.className = 'py-6 text-sm text-slate-500';
      loading.textContent = this.i18n.t('habits.loading');
      this.stateHost.appendChild(loading);
      this.tableComponent?.destroy();
      this.tableComponent = null;
      this.tableHost.replaceChildren();
      return;
    }

    if (
      !this.loading &&
      this.rows.length === 0 &&
      this.archivedRows.length === 0
    ) {
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
      this.stateHost.appendChild(emptyState);
      this.tableComponent?.destroy();
      this.tableComponent = null;
      this.tableHost.replaceChildren();
      return;
    }

    this.toolbarHost.appendChild(this.renderQuickAddToolbar());

    if (this.rows.length === 0 && this.archivedRows.length > 0) {
      const noActive = document.createElement('p');
      noActive.className = 'text-sm text-slate-500';
      noActive.textContent = this.i18n.t('habits.noActive');
      this.noActiveHost.appendChild(noActive);
    }

    if (this.rows.length > 0) {
      if (!this.tableComponent) {
        this.tableComponent = new HabitTrackerTable(this.i18n);
        this.tableHost.replaceChildren(this.tableComponent.element);
      } else if (!this.tableComponent.element.isConnected) {
        this.tableHost.replaceChildren(this.tableComponent.element);
      }
      this.tableComponent.update({
        rows: this.rows,
        days: this.days,
        loading: this.loading,
        createPending: this.createPending,
        pendingCellKeys: this.pendingCellKeys,
        sortMode: this.sortMode,
        prioritySortDirection: this.prioritySortDirection,
        isHabitPending: (habitUuid) => this.isHabitPending(habitUuid),
        onTogglePrioritySort: () => {
          this.togglePrioritySort();
        },
        onRenameHabit: (row, nextTitleRaw) => {
          void this.renameHabit(row, nextTitleRaw);
        },
        onUpdatePriority: (row, nextPriority) => {
          void this.updateHabitPriority(row, nextPriority);
        },
        onToggleCell: (row, day, previousChecked) => {
          void this.toggleCell(row, day, previousChecked);
        },
        onArchiveHabit: (row) => {
          void this.archiveHabit(row);
        },
        onDeleteHabit: (row) => {
          void this.deleteHabit(row);
        },
      });
    } else {
      this.tableComponent?.destroy();
      this.tableComponent = null;
      this.tableHost.replaceChildren();
    }

    if (this.archivedRows.length > 0) {
      this.archivedHost.appendChild(this.renderArchivedSection());
    }
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
        this.archivedRows = habits
          .filter((habit) => habit.status === Status.Archived)
          .map((habit) => this.mapHabitToRow(habit));
        this.sortRows();
        this.sortArchivedRowsByTitle();
        if (this.archivedRows.length === 0) {
          this.showArchived = false;
        }
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
        this.sortRows();
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
    const habitUuid = this.getHabitRef(row.habit);
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) {
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
    this.pendingHabitIds.add(habitUuid);
    row.habit = {
      ...row.habit,
      title: nextTitle,
    };
    this.sortRows();
    this.renderFooter();
    this.renderBody();
    try {
      const updated = await this.service.patchHabitTitle(habitUuid, nextTitle);
      row.habit = updated;
      row.completionByDateKey = this.buildCompletionMap(updated);
      this.sortRows();
      emitKanbanRefreshRequest();
    } catch {
      row.habit = {
        ...row.habit,
        title: previousTitle,
      };
      this.sortRows();
      this.errorKey = 'habits.error.rename';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async updateHabitPriority(
    row: HabitRowState,
    nextPriority: UiPriority
  ): Promise<void> {
    const habitUuid = this.getHabitRef(row.habit);
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) {
      return;
    }

    const previousPriority = this.getHabitPriority(row.habit);
    if (nextPriority === previousPriority) return;

    this.errorKey = null;
    this.pendingHabitIds.add(habitUuid);
    row.habit = {
      ...row.habit,
      priority: nextPriority as Priority,
    };
    this.renderFooter();
    this.renderBody();
    try {
      const updated = await this.service.patchHabitPriority(
        habitUuid,
        nextPriority
      );
      row.habit = updated;
      row.completionByDateKey = this.buildCompletionMap(updated);
      emitKanbanRefreshRequest();
    } catch {
      row.habit = {
        ...row.habit,
        priority: previousPriority as Priority,
      };
      this.errorKey = 'habits.error.priority';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async archiveHabit(row: HabitRowState): Promise<void> {
    const habitUuid = this.getHabitRef(row.habit);
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) {
      return;
    }

    this.errorKey = null;
    this.pendingHabitIds.add(habitUuid);
    this.renderFooter();
    this.renderBody();
    try {
      const archived = await this.service.archiveHabit(habitUuid);
      this.rows = this.rows.filter((item) => item.habit.uuid !== habitUuid);
      if (archived.status === Status.Archived) {
        this.archivedRows.push(this.mapHabitToRow(archived));
        this.sortArchivedRowsByTitle();
      }
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.errorKey = 'habits.error.archive';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async restoreHabit(row: HabitRowState): Promise<void> {
    const habitUuid = this.getHabitRef(row.habit);
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) {
      return;
    }

    this.errorKey = null;
    this.pendingHabitIds.add(habitUuid);
    this.renderFooter();
    this.renderBody();
    try {
      const restored = await this.service.restoreHabit(habitUuid);
      this.archivedRows = this.archivedRows.filter(
        (item) => item.habit.uuid !== habitUuid
      );
      if (restored.status === Status.Active) {
        this.rows.push(this.mapHabitToRow(restored));
        this.sortRows();
      }
      if (this.archivedRows.length === 0) {
        this.showArchived = false;
      }
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.errorKey = 'habits.error.archive';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async deleteHabit(row: HabitRowState): Promise<void> {
    const habitUuid = this.getHabitRef(row.habit);
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) {
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
    this.pendingHabitIds.add(habitUuid);
    this.renderFooter();
    this.renderBody();
    try {
      await this.service.deleteHabit(habitUuid);
      this.rows = this.rows.filter((item) => item.habit.uuid !== habitUuid);
      this.archivedRows = this.archivedRows.filter(
        (item) => item.habit.uuid !== habitUuid
      );
      if (this.archivedRows.length === 0) {
        this.showArchived = false;
      }
      emitKanbanRefreshRequest();
      this.emitStatusChange();
    } catch {
      this.errorKey = 'habits.error.delete';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderFooter();
      this.renderBody();
    }
  }

  private async toggleCell(
    row: HabitRowState,
    day: HabitDay,
    previousChecked: boolean
  ): Promise<void> {
    const habitUuid = this.getHabitRef(row.habit);
    const cellKey = this.toCellKey(habitUuid, day.key);
    if (this.pendingCellKeys.has(cellKey) || this.isHabitPending(habitUuid))
      return;

    this.errorKey = null;
    row.completionByDateKey.set(day.key, !previousChecked);
    this.pendingCellKeys.add(cellKey);
    this.renderFooter();
    this.renderBody();

    try {
      const updated = await this.service.toggleHabitCompletion(habitUuid, day.date);
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
