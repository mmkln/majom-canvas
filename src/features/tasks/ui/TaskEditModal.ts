import { Input } from '../../../ui-lib/src/components/Input.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../ui-lib/src/components/Modal.ts';
import { SearchDropdownSelect } from '../../../ui-lib/src/components/SearchDropdownSelect.ts';
import { StaticDropdownSelect } from '../../../ui-lib/src/components/StaticDropdownSelect.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createField,
  createSurface,
  createTextButton,
  setTextButtonLoading,
} from '../../../ui-lib/src/hud/index.ts';
import { createIcon } from '../../../ui-lib/src/hud/icons.ts';
import type {
  Priority,
  Status,
} from '../../../majom-wrapper/interfaces/index.ts';
import {
  applyTaskEditPatch,
  createTaskEditPatch,
  isTaskEditPatchEmpty,
  setTaskEditGoal,
  setTaskEditStory,
  TASK_EDIT_PRIORITY_VALUES,
  TASK_EDIT_STATUS_VALUES,
  type TaskEditCapabilities,
  type TaskEditModel,
  type TaskEditPatch,
  type TaskEditRelationOption,
} from '../domain/index.ts';
import type { TaskEditPort } from '../ports/index.ts';
import {
  confirmUnsavedTaskChangesModal,
  type ConfirmUnsavedTaskChangesLabels,
} from './ConfirmUnsavedTaskChangesModal.ts';
import { ensureTaskEditModalStyles } from './taskEditModalStyles.ts';

export type TaskEditModalLabels = {
  title: string;
  titleField: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  goal: string;
  story: string;
  goalPlaceholder: string;
  storyPlaceholder: string;
  goalSearchPlaceholder: string;
  storySearchPlaceholder: string;
  clearRelation: string;
  clearSearch: string;
  loadingOptions: string;
  goalEmpty: string;
  storyEmpty: string;
  goalHint: string;
  storyHint: string;
  relationSearchError: string;
  cancel: string;
  save: string;
  saving: string;
  loading: string;
  loadError: string;
  saveError: string;
  deleteTask: string;
  deleting: string;
  deleteError: string;
  deleteConfirm: string;
  actionsLabel: string;
  titleRequired: string;
  closeLabel: string;
  getStatusLabel: (status: Status) => string;
  getPriorityLabel: (priority: Priority) => string;
  unsaved: ConfirmUnsavedTaskChangesLabels;
};

export type TaskEditModalOptions = {
  task: TaskEditModel;
  port: TaskEditPort;
  labels?: Partial<TaskEditModalLabels>;
  capabilities?: TaskEditCapabilities;
  onClose?: (result: { saved: boolean; task: TaskEditModel | null }) => void;
};

const DEFAULT_CAPABILITIES: Required<TaskEditCapabilities> = {
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  goal: true,
  story: true,
  delete: true,
};

const DEFAULT_LABELS: TaskEditModalLabels = {
  title: 'Edit task',
  titleField: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  dueDate: 'Due date',
  goal: 'Goal',
  story: 'Story',
  goalPlaceholder: 'Select goal',
  storyPlaceholder: 'Select story',
  goalSearchPlaceholder: 'Search goals...',
  storySearchPlaceholder: 'Search stories...',
  clearRelation: 'Clear',
  clearSearch: 'Clear search',
  loadingOptions: 'Loading...',
  goalEmpty: 'No goals found',
  storyEmpty: 'No stories found',
  goalHint: 'Search for a goal',
  storyHint: 'Search for a story',
  relationSearchError: 'Could not load options.',
  cancel: 'Cancel',
  save: 'Save',
  saving: 'Saving...',
  loading: 'Loading task...',
  loadError: 'Could not load task.',
  saveError: 'Could not save task.',
  deleteTask: 'Delete task',
  deleting: 'Deleting...',
  deleteError: 'Could not delete task.',
  deleteConfirm: 'Delete "{title}" permanently? This action cannot be undone.',
  actionsLabel: 'Task actions',
  titleRequired: 'Title is required',
  closeLabel: 'Close',
  getStatusLabel: formatEnumLabel,
  getPriorityLabel: formatEnumLabel,
  unsaved: {
    title: 'Discard unsaved changes?',
    message: 'You have unsaved changes. If you close now, your edits will be lost.',
    keepEditing: 'Keep editing',
    discard: 'Discard',
    saveChanges: 'Save changes',
  },
};

