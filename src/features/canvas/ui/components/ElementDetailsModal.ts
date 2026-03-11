import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { ComponentFactory } from '../../../../ui-lib/src/core/ComponentFactory.ts';
import {
  createModalActionRow,
  createModalShell,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { confirmUnsavedChangesModal } from './ConfirmUnsavedChangesModal.ts';
import {
  createField,
  createSegmentedControl,
  createTextButton,
  type SegmentedControl,
} from '../primitives/index.ts';
import {
  ElementDetailsService,
  type StoryListItemVM,
  type TaskListItemVM,
} from '../../core/services/ElementDetailsService.ts';
import { environment } from '../../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import type { Subscription } from 'rxjs';
import {
  ELEMENT_STATUS_OPTIONS,
  ElementStatus,
} from '../../elements/ElementStatus.ts';
import { emitCanvasPositionsDirty } from '../../core/canvasPositionsLifecycle.ts';
import { emitCanvasElementDetailsEdited } from '../../core/canvasElementLifecycle.ts';

type CanvasElement = TaskElement | StoryElement | GoalElement;

export class ElementDetailsModal {
  private modal: HTMLDivElement | null = null;
  private readonly detailsService: ElementDetailsService;
  private subscriptions: Subscription[] = [];
  private storyTasksSubscription: Subscription | null = null;
  private selectedStoryId: number | null = null;
  private priorityControl: SegmentedControl<'low' | 'medium' | 'high'> | null =
    null;
  private scaleControl: SegmentedControl<GoalScale> | null = null;

  constructor(
    private readonly element: CanvasElement,
    private readonly scene: Scene
  ) {
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.detailsService = new ElementDetailsService(
      scene,
      new GoalsApiService(http),
      new StoriesApiService(http)
    );
  }

  public show(): void {
    this.destroyControls();
    this.storyTasksSubscription?.unsubscribe();
    this.storyTasksSubscription = null;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

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

    const { overlay, container, body, footer } = createModalShell(
      `${this.getTypeLabel()} details`,
      {
        onClose: () => {
          void requestClose();
        },
        intent: 'form',
      }
    );
    this.modal = overlay;
    container.classList.add(
      'max-w-none',
      'md:w-[min(84rem,calc(100vw-2rem))]',
      'md:max-h-[min(92vh,60rem)]'
    );

    const root = document.createElement('div');
    root.className =
      'grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]';
    body.appendChild(root);

    const formPane = document.createElement('div');
    formPane.className = 'min-w-0 lg:border-r lg:border-slate-200 lg:pr-5';
    root.appendChild(formPane);

    const rightPane = document.createElement('div');
    rightPane.className =
      'min-w-0 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-0 md:divide-x md:divide-slate-200';
    root.appendChild(rightPane);

    const storiesSection = this.createRightSection('Stories', 'md:pr-4');
    const tasksSection = this.createRightSection('Tasks', 'md:pl-4');
    rightPane.append(storiesSection.element, tasksSection.element);

    const formContent = document.createElement('div');
    formContent.className = 'space-y-4 pb-2';
    formPane.appendChild(formContent);

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

    this.priorityControl = createSegmentedControl({
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
      if (this.element instanceof GoalElement && originalScale !== tempScale) {
        this.element.setScale(tempScale);
        scaleChanged = true;
      }

      this.scene.changes.next();
      if (Object.keys(patch).length > 0) {
        emitCanvasElementDetailsEdited(this.element, patch);
      }
      if (scaleChanged) {
        emitCanvasPositionsDirty([this.element]);
      }
      this.close();
    };

    const actions = createModalActionRow({ variant: 'form' });
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
      onClick: saveAndClose,
    });
    actions.append(cancelBtn, saveBtn);
    footer.appendChild(actions);

    titleInputEl.focus();
    container.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        const target = e.target;
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

    if (this.element instanceof StoryElement) {
      this.renderMessage(storiesSection.content, 'Current story');
      const refId = Number.isFinite(this.element.backendId)
        ? (this.element.backendId as number)
        : null;
      if (refId === null) {
        this.renderMessage(
          tasksSection.content,
          'Story is not linked to backend yet'
        );
      } else {
        this.loadTasks(tasksSection.content, {
          id: refId,
          uuid: this.element.uuid,
        });
      }
      return;
    }

    this.renderMessage(storiesSection.content, 'Loading stories...');
    this.renderMessage(tasksSection.content, 'Select a story');
    const storiesSub = this.detailsService
      .loadStoriesForElement(this.element)
      .subscribe((stories) => {
        if (stories.length === 0) {
          this.selectedStoryId = null;
          this.renderMessage(tasksSection.content, 'No tasks to display');
        } else {
          this.selectedStoryId = stories[0].id;
          this.loadTasks(tasksSection.content, {
            id: stories[0].id,
            uuid: stories[0].uuid,
          });
        }
        this.renderStoriesList(
          storiesSection.content,
          stories,
          tasksSection.content
        );
      });
    this.subscriptions.push(storiesSub);
  }

  private loadTasks(
    container: HTMLElement,
    ref: { id: number; uuid?: string }
  ): void {
    this.storyTasksSubscription?.unsubscribe();
    this.renderMessage(container, 'Loading tasks...');
    this.storyTasksSubscription = this.detailsService
      .loadTasksForStory({ id: ref.id, uuid: ref.uuid ?? null })
      .subscribe((tasks) => this.renderTaskList(container, tasks));
    this.subscriptions.push(this.storyTasksSubscription);
  }

  private renderStoriesList(
    container: HTMLElement,
    stories: StoryListItemVM[],
    tasksContainer: HTMLElement
  ): void {
    container.innerHTML = '';
    if (stories.length === 0) {
      this.renderMessage(container, 'No related stories');
      return;
    }
    const list = document.createElement('div');
    list.className = 'divide-y divide-slate-200';
    stories.forEach((story) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const selected = this.selectedStoryId === story.id;
      btn.className =
        'w-full px-2 py-2 text-left text-sm transition-colors hover:bg-slate-50';
      if (selected) {
        btn.classList.add('bg-indigo-50');
      }
      btn.innerHTML = `<div class="font-medium text-slate-900">${story.title}</div><div class="text-xs text-slate-500">Tasks: ${story.tasksCount} | ${story.isOnCanvas ? 'On canvas' : 'Not on canvas'}</div>`;
      btn.addEventListener('click', () => {
        this.selectedStoryId = story.id;
        this.renderStoriesList(container, stories, tasksContainer);
        this.loadTasks(tasksContainer, { id: story.id, uuid: story.uuid });
      });
      list.appendChild(btn);
    });
    container.appendChild(list);
  }

  private renderTaskList(container: HTMLElement, tasks: TaskListItemVM[]): void {
    container.innerHTML = '';
    if (tasks.length === 0) {
      this.renderMessage(container, 'No tasks in this story');
      return;
    }
    const list = document.createElement('div');
    list.className = 'divide-y divide-slate-200';
    tasks.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'px-2 py-2 text-sm';
      item.innerHTML = `<div class="font-medium text-slate-900">${task.title}</div><div class="text-xs text-slate-500">${task.isOnCanvas ? 'On canvas' : 'Not on canvas'}</div>`;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  private renderMessage(container: HTMLElement, text: string): void {
    container.innerHTML = '';
    const empty = document.createElement('div');
    empty.className =
      'rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500';
    empty.textContent = text;
    container.appendChild(empty);
  }

  private createRightSection(
    title: string,
    className = ''
  ): { element: HTMLDivElement; content: HTMLDivElement } {
    const element = document.createElement('div');
    element.className = `min-w-0 ${className}`.trim();
    const heading = document.createElement('h3');
    heading.className = 'mb-2 text-sm font-semibold text-slate-900';
    heading.textContent = title;
    const content = document.createElement('div');
    content.className = 'min-h-[260px]';
    element.append(heading, content);
    return { element, content };
  }

  private getTypeLabel(): string {
    if (this.element instanceof TaskElement) return 'Task';
    if (this.element instanceof StoryElement) return 'Story';
    return 'Goal';
  }

  private close(): void {
    this.destroyControls();
    this.storyTasksSubscription?.unsubscribe();
    this.storyTasksSubscription = null;
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.modal) {
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
