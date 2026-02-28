import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../../../ui-lib/src/core/ComponentFactory.ts';
import { createModalShell } from '../../../../ui-lib/src/components/Modal.js';
import { confirmUnsavedChangesModal } from './ConfirmUnsavedChangesModal.ts';
import {
  createHudField,
  createHudSegmentedControl,
  createHudTextButton,
  type HudSegmentedControl,
} from '../primitives/index.ts';
import {
  ELEMENT_STATUS_OPTIONS,
  ElementStatus,
} from '../../elements/ElementStatus.ts';

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  private priorityControl: HudSegmentedControl<'low' | 'medium' | 'high'> | null =
    null;
  private scaleControl: HudSegmentedControl<GoalScale> | null = null;

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
    const { overlay, container } = createModalShell(`Edit ${typeLabel}`, {
      onClose: () => {
        void requestClose();
      },
    });
    this.modal = overlay;

    // Local temp state
    const originalTitle = this.element.title;
    const originalDescription = this.element.description;
    const originalStatus: ElementStatus = this.element.status;
    const originalPriority = this.element.priority;
    const taskElement =
      this.element instanceof TaskElement ? this.element : null;
    const isTask = taskElement !== null;
    const goalElement = this.element instanceof GoalElement
      ? this.element
      : null;
    const isGoal = goalElement !== null;
    const originalScale: GoalScale | null = goalElement ? goalElement.scale : null;
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

    const requestClose = async (): Promise<void> => {
      if (!this.modal) return;
      if (!hasUnsavedChanges()) {
        this.close();
        return;
      }
      if (closeGuardOpen) return;
      closeGuardOpen = true;
      const canDiscard = await confirmUnsavedChangesModal();
      closeGuardOpen = false;
      if (!canDiscard) return;
      this.close();
    };

    // Title input with label
    const titleField = createHudField({ label: 'Title', required: true });
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
    container.appendChild(titleField.element);

    // Description textarea with label
    const descField = createHudField({ label: 'Description' });
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
    descField.setControl(descTextarea.getElement() as HTMLElement);
    container.appendChild(descField.element);

    // Status dropdown with label
    const statusField = createHudField({ label: 'Status' });
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
    statusField.setControl(statusSelect.getElement() as HTMLElement);
    container.appendChild(statusField.element);

    // Priority segmented control with label
    this.priorityControl = createHudSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: 'Priority',
      options: [
        { id: 'priority-low', value: 'low', label: 'Low' },
        { id: 'priority-medium', value: 'medium', label: 'Medium' },
        { id: 'priority-high', value: 'high', label: 'High' },
      ],
      value: tempPriority,
      onChange: (value) => {
        tempPriority = value;
      },
    });
    const priorityField = createHudField({
      label: 'Priority',
      control: this.priorityControl.element,
    });
    container.appendChild(priorityField.element);

    if (isTask) {
      const dueDateField = createHudField({ label: 'Due date' });
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
      dueDateField.setControl(dueDateInput.getElement() as HTMLElement);
      container.appendChild(dueDateField.element);
    }

    if (isGoal) {
      this.scaleControl = createHudSegmentedControl({
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
      const scaleField = createHudField({
        label: 'Scale',
        control: this.scaleControl.element,
      });
      container.appendChild(scaleField.element);
    }

    // Save function
    const saveAndClose = () => {
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
        priority: 'low' | 'medium' | 'high';
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
    const btnRow = document.createElement('div');
    btnRow.className = 'flex justify-end gap-2 pt-1';
    const cancelBtn = createHudTextButton({
      text: 'Cancel',
      tone: 'text',
      onClick: () => {
        void requestClose();
      },
    });
    const saveBtn = createHudTextButton({
      text: 'Save',
      tone: 'primary',
      onClick: saveAndClose,
    });
    btnRow.append(cancelBtn, saveBtn);
    container.appendChild(btnRow);

    // Ensure title input receives focus when the modal opens.
    titleInputEl.focus();

    // Keyboard: handle modal shortcuts
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const target = e.target as EventTarget | null;
        const isTextarea = target instanceof HTMLTextAreaElement;
        if (isTextarea && !e.metaKey && !e.ctrlKey) {
          return;
        }
        e.preventDefault();
        saveAndClose();
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
      // Use remove() to trigger modalService.unregister()
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
