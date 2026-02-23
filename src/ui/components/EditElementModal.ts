import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.js';
import {
  createHudSegmentedControl,
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
      onClose: () => this.close(),
    });

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

    // Title input with label
    const titleDiv = document.createElement('div');
    titleDiv.className = 'mb-4 space-y-1.5';
    const titleLabel = document.createElement('label');
    titleLabel.className = 'block text-sm font-medium text-slate-600';
    titleLabel.textContent = 'Title';
    titleDiv.appendChild(titleLabel);
    const titleInput = ComponentFactory.createInput({
      variant: 'default',
      value: tempTitle,
      onChange: (v: string) => {
        tempTitle = v;
      },
      autoFocus: true,
      className: 'w-full',
    });
    titleInput.render(titleDiv);
    const titleInputEl = titleInput.getElement() as HTMLInputElement;
    container.appendChild(titleDiv);

    // Description textarea with label
    const descDiv = document.createElement('div');
    descDiv.className = 'mb-4 space-y-1.5';
    const descLabel = document.createElement('label');
    descLabel.className = 'block text-sm font-medium text-slate-600';
    descLabel.textContent = 'Description';
    descDiv.appendChild(descLabel);
    const descTextarea = ComponentFactory.createTextarea({
      variant: 'default',
      value: tempDescription,
      rows: 3,
      onInput: (value: string) => {
        tempDescription = value;
      },
      className: 'w-full',
    });
    descTextarea.render(descDiv);
    container.appendChild(descDiv);

    // Status dropdown with label
    const statusDiv = document.createElement('div');
    statusDiv.className = 'mb-4 space-y-1.5';
    const statusLabelEl = document.createElement('label');
    statusLabelEl.className = 'block text-sm font-medium text-slate-600';
    statusLabelEl.textContent = 'Status';
    statusDiv.appendChild(statusLabelEl);
    const statusSelect = ComponentFactory.createSelect({
      variant: 'default',
      items: ELEMENT_STATUS_OPTIONS,
      selectedValue: tempStatus,
      onChange: (v: string) => {
        tempStatus = v as ElementStatus;
      },
      className: 'w-full',
    });
    statusSelect.render(statusDiv);
    container.appendChild(statusDiv);

    // Priority segmented control with label
    const priorityDiv = document.createElement('div');
    priorityDiv.className = 'mb-4 space-y-1.5';
    const priorityLabelEl = document.createElement('label');
    priorityLabelEl.className = 'block text-sm font-medium text-slate-600';
    priorityLabelEl.textContent = 'Priority';
    priorityDiv.appendChild(priorityLabelEl);
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
    priorityDiv.appendChild(this.priorityControl.element);
    container.appendChild(priorityDiv);

    if (isTask) {
      const dueDateDiv = document.createElement('div');
      dueDateDiv.className = 'mb-4 space-y-1.5';
      const dueDateLabelEl = document.createElement('label');
      dueDateLabelEl.className = 'block text-sm font-medium text-slate-600';
      dueDateLabelEl.textContent = 'Due date';
      dueDateDiv.appendChild(dueDateLabelEl);
      const dueDateInput = ComponentFactory.createInput({
        variant: 'default',
        value: tempDueDateValue,
        onChange: (v: string) => {
          tempDueDateValue = v;
        },
        className: 'w-full',
        type: 'date',
      });
      dueDateInput.render(dueDateDiv);
      container.appendChild(dueDateDiv);
    }

    if (isGoal) {
      const scaleDiv = document.createElement('div');
      scaleDiv.className = 'mb-4 space-y-1.5';
      const scaleLabelEl = document.createElement('label');
      scaleLabelEl.className = 'block text-sm font-medium text-slate-600';
      scaleLabelEl.textContent = 'Scale';
      scaleDiv.appendChild(scaleLabelEl);
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
      scaleDiv.appendChild(this.scaleControl.element);
      container.appendChild(scaleDiv);
    }

    // Save function
    const saveAndClose = () => {
      const patch: Partial<{
        title: string;
        description: string;
        status: ElementStatus;
        priority: 'low' | 'medium' | 'high';
        dueDate: Date | null;
      }> = {};
      if (tempTitle !== originalTitle) patch.title = tempTitle;
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
      this.element.title = tempTitle;
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
    btnRow.className = 'flex justify-end space-x-2';
    ComponentFactory.createButton({
      text: 'Cancel',
      onClick: () => this.close(),
      variant: 'outline',
    }).render(btnRow);
    ComponentFactory.createButton({
      text: 'Save',
      onClick: saveAndClose,
      variant: 'default',
    }).render(btnRow);
    container.appendChild(btnRow);

    // Ensure title input receives focus when the modal opens.
    titleInputEl.focus();

    // Keyboard: handle modal shortcuts
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        saveAndClose();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });

    this.modal = overlay;
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
