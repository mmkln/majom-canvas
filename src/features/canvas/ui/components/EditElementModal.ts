import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
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
  ELEMENT_STATUS_OPTIONS,
  ElementStatus,
} from '../../elements/ElementStatus.ts';
import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  private priorityControl: SegmentedControl<UiPriority> | null =
    null;
  private scaleControl: SegmentedControl<GoalScale> | null = null;

  constructor(
    private element: TaskElement | StoryElement | GoalElement,
    private scene: Scene
  ) {}

  public show(): void {
    this.destroyControls();

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

    const withCloseGuard = async (
      work: () => Promise<void>
    ): Promise<void> => {
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

    // Title input with label
    const titleField = createField({ label: 'Title', required: true });
    const titleInput = ComponentFactory.createInput({
      variant: 'default',
      value: tempTitle,
      onChange: (v: string) => {
        tempTitle = v;
        if (v.trim().length > 0) {
          titleField.setState({ invalid: false, error: undefined });
        }
      },
      autoFocus: true,
      required: true,
      className: 'w-full',
    });
    titleInput.render(titleField.controlContainer);
    const titleInputEl = titleInput.getElement() as HTMLInputElement;
    titleField.setControl(titleInputEl);
    formContent.appendChild(titleField.element);

    // Description textarea with label
    const descField = createField({ label: 'Description' });
    const descTextarea = ComponentFactory.createTextarea({
      variant: 'default',
      value: tempDescription,
      rows: 3,
      onInput: (value: string) => {
        tempDescription = value;
      },
      className: 'w-full',
    });
    descTextarea.render(descField.controlContainer);
    descField.setControl(descTextarea.getElement());
    formContent.appendChild(descField.element);

    // Status dropdown with label
    const statusField = createField({ label: 'Status' });
    const statusSelect = ComponentFactory.createSelect({
      variant: 'default',
      items: ELEMENT_STATUS_OPTIONS,
      selectedValue: tempStatus,
      onChange: (v: string) => {
        tempStatus = v as ElementStatus;
      },
      className: 'w-full',
    });
    statusSelect.render(statusField.controlContainer);
    statusField.setControl(statusSelect.getElement());
    formContent.appendChild(statusField.element);

    // Priority segmented control with label
    this.priorityControl = createSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Priority',
      options: [
        { id: 'priority-lowest', value: 'lowest', label: 'Lowest' },
        { id: 'priority-low', value: 'low', label: 'Low' },
        { id: 'priority-medium', value: 'medium', label: 'Medium' },
        { id: 'priority-high', value: 'high', label: 'High' },
        { id: 'priority-highest', value: 'highest', label: 'Highest' },
      ],
      value: tempPriority,
      onChange: (value) => {
        tempPriority = value;
      },
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
          { id: 'scale-small', value: 1, label: 'Small' },
          { id: 'scale-medium', value: 2, label: 'Medium' },
          { id: 'scale-large', value: 3, label: 'Large' },
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
        titleField.setState({ invalid: true, error: 'Title is required' });
        titleInputEl.focus();
        titleInputEl.select();
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

    // Ensure title input receives focus when the modal opens.
    titleInputEl.focus();

    // Keyboard: handle modal shortcuts
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const target = e.target;
        const isTextarea = target instanceof HTMLTextAreaElement;
        if (isTextarea && !e.metaKey && !e.ctrlKey) {
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

  private close(): void {
    this.destroyControls();
    if (this.modal) {
      // remove() triggers shell cleanup and closes overlay record in modalService.
      this.modal.remove();
      this.modal = null;
    }
  }

  private destroyControls(): void {
    this.priorityControl?.destroy();
    this.priorityControl = null;
    this.scaleControl?.destroy();
    this.scaleControl = null;
  }
}
