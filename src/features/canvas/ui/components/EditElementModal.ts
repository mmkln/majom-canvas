import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import {
  PatchPlanningElementCommand,
  type PlanningElementPatch,
} from '../../core/commands/PatchPlanningElementCommand.ts';
import { firstValueFrom, Subscription } from 'rxjs';
import { ComponentFactory } from '../../../../ui-lib/src/core/ComponentFactory.ts';
import {
  createModalActionRow,
  getModalActionButtonClass,
  createModalShell,
} from '../../../../ui-lib/src/components/Modal.ts';
import {
  type ConfirmUnsavedChangesAction,
  confirmUnsavedChangesModal,
} from './ConfirmUnsavedChangesModal.ts';
import {
  createField,
  createSegmentedControl,
  createTextButton,
  type SegmentedControl,
} from '../primitives/index.ts';
import {
  ELEMENT_STATUS_VALUES,
  ElementStatus,
} from '../../elements/ElementStatus.ts';
import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import {
  Status,
  type Tag,
} from '../../../../majom-wrapper/interfaces/index.ts';
import {
  getStatusLabel,
  STATUS_ICON_MAP,
  STATUS_ICON_TONE_CLASS,
} from '../statusPresentation.ts';
import {
  getRoutineStatusLabel,
  ROUTINE_STATUS_ICON_MAP,
  ROUTINE_STATUS_ICON_TONE_CLASS,
  ROUTINE_STATUS_ORDER,
} from '../routineStatusPresentation.ts';
import { Checkbox } from '../../../../ui-lib/src/components/Checkbox.ts';
import { TagPickerField } from '../../../../ui-lib/src/components/TagPickerField.ts';
import { environment } from '../../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';
import { getDefaultTagColor } from '../../../../majom-wrapper/utils/tagColor.ts';
import {
  buildPlanningDescriptionField,
  buildPlanningTitleField,
} from './planningDetailsInlineFields.ts';

type DescriptionMode = 'view' | 'edit';

type TitleFieldMode = 'view' | 'edit';

type EditElementModalShowOptions = {
  initialTitleMode?: TitleFieldMode;
};

type TitleFieldOptions = {
  getValue: () => string;
  setValue: (value: string) => void;
};

type TitleFieldController = {
  field: ReturnType<typeof createField>;
  setMode: (mode: TitleFieldMode, options?: { focus?: boolean }) => void;
  focusInput: (options?: { select?: boolean }) => void;
  focusPreview: () => void;
  setRequiredError: (message: string) => void;
};

type DescriptionFieldOptions = {
  getValue: () => string;
  setValue: (value: string) => void;
};

type DescriptionFieldController = {
  field: ReturnType<typeof createField>;
  setMode: (mode: DescriptionMode, options?: { focus?: boolean }) => void;
};

type GoalTagOption = Pick<Tag, 'id' | 'title' | 'color'>;

const normalizeNumberSet = (values: Iterable<number>): number[] =>
  [...new Set(values)].sort((left, right) => left - right);

