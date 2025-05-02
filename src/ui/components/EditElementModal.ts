import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { notify } from '../../core/services/NotificationService.ts';
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
    const { overlay, container } = createModalShell(`Edit ${typeLabel}`, {
      onClose: () => this.close(),
    });

    // Local temp state
    let tempTitle = this.element.title;
    let tempDescription = this.element.description;
    let tempStatus: ElementStatus = this.element.status;
    let tempPriority = this.element.priority;

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

    // Save function
    const saveAndClose = () => {
      this.element.title = tempTitle;
      this.element.description = tempDescription;
      this.element.status = tempStatus;
      this.element.priority = tempPriority;
      this.scene.changes.next();
      notify('Saved!', 'success');
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
