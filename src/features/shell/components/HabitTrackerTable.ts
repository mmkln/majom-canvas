import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createInputBase,
  createSurface,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../canvas/ui/icons.ts';
import {
  Priority,
  type Habit,
} from '../../../majom-wrapper/interfaces/index.ts';
import type { I18nService } from '../../../i18n/index.ts';
import {
  normalizeUiPriority,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';

const STREAK_LINE_COLOR = '#EEF2FF';
const STREAK_LINE_THICKNESS = 14;
const HABIT_PRIORITY_ORDER: readonly UiPriority[] = [
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
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
export type HabitDay = {
  date: Date;
  key: string;
  dayLabel: string;
  shortLabel: string;
};

export type HabitRowState = {
  habit: Habit;
  completionByDateKey: Map<string, boolean>;
};

type StreakRowOverlayMeta = {
  dayAnchors: Array<{ xAnchor: HTMLElement; yAnchor: HTMLElement }>;
  checkedStates: boolean[];
};

export type HabitSortMode = 'title' | 'priority';
export type HabitPrioritySortDirection = 'desc' | 'asc';

type HabitTrackerTableRenderOptions = {
  rows: HabitRowState[];
  days: HabitDay[];
  loading: boolean;
  createPending: boolean;
  pendingCellKeys: ReadonlySet<string>;
  sortMode: HabitSortMode;
  prioritySortDirection: HabitPrioritySortDirection;
  isHabitPending: (habitUuid: string) => boolean;
  onTogglePrioritySort: () => void;
  onRenameHabit: (row: HabitRowState, nextTitleRaw: string) => void;
  onUpdatePriority: (row: HabitRowState, nextPriority: UiPriority) => void;
  onToggleCell: (
    row: HabitRowState,
    day: HabitDay,
    previousChecked: boolean
  ) => void;
  onArchiveHabit: (row: HabitRowState) => void;
  onDeleteHabit: (row: HabitRowState) => void;
};

export class HabitTrackerTable {
  public readonly element: HTMLDivElement;

  private readonly table: HTMLTableElement;
  private readonly thead: HTMLTableSectionElement;
  private readonly tbody: HTMLTableSectionElement;
  private readonly i18n: I18nService;
  private readonly rowMenuControllers = new Set<AnchoredMenu>();
  private lastOptions: HabitTrackerTableRenderOptions | null = null;
  private editingHabitUuid: string | null = null;
  private focusEditHabitUuid: string | null = null;
  private streakOverlayRows: StreakRowOverlayMeta[] = [];
  private streakOverlayRafId: number | null = null;
  private streakOverlayObserver: ResizeObserver | null = null;
  private readonly handleStreakOverlayScroll = (): void => {
    this.scheduleStreakOverlayRender();
  };
  private readonly handleStreakOverlayWindowResize = (): void => {
    this.scheduleStreakOverlayRender();
  };

  constructor(i18n: I18nService) {
    this.i18n = i18n;
    this.element = document.createElement('div');
    this.element.className =
      'w-full overflow-auto rounded-xl border border-slate-200/80 bg-white';
    this.element.style.position = 'relative';
    this.element.style.maxHeight = 'min(56vh, 34rem)';
    this.element.style.overscrollBehavior = 'contain';

    this.table = document.createElement('table');
    this.table.className = 'min-w-[940px] w-full border-separate border-spacing-0';
    this.table.style.position = 'relative';
    this.table.style.zIndex = '1';

    this.thead = document.createElement('thead');
    this.tbody = document.createElement('tbody');

    this.table.append(this.thead, this.tbody);
    this.element.appendChild(this.table);
  }

  public update(options: HabitTrackerTableRenderOptions): void {
    this.lastOptions = options;
    if (
      this.editingHabitUuid &&
      !options.rows.some((row) => this.getHabitRef(row.habit) === this.editingHabitUuid)
    ) {
      this.editingHabitUuid = null;
      this.focusEditHabitUuid = null;
    }
    this.disposeRowMenus();
    this.detachStreakOverlay();
    this.renderHeader(options);
    this.renderRows(options);
  }

  public destroy(): void {
    this.lastOptions = null;
    this.editingHabitUuid = null;
    this.focusEditHabitUuid = null;
    this.disposeRowMenus();
    this.detachStreakOverlay();
  }

  private renderHeader(options: HabitTrackerTableRenderOptions): void {
    this.thead.replaceChildren();

    const headRow = document.createElement('tr');
    const headerCellBaseClass =
      'h-11 border-b border-slate-200/80 px-3 py-1.5 align-middle text-[12px] font-semibold leading-[1.35] text-slate-600';
    const stickyLeftHeaderClass = 'sticky left-0 top-0 z-20 bg-slate-50';
    const stickyRightHeaderClass =
      'sticky right-0 top-0 z-20 bg-slate-50 text-center';

    const priorityHead = document.createElement('th');
    priorityHead.setAttribute('scope', 'col');
    priorityHead.className =
      `${headerCellBaseClass} ${stickyLeftHeaderClass} w-[44px] text-center`;
    const prioritySortButton = document.createElement('button');
    prioritySortButton.type = 'button';
    prioritySortButton.className =
      'inline-flex items-center justify-center rounded-md p-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80';
    prioritySortButton.setAttribute('aria-label', this.i18n.t('habits.priority'));
    prioritySortButton.title = this.i18n.t('habits.priority');
    const prioritySortIcon = createIcon(
      this.getPrioritySortIconName(
        options.sortMode,
        options.prioritySortDirection
      ),
      {
        size: 12,
        strokeWidth: 1.9,
      }
    );
    prioritySortIcon.classList.add(
      'shrink-0',
      options.sortMode === 'priority' ? 'text-indigo-600' : 'text-slate-400'
    );
    prioritySortButton.append(prioritySortIcon);
    prioritySortButton.addEventListener('click', options.onTogglePrioritySort);
    priorityHead.appendChild(prioritySortButton);
    headRow.appendChild(priorityHead);

    const titleHead = document.createElement('th');
    titleHead.className = `${headerCellBaseClass} sticky top-0 z-20 bg-slate-50 text-left`;
    titleHead.style.left = '44px';
    titleHead.setAttribute('scope', 'col');
    titleHead.textContent = this.i18n.t('habits.table.routine');
    headRow.appendChild(titleHead);

    const todayKey = this.toLocalDateKey(new Date());
    options.days.forEach((day) => {
      const th = document.createElement('th');
      th.setAttribute('scope', 'col');
      th.className = `${headerCellBaseClass} sticky top-0 z-20 text-center ${
        day.key === todayKey ? 'bg-indigo-50' : 'bg-slate-50'
      }`;
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
    actionsHead.className = `${headerCellBaseClass} ${stickyRightHeaderClass} w-14`;
    actionsHead.setAttribute('scope', 'col');
    actionsHead.setAttribute('aria-label', this.i18n.t('common.actions'));
    const actionsLabel = document.createElement('span');
    actionsLabel.className = 'sr-only';
    actionsLabel.textContent = this.i18n.t('common.actions');
    actionsHead.appendChild(actionsLabel);
    headRow.appendChild(actionsHead);

    this.thead.appendChild(headRow);
  }

  private renderRows(options: HabitTrackerTableRenderOptions): void {
    this.tbody.replaceChildren();
    const streakRows: StreakRowOverlayMeta[] = [];
    const rowCellStateClass =
      'transition-colors group-hover:bg-slate-50/70 group-focus-within:bg-slate-50/90';
    const stickyPriorityCellClass = 'sticky left-0 z-10 bg-white';
    const stickyTitleCellClass = 'sticky z-10 bg-white';
    const stickyRightCellClass = 'sticky right-0 z-10 bg-white';
    const stickyRowCellStateClass =
      'transition-colors group-hover:bg-slate-50 group-focus-within:bg-slate-50';

    options.rows.forEach((row) => {
      const habitUuid = this.getHabitRef(row.habit);
      const habitPending = options.isHabitPending(habitUuid);
      const titleEditing = this.editingHabitUuid === habitUuid;
      const rowCheckedStates = options.days.map(
        (day) => row.completionByDateKey.get(day.key) === true
      );
      const dayAnchors: Array<{ xAnchor: HTMLElement; yAnchor: HTMLElement }> =
        [];
      const tr = document.createElement('tr');
      tr.className = 'group h-11 border-b border-slate-200/80 last:border-b-0';

      const priorityCell = this.renderPrioritySelectorCell(
        row,
        habitPending,
        options
      );
      priorityCell.className = `${stickyPriorityCellClass} ${priorityCell.className}`;
      tr.appendChild(priorityCell);

      const title = document.createElement('td');
      title.className =
        `${stickyTitleCellClass} px-3 align-middle text-sm text-slate-900 ${stickyRowCellStateClass}`;
      title.style.left = '44px';
      const titleWrap = document.createElement('div');
      titleWrap.className = 'flex items-center gap-1.5';

      if (titleEditing) {
        const titleInput = createInputBase({
          value: row.habit.title,
          disabled: options.loading || options.createPending || habitPending,
          className:
            'h-[34px] min-w-0 flex-1 border-slate-200 bg-white px-2 text-base font-medium leading-5 text-slate-900 shadow-none hover:border-slate-300 focus-visible:bg-white md:text-sm disabled:border-transparent disabled:bg-transparent disabled:text-slate-500',
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
              this.requestRender();
            }
          },
        });
        titleInput.dataset.habitTitleInput = habitUuid;
        titleInput.title = row.habit.title;
        titleInput.addEventListener('blur', () => {
          const nextTitle = titleInput.value;
          const shouldRename =
            nextTitle.trim().length === 0 || nextTitle.trim() !== row.habit.title;
          this.editingHabitUuid = null;
          this.focusEditHabitUuid = null;
          if (shouldRename) {
            options.onRenameHabit(row, nextTitle);
            return;
          }
          this.requestRender();
        });
        titleWrap.appendChild(titleInput);
        if (this.focusEditHabitUuid === habitUuid) {
          this.focusEditHabitUuid = null;
          requestAnimationFrame(() => {
            titleInput.focus();
            titleInput.select();
          });
        }
      } else {
        const titleLabel = document.createElement('button');
        titleLabel.type = 'button';
        titleLabel.className =
          'min-w-0 flex-1 truncate rounded-md px-2 py-1 text-left text-base font-medium leading-5 text-slate-900 transition-colors hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80 md:text-sm';
        titleLabel.dataset.habitTitleLabel = habitUuid;
        titleLabel.textContent = row.habit.title;
        titleLabel.title = row.habit.title;
        titleLabel.setAttribute('aria-label', this.i18n.t('common.edit'));
        titleLabel.addEventListener('click', () => {
          if (options.loading || options.createPending || habitPending) return;
          this.startEditingTitle(habitUuid);
        });

        titleWrap.append(titleLabel);
      }

      title.appendChild(titleWrap);
      tr.appendChild(title);

      options.days.forEach((day, index) => {
        const td = document.createElement('td');
        td.className = `h-11 px-3 text-center align-middle ${rowCellStateClass}`;
        const cellKey = this.toCellKey(habitUuid, day.key);
        const pending = options.pendingCellKeys.has(cellKey);
        const checked = rowCheckedStates[index];
        const checkboxDisabled =
          pending || options.loading || options.createPending || habitPending;

        const checkbox = new Checkbox({
          checked,
          disabled: checkboxDisabled,
          ariaLabel: `${row.habit.title} ${day.shortLabel} completion`,
          className: 'inline-flex items-center justify-center',
        });
        checkbox.onChange(() => {
          options.onToggleCell(row, day, checked);
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
        disabled: options.loading || options.createPending || habitPending,
      });
      menuButton.classList.add('text-slate-600');
      menuButton.setAttribute('aria-haspopup', 'menu');

      const menuPanel = createSurface({
        elevated: true,
        className: 'absolute left-0 top-0 z-50 hidden w-36 overflow-hidden',
      });
      menuPanel.setAttribute('role', 'menu');

      const menuController = new AnchoredMenu({
        container: actionsRow,
        panel: menuPanel,
        onOpenChange: (open) => {
          menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
          menuButton.classList.toggle('bg-indigo-50', open);
          menuButton.classList.toggle('text-indigo-700', open);
          actions.style.zIndex = open ? '40' : '';
          actionsRow.style.zIndex = open ? '50' : '';
        },
      });
      menuController.mount();
      this.rowMenuControllers.add(menuController);

      const archiveItem = createDropdownItem({
        label: this.i18n.t('common.archive'),
        onClick: () => {
          menuController.close();
          options.onArchiveHabit(row);
        },
      });
      archiveItem.setAttribute('role', 'menuitem');

      const deleteItem = createDropdownItem({
        label: this.i18n.t('common.delete'),
        variant: 'danger',
        onClick: () => {
          menuController.close();
          options.onDeleteHabit(row);
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

      this.tbody.appendChild(tr);
      streakRows.push({
        dayAnchors,
        checkedStates: rowCheckedStates,
      });
    });

    this.bindStreakOverlay(this.element, this.table, streakRows);
  }

  private startEditingTitle(habitUuid: string): void {
    if (this.editingHabitUuid === habitUuid) return;
    this.editingHabitUuid = habitUuid;
    this.focusEditHabitUuid = habitUuid;
    this.requestRender();
  }

  private requestRender(): void {
    if (!this.lastOptions) return;
    this.update(this.lastOptions);
  }

  private renderPrioritySelectorCell(
    row: HabitRowState,
    habitPending: boolean,
    options: HabitTrackerTableRenderOptions
  ): HTMLTableCellElement {
    const priorityCell = document.createElement('td');
    priorityCell.className =
      'h-11 px-2 text-center align-middle transition-colors group-hover:bg-slate-50/70 group-focus-within:bg-slate-50/90';
    const currentPriority = this.getHabitPriority(row.habit);
    const priorityControl = document.createElement('div');
    priorityControl.className = 'relative inline-flex';

    const priorityButton = createIconButton({
      icon: HABIT_PRIORITY_ICON_MAP[currentPriority],
      size: 'sm',
      iconSize: 18,
      iconClassName: HABIT_PRIORITY_ICON_TONE_CLASS[currentPriority],
      iconStrokeWidth: 1.9,
      tone: 'text',
      title: `${this.i18n.t('habits.priority')}: ${this.getPriorityLabel(currentPriority)}`,
      ariaLabel: `${this.i18n.t('habits.priority')}: ${this.getPriorityLabel(currentPriority)}`,
      disabled: options.loading || options.createPending || habitPending,
      className: 'hover:bg-slate-100',
    });
    priorityButton.dataset.habitPriorityTrigger = this.getHabitRef(row.habit);
    priorityButton.setAttribute('aria-haspopup', 'menu');
    priorityButton.setAttribute('aria-expanded', 'false');

    const priorityPanel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-50 hidden w-44 overflow-hidden',
    });
    priorityPanel.setAttribute('role', 'menu');

    const priorityController = new AnchoredMenu({
      container: priorityControl,
      panel: priorityPanel,
      onOpenChange: (open) => {
        priorityButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        priorityButton.classList.toggle('ring-2', open);
        priorityButton.classList.toggle('ring-indigo-200', open);
        priorityCell.style.zIndex = open ? '40' : '';
        priorityControl.style.zIndex = open ? '50' : '';
      },
    });
    priorityController.mount();
    this.rowMenuControllers.add(priorityController);

    HABIT_PRIORITY_ORDER.forEach((priority) => {
      const leading = document.createElement('span');
      leading.className = 'inline-flex';
      leading.appendChild(this.createPriorityIcon(priority, 13, 1.8));

      const trailing =
        currentPriority === priority
          ? document.createElement('span')
          : null;
      if (trailing) {
        trailing.className = 'inline-flex';
        trailing.appendChild(
          createIcon('check', {
            size: 14,
            strokeWidth: 2,
          })
        );
      }

      const option = createDropdownItem({
        label: this.getPriorityLabel(priority),
        active: currentPriority === priority,
        leading,
        trailing,
        onClick: () => {
          priorityController.close();
          options.onUpdatePriority(row, priority);
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
      this.closeOtherRowMenus(priorityController);
      priorityController.openAt({
        anchor: priorityButton,
        placement: 'bottom-start',
        fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
        gap: 4,
        margin: 8,
        lockPlacementAfterOpen: true,
      });
    });

    priorityControl.append(priorityButton, priorityPanel);
    priorityCell.appendChild(priorityControl);
    return priorityCell;
  }

  private getPriorityLabel(priority: UiPriority): string {
    switch (priority) {
      case 'lowest':
        return this.i18n.t('priority.lowest');
      case 'high':
        return this.i18n.t('priority.high');
      case 'highest':
        return this.i18n.t('priority.highest');
      case 'medium':
        return this.i18n.t('priority.medium');
      case 'low':
      default:
        return this.i18n.t('priority.low');
    }
  }

  private getHabitPriority(habit: Habit): UiPriority {
    return normalizeUiPriority(habit.priority, 'low');
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

  private getPrioritySortIconName(
    sortMode: HabitSortMode,
    prioritySortDirection: HabitPrioritySortDirection
  ): 'bars-2' | 'arrow-down' | 'arrow-up' {
    if (sortMode !== 'priority') return 'bars-2';
    return prioritySortDirection === 'desc' ? 'arrow-down' : 'arrow-up';
  }

  private getHabitRef(habit: Habit): string {
    return habit.uuid;
  }

  private toCellKey(habitUuid: string, dateKey: string): string {
    return `${habitUuid}:${dateKey}`;
  }

  private toLocalDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    if (typeof window === 'undefined') {
      this.renderStreakOverlay(this.element, this.streakOverlayRows);
      return;
    }
    if (this.streakOverlayRafId !== null) return;
    this.streakOverlayRafId = window.requestAnimationFrame(() => {
      this.streakOverlayRafId = null;
      if (!this.element.isConnected) return;
      this.renderStreakOverlay(this.element, this.streakOverlayRows);
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
    this.element.removeEventListener('scroll', this.handleStreakOverlayScroll);
    this.streakOverlayRows = [];
    this.element
      .querySelector('[data-routine-streak-overlay="true"]')
      ?.remove();
  }

  private bindStreakOverlay(
    tableWrap: HTMLDivElement,
    table: HTMLTableElement,
    rows: StreakRowOverlayMeta[]
  ): void {
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
}