const haveSameNumberSetMembers = (
  left: Iterable<number>,
  right: Iterable<number>
): boolean => {
  const normalizedLeft = normalizeNumberSet(left);
  const normalizedRight = normalizeNumberSet(right);
  if (normalizedLeft.length !== normalizedRight.length) return false;
  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index]
  );
};

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  private statusControl: SegmentedControl<ElementStatus> | null = null;
  private priorityControl: SegmentedControl<UiPriority> | null = null;
  private scaleControl: SegmentedControl<GoalScale> | null = null;
  private goalTagPicker: TagPickerField | null = null;
  private tagLoadSubscription: Subscription | null = null;

  constructor(
    private element: TaskElement | StoryElement | GoalElement | HabitElement,
    private scene: Scene
  ) {}

  public show(options: EditElementModalShowOptions = {}): void {
    if (this.element instanceof HabitElement) {
      this.showHabitModal(options);
      return;
    }
    this.destroyControls();
    const initialTitleMode = options.initialTitleMode ?? 'view';

    const typeLabel =
      this.element instanceof TaskElement
        ? 'Task'
        : this.element instanceof StoryElement
          ? 'Story'
          : 'Goal';
    const formatDateInputValue = (value: Date | null | undefined): string => {
      if (!value || !(value instanceof Date) || Number.isNaN(value.getTime())) {
        return '';
      }
      return value.toISOString().slice(0, 10);
    };
    const parseDateInputValue = (value: string): Date | null => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    // Local temp state
    const originalTitle = this.element.title;
    const originalDescription = this.element.description;
    const originalStatus: ElementStatus = this.element.status;
    const originalPriority = this.element.priority;
    const taskElement =
      this.element instanceof TaskElement ? this.element : null;
    const isTask = taskElement !== null;
    const goalElement =
      this.element instanceof GoalElement ? this.element : null;
    const isGoal = goalElement !== null;
    const originalScale: GoalScale | null = goalElement
      ? goalElement.scale
      : null;
    const originalTagIds = new Set(goalElement?.tagIds ?? []);
    const originalTagTitles = new Set(goalElement?.tags ?? []);
    const originalDueDateValue = isTask
      ? formatDateInputValue(taskElement?.dueDate ?? null)
      : '';
    let tempTitle = originalTitle;
    let tempDescription = originalDescription;
    let tempStatus: ElementStatus = originalStatus;
    let tempPriority = originalPriority;
    let tempScale: GoalScale = originalScale ?? 1;
    const tempTagIds = new Set(originalTagIds);
    const availableGoalTags: GoalTagOption[] = [];
    let tempDueDateValue = originalDueDateValue;
    let goalTagsLoading = false;
    let goalTagsLoadFailed = false;
    let closeGuardOpen = false;
    let saveAndClose: (() => void) | null = null;

    const hasUnsavedChanges = (): boolean => {
      const normalizedTitle = tempTitle.trim();
      if (normalizedTitle !== originalTitle) return true;
      if (tempDescription !== originalDescription) return true;
      if (tempStatus !== originalStatus) return true;
      if (tempPriority !== originalPriority) return true;
      if (isTask && tempDueDateValue !== originalDueDateValue) return true;
      if (isGoal && originalScale !== tempScale) return true;
      if (isGoal && !haveSameNumberSetMembers(tempTagIds, originalTagIds)) {
        return true;
      }
      return false;
    };

    const withCloseGuard = async (work: () => Promise<void>): Promise<void> => {
      if (closeGuardOpen) return;
      closeGuardOpen = true;
      try {
        await work();
      } finally {
        closeGuardOpen = false;
      }
    };

    const applyCloseAction = (action: ConfirmUnsavedChangesAction): void => {
      const handlers: Record<ConfirmUnsavedChangesAction, () => void> = {
        'keep-editing': () => {
          return;
        },
        discard: () => {
          this.close();
        },
        'save-and-close': () => {
          saveAndClose?.();
        },
      };
      handlers[action]();
    };

    const requestClose = async (): Promise<void> => {
      if (!this.modal) return;
      if (!hasUnsavedChanges()) {
        this.close();
        return;
      }
      await withCloseGuard(async () => {
        const action = await confirmUnsavedChangesModal();
        applyCloseAction(action);
      });
    };

    const { overlay, container, body, footer } = createModalShell(
      `Edit ${typeLabel}`,
      {
        onClose: () => {
          void requestClose();
        },
        intent: 'form',
      }
    );
    this.modal = overlay;

    const formContent = document.createElement('div');
    formContent.className = 'space-y-4 pb-2';
    body.appendChild(formContent);

    const titleField = this.buildTitleField({
      getValue: () => tempTitle,
      setValue: (value) => {
        tempTitle = value;
      },
    });
    titleField.setMode(initialTitleMode, { focus: false });
    formContent.appendChild(titleField.field.element);

    const descriptionField = this.buildDescriptionField({
      getValue: () => tempDescription,
      setValue: (value) => {
        tempDescription = value;
      },
    });
    descriptionField.setMode('view', { focus: false });
    formContent.appendChild(descriptionField.field.element);

    this.statusControl = createSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Status',
      options: ELEMENT_STATUS_VALUES.map((status) => ({
        id: `status-${status}`,
        value: status,
        label: getStatusLabel(status),
        icon: STATUS_ICON_MAP[status],
        iconColorClassName: STATUS_ICON_TONE_CLASS[status],
        title: getStatusLabel(status),
      })),
      value: tempStatus,
      onChange: (value) => {
        tempStatus = value;
      },
    });
    const statusField = createField({
      label: 'Status',
      control: this.statusControl.element,
    });
    formContent.appendChild(statusField.element);

    // Priority segmented control with label
    this.priorityControl = this.createPriorityControl(tempPriority, (value) => {
      tempPriority = value;
    });
    const priorityField = createField({
      label: 'Priority',
      control: this.priorityControl.element,
    });
    formContent.appendChild(priorityField.element);

    if (isTask) {
      const dueDateField = createField({ label: 'Due date' });
      const dueDateInput = ComponentFactory.createInput({
        variant: 'default',
        value: tempDueDateValue,
        onChange: (v: string) => {
          tempDueDateValue = v;
        },
        className: 'w-full',
        type: 'date',
      });
      dueDateInput.render(dueDateField.controlContainer);
      dueDateField.setControl(dueDateInput.getElement());
      formContent.appendChild(dueDateField.element);
    }

    if (isGoal) {
      this.scaleControl = createSegmentedControl({
        size: 'md',
        fullWidth: true,
        ariaLabel: 'Scale',
        options: [
          {
            id: 'scale-small',
            value: 1,
            label: 'Small',
            title: 'Small scope. Quick to deliver with minimal dependencies.',
          },
          {
            id: 'scale-medium',
            value: 2,
            label: 'Medium',
            title: 'Moderate scope. Requires coordination across a few steps.',
          },
          {
            id: 'scale-large',
            value: 3,
            label: 'Large',
            title: 'Large scope. Complex goal with multiple milestones.',
          },
        ],
        value: tempScale,
        onChange: (value) => {
          tempScale = value;
        },
      });
      const scaleField = createField({
        label: 'Scale',
        control: this.scaleControl.element,
      });
      formContent.appendChild(scaleField.element);

      const tasksApi = new TasksApiService(
        new HttpInterceptorClient(environment.apiUrl)
      );
      this.goalTagPicker = new TagPickerField({
        items: availableGoalTags,
        selectedIds: [...tempTagIds],
        loading: true,
        onCreate: async (title) => {
          try {
            const created = await firstValueFrom(
              tasksApi.createTag({
                title,
                color: getDefaultTagColor(title),
              })
            );
            const createdOption = {
              id: created.id,
              title: created.title,
              color: created.color,
            };
            const existingIndex = availableGoalTags.findIndex(
              (tag) => tag.id === createdOption.id
            );
            if (existingIndex >= 0) {
              availableGoalTags[existingIndex] = createdOption;
            } else {
              availableGoalTags.push(createdOption);
            }
            goalTagsLoadFailed = false;
            return createdOption;
          } catch {
            throw new Error('Failed to create tag.');
          }
        },
        onChange: (selectedIds) => {
          tempTagIds.clear();
          selectedIds.forEach((id) => tempTagIds.add(id));
        },
      });
      const tagsField = createField({
        label: 'Tags',
        control: this.goalTagPicker.element,
      });
      formContent.appendChild(tagsField.element);

      const syncGoalTagPicker = (): void => {
        this.goalTagPicker?.update({
          items: availableGoalTags,
          selectedIds: [...tempTagIds],
          loading: goalTagsLoading,
          errorMessage: goalTagsLoadFailed ? 'Failed to load tags.' : null,
        });
      };
      goalTagsLoading = true;
      syncGoalTagPicker();
      this.tagLoadSubscription = tasksApi.getTags().subscribe({
        next: (tags) => {
          availableGoalTags.splice(
            0,
            availableGoalTags.length,
            ...tags.map((tag) => ({
              id: tag.id,
              title: tag.title,
              color: tag.color,
            }))
          );
          if (originalTagIds.size === 0 && originalTagTitles.size > 0) {
            const resolvedIds = tags
              .filter((tag) => originalTagTitles.has(tag.title))
              .map((tag) => tag.id);
            if (resolvedIds.length > 0 && tempTagIds.size === 0) {
              resolvedIds.forEach((id) => {
                originalTagIds.add(id);
                tempTagIds.add(id);
              });
            }
          }
          goalTagsLoading = false;
          goalTagsLoadFailed = false;
          syncGoalTagPicker();
        },
        error: () => {
          goalTagsLoading = false;
          goalTagsLoadFailed = true;
          syncGoalTagPicker();
        },
      });
    }

    // Save function
    saveAndClose = () => {
      const normalizedTitle = tempTitle.trim();
      if (normalizedTitle.length === 0) {
        titleField.setRequiredError('Title is required');
        titleField.setMode('edit', { focus: true });
        titleField.focusInput({ select: true });
        return;
      }

      const patch: PlanningElementPatch = {};
      if (normalizedTitle !== originalTitle) patch.title = normalizedTitle;
      if (tempDescription !== originalDescription) {
        patch.description = tempDescription;
      }
      if (tempStatus !== originalStatus) patch.status = tempStatus;
      if (tempPriority !== originalPriority) patch.priority = tempPriority;
      if (isTask && tempDueDateValue !== originalDueDateValue) {
        const nextDueDate = parseDateInputValue(tempDueDateValue);
        patch.dueDate = nextDueDate;
      }
      if (this.element instanceof GoalElement) {
        const nextTagIds = normalizeNumberSet(tempTagIds);
        const tagsChanged = !haveSameNumberSetMembers(
          tempTagIds,
          originalTagIds
        );
        if (tagsChanged) {
          patch.tagIds = nextTagIds;
          patch.tags = availableGoalTags
            .filter((tag) => tempTagIds.has(tag.id))
            .map((tag) => tag.title);
        }
        if (originalScale !== tempScale) {
          patch.scale = tempScale;
        }
      }
      if (Object.keys(patch).length > 0) {
        historyService.execute(
          new PatchPlanningElementCommand(this.scene, this.element, patch)
        );
      }
      this.close();
    };

    // Actions
    const btnRow = createModalActionRow({ variant: 'form' });
    const cancelBtn = createTextButton({
      text: 'Cancel',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        void requestClose();
      },
    });
    const saveBtn = createTextButton({
      text: 'Save',
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        saveAndClose?.();
      },
    });
    btnRow.append(cancelBtn, saveBtn);
    footer.appendChild(btnRow);

    if (initialTitleMode === 'edit') {
      titleField.focusInput({ select: true });
    } else {
      // Keep initial focus on title preview; click/Enter starts inline edit.
      titleField.focusPreview();
    }

    // Keyboard: handle modal shortcuts
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const target = e.target;
        const targetEl = target instanceof HTMLElement ? target : null;
        const isTextarea = target instanceof HTMLTextAreaElement;
        const isInlineTitleInput =
          targetEl?.closest('[data-inline-title-input="true"]') !== null;
        const isButton = target instanceof HTMLButtonElement;
        if (isInlineTitleInput) {
          return;
        }
        if (isTextarea && !e.metaKey && !e.ctrlKey) {
          return;
        }
        if (isButton) {
          return;
        }
        e.preventDefault();
        saveAndClose?.();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        void requestClose();
      }
    });
  }

  private showHabitModal(options: EditElementModalShowOptions = {}): void {
    this.destroyControls();
    if (!(this.element instanceof HabitElement)) {
      return;
    }
    const initialTitleMode = options.initialTitleMode ?? 'view';
    const routine = this.element;
    const originalTitle = routine.title;
    const originalDescription = routine.description;
    const originalStatus = routine.habitStatus;
    const originalPriority = routine.priority;
    const initialHistory = this.getRoutineHistoryDraft(routine);
    let tempTitle = originalTitle;
    let tempDescription = originalDescription;
    let tempStatus: Status.Active | Status.Archived = originalStatus;
    let tempPriority = originalPriority;
    const completionDraft = new Map(initialHistory);
    let closeGuardOpen = false;
    let saveAndClose: (() => void) | null = null;

    const hasUnsavedChanges = (): boolean => {
      if (tempTitle.trim() !== originalTitle) return true;
      if (tempDescription !== originalDescription) return true;
      if (tempStatus !== originalStatus) return true;
      if (tempPriority !== originalPriority) return true;
      for (const [date, checked] of initialHistory) {
        if ((completionDraft.get(date) ?? false) !== checked) return true;
      }
      return false;
    };

    const withCloseGuard = async (work: () => Promise<void>): Promise<void> => {
      if (closeGuardOpen) return;
      closeGuardOpen = true;
      try {
        await work();
      } finally {
        closeGuardOpen = false;
      }
    };

    const requestClose = async (): Promise<void> => {
      if (!this.modal) return;
      if (!hasUnsavedChanges()) {
        this.close();
        return;
      }
      await withCloseGuard(async () => {
        const action = await confirmUnsavedChangesModal();
        if (action === 'keep-editing') return;
        if (action === 'discard') {
          this.close();
          return;
        }
        saveAndClose?.();
      });
    };

    const { overlay, container, body, footer } = createModalShell(
      'Edit routine',
      {
        onClose: () => {
          void requestClose();
        },
        intent: 'form',
      }
    );
    this.modal = overlay;

    const formContent = document.createElement('div');
    formContent.className = 'space-y-4 pb-2';
    body.appendChild(formContent);

    const titleField = this.buildTitleField({
      getValue: () => tempTitle,
      setValue: (value) => {
        tempTitle = value;
      },
    });
    titleField.setMode(initialTitleMode, { focus: false });
    formContent.appendChild(titleField.field.element);

    const descriptionField = this.buildDescriptionField({
      getValue: () => tempDescription,
      setValue: (value) => {
        tempDescription = value;
      },
    });
    descriptionField.setMode('view', { focus: false });
    formContent.appendChild(descriptionField.field.element);

    this.priorityControl = this.createPriorityControl(tempPriority, (value) => {
      tempPriority = value;
    });
    const priorityField = createField({
      label: 'Priority',
      control: this.priorityControl.element,
    });
    formContent.appendChild(priorityField.element);

    const historyGrid = document.createElement('div');
    historyGrid.className = 'grid grid-cols-2 gap-2 sm:grid-cols-5';
    this.getRoutineHistoryDraft(routine).forEach(([date, checked]) => {
      const checkbox = new Checkbox({
        checked,
        ariaLabel: date,
        stopPropagation: true,
        onChange: (nextChecked) => {
          completionDraft.set(date, nextChecked);
        },
      });
      checkbox.getElement().classList.add('shrink-0');

      const dateObj = new Date(`${date}T12:00:00`);
      const dayLabel = document.createElement('div');
      dayLabel.className = 'text-[11px] font-medium leading-4 text-slate-600';
      dayLabel.textContent = this.formatRoutineHistoryWeekday(dateObj);

      const metaLabel = document.createElement('div');
      metaLabel.className = 'text-[11px] leading-4 text-slate-400';
      metaLabel.textContent = this.formatRoutineHistoryDate(dateObj);

      const label = document.createElement('label');
      label.className =
        'flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5';
      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0';
      textWrap.append(dayLabel, metaLabel);
      label.append(textWrap, checkbox.getElement());
      historyGrid.appendChild(label);
    });
    const historyField = createField({
      label: 'Last 10 days',
      control: historyGrid,
    });
    formContent.appendChild(historyField.element);

    const statusControl = createSegmentedControl<
      Status.Active | Status.Archived
    >({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Routine status',
      options: ROUTINE_STATUS_ORDER.map((status) => ({
        id: `routine-status-${status}`,
        value: status,
        label: getRoutineStatusLabel(status),
        icon: ROUTINE_STATUS_ICON_MAP[status],
        iconColorClassName: ROUTINE_STATUS_ICON_TONE_CLASS[status],
        title: getRoutineStatusLabel(status),
      })),
      value: tempStatus,
      onChange: (value) => {
        tempStatus = value;
      },
    });
    const statusField = createField({
      label: 'Status',
      control: statusControl.element,
    });
    formContent.appendChild(statusField.element);

    const commitDraft = (): boolean => {
      const normalizedTitle = tempTitle.trim();
      if (normalizedTitle.length === 0) {
        titleField.setRequiredError('Title is required');
        titleField.setMode('edit', { focus: true });
        titleField.focusInput({ select: true });
        return false;
      }
      const patch: Partial<{
        title: string;
        description: string;
        priority: UiPriority;
      }> = {};
      if (normalizedTitle !== originalTitle) patch.title = normalizedTitle;
      if (tempDescription !== originalDescription) {
        patch.description = tempDescription;
      }
      if (tempPriority !== originalPriority) {
        patch.priority = tempPriority;
      }
      routine.title = normalizedTitle;
      routine.description = tempDescription;
      routine.priority = tempPriority;
      if (Object.keys(patch).length > 0) {
        window.dispatchEvent(
          new CustomEvent('elementDetailsEdited', {
            detail: { element: routine, patch },
          })
        );
      }
      if (tempStatus !== originalStatus) {
        window.dispatchEvent(
          new CustomEvent('habitCanvasMutationRequested', {
            detail: {
              element: routine,
              action: tempStatus === Status.Archived ? 'archive' : 'restore',
            },
          })
        );
      }
      this.getRoutineHistoryDraft(routine).forEach(
        ([date, originalChecked]) => {
          const nextChecked = completionDraft.get(date) ?? false;
          if (nextChecked === originalChecked) return;
          window.dispatchEvent(
            new CustomEvent('habitCanvasMutationRequested', {
              detail: {
                element: routine,
                action: 'set-completion-date',
                date,
                completed: nextChecked,
              },
            })
          );
        }
      );
      routine.habitStatus = tempStatus;
      routine.completionHistory = this.getRoutineHistoryDraft(routine).map(
        ([date]) => [date, completionDraft.get(date) ?? false]
      );
      routine.completedToday =
        completionDraft.get(this.getTodayKey()) ?? routine.completedToday;
      this.scene.changes.next();
      return true;
    };

    saveAndClose = () => {
      if (!commitDraft()) return;
      this.close();
    };

    const btnRow = createModalActionRow({ variant: 'form' });
    const cancelBtn = createTextButton({
      text: 'Cancel',
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        void requestClose();
      },
    });
    const saveBtn = createTextButton({
      text: 'Save',
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        saveAndClose?.();
      },
    });
    btnRow.append(cancelBtn, saveBtn);
    footer.appendChild(btnRow);

    if (initialTitleMode === 'edit') {
      titleField.focusInput({ select: true });
    } else {
      titleField.focusPreview();
    }

    container.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        const target = event.target;
        const targetEl = target instanceof HTMLElement ? target : null;
        const isTextarea = target instanceof HTMLTextAreaElement;
        const isInlineTitleInput =
          targetEl?.closest('[data-inline-title-input="true"]') !== null;
        const isButton = target instanceof HTMLButtonElement;
        if (isInlineTitleInput || isTextarea || isButton) {
          return;
        }
        event.preventDefault();
        saveAndClose?.();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        void requestClose();
      }
    });
  }

  private getRoutineHistoryDraft(
    habit: HabitElement
  ): Array<[string, boolean]> {
    const completionByDate = new Map<string, boolean>(
      (habit.completionHistory ?? []).map(([date, checked]) => [date, checked])
    );
    if (habit.lastChecked) {
      completionByDate.set(this.toDateKey(habit.lastChecked), true);
    }
    const entries: Array<[string, boolean]> = [];
    const today = new Date();
    for (let offset = 9; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const dateKey = this.toDateKey(date);
      entries.push([dateKey, completionByDate.get(dateKey) ?? false]);
    }
    return entries;
  }

  private formatRoutineHistoryWeekday(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
    }).format(date);
  }

  private formatRoutineHistoryDate(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  private getTodayKey(): string {
    return this.toDateKey(new Date());
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createPriorityControl(
    value: UiPriority,
    onChange: (value: UiPriority) => void
  ): SegmentedControl<UiPriority> {
    return createSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Priority',
      options: [
        {
          id: 'priority-lowest',
          value: 'lowest',
          label: 'Lowest',
          icon: 'chevron-double-down',
          iconColorClassName: 'text-sky-500',
          title: 'Lowest priority. Can be ignored for now.',
        },
        {
          id: 'priority-low',
          value: 'low',
          label: 'Low',
          icon: 'chevron-down',
          iconColorClassName: 'text-sky-500',
          title: 'Low urgency. Important, but not time-sensitive.',
        },
        {
          id: 'priority-medium',
          value: 'medium',
          label: 'Medium',
          icon: 'bars-2',
          iconColorClassName: 'text-orange-500',
          title: 'Balanced priority for regular planning and execution.',
        },
        {
          id: 'priority-high',
          value: 'high',
          label: 'High',
          icon: 'chevron-up',
          iconColorClassName: 'text-red-500',
          title: 'High urgency. Should be scheduled and completed soon.',
        },
        {
          id: 'priority-highest',
          value: 'highest',
          label: 'Highest',
          icon: 'chevron-double-up',
          iconColorClassName: 'text-red-500',
          title:
            'Highest priority. Super urgent and should be handled immediately.',
        },
      ],
      value,
      onChange,
    });
  }

  private buildTitleField(options: TitleFieldOptions): TitleFieldController {
    return buildPlanningTitleField({
      label: 'Title',
      placeholder: 'Untitled',
      previewAriaLabel: 'Title preview. Press Enter to edit.',
      emptyPreviewAriaLabel: 'Untitled. Press Enter to add title.',
      ...options,
    });
  }

  private buildDescriptionField(
    options: DescriptionFieldOptions
  ): DescriptionFieldController {
    return buildPlanningDescriptionField({
      label: 'Description',
      placeholder: 'No description yet.',
      previewAriaLabel: 'Description preview. Press Enter to edit.',
      emptyPreviewAriaLabel: 'No description yet. Press Enter to add description.',
      ...options,
    });
  }

  private close(): void {
    this.destroyControls();
    if (this.modal) {
      // remove() triggers shell cleanup and closes overlay record in modalService.
      this.modal.remove();
      this.modal = null;
    }
  }

  private destroyControls(): void {
    this.goalTagPicker?.destroy();
    this.goalTagPicker = null;
    this.tagLoadSubscription?.unsubscribe();
    this.tagLoadSubscription = null;
    this.statusControl?.destroy();
    this.statusControl = null;
    this.priorityControl?.destroy();
    this.priorityControl = null;
    this.scaleControl?.destroy();
    this.scaleControl = null;
  }
}
