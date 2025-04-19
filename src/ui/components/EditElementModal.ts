import { Task } from '../../elements/Task.ts';
import { Story } from '../../elements/Story.ts';
import { Goal } from '../../elements/Goal.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { createModalShell } from '../../ui-lib/src/components/Modal.js';

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  constructor(private element: Task | Story | Goal, private scene: Scene) {}

  public show(): void {
    const typeLabel = this.element instanceof Task ? 'Task' : this.element instanceof Story ? 'Story' : 'Goal';
    const { overlay, container } = createModalShell(`Edit ${typeLabel}`, { onClose: () => this.close() });

    // Local temp state
    let tempTitle = this.element.title;
    let tempStatus = this.element.status;
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
      onChange: (v: string) => { tempTitle = v; },
      autoFocus: true,
      className: 'w-full'
    });
    titleInput.render(titleDiv);
    container.appendChild(titleDiv);

    // Status dropdown with label
    const statusDiv = document.createElement('div');
    statusDiv.className = 'mb-4';
    const statusLabelEl = document.createElement('label');
    statusLabelEl.className = 'block text-sm font-medium text-gray-700';
    statusLabelEl.textContent = 'Status';
    statusDiv.appendChild(statusLabelEl);
    const statusSelect = ComponentFactory.createSelect({
      items: [
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'done', label: 'Done' }
      ],
      selectedValue: tempStatus,
      onChange: (v: string) => { tempStatus = v as 'pending' | 'in-progress' | 'done'; },
      className: 'w-full'
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
    const prioritySelect = ComponentFactory.createSelect({
      items: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ],
      selectedValue: tempPriority,
      onChange: (v: string) => { tempPriority = v as 'low' | 'medium' | 'high'; },
      className: 'w-full'
    });
    prioritySelect.render(priorityDiv);
    container.appendChild(priorityDiv);

    // Save function
    const saveAndClose = () => {
      this.element.title = tempTitle;
      this.element.status = tempStatus;
      this.element.priority = tempPriority;
      this.scene.changes.next();
      notify('Saved!', 'success');
      this.close();
    };

    // Actions
    const btnRow = document.createElement('div');
    btnRow.className = 'flex justify-end space-x-2';
    ComponentFactory.createButton({ text: 'Cancel', onClick: () => this.close(), variant: 'outline' }).render(btnRow);
    ComponentFactory.createButton({ text: 'Save', onClick: saveAndClose, variant: 'default' }).render(btnRow);
    container.appendChild(btnRow);

    // Keyboard: handle modal shortcuts
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); saveAndClose(); }
      if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });

    this.modal = overlay;
  }

  private close(): void {
    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
    }
  }
}
