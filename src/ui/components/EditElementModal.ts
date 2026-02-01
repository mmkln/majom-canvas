import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.js';
import {
  ELEMENT_STATUS_OPTIONS,
  ElementStatus,
} from '../../elements/ElementStatus.ts';

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  constructor(
    private element: TaskElement | StoryElement | GoalElement,
    private scene: Scene
  ) {}

  public show(): void {
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
    titleDiv.className = 'mb-4';
    const titleLabel = document.createElement('label');
    titleLabel.className = 'block text-sm font-medium text-gray-700';
    titleLabel.textContent = 'Title';
    titleDiv.appendChild(titleLabel);
    const titleInput = ComponentFactory.createInput({
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
    descDiv.className = 'mb-4';
    const descLabel = document.createElement('label');
    descLabel.className = 'block text-sm font-medium text-gray-700';
    descLabel.textContent = 'Description';
    descDiv.appendChild(descLabel);
    const descTextarea = document.createElement('textarea');
    descTextarea.value = tempDescription;
    descTextarea.className = 'w-full border rounded p-2';
    descTextarea.rows = 3;
    descTextarea.addEventListener('input', (e) => {
      tempDescription = (e.target as HTMLTextAreaElement).value;
    });
    descDiv.appendChild(descTextarea);
    container.appendChild(descDiv);

    // Status dropdown with label
    const statusDiv = document.createElement('div');
    statusDiv.className = 'mb-4';
    const statusLabelEl = document.createElement('label');
    statusLabelEl.className = 'block text-sm font-medium text-gray-700';
    statusLabelEl.textContent = 'Status';
    statusDiv.appendChild(statusLabelEl);
    // TODO: replace Select with ToggleSwitch component
    const statusSelect = ComponentFactory.createSelect({
      items: ELEMENT_STATUS_OPTIONS,
      selectedValue: tempStatus,
      onChange: (v: string) => {
        tempStatus = v as ElementStatus;
      },
      className: 'w-full',
    });
    statusSelect.render(statusDiv);
    container.appendChild(statusDiv);

    // Priority dropdown with label
    const priorityDiv = document.createElement('div');
    priorityDiv.className = 'mb-4';
    const priorityLabelEl = document.createElement('label');
    priorityLabelEl.className = 'block text-sm font-medium text-gray-700';
    priorityLabelEl.textContent = 'Priority';
    priorityDiv.appendChild(priorityLabelEl);
    // TODO: replace Select with ToggleSwitch component
    // TODO: use correct priority values (create a new enum for priority)
    const prioritySelect = ComponentFactory.createSelect({
      items: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      selectedValue: tempPriority,
      onChange: (v: string) => {
        tempPriority = v as 'low' | 'medium' | 'high';
      },
      className: 'w-full',
    });
    prioritySelect.render(priorityDiv);
    container.appendChild(priorityDiv);

    if (isTask) {
      const dueDateDiv = document.createElement('div');
      dueDateDiv.className = 'mb-4';
      const dueDateLabelEl = document.createElement('label');
      dueDateLabelEl.className = 'block text-sm font-medium text-gray-700';
      dueDateLabelEl.textContent = 'Due date';
      dueDateDiv.appendChild(dueDateLabelEl);
      const dueDateInput = ComponentFactory.createInput({
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
      scaleDiv.className = 'mb-4';
      const scaleLabelEl = document.createElement('label');
      scaleLabelEl.className = 'block text-sm font-medium text-gray-700';
      scaleLabelEl.textContent = 'Масштаб';
      scaleDiv.appendChild(scaleLabelEl);
      const scaleSelect = ComponentFactory.createSelect({
        items: [
          { value: '1', label: 'Малий' },
          { value: '2', label: 'Середній' },
          { value: '3', label: 'Великий' },
        ],
        selectedValue: tempScale.toString(),
        onChange: (v: string) => {
          tempScale = Number(v) as GoalScale;
        },
        className: 'w-full',
      });
      scaleSelect.render(scaleDiv);
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
    if (this.modal) {
      // Use remove() to trigger modalService.unregister()
      this.modal.remove();
      this.modal = null;
    }
  }
}
