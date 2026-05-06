import type {
  FocusBoardCycleLength,
  FocusBoardGoalFilterOption,
  FocusBoardSnapshot,
  FocusBoardStoryFilterOption,
  FocusBoardTask,
  FocusBoardTaskContainerId,
} from '../domain/types.ts';
import { createIcon, type IconName } from '../../canvas/ui/icons.ts';
import {
  createBadge,
  createField,
  createIconButton,
  createSegmentedControl,
  createSurface,
  createTextButton,
  type SegmentedControl,
} from '../../../ui-lib/src/hud/index.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import type { AppRuntime } from '../../../app-runtime/index.ts';
import { Textarea } from '../../../ui-lib/src/components/Textarea.ts';
import { Button } from '../../../ui-lib/src/components/Button.ts';
import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';
import { Input } from '../../../ui-lib/src/components/Input.ts';
import { SearchDropdownSelect } from '../../../ui-lib/src/components/SearchDropdownSelect.ts';
import { StaticDropdownSelect } from '../../../ui-lib/src/components/StaticDropdownSelect.ts';
import { ensureFocusBoardStyles } from './focusBoardStyles.ts';
import {
  normalizeUiPriority,
  type UiPriority,
} from '../../../majom-wrapper/utils/priorityMapping.ts';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';

type FocusBoardViewOptions = {
  onToggleBacklog: () => void;
  onCloseBacklog: () => void;
  onOpenGoalModal: () => void;
  onCloseGoalModal: () => void;
  onSetGoalModalDraft: (
    goal: string,
    cycleLength: FocusBoardCycleLength
  ) => void;
  onSaveGoalAndCycle: (goal: string) => void;
  onOpenHabitDay: (dayIndex: number) => void;
  onCloseHabitDay: () => void;
  onUpdateDailyGoal: (dayIndex: number, goal: string) => void;
  onToggleTask: (
    containerId: FocusBoardTaskContainerId,
    taskId: string
  ) => void;
  onMoveTask: (
    sourceId: FocusBoardTaskContainerId,
    targetId: FocusBoardTaskContainerId,
    taskId: string
  ) => void;
  onToggleHabit: (dayIndex: number, habitId: string) => void;
  onSetBacklogSearchQuery: (query: string) => void;
  onOpenTaskPicker: () => void;
  onCloseTaskPicker: () => void;
  onSetTaskPickerQuery: (query: string) => void;
  onSetTaskPickerStatus: (status: Status | null) => void;
  onSetTaskPickerGoal: (goal: FocusBoardGoalFilterOption | null) => void;
  onSetTaskPickerStory: (story: FocusBoardStoryFilterOption | null) => void;
  onLoadMoreTaskPicker: () => void;
  onAddTaskToBacklog: (taskId: string) => void;
  searchTaskPickerGoals: (params: {
    query: string;
    page: number;
    pageSize: number;
  }) => Promise<{
    items: FocusBoardGoalFilterOption[];
    nextPage: number | null;
  }>;
  searchTaskPickerStories: (params: {
    query: string;
    page: number;
    pageSize: number;
    goalId: number | null;
  }) => Promise<{
    items: FocusBoardStoryFilterOption[];
    nextPage: number | null;
  }>;
  onOpenTaskComposer: (target: FocusBoardTaskContainerId) => void;
  onCloseTaskComposer: () => void;
  onSetTaskComposerTitle: (title: string) => void;
  onSubmitTaskComposer: () => void;
  onOpenWallpaperPicker: () => void;
  onUpdateCycleGoal: (goal: string) => void;
};

type DragPayload = {
  taskId: string;
  sourceId: FocusBoardTaskContainerId;
};

type TaskPickerStatusOption = {
  id: Status | 'all';
  label: string;
};

type TaskPickerAllGoalOption = {
  id: 'all-goals';
  title: string;
};

type TaskPickerAllStoryOption = {
  id: 'all-stories';
  title: string;
  goalId: null;
};

type TaskPickerGoalSelectOption =
  | FocusBoardGoalFilterOption
  | TaskPickerAllGoalOption;

type TaskPickerStorySelectOption =
  | FocusBoardStoryFilterOption
  | TaskPickerAllStoryOption;

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
  highest: 'chevron-double-up',
  high: 'chevron-up',
  medium: 'bars-2',
  low: 'chevron-down',
  lowest: 'chevron-double-down',
};
const HABIT_PRIORITY_ICON_TONE_CLASS: Record<UiPriority, string> = {
  highest: 'text-red-500',
  high: 'text-red-500',
  medium: 'text-orange-500',
  low: 'text-sky-500',
  lowest: 'text-sky-500',
};

const TASK_PICKER_ALL_STATUS_OPTION: TaskPickerStatusOption = {
  id: 'all',
  label: 'Усі статуси',
};

const TASK_PICKER_STATUS_OPTIONS: readonly TaskPickerStatusOption[] = [
  TASK_PICKER_ALL_STATUS_OPTION,
  { id: Status.Completed, label: 'Завершена' },
  { id: Status.Active, label: 'Активна' },
  { id: Status.Described, label: 'Описано' },
  { id: Status.Draft, label: 'Чернетка' },
  { id: Status.Archived, label: 'Архівна' },
  { id: Status.Cancelled, label: 'Скасована' },
];

const TASK_PICKER_ALL_GOALS_OPTION: TaskPickerAllGoalOption = {
  id: 'all-goals',
  title: 'Усі цілі',
};

