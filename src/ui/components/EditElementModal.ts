import { Task } from '../../elements/Task.ts';
import { Story } from '../../elements/Story.ts';
import { Goal } from '../../elements/Goal.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../ui-lib/src/core/ComponentFactory.ts';
import { notify } from '../../core/services/NotificationService.ts';

// Modal for editing title, status, and priority of an element
export class EditElementModal {
  private modal: HTMLDivElement | null = null;
  constructor(private element: Task | Story | Goal, private scene: Scene) {}

  public show(): void {
    // Overlay and container
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/15 backdrop-blur-xs flex items-center justify-center';
    // Ensure overlay above canvas
    overlay.style.zIndex = '200';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    const container = document.createElement('div');
    container.className = 'bg-white rounded-lg p-6 w-96 space-y-4 shadow-lg';
    container.tabIndex = 0;
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    container.focus();

    // Modal header for clarity
    const headerEl = document.createElement('h2');
    headerEl.className = 'text-lg font-semibold';
    const typeLabel = this.element instanceof Task
      ? 'Task'
      : this.element instanceof Story
      ? 'Story'
      : 'Goal';
    headerEl.textContent = `Edit ${typeLabel}`;
    container.appendChild(headerEl);

    // Local temp state
    let tempTitle = this.element.title;
    let tempStatus = this.element.status;
    let tempPriority = this.element.priority;

    // Title input
    const titleInput = ComponentFactory.createInput({
      value: tempTitle,
      onChange: (v: string) => { tempTitle = v; },
      autoFocus: true,
      className: 'w-full'
    });
    titleInput.render(container);

    // Status dropdown
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
    statusSelect.render(container);

    // Priority dropdown
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
    prioritySelect.render(container);

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

    // Keyboard: Enter=Save, Escape=Close
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveAndClose();
      if (e.key === 'Escape') this.close();
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
