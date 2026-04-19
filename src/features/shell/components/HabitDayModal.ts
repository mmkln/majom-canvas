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
import type { AppTranslationKey, I18nService } from '../../../i18n/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { ShellHabitsService } from '../services/ShellHabitsService.ts';
import type { Habit } from '../../../majom-wrapper/interfaces/index.ts';
import type { UiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import { normalizeUiPriority } from '../../../majom-wrapper/utils/priorityMapping.ts';
import type { HabitDay, HabitRowState } from './HabitTrackerTable.ts';
import { confirmDeleteRoutineModal } from './ConfirmDeleteRoutineModal.ts';
import {
  buildHabitDay,
  emitKanbanRefreshRequest,
  mapArchivedSummaryToHabitRow,
  mapDaySnapshotToRows,
} from './habitTrackerShared.ts';

const HABIT_PRIORITY_ORDER: readonly UiPriority[] = [
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
];
const HABIT_PRIORITY_MENU_ORDER: readonly UiPriority[] = [
  'highest',
  'high',
  'medium',
  'low',
  'lowest',
];
const HABIT_PRIORITY_GROUP_ORDER: readonly UiPriority[] = [
  'highest',
  'high',
  'medium',
  'low',
  'lowest',
];
const HABIT_PRIORITY_ICON_MAP: Record<
  UiPriority,
  Parameters<typeof createIcon>[0]
> = {
  lowest: 'chevron-double-down',
  low: 'chevron-down',
  medium: 'bars-2',
  high: 'chevron-up',
  highest: 'chevron-double-up',
};
const HABIT_PRIORITY_ICON_TONE_CLASS: Record<UiPriority, string> = {
  lowest: 'text-sky-500',
  low: 'text-sky-500',
  medium: 'text-orange-500',
  high: 'text-red-500',
  highest: 'text-red-500',
};

type HabitDayModalService = Pick<
  ShellHabitsService,
  | 'loadDay'
  | 'setHabitCompletion'
  | 'createHabit'
  | 'patchHabitTitle'
  | 'patchHabitPriority'
  | 'archiveHabit'
  | 'restoreHabit'
  | 'deleteHabit'
>;

type HabitDayModalOptions = {
  onDataChanged?: () => void | Promise<void>;
};

export class HabitDayModal {
  private overlay: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private createOverlay: HTMLDivElement | null = null;
  private createHeader: HTMLDivElement | null = null;
  private createBody: HTMLDivElement | null = null;
  private createFooter: HTMLDivElement | null = null;
  private currentDay: HabitDay | null = null;
  private rows: HabitRowState[] = [];
  private archivedRows: HabitRowState[] = [];
  private showArchived = false;
  private loading = false;
  private errorKey: AppTranslationKey | null = null;
  private createErrorKey: AppTranslationKey | null = null;
  private createTitle = '';
  private createPending = false;
  private focusCreateInputOnRender = false;
  private refreshVersion = 0;
  private editingHabitUuid: string | null = null;
  private focusEditHabitUuid: string | null = null;
  private readonly pendingCellKeys = new Set<string>();
  private readonly pendingHabitIds = new Set<string>();
  private readonly rowMenuControllers = new Set<AnchoredMenu>();
  private readonly disposeRuntimeSubscription: () => void;

  constructor(
    private readonly service: HabitDayModalService = new ShellHabitsService(),
    private readonly runtime: AppRuntime = createAppRuntime(),
    private readonly options: HabitDayModalOptions = {}
  ) {
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      if (this.currentDay) {
        this.currentDay = buildHabitDay(this.currentDay.date, this.runtime.i18n);
      }
      this.refreshTranslations();
    });
  }

  public isOpen(): boolean {
    return this.overlay !== null;
  }

  public open(day: HabitDay): void {
    this.currentDay = buildHabitDay(day.date, this.runtime.i18n);
    if (this.overlay) {
      this.refreshTranslations();
      void this.refresh();
      return;
    }

    const { overlay, container, header, body, footer } = createModalShell(
      this.runtime.i18n.t('habits.modal.title'),
      {
        subtitle: this.getDaySubtitle(),
        onClose: () => this.close(),
        intent: 'form',
        zIndex: 270,
      }
    );
    container.style.width = 'min(42rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(42rem, calc(100vw - 2rem))';

    this.overlay = overlay;
    this.header = header;
    this.body = body;
    this.footer = footer;
    this.renderFooter();
    this.renderBody();
    void this.refresh();
  }

  public async refresh(): Promise<void> {
    if (!this.currentDay || this.loading) return;
    const refreshVersion = this.refreshVersion + 1;
    this.refreshVersion = refreshVersion;
    this.loading = true;
    this.errorKey = null;
    this.renderFooter();
    this.renderBody();

    try {
      const snapshot = await this.service.loadDay(this.currentDay.date);
      if (refreshVersion !== this.refreshVersion) return;
      this.currentDay = buildHabitDay(snapshot.day.date, this.runtime.i18n);
      this.rows = mapDaySnapshotToRows(snapshot);
      this.archivedRows = snapshot.archived_habits.map((habit) =>
        mapArchivedSummaryToHabitRow(habit)
      );
      if (this.archivedRows.length === 0) {
        this.showArchived = false;
      }
    } catch {
      if (refreshVersion !== this.refreshVersion) return;
      this.errorKey = 'habits.error.load';
      this.rows = [];
      this.archivedRows = [];
    } finally {
      if (refreshVersion !== this.refreshVersion) return;
      this.loading = false;
      this.renderFooter();
      this.renderBody();
    }
  }

  public close(): void {
    this.overlay?.remove();
    this.closeCreateModal();
    this.disposeMenus();
    this.overlay = null;
    this.header = null;
    this.body = null;
    this.footer = null;
    this.currentDay = null;
    this.rows = [];
    this.archivedRows = [];
    this.showArchived = false;
    this.loading = false;
    this.errorKey = null;
    this.refreshVersion += 1;
    this.editingHabitUuid = null;
    this.focusEditHabitUuid = null;
    this.pendingCellKeys.clear();
    this.pendingHabitIds.clear();
  }

  public destroy(): void {
    this.close();
    this.disposeRuntimeSubscription();
  }

  private refreshTranslations(): void {
    if (this.header) {
      const title = this.header.querySelector('h2');
      const subtitle = this.header.querySelector('p');
      if (title) title.textContent = this.runtime.i18n.t('habits.modal.title');
      if (subtitle) subtitle.textContent = this.getDaySubtitle();
    }
    if (this.createHeader) {
      const title = this.createHeader.querySelector('h2');
      const subtitle = this.createHeader.querySelector('p');
      if (title) title.textContent = this.runtime.i18n.t('habits.create.title');
      if (subtitle) {
        subtitle.textContent = this.runtime.i18n.t('habits.create.description');
      }
    }
    if (this.overlay) {
      this.renderFooter();
      this.renderBody();
    }
    if (this.createOverlay) {
      this.renderCreateModal();
    }
  }

  private getDaySubtitle(): string {
    if (!this.currentDay) return '';
    return `${this.currentDay.dayLabel}, ${this.currentDay.shortLabel}`;
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
    closeButton.textContent = this.runtime.i18n.t('common.close');
    closeButton.addEventListener('click', () => this.close());
    row.append(closeButton);
    this.footer.appendChild(row);
  }

  private renderBody(): void {
    if (!this.body) return;
    this.body.replaceChildren();
    this.disposeMenus();

    const root = document.createElement('div');
    root.className = 'space-y-3 pb-1';

    if (this.errorKey) {
      const errorBox = document.createElement('div');
      errorBox.className =
        'rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700';
      errorBox.textContent = this.runtime.i18n.t(this.errorKey);
      root.appendChild(errorBox);
    }

    if (this.loading && this.rows.length === 0 && this.archivedRows.length === 0) {
      const loading = document.createElement('div');
      loading.className = 'py-6 text-sm text-slate-500';
      loading.textContent = this.runtime.i18n.t('habits.loading');
      root.appendChild(loading);
      this.body.appendChild(root);
      return;
    }

    if (!this.loading && this.rows.length === 0 && this.archivedRows.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className =
        'flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center';
      const empty = document.createElement('p');
      empty.className = 'max-w-sm text-sm text-slate-500';
      empty.textContent = this.runtime.i18n.t('habits.empty');
      const createFirstRoutineButton = createTextButton({
        text: this.runtime.i18n.t('habits.createFirst'),
        tone: 'primary',
        size: 'sm',
        disabled: this.createPending,
        onClick: () => this.openCreateModal(),
      });
      emptyState.append(empty, createFirstRoutineButton);
      root.appendChild(emptyState);
      this.body.appendChild(root);
      return;
    }

    root.appendChild(this.renderQuickAddToolbar());

    if (this.currentDay) {
      const summary = document.createElement('p');
      summary.className = 'text-sm text-slate-500';
      const completed = this.rows.filter((row) => this.isRowCompleted(row)).length;
      summary.textContent = `${completed}/${this.rows.length}`;
      root.appendChild(summary);
    }

    if (this.rows.length > 0) {
      const list = document.createElement('div');
      list.className = 'space-y-1';
      this.buildPriorityGroups(this.rows).forEach((group, index) => {
        if (index > 0) {
          const divider = document.createElement('div');
          divider.className = 'border-t border-slate-200/80';
          list.appendChild(divider);
        }
        list.appendChild(this.renderPriorityGroup(group.priority, group.rows));
      });
      root.appendChild(list);
    }

    if (this.rows.length === 0 && this.archivedRows.length > 0) {
      const noActive = document.createElement('p');
      noActive.className = 'text-sm text-slate-500';
      noActive.textContent = this.runtime.i18n.t('habits.noActive');
      root.appendChild(noActive);
    }

    if (this.archivedRows.length > 0) {
      root.appendChild(this.renderArchivedSection());
    }

    this.body.appendChild(root);
  }

  private renderQuickAddToolbar(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'flex items-center justify-end';
    const newRoutineButton = createTextButton({
      text: this.runtime.i18n.t('habits.newRoutine'),
      tone: 'secondary',
      size: 'sm',
      disabled: this.loading || this.createPending,
      onClick: () => this.openCreateModal(),
    });
    const newRoutineIcon = createIcon('plus', { size: 14, strokeWidth: 1.9 });
    newRoutineIcon.setAttribute('aria-hidden', 'true');
    newRoutineButton.classList.add('inline-flex', 'items-center', 'gap-1.5');
    newRoutineButton.prepend(newRoutineIcon);
    wrap.appendChild(newRoutineButton);
    return wrap;
  }

  private renderRow(row: HabitRowState): HTMLElement {
    const habitUuid = row.habit.uuid;
    const habitPending = this.isHabitPending(habitUuid);
    const container = document.createElement('div');
    container.className =
      'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-100/80';

    container.appendChild(this.renderPriorityControl(row, habitPending));
    container.appendChild(this.renderTitleControl(row, habitPending));

    const checkboxWrap = document.createElement('div');
    checkboxWrap.className = 'ml-auto flex items-center gap-2';
    if (this.currentDay) {
      const cellKey = `${habitUuid}:${this.currentDay.key}`;
      const checked = this.isRowCompleted(row);
      const checkbox = new Checkbox({
        checked,
        disabled:
          this.pendingCellKeys.has(cellKey) ||
          this.loading ||
          this.createPending ||
          habitPending,
        ariaLabel: `${row.habit.title} ${this.currentDay.shortLabel} completion`,
      });
      checkbox.onChange(() => {
        void this.toggleCompletion(row, checked);
      });
      checkboxWrap.appendChild(checkbox.getElement());
    }
    checkboxWrap.appendChild(this.renderActionsMenu(row, habitPending));
    container.appendChild(checkboxWrap);
    return container;
  }

  private renderPriorityGroup(
    priority: UiPriority,
    rows: HabitRowState[]
  ): HTMLElement {
    const section = document.createElement('section');
    section.className = 'space-y-0.5';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-2 px-2 py-1';
    const label = document.createElement('p');
    label.className = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
    label.textContent = this.getPriorityLabel(priority);
    const line = document.createElement('div');
    line.className = 'h-px flex-1 bg-slate-200/80';
    header.append(label, line);
    section.appendChild(header);

    rows.forEach((row) => {
      section.appendChild(this.renderRow(row));
    });

    return section;
  }

  private renderTitleControl(
    row: HabitRowState,
    habitPending: boolean
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'min-w-0 flex-1';
    const habitUuid = row.habit.uuid;
    if (this.editingHabitUuid === habitUuid) {
      const titleInput = createInputBase({
        value: row.habit.title,
        disabled: this.loading || this.createPending || habitPending,
        className:
          'h-[34px] min-w-0 w-full border-slate-200 bg-white px-2 text-base font-medium leading-5 text-slate-900 shadow-none hover:border-slate-300 focus-visible:bg-white md:text-sm disabled:border-transparent disabled:bg-transparent disabled:text-slate-500',
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            titleInput.blur();
            return;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            this.editingHabitUuid = null;
            this.focusEditHabitUuid = null;
            this.renderBody();
          }
        },
      });
      titleInput.dataset.habitTitleInput = habitUuid;
      titleInput.addEventListener('blur', () => {
        const nextTitle = titleInput.value;
        this.editingHabitUuid = null;
        this.focusEditHabitUuid = null;
        if (nextTitle.trim() === row.habit.title) {
          this.renderBody();
          return;
        }
        void this.renameHabit(row, nextTitle);
      });
      wrap.appendChild(titleInput);
      if (this.focusEditHabitUuid === habitUuid) {
        this.focusEditHabitUuid = null;
        requestAnimationFrame(() => {
          titleInput.focus();
          titleInput.select();
        });
      }
      return wrap;
    }

    const titleButton = document.createElement('button');
    titleButton.type = 'button';
    titleButton.className =
      'min-w-0 max-w-full truncate rounded-md px-2 py-1 text-left text-base font-medium leading-5 text-slate-900 transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80 md:text-sm';
    titleButton.dataset.habitTitleLabel = habitUuid;
    titleButton.textContent = row.habit.title;
    titleButton.title = row.habit.title;
    titleButton.setAttribute('aria-label', this.runtime.i18n.t('common.edit'));
    titleButton.addEventListener('click', () => {
      if (this.loading || this.createPending || habitPending) return;
      this.editingHabitUuid = habitUuid;
      this.focusEditHabitUuid = habitUuid;
      this.renderBody();
    });
    wrap.appendChild(titleButton);
    return wrap;
  }

  private renderPriorityControl(
    row: HabitRowState,
    habitPending: boolean
  ): HTMLElement {
    const priorityCell = document.createElement('div');
    priorityCell.className = 'relative inline-flex shrink-0';
    const currentPriority = normalizeUiPriority(row.habit.priority, 'low');
    const priorityButton = createIconButton({
      icon: HABIT_PRIORITY_ICON_MAP[currentPriority],
      size: 'sm',
      iconSize: 18,
      iconClassName: HABIT_PRIORITY_ICON_TONE_CLASS[currentPriority],
      iconStrokeWidth: 1.9,
      tone: 'text',
      title: `${this.runtime.i18n.t('habits.priority')}: ${this.getPriorityLabel(currentPriority)}`,
      ariaLabel: `${this.runtime.i18n.t('habits.priority')}: ${this.getPriorityLabel(currentPriority)}`,
      disabled: this.loading || this.createPending || habitPending,
      className: 'hover:bg-slate-100',
    });
    priorityButton.dataset.habitPriorityTrigger = row.habit.uuid;
    priorityButton.setAttribute('aria-haspopup', 'menu');
    priorityButton.setAttribute('aria-expanded', 'false');

    const priorityPanel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-50 hidden w-44 overflow-hidden',
    });
    priorityPanel.setAttribute('role', 'menu');

    const priorityController = new AnchoredMenu({
      container: priorityCell,
      panel: priorityPanel,
      onOpenChange: (open) => {
        priorityButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        priorityButton.classList.toggle('ring-2', open);
        priorityButton.classList.toggle('ring-indigo-200', open);
      },
    });
    priorityController.mount();
    this.rowMenuControllers.add(priorityController);

    HABIT_PRIORITY_MENU_ORDER.forEach((priority) => {
      const leading = document.createElement('span');
      leading.className = 'inline-flex';
      leading.appendChild(this.createPriorityIcon(priority, 13, 1.8));
      const trailing =
        currentPriority === priority ? document.createElement('span') : null;
      if (trailing) {
        trailing.className = 'inline-flex';
        trailing.appendChild(createIcon('check', { size: 14, strokeWidth: 2 }));
      }
      const option = createDropdownItem({
        label: this.getPriorityLabel(priority),
        active: currentPriority === priority,
        leading,
        trailing,
        onClick: () => {
          priorityController.close();
          void this.updateHabitPriority(row, priority);
        },
      });
      option.setAttribute('role', 'menuitemradio');
      option.setAttribute(
        'aria-checked',
        currentPriority === priority ? 'true' : 'false'
      );
      priorityPanel.appendChild(option);
    });

    priorityButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (priorityButton.disabled) return;
      if (priorityController.isOpen()) {
        priorityController.close();
        return;
      }
      this.closeOtherMenus(priorityController);
      priorityController.openAt({
        anchor: priorityButton,
        placement: 'bottom-start',
        fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
        gap: 4,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    priorityCell.append(priorityButton, priorityPanel);
    return priorityCell;
  }

  private renderActionsMenu(
    row: HabitRowState,
    habitPending: boolean
  ): HTMLElement {
    const actionsRow = document.createElement('div');
    actionsRow.className = 'relative inline-flex shrink-0';
    const menuButton = createIconButton({
      icon: 'ellipsis-vertical',
      size: 'sm',
      tone: 'text',
      title: this.runtime.i18n.t('habits.rowActions'),
      ariaLabel: this.runtime.i18n.t('habits.openRowActions'),
      disabled: this.loading || this.createPending || habitPending,
    });
    const menuPanel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-50 hidden w-36 overflow-hidden',
    });
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
      label: this.runtime.i18n.t('common.archive'),
      onClick: () => {
        menuController.close();
        void this.archiveHabit(row);
      },
    });
    archiveItem.setAttribute('role', 'menuitem');
    const deleteItem = createDropdownItem({
      label: this.runtime.i18n.t('common.delete'),
      variant: 'danger',
      onClick: () => {
        menuController.close();
        void this.deleteHabit(row);
      },
    });
    deleteItem.setAttribute('role', 'menuitem');
    menuPanel.append(archiveItem, deleteItem);

    menuButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (menuButton.disabled) return;
      if (menuController.isOpen()) {
        menuController.close();
        return;
      }
      this.closeOtherMenus(menuController);
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
    return actionsRow;
  }

  private renderArchivedSection(): HTMLElement {
    const section = document.createElement('section');
    section.className =
      'overflow-hidden rounded-xl border border-slate-200/80 bg-white';
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
    title.textContent = this.runtime.i18n.t('habits.archivedToggle', {
      count: String(this.archivedRows.length),
    });
    const subtitle = document.createElement('div');
    subtitle.className = 'text-xs text-slate-500';
    subtitle.textContent = this.runtime.i18n.t('habits.archivedSubtitle');
    const chevron = createIcon(
      this.showArchived ? 'chevron-up' : 'chevron-down',
      {
        size: 14,
        strokeWidth: 1.9,
      }
    );
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
      const item = document.createElement('div');
      item.className =
        'flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50';
      const label = document.createElement('div');
      label.className = 'min-w-0 text-sm font-medium text-slate-700';
      label.textContent = row.habit.title;
      label.title = row.habit.title;
      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-1.5';
      actions.append(
        createIconButton({
          icon: 'arrow-uturn-left',
          tone: 'text',
          size: 'sm',
          title: this.runtime.i18n.t('common.restore'),
          ariaLabel: this.runtime.i18n.t('common.restore'),
          disabled: this.loading || this.createPending,
          onClick: () => {
            void this.restoreHabit(row);
          },
        }),
        createIconButton({
          icon: 'trash',
          tone: 'danger',
          size: 'sm',
          title: this.runtime.i18n.t('common.delete'),
          ariaLabel: this.runtime.i18n.t('common.delete'),
          disabled: this.loading || this.createPending,
          onClick: () => {
            void this.deleteHabit(row);
          },
        })
      );
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
      this.runtime.i18n.t('habits.create.title'),
      {
        subtitle: this.runtime.i18n.t('habits.create.description'),
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
    this.createOverlay?.remove();
    this.createOverlay = null;
    this.createHeader = null;
    this.createBody = null;
    this.createFooter = null;
    this.createErrorKey = null;
    this.focusCreateInputOnRender = false;
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
      errorBox.textContent = this.runtime.i18n.t(this.createErrorKey);
      bodyWrap.appendChild(errorBox);
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = this.runtime.i18n.t('habits.create.placeholder');
    input.value = this.createTitle;
    input.disabled = this.loading || this.createPending;
    input.className =
      'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition-colors focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500';
    const createButton = createTextButton({
      text: this.createPending
        ? this.runtime.i18n.t('habits.createPending')
        : this.runtime.i18n.t('common.create'),
      tone: 'primary',
      size: 'sm',
      disabled:
        this.loading || this.createPending || this.createTitle.trim().length === 0,
      onClick: () => void this.createHabit(),
    });
    input.addEventListener('input', () => {
      this.createTitle = input.value;
      createButton.disabled =
        this.loading || this.createPending || this.createTitle.trim().length === 0;
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
    footerRow.className = 'flex flex-col-reverse gap-2 md:flex-row md:justify-end';
    footerRow.append(
      createTextButton({
        text: this.runtime.i18n.t('common.cancel'),
        tone: 'text',
        size: 'sm',
        disabled: this.createPending,
        onClick: () => this.closeCreateModal(),
      }),
      createButton
    );
    this.createFooter.appendChild(footerRow);
    if (this.focusCreateInputOnRender) {
      this.focusCreateInputOnRender = false;
      requestAnimationFrame(() => input.focus());
    }
  }

  private async createHabit(): Promise<void> {
    const title = this.createTitle.trim();
    if (!title || this.loading || this.createPending) return;
    this.createPending = true;
    this.createErrorKey = null;
    this.renderBody();
    this.renderFooter();
    this.renderCreateModal();
    try {
      await this.service.createHabit(title);
      this.createTitle = '';
      this.closeCreateModal();
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
      await this.refresh();
    } catch {
      this.createErrorKey = 'habits.error.create';
      this.errorKey = 'habits.error.create';
    } finally {
      this.createPending = false;
      this.renderBody();
      this.renderFooter();
      this.renderCreateModal();
    }
  }

  private async renameHabit(row: HabitRowState, nextTitleRaw: string): Promise<void> {
    const habitUuid = row.habit.uuid;
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) return;
    const nextTitle = nextTitleRaw.trim();
    const previousTitle = row.habit.title;
    if (!nextTitle) {
      this.errorKey = 'habits.error.emptyTitle';
      this.renderBody();
      return;
    }
    if (nextTitle === previousTitle) return;
    this.pendingHabitIds.add(habitUuid);
    row.habit = { ...row.habit, title: nextTitle };
    this.renderBody();
    try {
      const updated = await this.service.patchHabitTitle(habitUuid, nextTitle);
      row.habit = updated;
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
    } catch {
      row.habit = { ...row.habit, title: previousTitle };
      this.errorKey = 'habits.error.rename';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderBody();
    }
  }

  private async updateHabitPriority(
    row: HabitRowState,
    nextPriority: UiPriority
  ): Promise<void> {
    const habitUuid = row.habit.uuid;
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) return;
    const previousPriority = normalizeUiPriority(row.habit.priority, 'low');
    if (nextPriority === previousPriority) return;
    this.pendingHabitIds.add(habitUuid);
    row.habit = { ...row.habit, priority: nextPriority as Habit['priority'] };
    this.renderBody();
    try {
      const updated = await this.service.patchHabitPriority(habitUuid, nextPriority);
      row.habit = updated;
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
    } catch {
      row.habit = {
        ...row.habit,
        priority: previousPriority as Habit['priority'],
      };
      this.errorKey = 'habits.error.priority';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderBody();
    }
  }

  private async archiveHabit(row: HabitRowState): Promise<void> {
    const habitUuid = row.habit.uuid;
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) return;
    this.pendingHabitIds.add(habitUuid);
    this.renderBody();
    try {
      await this.service.archiveHabit(habitUuid);
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
      await this.refresh();
    } catch {
      this.errorKey = 'habits.error.archive';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderBody();
    }
  }

  private async restoreHabit(row: HabitRowState): Promise<void> {
    const habitUuid = row.habit.uuid;
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) return;
    this.pendingHabitIds.add(habitUuid);
    this.renderBody();
    try {
      await this.service.restoreHabit(habitUuid);
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
      await this.refresh();
    } catch {
      this.errorKey = 'habits.error.archive';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderBody();
    }
  }

  private async deleteHabit(row: HabitRowState): Promise<void> {
    const habitUuid = row.habit.uuid;
    if (this.loading || this.createPending || this.isHabitPending(habitUuid)) return;
    const confirmed = await confirmDeleteRoutineModal({
      routineTitle: row.habit.title,
      i18n: this.runtime.i18n,
    });
    if (!confirmed) return;
    this.pendingHabitIds.add(habitUuid);
    this.renderBody();
    try {
      await this.service.deleteHabit(habitUuid);
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
      await this.refresh();
    } catch {
      this.errorKey = 'habits.error.delete';
    } finally {
      this.pendingHabitIds.delete(habitUuid);
      this.renderBody();
    }
  }

  private async toggleCompletion(
    row: HabitRowState,
    previousChecked: boolean
  ): Promise<void> {
    if (!this.currentDay) return;
    const habitUuid = row.habit.uuid;
    const cellKey = `${habitUuid}:${this.currentDay.key}`;
    if (this.pendingCellKeys.has(cellKey) || this.isHabitPending(habitUuid)) return;
    row.completionByDateKey.set(this.currentDay.key, !previousChecked);
    this.pendingCellKeys.add(cellKey);
    this.renderBody();
    try {
      const updated = await this.service.setHabitCompletion(
        habitUuid,
        this.currentDay.date,
        !previousChecked
      );
      row.habit = updated;
      emitKanbanRefreshRequest();
      await this.notifyDataChanged();
    } catch {
      row.completionByDateKey.set(this.currentDay.key, previousChecked);
      this.errorKey = 'habits.error.toggleCompletion';
    } finally {
      this.pendingCellKeys.delete(cellKey);
      this.renderBody();
    }
  }

  private isHabitPending(habitUuid: string): boolean {
    return this.pendingHabitIds.has(habitUuid);
  }

  private isRowCompleted(row: HabitRowState): boolean {
    if (!this.currentDay) return false;
    return row.completionByDateKey.get(this.currentDay.key) === true;
  }

  private closeOtherMenus(activeController: AnchoredMenu): void {
    this.rowMenuControllers.forEach((controller) => {
      if (controller === activeController) return;
      controller.close();
    });
  }

  private disposeMenus(): void {
    this.rowMenuControllers.forEach((controller) => controller.unmount());
    this.rowMenuControllers.clear();
  }

  private getPriorityLabel(priority: UiPriority): string {
    switch (priority) {
      case 'lowest':
        return this.runtime.i18n.t('priority.lowest');
      case 'high':
        return this.runtime.i18n.t('priority.high');
      case 'highest':
        return this.runtime.i18n.t('priority.highest');
      case 'medium':
        return this.runtime.i18n.t('priority.medium');
      case 'low':
      default:
        return this.runtime.i18n.t('priority.low');
    }
  }

  private createPriorityIcon(
    priority: UiPriority,
    size = 12,
    strokeWidth = 1.9
  ): SVGElement {
    const icon = createIcon(HABIT_PRIORITY_ICON_MAP[priority], {
      size,
      strokeWidth,
    });
    icon.classList.add('shrink-0', HABIT_PRIORITY_ICON_TONE_CLASS[priority]);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  private buildPriorityGroups(
    rows: HabitRowState[]
  ): Array<{ priority: UiPriority; rows: HabitRowState[] }> {
    const grouped = new Map<UiPriority, HabitRowState[]>();
    HABIT_PRIORITY_GROUP_ORDER.forEach((priority) => grouped.set(priority, []));

    rows.forEach((row) => {
      const priority = normalizeUiPriority(row.habit.priority, 'low');
      grouped.get(priority)?.push(row);
    });

    return HABIT_PRIORITY_GROUP_ORDER.map((priority) => ({
      priority,
      rows:
        grouped
          .get(priority)
          ?.slice()
          .sort((left, right) => left.habit.title.localeCompare(right.habit.title)) ??
        [],
    })).filter((group) => group.rows.length > 0);
  }

  private async notifyDataChanged(): Promise<void> {
    await this.options.onDataChanged?.();
  }
}