const TASK_PICKER_ALL_STORIES_OPTION: TaskPickerAllStoryOption = {
  id: 'all-stories',
  title: 'Усі сценарії',
  goalId: null,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseContainerId(
  raw: string | undefined
): FocusBoardTaskContainerId | null {
  if (!raw) return null;
  if (raw === 'backlog') return 'backlog';
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function getHabitPriorityLabel(priority: UiPriority): string {
  switch (priority) {
    case 'highest':
      return 'Найвищий';
    case 'high':
      return 'Високий';
    case 'medium':
      return 'Середній';
    case 'lowest':
      return 'Найнижчий';
    case 'low':
    default:
      return 'Низький';
  }
}

function createHabitPriorityIcon(priority: UiPriority): SVGElement {
  const icon = createIcon(HABIT_PRIORITY_ICON_MAP[priority], {
    size: 14,
    strokeWidth: 1.9,
  });
  icon.classList.add('shrink-0', HABIT_PRIORITY_ICON_TONE_CLASS[priority]);
  icon.setAttribute('aria-hidden', 'true');
  return icon;
}

function getTaskPickerStatusOption(
  status: Status | null
): TaskPickerStatusOption {
  return (
    TASK_PICKER_STATUS_OPTIONS.find(
      (option) => option.id === (status ?? 'all')
    ) ?? TASK_PICKER_ALL_STATUS_OPTION
  );
}

function getCycleLengthLabel(cycleLength: FocusBoardCycleLength): string {
  return cycleLength <= 4
    ? `Цикл: ${cycleLength} дні`
    : `Цикл: ${cycleLength} днів`;
}

export class FocusBoardView {
  private snapshot: FocusBoardSnapshot | null = null;
  private draggedTask: DragPayload | null = null;
  private goalModalOverlay: HTMLDivElement | null = null;
  private goalModalTextarea: Textarea | null = null;
  private goalModalCycleControl: SegmentedControl<FocusBoardCycleLength> | null =
    null;
  private habitDayModalOverlay: HTMLDivElement | null = null;
  private habitDayModalBody: HTMLDivElement | null = null;
  private habitDayModalSubtitle: HTMLParagraphElement | null = null;
  private taskPickerModalOverlay: HTMLDivElement | null = null;
  private taskPickerSearchInput: Input | null = null;
  private taskPickerStatusSelect: StaticDropdownSelect<TaskPickerStatusOption> | null =
    null;
  private taskPickerGoalSelect: SearchDropdownSelect<TaskPickerGoalSelectOption> | null =
    null;
  private taskPickerStorySelect: SearchDropdownSelect<TaskPickerStorySelectOption> | null =
    null;
  private taskPickerList: HTMLDivElement | null = null;
  private taskPickerListScrollHandler: ((event: Event) => void) | null = null;
  private taskComposerModalOverlay: HTMLDivElement | null = null;
  private taskComposerInput: Input | null = null;
  private taskComposerErrorText: HTMLParagraphElement | null = null;
  private taskComposerSubmitButton: HTMLButtonElement | null = null;
  private restoreBacklogSearchFocus = false;
  private readonly runtime: AppRuntime;

  private readonly clickHandler = (event: MouseEvent) =>
    this.handleClick(event);
  private readonly keydownHandler = (event: KeyboardEvent) =>
    this.handleKeydown(event);
  private readonly focusoutHandler = (event: FocusEvent) =>
    this.handleFocusOut(event);
  private readonly dragstartHandler = (event: DragEvent) =>
    this.handleDragStart(event);
  private readonly dragendHandler = (event: DragEvent) =>
    this.handleDragEnd(event);
  private readonly dragoverHandler = (event: DragEvent) =>
    this.handleDragOver(event);
  private readonly dragleaveHandler = (event: DragEvent) =>
    this.handleDragLeave(event);
  private readonly dropHandler = (event: DragEvent) => this.handleDrop(event);

  constructor(
    private readonly root: HTMLElement,
    private readonly options: FocusBoardViewOptions,
    runtime: AppRuntime
  ) {
    this.runtime = runtime;
    ensureFocusBoardStyles();
    this.root.id = 'focus-board-root';
    this.root.dataset.module = 'focus-board';
    this.root.addEventListener('click', this.clickHandler);
    this.root.addEventListener('keydown', this.keydownHandler);
    this.root.addEventListener('focusout', this.focusoutHandler);
    this.root.addEventListener('dragstart', this.dragstartHandler);
    this.root.addEventListener('dragend', this.dragendHandler);
    this.root.addEventListener('dragover', this.dragoverHandler);
    this.root.addEventListener('dragleave', this.dragleaveHandler);
    this.root.addEventListener('drop', this.dropHandler);
  }

  public render(state: FocusBoardSnapshot): void {
    this.snapshot = state;
    const visibleBacklog = this.filterBacklogTasks(
      state.backlog,
      state.backlogSearchQuery
    );
    this.root.innerHTML = `
      <div class="fb-page">
        <header class="fb-header" data-focus-board-header-root="true"></header>

        <main class="fb-board-main">
          ${
            state.hasActiveCycle
              ? `
          <div class="fb-board-scroll custom-scrollbar">
            <div class="fb-board-row">
              ${Array.from({ length: state.cycleLength }, (_, index) =>
                this.renderDayColumn(state, index + 1)
              ).join('')}
            </div>
          </div>
          `
              : this.renderEmptyCycleState()
          }
        </main>

        <button
          type="button"
          class="fb-backlog-backdrop"
          data-open="${state.backlogOpen}"
          data-action="close-backlog"
          aria-label="Закрити беклог"
        ></button>

        <aside class="fb-backlog-sidebar" data-open="${state.backlogOpen}">
          <div class="fb-side-header">
            <p class="fb-side-title">Беклог</p>
            <div class="fb-side-header-actions" data-backlog-header-actions-root="true"></div>
          </div>
          <div
            class="fb-backlog-search"
            data-backlog-search-root="true"
            data-backlog-search-value="${escapeHtml(state.backlogSearchQuery)}"
          >
          </div>
          <div
            class="fb-backlog-list custom-scrollbar"
            data-drop-target="backlog"
            data-drag-over="false"
          >
            ${
              visibleBacklog.length > 0
                ? visibleBacklog
                    .map((task) => this.renderTaskCard(task, 'backlog'))
                    .join('')
                : `<p class="fb-empty-state">${
                    state.backlogSearchQuery.trim().length > 0
                      ? 'Нічого не знайдено у беклозі.'
                      : 'Беклог порожній.'
                  }</p>`
            }
          </div>
          <div class="fb-backlog-footer" data-backlog-create-root="true"></div>
        </aside>
      </div>
    `;
    this.syncGoalModal(state);
    this.syncHabitDayModal(state);
    this.syncTaskPickerModal(state);
    this.syncTaskComposerModal(state);
    this.hydrateHeader(state);
    this.hydrateUiLibPrimitives();
    this.populateIcons();
  }

  public destroy(): void {
    this.root.removeEventListener('click', this.clickHandler);
    this.root.removeEventListener('keydown', this.keydownHandler);
    this.root.removeEventListener('focusout', this.focusoutHandler);
    this.root.removeEventListener('dragstart', this.dragstartHandler);
    this.root.removeEventListener('dragend', this.dragendHandler);
    this.root.removeEventListener('dragover', this.dragoverHandler);
    this.root.removeEventListener('dragleave', this.dragleaveHandler);
    this.root.removeEventListener('drop', this.dropHandler);
    this.closeNativeGoalModal();
    this.closeNativeHabitDayModal();
    this.closeNativeTaskPickerModal();
    this.closeNativeTaskComposerModal();
    this.root.innerHTML = '';
    this.snapshot = null;
  }

  private renderDayColumn(state: FocusBoardSnapshot, dayIndex: number): string {
    const dayTasks = state.days[dayIndex] ?? [];
    const focusTask = dayTasks.find((task) => task.isFocus) ?? null;
    const otherTasks = dayTasks.filter((task) => !task.isFocus);
    const doneHabits = this.getHabitDoneCount(state, dayIndex);
    const date = this.formatDate(dayIndex);
    const isToday =
      this.dateKeyFromOffset(state.cycleStartDateKey, dayIndex - 1) ===
      this.dateKeyFromDate(new Date());
    const openTaskCount = dayTasks.filter((task) => !task.completed).length;
    const dailyGoal = state.dailyGoals[dayIndex] ?? '';

    return `
      <section class="fb-day-column" data-today="${isToday}">
        <div class="fb-day-header">
          <div>
            <p class="fb-day-kicker">День ${dayIndex}</p>
            <h3 class="fb-day-date">${escapeHtml(date)}</h3>
          </div>
          <span data-day-count-badge="${openTaskCount}"></span>
        </div>

        <div
          class="fb-day-goal-wrap"
          data-day-goal-root="${dayIndex}"
          data-day-goal-value="${escapeHtml(dailyGoal)}"
        >
        </div>

        <button
          type="button"
          class="fb-habit-stack"
          data-action="open-habit-day"
          data-day-index="${dayIndex}"
        >
          <div class="fb-habit-stack-copy">
            <span class="fb-habit-stack-label">Звички</span>
            <div class="fb-habit-stack-row">
              <div class="fb-habit-stack-icons">
                ${state.habits
                  .slice(0, 4)
                  .map((habit) =>
                    this.renderHabitMini(
                      habit,
                      Boolean(state.habitChecks[dayIndex]?.[habit.id])
                    )
                  )
                  .join('')}
              </div>
              <span class="fb-habit-stack-stats">${doneHabits}/${state.habits.length}</span>
            </div>
          </div>
          <span class="fb-chevron">></span>
        </button>

        <div class="fb-focus-zone">
          ${focusTask ? this.renderTaskCard(focusTask, dayIndex, true) : ''}
        </div>

        <div
          class="fb-task-list custom-scrollbar"
          data-drop-target="${dayIndex}"
          data-drag-over="false"
        >
          ${
            otherTasks.length > 0
              ? otherTasks
                  .map((task) => this.renderTaskCard(task, dayIndex))
                  .join('')
              : '<p class="fb-column-hint">Перетягни сюди задачу з іншого дня або з беклогу.</p>'
          }
        </div>

        <div class="fb-day-footer" data-day-create-task-root="${dayIndex}"></div>
      </section>
    `;
  }

  private renderTaskCard(
    task: FocusBoardTask,
    containerId: FocusBoardTaskContainerId,
    isFocus = false
  ): string {
    const listId = String(containerId);
    return `
      <article
        class="fb-task-card ${isFocus ? 'fb-task-card-focus' : ''} ${
          task.completed ? 'fb-task-card-done' : ''
        }"
        draggable="true"
        data-task-id="${task.id}"
        data-list-id="${listId}"
      >
        <span
          class="fb-task-toggle-slot"
          data-task-toggle-root="true"
          data-task-id="${task.id}"
          data-list-id="${listId}"
          data-task-completed="${task.completed}"
        >
        </span>
        <div class="fb-task-content">
          <p class="fb-task-text">${escapeHtml(task.text)}</p>
        </div>
      </article>
    `;
  }

  private renderHabitMini(
    habit: FocusBoardSnapshot['habits'][number],
    checked: boolean
  ): string {
    return `
      <span
        class="fb-habit-mini"
        style="--habit-accent: ${habit.accent};"
        data-checked="${checked}"
      >
        ${escapeHtml(habit.badge)}
      </span>
    `;
  }

  private renderEmptyCycleState(): string {
    return `
      <section class="fb-empty-cycle-state">
        <div data-empty-cycle-root="true"></div>
      </section>
    `;
  }

  private filterBacklogTasks(
    tasks: FocusBoardTask[],
    query: string
  ): FocusBoardTask[] {
    const normalized = query.trim().toLocaleLowerCase('uk-UA');
    if (normalized.length === 0) return tasks;
    return tasks.filter((task) =>
      task.text.toLocaleLowerCase('uk-UA').includes(normalized)
    );
  }

  private findTaskPlacement(
    state: FocusBoardSnapshot,
    taskId: string
  ): { inBacklog: boolean; dayIndex: number | null } {
    if (state.backlog.some((task) => task.id === taskId)) {
      return { inBacklog: true, dayIndex: null };
    }

    for (const [dayKey, tasks] of Object.entries(state.days)) {
      if (tasks.some((task) => task.id === taskId)) {
        return { inBacklog: false, dayIndex: Number(dayKey) };
      }
    }

    return { inBacklog: false, dayIndex: null };
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const actionElement = target.closest<HTMLElement>('[data-action]');
    if (!actionElement) return;

    const action = actionElement.dataset.action;
    if (!action) return;

    switch (action) {
      case 'toggle-backlog':
        this.options.onToggleBacklog();
        return;
      case 'close-backlog':
        this.options.onCloseBacklog();
        return;
      case 'open-goal-modal':
        this.options.onOpenGoalModal();
        return;
      case 'open-wallpaper-picker':
        this.options.onOpenWallpaperPicker();
        return;
      case 'open-habit-day': {
        const dayIndex = Number(actionElement.dataset.dayIndex);
        if (!Number.isInteger(dayIndex) || dayIndex < 1) return;
        this.options.onOpenHabitDay(dayIndex);
        return;
      }
      default:
        return;
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    void event;
  }

  private handleFocusOut(event: FocusEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (
      target instanceof HTMLTextAreaElement &&
      target.matches('[data-day-goal-index]')
    ) {
      const dayIndex = Number(target.dataset.dayGoalIndex);
      if (!Number.isInteger(dayIndex) || dayIndex < 1) return;
      this.options.onUpdateDailyGoal(dayIndex, target.value.trim());
    }
  }

  private handleDragStart(event: DragEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const taskCard = target.closest<HTMLElement>(
      '[data-task-id][data-list-id]'
    );
    if (!taskCard) return;

    const taskId = taskCard.dataset.taskId;
    const sourceId = parseContainerId(taskCard.dataset.listId);
    if (!taskId || sourceId === null) return;

    this.draggedTask = { taskId, sourceId };
    taskCard.dataset.dragging = 'true';
    event.dataTransfer?.setData('text/plain', taskId);
    event.dataTransfer?.setDragImage(taskCard, 16, 16);
  }

  private handleDragEnd(event: DragEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement) {
      const taskCard = target.closest<HTMLElement>(
        '[data-task-id][data-list-id]'
      );
      if (taskCard) {
        taskCard.dataset.dragging = 'false';
      }
    }
    this.draggedTask = null;
    this.clearDropTargets();
  }

  private handleDragOver(event: DragEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dropZone = target.closest<HTMLElement>('[data-drop-target]');
    if (!dropZone || !this.draggedTask) return;
    event.preventDefault();
    dropZone.dataset.dragOver = 'true';
  }

  private handleDragLeave(event: DragEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dropZone = target.closest<HTMLElement>('[data-drop-target]');
    if (!dropZone) return;
    dropZone.dataset.dragOver = 'false';
  }

  private handleDrop(event: DragEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const dropZone = target.closest<HTMLElement>('[data-drop-target]');
    if (!dropZone || !this.draggedTask) return;
    event.preventDefault();
    const targetId = parseContainerId(dropZone.dataset.dropTarget);
    dropZone.dataset.dragOver = 'false';
    if (targetId === null) return;
    this.options.onMoveTask(
      this.draggedTask.sourceId,
      targetId,
      this.draggedTask.taskId
    );
    this.draggedTask = null;
  }

  private clearDropTargets(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-drop-target]')
      .forEach((zone) => {
        zone.dataset.dragOver = 'false';
      });
  }

  private getHabitDoneCount(
    state: FocusBoardSnapshot,
    dayIndex: number
  ): number {
    const checks = state.habitChecks[dayIndex] ?? {};
    return Object.values(checks).filter(Boolean).length;
  }

  private formatDate(dayIndex: number): string {
    const snapshot = this.snapshot;
    const cycleStartDateKey = snapshot?.cycleStartDateKey;
    const date = cycleStartDateKey
      ? this.dateFromDateKey(cycleStartDateKey, dayIndex - 1)
      : new Date();
    return this.runtime.i18n.formatDate(date, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  private dateFromDateKey(dateKey: string, offsetDays = 0): Date {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12);
    date.setDate(date.getDate() + offsetDays);
    return date;
  }

  private dateKeyFromDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private dateKeyFromOffset(dateKey: string, offsetDays = 0): string {
    return this.dateKeyFromDate(this.dateFromDateKey(dateKey, offsetDays));
  }

  private hydrateHeader(state: FocusBoardSnapshot): void {
    const header = this.root.querySelector<HTMLElement>(
      '[data-focus-board-header-root]'
    );
    if (!header) return;

    const cycleSurface = createSurface({
      className: 'inline-flex items-center p-1.5',
    });
    const goalSurface = createSurface({
      className: 'fb-goal-surface inline-flex min-w-0 items-center gap-2 p-1.5',
    });
    const wallpaperSurface = createSurface({
      className: 'fb-wallpaper-surface inline-flex items-center p-1.5',
    });
    const backlogSurface = createSurface({
      className: 'inline-flex items-center p-1.5',
    });

    const cycleButton = createTextButton({
      tone: 'text',
      size: 'lg',
      text: getCycleLengthLabel(state.cycleLength),
      title: 'Налаштування циклу',
      ariaLabel: 'Налаштування циклу',
    });
    cycleButton.dataset.action = 'open-goal-modal';
    const cycleIcon = createIcon('cog-6-tooth', { size: 16, strokeWidth: 1.8 });
    cycleIcon.setAttribute('aria-hidden', 'true');
    cycleButton.append(cycleIcon);

    const goalIcon = createIcon('star', { size: 16, strokeWidth: 1.8 });
    goalIcon.setAttribute('aria-hidden', 'true');
    const goalInput = new Input({
      value: state.goal,
      placeholder: 'Головна мета циклу...',
      variant: 'inline',
      className: 'min-w-0',
    }).getElement() as HTMLInputElement;
    goalInput.dataset.role = 'focus-board-cycle-goal-input';
    goalInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      this.commitHeaderGoalInput(goalInput);
      goalInput.blur();
    });
    goalInput.addEventListener('blur', () => {
      this.commitHeaderGoalInput(goalInput);
    });
    goalSurface.append(goalIcon, goalInput);

    const wallpaperButton = createIconButton({
      icon: 'palette',
      size: 'lg',
      tone: 'text',
      title: this.runtime.i18n.t('profileSettings.appearance.change'),
      ariaLabel: this.runtime.i18n.t('profileSettings.appearance.change'),
    });
    wallpaperButton.dataset.action = 'open-wallpaper-picker';

    const backlogButton = createTextButton({
      tone: 'text',
      size: 'lg',
      text: 'Беклог',
      title: 'Беклог',
    });
    backlogButton.dataset.action = 'toggle-backlog';
    const backlogIcon = createIcon('inbox', { size: 16, strokeWidth: 1.8 });
    backlogIcon.setAttribute('aria-hidden', 'true');
    const backlogBadge = createBadge({
      label: String(state.backlog.length),
      tone: 'accent',
    });
    backlogButton.prepend(backlogIcon);
    backlogButton.append(backlogBadge);

    cycleSurface.appendChild(cycleButton);
    wallpaperSurface.appendChild(wallpaperButton);
    backlogSurface.appendChild(backlogButton);
    header.replaceChildren(
      cycleSurface,
      goalSurface,
      wallpaperSurface,
      backlogSurface
    );
  }

  private commitHeaderGoalInput(input: HTMLInputElement): void {
    const nextGoal = input.value.trim();
    const currentGoal = this.snapshot?.goal ?? '';
    if (nextGoal === currentGoal) return;
    this.options.onUpdateCycleGoal(nextGoal);
  }

  private populateIcons(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-icon-name]')
      .forEach((node) => {
        const iconName = node.dataset.iconName as IconName | undefined;
        if (!iconName) return;
        node.replaceChildren(
          createIcon(iconName, { size: 16, strokeWidth: 1.5 })
        );
      });
  }

  private hydrateUiLibPrimitives(): void {
    this.hydrateEmptyCycleState();
    this.hydrateDayCountBadges();
    this.hydrateTextareas();
    this.hydrateTaskCheckboxes();
    this.hydrateDayCreateButtons();
    this.hydrateBacklogHeaderActions();
    this.hydrateBacklogSearch();
    this.hydrateBacklogCreateButton();
  }

  private hydrateEmptyCycleState(): void {
    const slot = this.root.querySelector<HTMLElement>(
      '[data-empty-cycle-root]'
    );
    if (!slot) return;

    const surface = createSurface({
      className:
        'mx-auto flex w-full max-w-[32.5rem] flex-col items-start gap-3 rounded-[1.75rem] px-7 py-7',
    });

    const kicker = document.createElement('p');
    kicker.className = 'fb-empty-cycle-kicker';
    kicker.textContent = 'Focus Board';

    const title = document.createElement('h2');
    title.className = 'fb-empty-cycle-title';
    title.textContent = 'Немає активного циклу';

    const text = document.createElement('p');
    text.className = 'fb-empty-cycle-text';
    text.textContent =
      'Створи цикл на 3-7 днів, щоб розкласти задачі з беклогу по днях.';

    const button = new Button({
      text: 'Створити цикл',
      variant: 'default',
      className: 'mt-2 min-w-[11.25rem]',
      onClick: () => this.options.onOpenGoalModal(),
    }).getElement();

    surface.append(kicker, title, text, button);
    slot.replaceChildren(surface);
  }

  private hydrateDayCountBadges(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-day-count-badge]')
      .forEach((slot) => {
        const label = slot.dataset.dayCountBadge ?? '0';
        const badge = createBadge({
          label,
          tone: 'neutral',
        });
        slot.replaceWith(badge);
      });
  }

  private hydrateTextareas(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-day-goal-root]')
      .forEach((slot) => {
        const dayIndex = Number(slot.dataset.dayGoalRoot);
        if (!Number.isInteger(dayIndex) || dayIndex < 1) return;

        const textarea = new Textarea({
          value: slot.dataset.dayGoalValue ?? '',
          placeholder: 'Гра дня...',
          rows: 2,
          variant: 'inline',
          className: 'min-h-[56px]',
        }).getElement() as HTMLTextAreaElement;
        textarea.dataset.dayGoalIndex = String(dayIndex);
        slot.replaceChildren(textarea);
      });
  }

  private hydrateTaskCheckboxes(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-task-toggle-root]')
      .forEach((slot) => {
        const taskId = slot.dataset.taskId;
        const containerId = parseContainerId(slot.dataset.listId);
        if (!taskId || containerId === null) return;

        const checkbox = new Checkbox({
          checked: slot.dataset.taskCompleted === 'true',
          ariaLabel: 'Перемкнути статус задачі',
          stopPropagation: true,
          className: 'fb-task-checkbox',
          onChange: () => this.options.onToggleTask(containerId, taskId),
        }).getElement();
        slot.replaceChildren(checkbox);
      });
  }

  private hydrateDayCreateButtons(): void {
    this.root
      .querySelectorAll<HTMLElement>('[data-day-create-task-root]')
      .forEach((slot) => {
        const dayIndex = Number(slot.dataset.dayCreateTaskRoot);
        if (!Number.isInteger(dayIndex) || dayIndex < 1) return;

        const button = new Button({
          text: 'Нова задача',
          variant: 'outline',
          className: 'w-full',
          onClick: () => this.options.onOpenTaskComposer(dayIndex),
        }).getElement();
        slot.replaceChildren(button);
      });
  }

  private hydrateBacklogHeaderActions(): void {
    const slot = this.root.querySelector<HTMLElement>(
      '[data-backlog-header-actions-root]'
    );
    if (!slot) return;

    const pickerButton = createIconButton({
      icon: 'circle-stack',
      size: 'lg',
      tone: 'text',
      title: 'Додати існуючу задачу',
      ariaLabel: 'Додати існуючу задачу',
      onClick: () => this.options.onOpenTaskPicker(),
    });
    const closeButton = createIconButton({
      icon: 'x-mark',
      size: 'lg',
      tone: 'text',
      title: 'Закрити беклог',
      ariaLabel: 'Закрити беклог',
      onClick: () => this.options.onCloseBacklog(),
    });

    slot.replaceChildren(pickerButton, closeButton);
  }

  private hydrateBacklogSearch(): void {
    const slot = this.root.querySelector<HTMLElement>(
      '[data-backlog-search-root]'
    );
    if (!slot) return;

    const input = new Input({
      value: slot.dataset.backlogSearchValue ?? '',
      placeholder: 'Пошук у беклозі...',
      onInput: (value) => {
        this.restoreBacklogSearchFocus = true;
        this.options.onSetBacklogSearchQuery(value);
      },
    }).getElement() as HTMLInputElement;
    input.dataset.focusBoardBacklogSearch = 'true';
    slot.replaceChildren(input);

    if (this.restoreBacklogSearchFocus) {
      this.restoreBacklogSearchFocus = false;
      window.requestAnimationFrame(() => {
        input.focus();
        const end = input.value.length;
        input.setSelectionRange(end, end);
      });
    }
  }

  private hydrateBacklogCreateButton(): void {
    const slot = this.root.querySelector<HTMLElement>(
      '[data-backlog-create-root]'
    );
    if (!slot) return;

    const button = new Button({
      text: 'Створити',
      variant: 'lightgray',
      className: 'w-full',
      onClick: () => this.options.onOpenTaskComposer('backlog'),
    }).getElement();
    slot.replaceChildren(button);
  }

  private syncGoalModal(state: FocusBoardSnapshot): void {
    if (!state.goalModalOpen) {
      this.closeNativeGoalModal();
      return;
    }

    if (!this.goalModalOverlay) {
      this.openNativeGoalModal(state);
      return;
    }

    if (
      this.goalModalTextarea &&
      this.goalModalTextarea.getValue() !== state.tempGoal
    ) {
      this.goalModalTextarea.setValue(state.tempGoal);
    }
    if (
      this.goalModalCycleControl &&
      this.goalModalCycleControl.getValue() !== state.tempCycleLength
    ) {
      this.goalModalCycleControl.setValue(state.tempCycleLength);
    }
  }

  private syncHabitDayModal(state: FocusBoardSnapshot): void {
    if (state.activeHabitDay === null) {
      this.closeNativeHabitDayModal();
      return;
    }

    if (!this.habitDayModalOverlay) {
      this.openNativeHabitDayModal(state, state.activeHabitDay);
      return;
    }

    this.renderNativeHabitDayContent(state, state.activeHabitDay);
  }

  private syncTaskPickerModal(state: FocusBoardSnapshot): void {
    if (!state.taskPicker.open) {
      this.closeNativeTaskPickerModal();
      return;
    }

    if (!this.taskPickerModalOverlay) {
      this.openNativeTaskPickerModal(state);
      return;
    }

    if (
      this.taskPickerSearchInput &&
      this.taskPickerSearchInput.getValue() !== state.taskPicker.query
    ) {
      this.taskPickerSearchInput.setValue(state.taskPicker.query);
    }
    this.taskPickerStatusSelect?.setSelected(
      getTaskPickerStatusOption(state.taskPicker.status)
    );
    this.taskPickerGoalSelect?.setSelected(
      state.taskPicker.goal ?? TASK_PICKER_ALL_GOALS_OPTION
    );
    this.taskPickerStorySelect?.setSelected(
      state.taskPicker.story ?? TASK_PICKER_ALL_STORIES_OPTION
    );

    this.renderNativeTaskPickerContent(state);
  }

  private syncTaskComposerModal(state: FocusBoardSnapshot): void {
    if (!state.taskComposer.open) {
      this.closeNativeTaskComposerModal();
      return;
    }

    if (!this.taskComposerModalOverlay) {
      this.openNativeTaskComposerModal(state);
      return;
    }

    if (
      this.taskComposerInput &&
      this.taskComposerInput.getValue() !== state.taskComposer.title
    ) {
      this.taskComposerInput.setValue(state.taskComposer.title);
    }

    if (this.taskComposerErrorText) {
      this.taskComposerErrorText.textContent = state.taskComposer.error ?? '';
      this.taskComposerErrorText.hidden = !state.taskComposer.error;
    }

    if (this.taskComposerSubmitButton) {
      this.taskComposerSubmitButton.textContent = state.taskComposer.saving
        ? 'Створення...'
        : 'Створити';
      this.taskComposerSubmitButton.disabled = state.taskComposer.saving;
    }
  }

  private openNativeGoalModal(state: FocusBoardSnapshot): void {
    this.closeNativeGoalModal();

    const { overlay, container, body, footer } = createModalShell(
      'Налаштування циклу',
      {
        subtitle: 'Задай загальну мету і горизонт планування.',
        onClose: () => this.options.onCloseGoalModal(),
        intent: 'form',
        zIndex: 260,
      }
    );

    overlay.dataset.role = 'focus-board-goal-modal';
    container.dataset.role = 'focus-board-goal-modal-container';
    container.style.width = 'min(38rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(38rem, calc(100vw - 2rem))';
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
    });

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-5';

    const goalTextarea = new Textarea({
      value: state.tempGoal,
      placeholder: 'Чого ти хочеш досягти за ці дні?',
      rows: 4,
      id: 'fb-goal-modal-input',
      onInput: (value) => {
        this.options.onSetGoalModalDraft(
          value,
          this.goalModalCycleControl?.getValue() ?? state.tempCycleLength
        );
      },
    });
    this.goalModalTextarea = goalTextarea;

    const goalField = createField({
      label: 'Мета на весь цикл',
      className: 'mb-0',
      control: goalTextarea.getElement(),
    });
    content.appendChild(goalField.element);

    const cycleControl = createSegmentedControl<FocusBoardCycleLength>({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Тривалість циклу',
      value: state.tempCycleLength,
      options: state.cycleLengthOptions.map((length) => ({
        id: `focus-board-cycle-${length}`,
        value: length,
        label: `${length} дн`,
        title: `${length} днів у циклі`,
      })),
      onChange: (value) => {
        this.options.onSetGoalModalDraft(
          this.goalModalTextarea?.getValue() ?? '',
          value
        );
      },
    });
    this.goalModalCycleControl = cycleControl;

    const cycleField = createField({
      label: 'Тривалість циклу',
      className: 'mb-0',
      control: cycleControl.element,
    });
    content.appendChild(cycleField.element);

    body.appendChild(content);

    const actions = createModalActionRow({ variant: 'form' });
    const cancelButton = new Button({
      text: 'Скасувати',
      variant: 'outline',
      className: getModalActionButtonClass('default'),
      onClick: () => this.options.onCloseGoalModal(),
    }).getElement();
    const saveButton = new Button({
      text: 'Зберегти',
      variant: 'default',
      className: getModalActionButtonClass('wide'),
      onClick: () =>
        this.options.onSaveGoalAndCycle(
          this.goalModalTextarea?.getValue() ?? ''
        ),
    }).getElement();
    actions.append(cancelButton, saveButton);
    footer.appendChild(actions);

    this.goalModalOverlay = overlay;
  }

  private closeNativeGoalModal(): void {
    this.goalModalCycleControl?.destroy();
    this.goalModalCycleControl = null;
    this.goalModalTextarea = null;
    this.goalModalOverlay?.remove();
    this.goalModalOverlay = null;
  }

  private openNativeHabitDayModal(
    state: FocusBoardSnapshot,
    dayIndex: number
  ): void {
    this.closeNativeHabitDayModal();

    const { overlay, container, header, body, footer } = createModalShell(
      'Звички дня',
      {
        onClose: () => this.options.onCloseHabitDay(),
        intent: 'form',
        presentation: 'bottom-sheet',
        zIndex: 265,
      }
    );

    overlay.dataset.role = 'focus-board-habit-day-modal';
    container.dataset.role = 'focus-board-habit-day-modal-container';
    container.style.width = 'min(42rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(42rem, calc(100vw - 2rem))';
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      event.stopPropagation();
    });

    const subtitle = document.createElement('p');
    subtitle.className = 'mt-1 text-sm leading-5 text-slate-500';
    this.habitDayModalSubtitle = subtitle;
    header.appendChild(subtitle);

    body.className = 'min-h-0 flex-1 overflow-y-auto';
    this.habitDayModalBody = body;

    const actions = createModalActionRow({ variant: 'form' });
    const doneButton = new Button({
      text: 'Готово',
      variant: 'default',
      className: getModalActionButtonClass('wide'),
      onClick: () => this.options.onCloseHabitDay(),
    }).getElement();
    actions.append(doneButton);
    footer.appendChild(actions);

    this.habitDayModalOverlay = overlay;
    this.renderNativeHabitDayContent(state, dayIndex);
  }

  private renderNativeHabitDayContent(
    state: FocusBoardSnapshot,
    dayIndex: number
  ): void {
    if (!this.habitDayModalBody) return;

    const doneCount = this.getHabitDoneCount(state, dayIndex);
    if (this.habitDayModalSubtitle) {
      this.habitDayModalSubtitle.textContent = `${doneCount} з ${state.habits.length} виконано`;
    }

    this.habitDayModalBody.replaceChildren();

    const list = document.createElement('div');
    list.className = 'flex flex-col px-4 py-4 md:px-6 md:py-5';

    this.buildHabitPriorityGroups(state).forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        const divider = document.createElement('div');
        divider.className = 'my-2 border-t border-slate-200/80';
        list.appendChild(divider);
      }

      const section = document.createElement('section');
      section.className = 'flex flex-col';

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2 px-3 py-1';
      header.appendChild(createHabitPriorityIcon(group.priority));

      const label = document.createElement('p');
      label.className =
        'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500';
      label.textContent = getHabitPriorityLabel(group.priority);
      header.appendChild(label);
      section.appendChild(header);

      const rowsWrap = document.createElement('div');
      rowsWrap.className = 'flex flex-wrap gap-1';

      group.habits.forEach((habit) => {
        const checked = Boolean(state.habitChecks[dayIndex]?.[habit.id]);
        const row = document.createElement('button');
        row.type = 'button';
        row.className =
          'flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100/80 sm:basis-[calc(50%-0.125rem)] sm:flex-1';
        row.dataset.role = 'focus-board-habit-day-row';
        row.dataset.priority = habit.priority;

        const checkbox = new Checkbox({
          checked,
          ariaLabel: `Позначити звичку ${habit.text}`,
          stopPropagation: true,
          onChange: () => this.options.onToggleHabit(dayIndex, habit.id),
        }).getElement();

        const badge = createBadge({
          label: habit.badge,
          tone: checked ? 'accent' : 'neutral',
        });
        badge.style.flexShrink = '0';

        const text = document.createElement('span');
        text.className = 'min-w-0 text-sm font-medium leading-5 text-slate-700';
        text.textContent = habit.text;

        row.append(checkbox, badge, text);
        row.addEventListener('click', () => {
          this.options.onToggleHabit(dayIndex, habit.id);
        });
        rowsWrap.appendChild(row);
      });

      section.appendChild(rowsWrap);
      list.appendChild(section);
    });

    this.habitDayModalBody.appendChild(list);
  }

  private buildHabitPriorityGroups(
    state: FocusBoardSnapshot
  ): Array<{ priority: UiPriority; habits: FocusBoardSnapshot['habits'] }> {
    const groups = new Map<UiPriority, FocusBoardSnapshot['habits']>();
    HABIT_PRIORITY_GROUP_ORDER.forEach((priority) => groups.set(priority, []));

    state.habits.forEach((habit) => {
      const priority = normalizeUiPriority(habit.priority, 'low');
      const entries = groups.get(priority);
      if (!entries) return;
      entries.push(habit);
    });

    return HABIT_PRIORITY_GROUP_ORDER.map((priority) => ({
      priority,
      habits: [...(groups.get(priority) ?? [])].sort((left, right) =>
        left.text.localeCompare(right.text)
      ),
    })).filter((group) => group.habits.length > 0);
  }

  private closeNativeHabitDayModal(): void {
    this.habitDayModalBody = null;
    this.habitDayModalSubtitle = null;
    this.habitDayModalOverlay?.remove();
    this.habitDayModalOverlay = null;
  }

  private openNativeTaskPickerModal(state: FocusBoardSnapshot): void {
    this.closeNativeTaskPickerModal();

    const { overlay, container, body } = createModalShell('Усі задачі', {
      subtitle: 'Шукай задачі у проекті та додавай їх у беклог.',
      onClose: () => this.options.onCloseTaskPicker(),
      intent: 'form',
      zIndex: 270,
    });

    overlay.dataset.role = 'focus-board-task-picker-modal';
    container.style.width = 'min(44rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(44rem, calc(100vw - 2rem))';

    const content = document.createElement('div');
    content.className = 'flex min-h-0 flex-1 flex-col gap-4';

    const searchWrap = document.createElement('div');
    searchWrap.className = 'px-6 pt-5';
    const searchInput = new Input({
      value: state.taskPicker.query,
      placeholder: 'Пошук задач...',
      autoFocus: true,
      onInput: (value) => this.options.onSetTaskPickerQuery(value),
    });
    this.taskPickerSearchInput = searchInput;
    searchWrap.appendChild(searchInput.getElement());

    const filtersWrap = document.createElement('div');
    filtersWrap.className = 'fb-task-picker-filters';
    const filtersGrid = document.createElement('div');
    filtersGrid.className = 'fb-task-picker-filter-grid';

    const statusField = createField({
      label: 'Статус',
      className: 'min-w-0',
    });
    const statusSelect = new StaticDropdownSelect<TaskPickerStatusOption>({
      value: getTaskPickerStatusOption(state.taskPicker.status),
      placeholder: TASK_PICKER_ALL_STATUS_OPTION.label,
      items: [...TASK_PICKER_STATUS_OPTIONS],
      getKey: (option) => String(option.id),
      getLabel: (option) => option.label,
      onSelect: (option) => {
        this.options.onSetTaskPickerStatus(
          option.id === 'all' ? null : option.id
        );
      },
      className: 'w-full',
      ariaLabel: 'Фільтр задач за статусом',
      portalTarget: overlay,
    });
    this.taskPickerStatusSelect = statusSelect;
    statusField.setControl(statusSelect.element);

    const goalField = createField({
      label: 'Ціль (goal)',
      className: 'min-w-0',
    });
    const goalSelect = new SearchDropdownSelect<TaskPickerGoalSelectOption>({
      placeholder: TASK_PICKER_ALL_GOALS_OPTION.title,
      searchPlaceholder: 'Шукати цілі...',
      clearSearchLabel: 'Очистити пошук цілей',
      loadingLabel: 'Завантаження цілей...',
      emptyLabel: 'Цілей не знайдено.',
      hintLabel: 'Почни вводити назву цілі.',
      errorFallbackLabel: 'Не вдалося завантажити цілі.',
      value: state.taskPicker.goal ?? TASK_PICKER_ALL_GOALS_OPTION,
      className: 'w-full',
      ariaLabel: 'Фільтр задач за ціллю',
      portalTarget: overlay,
      getKey: (option) =>
        option.id === 'all-goals' ? option.id : `goal-${option.id}`,
      getLabel: (option) => option.title,
      onSelect: (option) => {
        this.options.onSetTaskPickerGoal(
          option.id === 'all-goals' ? null : option
        );
      },
      loadPage: async (term, page, pageSize) => {
        const result = await this.options.searchTaskPickerGoals({
          query: term,
          page,
          pageSize,
        });
        return {
          items:
            page === 1
              ? [TASK_PICKER_ALL_GOALS_OPTION, ...result.items]
              : result.items,
          hasMore: result.nextPage !== null,
        };
      },
    });
    this.taskPickerGoalSelect = goalSelect;
    goalField.setControl(goalSelect.element);

    const storyField = createField({
      label: 'Сценарій (story)',
      className: 'min-w-0',
    });
    const storySelect = new SearchDropdownSelect<TaskPickerStorySelectOption>({
      placeholder: TASK_PICKER_ALL_STORIES_OPTION.title,
      searchPlaceholder: 'Шукати сценарії...',
      clearSearchLabel: 'Очистити пошук сценаріїв',
      loadingLabel: 'Завантаження сценаріїв...',
      emptyLabel: 'Сценаріїв не знайдено.',
      hintLabel:
        state.taskPicker.goal === null
          ? 'Почни вводити назву сценарію.'
          : 'Почни вводити назву сценарію для вибраної цілі.',
      errorFallbackLabel: 'Не вдалося завантажити сценарії.',
      value: state.taskPicker.story ?? TASK_PICKER_ALL_STORIES_OPTION,
      className: 'w-full',
      ariaLabel: 'Фільтр задач за сценарієм',
      portalTarget: overlay,
      getKey: (option) =>
        option.id === 'all-stories' ? option.id : `story-${option.id}`,
      getLabel: (option) => option.title,
      onSelect: (option) => {
        this.options.onSetTaskPickerStory(
          option.id === 'all-stories' ? null : option
        );
      },
      loadPage: async (term, page, pageSize) => {
        const result = await this.options.searchTaskPickerStories({
          query: term,
          page,
          pageSize,
          goalId: this.snapshot?.taskPicker.goal?.id ?? null,
        });
        return {
          items:
            page === 1
              ? [TASK_PICKER_ALL_STORIES_OPTION, ...result.items]
              : result.items,
          hasMore: result.nextPage !== null,
        };
      },
    });
    this.taskPickerStorySelect = storySelect;
    storyField.setControl(storySelect.element);

    filtersGrid.append(
      statusField.element,
      goalField.element,
      storyField.element
    );
    filtersWrap.appendChild(filtersGrid);

    const list = document.createElement('div');
    list.className = 'fb-task-picker-list custom-scrollbar';
    this.taskPickerList = list;
    this.taskPickerListScrollHandler = (event: Event) => {
      const target = event.currentTarget;
      if (!(target instanceof HTMLElement)) return;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
        this.options.onLoadMoreTaskPicker();
      }
    };
    list.addEventListener('scroll', this.taskPickerListScrollHandler);

    content.append(searchWrap, filtersWrap, list);
    body.className = 'flex min-h-0 flex-1 flex-col overflow-hidden p-0';
    body.appendChild(content);

    this.taskPickerModalOverlay = overlay;
    this.renderNativeTaskPickerContent(state);
  }

  private renderNativeTaskPickerContent(state: FocusBoardSnapshot): void {
    if (!this.taskPickerList) return;

    this.taskPickerList.replaceChildren();

    if (state.taskPicker.items.length === 0 && state.taskPicker.loading) {
      const loading = document.createElement('p');
      loading.className = 'fb-empty-state';
      loading.textContent = 'Завантаження задач...';
      this.taskPickerList.appendChild(loading);
      return;
    }

    if (state.taskPicker.items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'fb-empty-state';
      empty.textContent =
        state.taskPicker.query.trim().length > 0
          ? 'За цим запитом задач не знайдено.'
          : 'Немає задач для додавання.';
      this.taskPickerList.appendChild(empty);
    } else {
      state.taskPicker.items.forEach((task) => {
        const placement = this.findTaskPlacement(state, task.id);
        const row = createSurface({
          className:
            'flex items-center justify-between gap-3 rounded-2xl px-4 py-3',
        });

        const copy = document.createElement('div');
        copy.className = 'min-w-0 flex-1';

        const title = document.createElement('p');
        title.className =
          'truncate text-sm font-medium leading-5 text-slate-800';
        title.textContent = task.text;

        const meta = document.createElement('p');
        meta.className = 'mt-1 text-xs leading-4 text-slate-500';
        if (placement.inBacklog) {
          meta.textContent = 'Уже в беклозі';
        } else if (placement.dayIndex !== null) {
          meta.textContent = `Уже призначена на день ${placement.dayIndex}`;
        } else if (task.completed) {
          meta.textContent = 'Виконана задача';
        } else {
          meta.textContent = 'Можна додати у беклог';
        }

        copy.append(title, meta);

        const addButton = new Button({
          text:
            placement.inBacklog || placement.dayIndex !== null
              ? 'Додано'
              : undefined,
          variant:
            placement.inBacklog || placement.dayIndex !== null
              ? 'secondary'
              : 'default',
          disabled: placement.inBacklog || placement.dayIndex !== null,
          children:
            placement.inBacklog || placement.dayIndex !== null
              ? undefined
              : (() => {
                  const content = document.createElement('span');
                  content.className = 'inline-flex items-center gap-2';
                  content.append(
                    createIcon('plus', { size: 16, strokeWidth: 1.9 }),
                    document.createTextNode('В беклог')
                  );
                  return content;
                })(),
          onClick: () => this.options.onAddTaskToBacklog(task.id),
        }).getElement();

        row.append(copy, addButton);
        this.taskPickerList?.appendChild(row);
      });
    }

    if (state.taskPicker.error) {
      const error = document.createElement('p');
      error.className = 'px-1 text-sm leading-5 text-red-500';
      error.textContent = state.taskPicker.error;
      this.taskPickerList.appendChild(error);
    }

    if (state.taskPicker.loading && state.taskPicker.items.length > 0) {
      const loadingMore = document.createElement('p');
      loadingMore.className = 'fb-empty-state';
      loadingMore.textContent = 'Завантаження ще...';
      this.taskPickerList.appendChild(loadingMore);
    } else if (state.taskPicker.nextPage !== null) {
      const loadMoreWrap = document.createElement('div');
      loadMoreWrap.className = 'flex justify-center pt-2';
      const loadMoreButton = new Button({
        text: 'Завантажити ще',
        variant: 'outline',
        onClick: () => this.options.onLoadMoreTaskPicker(),
      }).getElement();
      loadMoreWrap.appendChild(loadMoreButton);
      this.taskPickerList.appendChild(loadMoreWrap);
    }
  }

  private closeNativeTaskPickerModal(): void {
    if (this.taskPickerList && this.taskPickerListScrollHandler) {
      this.taskPickerList.removeEventListener(
        'scroll',
        this.taskPickerListScrollHandler
      );
    }
    this.taskPickerListScrollHandler = null;
    this.taskPickerStatusSelect?.destroy();
    this.taskPickerStatusSelect = null;
    this.taskPickerGoalSelect?.destroy();
    this.taskPickerGoalSelect = null;
    this.taskPickerStorySelect?.destroy();
    this.taskPickerStorySelect = null;
    this.taskPickerSearchInput = null;
    this.taskPickerList = null;
    this.taskPickerModalOverlay?.remove();
    this.taskPickerModalOverlay = null;
  }

  private openNativeTaskComposerModal(state: FocusBoardSnapshot): void {
    this.closeNativeTaskComposerModal();

    const isBacklogTarget = state.taskComposer.target === 'backlog';
    const title = isBacklogTarget
      ? 'Нова задача у беклог'
      : 'Нова задача у день';
    const subtitle = isBacklogTarget
      ? 'Створи задачу і додай її в беклог.'
      : 'Створи задачу і одразу розмісти її у вибраному дні.';

    const { overlay, container, body, footer } = createModalShell(title, {
      subtitle,
      onClose: () => this.options.onCloseTaskComposer(),
      intent: 'form',
      zIndex: 272,
    });

    overlay.dataset.role = 'focus-board-task-composer-modal';
    container.style.width = 'min(32rem, calc(100vw - 2rem))';
    container.style.maxWidth = 'min(32rem, calc(100vw - 2rem))';

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-2';

    const input = new Input({
      value: state.taskComposer.title,
      placeholder: 'Назва задачі...',
      autoFocus: true,
      onInput: (value) => this.options.onSetTaskComposerTitle(value),
    });
    this.taskComposerInput = input;

    const field = createField({
      label: 'Назва задачі',
      className: 'mb-0',
      control: input.getElement(),
    });
    content.appendChild(field.element);

    const error = document.createElement('p');
    error.className = 'text-sm leading-5 text-red-500';
    error.textContent = state.taskComposer.error ?? '';
    error.hidden = !state.taskComposer.error;
    this.taskComposerErrorText = error;
    content.appendChild(error);

    body.appendChild(content);

    const actions = createModalActionRow({ variant: 'form' });
    const cancelButton = new Button({
      text: 'Скасувати',
      variant: 'outline',
      className: getModalActionButtonClass('default'),
      onClick: () => this.options.onCloseTaskComposer(),
    }).getElement();
    const createButton = new Button({
      text: state.taskComposer.saving ? 'Створення...' : 'Створити',
      variant: 'default',
      disabled: state.taskComposer.saving,
      className: getModalActionButtonClass('wide'),
      onClick: () => this.options.onSubmitTaskComposer(),
    }).getElement() as HTMLButtonElement;
    this.taskComposerSubmitButton = createButton;
    actions.append(cancelButton, createButton);
    footer.appendChild(actions);

    this.taskComposerModalOverlay = overlay;
  }

  private closeNativeTaskComposerModal(): void {
    this.taskComposerInput = null;
    this.taskComposerErrorText = null;
    this.taskComposerSubmitButton = null;
    this.taskComposerModalOverlay?.remove();
    this.taskComposerModalOverlay = null;
  }
}
