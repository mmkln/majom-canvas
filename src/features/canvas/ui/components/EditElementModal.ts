import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
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
import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
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

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  private statusControl: SegmentedControl<ElementStatus> | null = null;
  private priorityControl: SegmentedControl<UiPriority> | null = null;
  private scaleControl: SegmentedControl<GoalScale> | null = null;

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
    const originalDueDateValue = isTask
      ? formatDateInputValue(taskElement?.dueDate ?? null)
      : '';
    let tempTitle = originalTitle;
    let tempDescription = originalDescription;
    let tempStatus: ElementStatus = originalStatus;
    let tempPriority = originalPriority;
    let tempScale: GoalScale = originalScale ?? 1;
    let tempDueDateValue = originalDueDateValue;
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
      size: 'sm',
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
    this.priorityControl = this.createPriorityControl(
      tempPriority,
      (value) => {
        tempPriority = value;
      }
    );
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
        size: 'sm',
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

      const patch: Partial<{
        title: string;
        description: string;
        status: ElementStatus;
        priority: UiPriority;
        dueDate: Date | null;
      }> = {};
      if (normalizedTitle !== originalTitle) patch.title = normalizedTitle;
      if (tempDescription !== originalDescription) {
        patch.description = tempDescription;
      }
      if (tempStatus !== originalStatus) patch.status = tempStatus;
      if (tempPriority !== originalPriority) patch.priority = tempPriority;
      if (isTask && tempDueDateValue !== originalDueDateValue) {
        const nextDueDate = parseDateInputValue(tempDueDateValue);
        patch.dueDate = nextDueDate;
        (this.element as TaskElement).dueDate = nextDueDate;
      }
      this.element.title = normalizedTitle;
      this.element.description = tempDescription;
      this.element.status = tempStatus;
      this.element.priority = tempPriority;
      let scaleChanged = false;
      if (this.element instanceof GoalElement) {
        if (originalScale !== tempScale) {
          this.element.setScale(tempScale);
          scaleChanged = true;
        }
      }
      this.scene.changes.next();
      if (Object.keys(patch).length > 0) {
        window.dispatchEvent(
          new CustomEvent('elementDetailsEdited', {
            detail: { element: this.element, patch },
          })
        );
      }
      if (scaleChanged) {
        window.dispatchEvent(
          new CustomEvent('canvasPositionsDirty', {
            detail: { elements: [this.element] },
          })
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

    this.priorityControl = this.createPriorityControl(
      tempPriority,
      (value) => {
        tempPriority = value;
      }
    );
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
      size: 'sm',
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
      this.getRoutineHistoryDraft(routine).forEach(([date, originalChecked]) => {
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
      });
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

  private getRoutineHistoryDraft(habit: HabitElement): Array<[string, boolean]> {
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
      size: 'sm',
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
    const field = createField({ label: 'Title', required: true });
    const input = ComponentFactory.createInput({
      variant: 'default',
      value: options.getValue(),
      required: true,
      className: 'w-full',
    });
    const mount = document.createElement('div');
    input.render(mount);
    const inputEl = input.getElement() as HTMLInputElement;
    inputEl.dataset.inlineTitleInput = 'true';

    let mode: TitleFieldMode = 'view';
    let editOrigin = options.getValue();

    const renderTitlePreview = (preview: HTMLDivElement): void => {
      const current = options.getValue().trim();
      if (current.length > 0) {
        preview.textContent = current;
        preview.className =
          'rounded-md px-3 py-2 text-[14px] leading-6 tracking-tight text-slate-900 whitespace-pre-wrap break-words transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80';
        preview.setAttribute(
          'aria-label',
          'Title preview. Press Enter to edit.'
        );
        return;
      }
      preview.textContent = 'Untitled';
      preview.className =
        'h-10 rounded-md px-2 py-1 text-center text-[12px] italic leading-5 text-slate-400 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80';
      preview.setAttribute('aria-label', 'Untitled. Press Enter to add title.');
    };

    const applyEdit = (apply: boolean): void => {
      if (mode !== 'edit') return;
      if (apply) {
        const nextTitle = inputEl.value.trim();
        if (nextTitle.length > 0) {
          options.setValue(nextTitle);
          field.setState({ invalid: false, error: undefined });
        } else {
          options.setValue(editOrigin);
        }
      } else {
        options.setValue(editOrigin);
      }
      setMode('view', { focus: true });
    };

    const createViewControl = (): HTMLDivElement => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pb-1';

      const preview = document.createElement('div');
      preview.dataset.titlePreview = 'true';
      preview.tabIndex = 0;
      preview.setAttribute('role', 'button');
      renderTitlePreview(preview);

      const startEdit = (): void => setMode('edit');
      preview.addEventListener('click', startEdit);
      preview.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        startEdit();
      });

      wrapper.appendChild(preview);
      return wrapper;
    };

    const createEditControl = (): HTMLDivElement => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pb-1';
      wrapper.appendChild(inputEl);
      return wrapper;
    };

    inputEl.addEventListener('input', () => {
      if (inputEl.value.trim().length > 0) {
        field.setState({ invalid: false, error: undefined });
      }
    });
    inputEl.addEventListener('blur', () => applyEdit(true));
    inputEl.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        applyEdit(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        applyEdit(false);
      }
    });

    function setMode(
      nextMode: TitleFieldMode,
      modeOptions: { focus?: boolean } = {}
    ): void {
      mode = nextMode;
      const shouldFocus = modeOptions.focus ?? true;
      if (nextMode === 'edit') {
        editOrigin = options.getValue();
        inputEl.value = editOrigin;
        field.setControl(createEditControl());
        if (shouldFocus) {
          inputEl.focus();
          inputEl.select();
        }
        return;
      }

      const viewControl = createViewControl();
      field.setControl(viewControl);
      if (shouldFocus) {
        viewControl
          .querySelector<HTMLElement>('[data-title-preview="true"]')
          ?.focus();
      }
    }

    return {
      field,
      setMode,
      focusInput: ({ select = false } = {}) => {
        inputEl.focus();
        if (select) inputEl.select();
      },
      focusPreview: () => {
        field.element
          .querySelector<HTMLElement>('[data-title-preview="true"]')
          ?.focus();
      },
      setRequiredError: (message: string) => {
        field.setState({ invalid: true, error: message });
      },
    };
  }

  private buildDescriptionField(
    options: DescriptionFieldOptions
  ): DescriptionFieldController {
    const field = createField({ label: 'Description' });
    const textarea = ComponentFactory.createTextarea({
      variant: 'default',
      value: options.getValue(),
      rows: 6,
      onInput: (value: string) => {
        options.setValue(value);
      },
      className:
        'min-h-[144px] w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2 shadow-none text-base leading-6 tracking-[0.005em] text-slate-800 md:text-[13px]',
    });
    const mount = document.createElement('div');
    textarea.render(mount);
    const textareaEl = textarea.getElement() as HTMLTextAreaElement;
    textareaEl.dataset.inlineDescriptionInput = 'true';
    let mode: DescriptionMode = 'view';
    let editOrigin = options.getValue();

    const renderDescriptionPreview = (preview: HTMLDivElement): void => {
      const value = options.getValue();
      const hasText = value.trim().length > 0;
      preview.textContent = hasText ? value : 'No description yet.';
      preview.setAttribute(
        'aria-label',
        hasText
          ? 'Description preview. Press Enter to edit.'
          : 'No description yet. Press Enter to add description.'
      );
      preview.className = hasText
        ? 'max-h-56 overflow-y-auto rounded-md px-3 py-2 text-[13px] leading-6 tracking-[0.005em] whitespace-pre-wrap break-words text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80'
        : 'h-12 rounded-md px-3 py-2 text-center text-[12px] italic leading-5 text-slate-400 flex items-center justify-center transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200/80';
    };

    const applyEdit = (apply: boolean): void => {
      if (mode !== 'edit') return;
      if (apply) {
        options.setValue(textareaEl.value);
      } else {
        options.setValue(editOrigin);
        textareaEl.value = editOrigin;
      }
      setMode('view', { focus: true });
    };

    const createViewControl = (): HTMLDivElement => {
      const wrapper = document.createElement('div');
      wrapper.className = 'space-y-2 pb-1';

      const preview = document.createElement('div');
      preview.dataset.descriptionPreview = 'true';
      preview.tabIndex = 0;
      preview.setAttribute('role', 'button');
      renderDescriptionPreview(preview);

      const switchToEdit = (): void => setMode('edit');
      preview.addEventListener('click', switchToEdit);
      preview.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        switchToEdit();
      });

      wrapper.append(preview);
      return wrapper;
    };

    const createEditControl = (): HTMLDivElement => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pb-1';
      wrapper.appendChild(textareaEl);
      return wrapper;
    };

    textareaEl.addEventListener('blur', () => applyEdit(true));
    textareaEl.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        applyEdit(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        applyEdit(true);
      }
    });

    function setMode(
      nextMode: DescriptionMode,
      modeOptions: { focus?: boolean } = {}
    ): void {
      mode = nextMode;
      const shouldFocus = modeOptions.focus ?? true;
      if (nextMode === 'edit') {
        editOrigin = options.getValue();
        textareaEl.value = editOrigin;
        field.setControl(createEditControl());
        if (shouldFocus) {
          textareaEl.focus();
          const end = textareaEl.value.length;
          textareaEl.setSelectionRange(end, end);
        }
        return;
      }

      const viewControl = createViewControl();
      field.setControl(viewControl);
      if (shouldFocus) {
        viewControl
          .querySelector<HTMLElement>('[data-description-preview="true"]')
          ?.focus();
      }
    }

    return { field, setMode };
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
    this.statusControl?.destroy();
    this.statusControl = null;
    this.priorityControl?.destroy();
    this.priorityControl = null;
    this.scaleControl?.destroy();
    this.scaleControl = null;
  }
}