export class TaskEditModal {
  private overlay: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private saveButton: HTMLButtonElement | null = null;
  private actionMenu: AnchoredMenu | null = null;
  private readonly dropdowns: Array<{ destroy: () => void }> = [];
  private readonly labels: TaskEditModalLabels;
  private readonly capabilities: Required<TaskEditCapabilities>;
  private original: TaskEditModel;
  private draft: TaskEditModel;
  private loading = false;
  private loadFailed = false;
  private saving = false;
  private deleting = false;
  private saveFailed = false;
  private deleteFailed = false;
  private titleError: string | null = null;
  private closed = false;

  constructor(private readonly options: TaskEditModalOptions) {
    this.original = { ...options.task };
    this.draft = { ...options.task };
    this.labels = {
      ...DEFAULT_LABELS,
      ...options.labels,
      unsaved: {
        ...DEFAULT_LABELS.unsaved,
        ...(options.labels?.unsaved ?? {}),
      },
    };
    this.capabilities = {
      ...DEFAULT_CAPABILITIES,
      ...(options.capabilities ?? {}),
    };
  }

  public show(): void {
    ensureTaskEditModalStyles();
    const { overlay, body, footer, container } = createModalShell(
      this.labels.title,
      {
        onClose: () => {
          void this.requestClose();
        },
        intent: 'form',
        hideCloseButton: true,
      }
    );
    this.overlay = overlay;
    this.body = body;
    this.footer = footer;
    this.mountHeaderActions(container);
    container.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        const target = event.target;
        if (target instanceof HTMLTextAreaElement) return;
        if (target instanceof HTMLButtonElement) return;
        event.preventDefault();
        void this.save();
      }
    });
    this.render();
    if (this.options.port.loadTask) {
      void this.loadFullTask();
    }
  }

  public close(result: { saved: boolean; task: TaskEditModel | null } = {
    saved: false,
    task: null,
  }): void {
    if (this.closed) return;
    this.closed = true;
    this.destroyDropdowns();
    this.destroyActionMenu();
    this.overlay?.remove();
    this.overlay = null;
    this.options.onClose?.(result);
  }

  private async loadFullTask(): Promise<void> {
    this.loading = true;
    this.loadFailed = false;
    this.render();
    try {
      const loaded = await this.options.port.loadTask?.();
      if (!loaded || this.closed) return;
      this.original = { ...loaded };
      this.draft = { ...loaded };
    } catch {
      this.loadFailed = true;
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private render(): void {
    if (!this.body || !this.footer) return;
    this.destroyDropdowns();
    this.body.replaceChildren(this.renderBody());
    this.footer.replaceChildren(this.renderFooter());
  }

  private mountHeaderActions(container: HTMLDivElement): void {
    const actions = document.createElement('div');
    actions.className = 'task-edit-modal-header-actions';

    if (this.canDeleteTask()) {
      const menuButton = createIconButton({
        icon: 'ellipsis-vertical',
        ariaLabel: this.labels.actionsLabel,
        title: this.labels.actionsLabel,
        size: 'sm',
        tone: 'text',
        className: 'task-edit-modal-header-button',
      });
      menuButton.setAttribute('aria-expanded', 'false');

      const panel = createSurface({
        elevated: true,
        className:
          'absolute left-0 top-0 z-40 hidden min-w-[190px] overflow-hidden',
      });
      panel.setAttribute('role', 'menu');
      panel.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });

      const deleteIcon = createIcon('trash', { size: 14, strokeWidth: 1.8 });
      deleteIcon.classList.add('shrink-0', 'text-rose-600');
      deleteIcon.setAttribute('aria-hidden', 'true');

      const deleteItem = createDropdownItem({
        label: this.deleting ? this.labels.deleting : this.labels.deleteTask,
        leading: deleteIcon,
        tone: 'danger',
        disabled: this.deleting,
        onClick: (event) => {
          event.stopPropagation();
          this.actionMenu?.close();
          void this.deleteTask();
        },
      });
      deleteItem.setAttribute('role', 'menuitem');
      deleteItem.setAttribute('data-task-edit-delete', 'true');
      deleteItem.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      panel.appendChild(deleteItem);

      this.actionMenu = new AnchoredMenu({
        container: menuButton,
        panel,
        positioning: 'viewport',
        portalTarget: this.overlay ?? undefined,
        onOpenChange: (open) => {
          menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
        },
      });
      this.actionMenu.mount();
      menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (this.actionMenu?.isOpen()) {
          this.actionMenu.close();
          return;
        }
        this.actionMenu?.openAt({
          anchor: menuButton,
          placement: 'bottom-end',
          fallbackPlacements: ['top-end', 'bottom-start', 'top-start'],
          gap: 8,
          margin: 12,
          lockPlacementAfterOpen: true,
        });
      });
      actions.appendChild(menuButton);
    }

    actions.appendChild(
      createIconButton({
        icon: 'x-mark',
        ariaLabel: this.labels.closeLabel,
        title: this.labels.closeLabel,
        size: 'sm',
        tone: 'text',
        className: 'task-edit-modal-header-button',
        onClick: () => {
          void this.requestClose();
        },
      })
    );
    container.appendChild(actions);
  }

  private renderBody(): HTMLElement {
    const form = document.createElement('div');
    form.className = 'task-edit-modal-form';

    if (this.loading) {
      form.appendChild(this.renderMessage(this.labels.loading));
      return form;
    }
    if (this.loadFailed) {
      form.appendChild(this.renderMessage(this.labels.loadError));
      return form;
    }

    const titleInput = new Input({
      value: this.draft.title,
      className: 'task-edit-modal-input',
      disabled: this.isInteractionLocked(),
      onInput: (value) => {
        this.draft.title = value;
        this.titleError = null;
      },
    }).createElement();
    form.appendChild(
      createField({
        label: this.labels.titleField,
        control: titleInput,
        required: true,
        error: this.titleError ?? undefined,
      }).element
    );

    if (this.capabilities.description) {
      const description = document.createElement('textarea');
      description.className = 'task-edit-modal-textarea';
      description.value = this.draft.description;
      description.disabled = this.isInteractionLocked();
      description.addEventListener('input', () => {
        this.draft.description = description.value;
      });
      form.appendChild(
        createField({
          label: this.labels.description,
          control: description,
        }).element
      );
    }

    const grid = document.createElement('div');
    grid.className = 'task-edit-modal-grid';
    if (this.capabilities.status) {
      grid.appendChild(this.renderStatusField());
    }
    if (this.capabilities.priority) {
      grid.appendChild(this.renderPriorityField());
    }
    if (this.capabilities.dueDate) {
      grid.appendChild(this.renderDueDateField());
    }
    if (grid.children.length > 0) {
      form.appendChild(grid);
    }

    const relationGrid = document.createElement('div');
    relationGrid.className = 'task-edit-modal-grid';
    if (this.capabilities.goal && this.options.port.searchGoals) {
      relationGrid.appendChild(this.renderGoalField());
    }
    if (this.capabilities.story && this.options.port.searchStories) {
      relationGrid.appendChild(this.renderStoryField());
    }
    if (relationGrid.children.length > 0) {
      form.appendChild(relationGrid);
    }

    if (this.saveFailed) {
      form.appendChild(this.renderMessage(this.labels.saveError));
    }
    if (this.deleteFailed) {
      form.appendChild(this.renderMessage(this.labels.deleteError));
    }
    return form;
  }

  private renderFooter(): HTMLElement {
    const row = createModalActionRow({ variant: 'form' });
    row.append(
      createTextButton({
        text: this.labels.cancel,
        tone: 'text',
        size: 'md',
        className: getModalActionButtonClass('default'),
        disabled: this.isInteractionLocked(),
        onClick: () => {
          void this.requestClose();
        },
      })
    );
    this.saveButton = createTextButton({
      text: this.labels.save,
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      disabled: this.loading || this.loadFailed || this.isInteractionLocked(),
      onClick: () => {
        void this.save();
      },
    });
    if (this.saving) {
      setTextButtonLoading(this.saveButton, true, { text: this.labels.saving });
    }
    row.append(this.saveButton);
    return row;
  }

  private renderStatusField(): HTMLElement {
    const select = new StaticDropdownSelect<Status>({
      value: this.draft.status,
      placeholder: this.labels.status,
      items: [...TASK_EDIT_STATUS_VALUES],
      getKey: (status) => status,
      getLabel: (status) => this.labels.getStatusLabel(status),
      onSelect: (status) => {
        this.draft.status = status;
      },
      disabled: this.isInteractionLocked(),
      ariaLabel: this.labels.status,
      portalTarget: this.overlay ?? undefined,
    });
    this.dropdowns.push(select);
    return createField({
      label: this.labels.status,
      control: select.element,
    }).element;
  }

  private renderPriorityField(): HTMLElement {
    const select = new StaticDropdownSelect<Priority>({
      value: this.draft.priority,
      placeholder: this.labels.priority,
      items: [...TASK_EDIT_PRIORITY_VALUES],
      getKey: (priority) => priority,
      getLabel: (priority) => this.labels.getPriorityLabel(priority),
      onSelect: (priority) => {
        this.draft.priority = priority;
      },
      disabled: this.isInteractionLocked(),
      ariaLabel: this.labels.priority,
      portalTarget: this.overlay ?? undefined,
    });
    this.dropdowns.push(select);
    return createField({
      label: this.labels.priority,
      control: select.element,
    }).element;
  }

  private renderDueDateField(): HTMLElement {
    const input = new Input({
      value: this.draft.dueDate ?? '',
      type: 'date',
      className: 'task-edit-modal-input',
      disabled: this.isInteractionLocked(),
      onInput: (value) => {
        this.draft.dueDate = value || null;
      },
    }).createElement();
    return createField({
      label: this.labels.dueDate,
      control: input,
    }).element;
  }

  private renderGoalField(): HTMLElement {
    const select = new SearchDropdownSelect<TaskEditRelationOption>({
      value: this.draft.goal,
      placeholder: this.labels.goalPlaceholder,
      searchPlaceholder: this.labels.goalSearchPlaceholder,
      clearSearchLabel: this.labels.clearSearch,
      loadingLabel: this.labels.loadingOptions,
      emptyLabel: this.labels.goalEmpty,
      hintLabel: this.labels.goalHint,
      errorFallbackLabel: this.labels.relationSearchError,
      getKey: (goal) => String(goal.id),
      getLabel: (goal) => goal.title,
      onSelect: (goal) => {
        this.draft = setTaskEditGoal(this.draft, goal);
        this.render();
      },
      loadPage: async (term, page, pageSize) => {
        const result = await this.options.port.searchGoals!({
          query: term,
          page,
          pageSize,
        });
        return {
          items: result.items,
          hasMore: result.nextPage !== null,
        };
      },
      disabled: this.isInteractionLocked(),
      ariaLabel: this.labels.goal,
      portalTarget: this.overlay ?? undefined,
    });
    this.dropdowns.push(select);
    return this.renderRelationField({
      label: this.labels.goal,
      control: select.element,
      selected: this.draft.goal !== null,
      onClear: () => {
        this.draft = setTaskEditGoal(this.draft, null);
        this.render();
      },
    });
  }

  private renderStoryField(): HTMLElement {
    const select = new SearchDropdownSelect<TaskEditRelationOption>({
      value: this.draft.story,
      placeholder: this.labels.storyPlaceholder,
      searchPlaceholder: this.labels.storySearchPlaceholder,
      clearSearchLabel: this.labels.clearSearch,
      loadingLabel: this.labels.loadingOptions,
      emptyLabel: this.labels.storyEmpty,
      hintLabel: this.labels.storyHint,
      errorFallbackLabel: this.labels.relationSearchError,
      getKey: (story) => String(story.id),
      getLabel: (story) => story.title,
      onSelect: (story) => {
        this.draft = setTaskEditStory(this.draft, story);
        this.render();
      },
      loadPage: async (term, page, pageSize) => {
        const result = await this.options.port.searchStories!({
          query: term,
          page,
          pageSize,
          goalId: this.draft.goalId,
        });
        return {
          items: result.items,
          hasMore: result.nextPage !== null,
        };
      },
      disabled: this.isInteractionLocked(),
      ariaLabel: this.labels.story,
      portalTarget: this.overlay ?? undefined,
    });
    this.dropdowns.push(select);
    return this.renderRelationField({
      label: this.labels.story,
      control: select.element,
      selected: this.draft.story !== null,
      onClear: () => {
        this.draft = setTaskEditStory(this.draft, null);
        this.render();
      },
    });
  }

  private renderRelationField(options: {
    label: string;
    control: HTMLElement;
    selected: boolean;
    onClear: () => void;
  }): HTMLElement {
    const row = document.createElement('div');
    row.className = 'task-edit-modal-relation-control';
    row.appendChild(options.control);
    const clearButton = createIconButton({
      icon: 'x-mark',
      ariaLabel: this.labels.clearRelation,
      size: 'sm',
      tone: 'text',
      className: 'task-edit-modal-relation-clear',
      disabled: this.isInteractionLocked() || !options.selected,
      onClick: options.onClear,
    });
    row.appendChild(clearButton);
    return createField({
      label: options.label,
      control: row,
    }).element;
  }

  private async requestClose(): Promise<void> {
    if (this.deleting) return;
    if (!this.hasUnsavedChanges()) {
      this.close();
      return;
    }
    const action = await confirmUnsavedTaskChangesModal(this.labels.unsaved);
    if (action === 'discard') {
      this.close();
      return;
    }
    if (action === 'save-and-close') {
      await this.save();
    }
  }

  private async deleteTask(): Promise<void> {
    if (
      this.loading ||
      this.saving ||
      this.deleting ||
      this.loadFailed ||
      !this.canDeleteTask()
    ) {
      return;
    }
    const confirmed = window.confirm(
      formatTaskLabel(this.labels.deleteConfirm, this.original)
    );
    if (!confirmed) return;

    this.deleting = true;
    this.deleteFailed = false;
    this.render();
    try {
      await this.options.port.deleteTask!();
      if (this.closed) return;
      this.close({ saved: false, task: null });
    } catch {
      this.deleting = false;
      this.deleteFailed = true;
      this.render();
    }
  }

  private async save(): Promise<void> {
    if (this.loading || this.saving || this.deleting || this.loadFailed) return;
    if (this.draft.title.trim().length === 0) {
      this.titleError = this.labels.titleRequired;
      this.render();
      return;
    }

    const patch = createTaskEditPatch(this.original, this.draft);
    if (isTaskEditPatchEmpty(patch)) {
      this.close({ saved: false, task: this.original });
      return;
    }

    this.saving = true;
    this.saveFailed = false;
    this.render();
    try {
      const saved = await this.options.port.saveTaskPatch(patch);
      if (this.closed) return;
      const nextTask = saved ?? applyTaskEditPatch(this.original, patch);
      this.close({ saved: true, task: nextTask });
    } catch {
      this.saving = false;
      this.saveFailed = true;
      this.render();
    }
  }

  private hasUnsavedChanges(): boolean {
    return !isTaskEditPatchEmpty(createTaskEditPatch(this.original, this.draft));
  }

  private canDeleteTask(): boolean {
    return this.capabilities.delete && Boolean(this.options.port.deleteTask);
  }

  private isInteractionLocked(): boolean {
    return this.saving || this.deleting;
  }

  private renderMessage(text: string): HTMLElement {
    const message = document.createElement('div');
    message.className = 'task-edit-modal-message';
    message.textContent = text;
    return message;
  }

  private destroyDropdowns(): void {
    this.dropdowns.splice(0).forEach((dropdown) => dropdown.destroy());
  }

  private destroyActionMenu(): void {
    this.actionMenu?.unmount();
    this.actionMenu = null;
  }
}

function formatEnumLabel(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatTaskLabel(template: string, task: TaskEditModel): string {
  return template.replace('{title}', task.title);
}
