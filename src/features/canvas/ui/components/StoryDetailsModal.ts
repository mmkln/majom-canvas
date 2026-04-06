import { Subscription } from 'rxjs';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import {
  PatchPlanningElementCommand,
  type PlanningElementPatch,
} from '../../core/commands/PatchPlanningElementCommand.ts';
import { AddElementCommand } from '../../core/commands/AddElementCommand.ts';
import { ResizeCommand } from '../../core/commands/ResizeCommand.ts';
import { editElement$ } from '../../core/eventBus.ts';
import {
  createModalActionRow,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createPaneModalShell } from '../../../../ui-lib/src/components/PaneModal.ts';
import {
  type ConfirmUnsavedChangesAction,
  confirmUnsavedChangesModal,
} from './ConfirmUnsavedChangesModal.ts';
import {
  createBadge,
  AnchoredMenu,
  createDropdownItem,
  createField,
  createIconButton,
  createSegmentedControl,
  createSurface,
  createTextButton,
  type SegmentedControl,
} from '../primitives/index.ts';
import { createIcon } from '../icons.ts';
import {
  ELEMENT_STATUS_VALUES,
  ElementStatus,
} from '../../elements/ElementStatus.ts';
import type { PlatformTask } from '../../../../majom-wrapper/interfaces/index.ts';
import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import {
  getStatusLabel,
  STATUS_BADGE_TONE_CLASS,
  STATUS_ICON_MAP,
  STATUS_ICON_TONE_CLASS,
} from '../statusPresentation.ts';
import { environment } from '../../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { createPlanningEntityIcon } from './PlanningEntityIcon.ts';
import { emitTaskStoryLinkSet } from '../../core/canvasLinkLifecycle.ts';
import { StoryLayoutService } from '../../core/services/StoryLayoutService.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import {
  buildPlanningDescriptionField,
  buildPlanningTitleField,
} from './planningDetailsInlineFields.ts';
import {
  createHierarchyEmptyState,
  getHierarchyRowClass,
  HIERARCHY_PANEL_HEADER_CLASS,
  HIERARCHY_PANEL_LIST_CLASS,
  HIERARCHY_PANEL_SECTION_CLASS,
  HIERARCHY_STATUS_BADGE_CLASS,
  styleHierarchyActionButton,
} from './planningDetailsHierarchyPanel.ts';

type DescriptionMode = 'view' | 'edit';
type TitleFieldMode = 'view' | 'edit';

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

type StoryTaskListItem = {
  key: string;
  title: string;
  status: ElementStatus;
  canvasTask: TaskElement | null;
};

type StoryTasksPanelController = {
  element: HTMLDivElement;
  setLoading: () => void;
  setTasks: (tasks: StoryTaskListItem[]) => void;
  setError: (message: string) => void;
};

export class StoryDetailsModal {
  private modal: HTMLDivElement | null = null;
  private statusControl: SegmentedControl<ElementStatus> | null = null;
  private priorityControl: SegmentedControl<UiPriority> | null = null;
  private storyTaskLoadSubscription: Subscription | null = null;

  constructor(
    private readonly story: StoryElement,
    private readonly scene: Scene,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {}

  public show(): void {
    this.destroyControls();

    const originalTitle = this.story.title;
    const originalDescription = this.story.description;
    const originalStatus = this.story.status;
    const originalPriority = this.story.priority;
    const initialHeaderTitle = this.getStoryHeaderTitle();

    let tempTitle = originalTitle;
    let tempDescription = originalDescription;
    let tempStatus = originalStatus;
    let tempPriority = originalPriority;
    let tasksVisible = true;
    let closeGuardOpen = false;
    let saveAndClose: (() => void) | null = null;

    const hasUnsavedChanges = (): boolean => {
      if (tempTitle.trim() !== originalTitle) return true;
      if (tempDescription !== originalDescription) return true;
      if (tempStatus !== originalStatus) return true;
      if (tempPriority !== originalPriority) return true;
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

    const { overlay, container, body, titleWrap, titleElement, actions } =
      createPaneModalShell(initialHeaderTitle, {
        onClose: () => {
          void requestClose();
        },
        intent: 'form',
      });
    this.decorateHeaderTitle(titleWrap, titleElement);

    const closeButton = actions.querySelector<HTMLButtonElement>(
      'button[aria-label="Close dialog"]'
    );
    const tasksToggleButton = this.createTasksToggleButton({
      getVisible: () => tasksVisible,
      onToggle: () => {
        tasksVisible = !tasksVisible;
        syncTasksVisibility();
      },
    });
    tasksToggleButton.setAttribute('data-story-tasks-toggle', 'true');
    const headerDivider = document.createElement('div');
    headerDivider.className = 'h-5 w-px shrink-0 bg-slate-200';
    headerDivider.setAttribute('aria-hidden', 'true');
    if (closeButton) {
      actions.insertBefore(tasksToggleButton, closeButton);
      actions.insertBefore(headerDivider, closeButton);
    } else {
      actions.append(tasksToggleButton, headerDivider);
    }

    const contentLayout = document.createElement('div');
    const storyLayoutWidths = {
      compact: '34rem',
      split: '78rem',
    } as const;
    const getLayoutMode = (): 'compact' | 'split' =>
      tasksVisible ? 'split' : 'compact';
    const applyContainerWidth = (): void => {
      const width = storyLayoutWidths[getLayoutMode()];
      container.style.width = `min(${width}, calc(100vw - 2rem))`;
      container.style.maxWidth = width;
    };
    const applyContentLayout = (): void => {
      const layoutMode = getLayoutMode();
      contentLayout.className =
        layoutMode === 'split'
          ? 'grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,34rem)_1px_minmax(0,1fr)]'
          : 'grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,34rem)]';
    };
    const syncTasksVisibility = (): void => {
      applyContainerWidth();
      applyContentLayout();
      divider.hidden = !tasksVisible;
      storyTasksPanel.element.hidden = !tasksVisible;
      this.updateTasksToggleButtonLabel(tasksToggleButton, tasksVisible);
    };
    this.modal = overlay;
    container.style.transition = 'width 180ms ease, max-width 180ms ease';
    container.style.height = 'min(44rem, calc(100dvh - 2rem))';
    container.style.maxHeight = 'min(44rem, calc(100dvh - 2rem))';

    applyContainerWidth();
    applyContentLayout();
    body.appendChild(contentLayout);

    const formPane = document.createElement('section');
    formPane.className = 'min-h-0 min-w-0 overflow-hidden';
    formPane.setAttribute('data-story-form-pane', 'true');
    contentLayout.appendChild(formPane);

    const formLayout = document.createElement('div');
    formLayout.className = 'flex h-full min-h-0 flex-col';
    formPane.appendChild(formLayout);

    const formContent = document.createElement('div');
    formContent.className =
      'min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-4 md:px-5 md:pt-5 md:pb-5';
    formLayout.appendChild(formContent);

    const divider = document.createElement('div');
    divider.className = 'hidden h-full w-px bg-slate-200 md:block';

    const storyTasksPanel = this.buildStoryTasksPanel(() => {
      tasksVisible = false;
      syncTasksVisibility();
    }, () => {
      this.createTaskInStory();
      this.loadStoryTasks(storyTasksPanel);
    });
    contentLayout.append(divider, storyTasksPanel.element);
    syncTasksVisibility();
    this.loadStoryTasks(storyTasksPanel);

    const titleField = this.buildTitleField({
      getValue: () => tempTitle,
      setValue: (value) => {
        tempTitle = value;
      },
    });
    titleField.setMode('view', { focus: false });
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
      size: 'md',
      fullWidth: true,
      ariaLabel: this.t('planningDetails.field.status'),
      options: ELEMENT_STATUS_VALUES.map((status) => ({
        id: `status-${status}`,
        value: status,
        label: this.getStatusLabel(status),
        icon: STATUS_ICON_MAP[status],
        iconColorClassName: STATUS_ICON_TONE_CLASS[status],
        title: this.getStatusLabel(status),
      })),
      value: tempStatus,
      onChange: (value) => {
        tempStatus = value;
      },
    });
    const statusField = createField({
      label: this.t('planningDetails.field.status'),
      control: this.statusControl.element,
    });
    formContent.appendChild(statusField.element);

    this.priorityControl = this.createPriorityControl(tempPriority, (value) => {
      tempPriority = value;
    });
    const priorityField = createField({
      label: this.t('planningDetails.field.priority'),
      control: this.priorityControl.element,
    });
    formContent.appendChild(priorityField.element);

    saveAndClose = () => {
        const normalizedTitle = tempTitle.trim();
      if (normalizedTitle.length === 0) {
        titleField.setRequiredError(this.t('planningDetails.validation.titleRequired'));
        titleField.setMode('edit', { focus: true });
        titleField.focusInput({ select: true });
        return;
      }

      const patch: PlanningElementPatch = {};
      if (normalizedTitle !== originalTitle) patch.title = normalizedTitle;
      if (tempDescription !== originalDescription) {
        patch.description = tempDescription;
      }
      if (tempStatus !== originalStatus) patch.status = tempStatus;
      if (tempPriority !== originalPriority) patch.priority = tempPriority;

      if (Object.keys(patch).length > 0) {
        historyService.execute(
          new PatchPlanningElementCommand(this.scene, this.story, patch)
        );
      }
      this.close();
    };

    const formActions = document.createElement('div');
    formActions.className = 'shrink-0 border-t border-slate-200';
    formActions.setAttribute('data-story-form-actions', 'true');

    const formActionsInner = document.createElement('div');
    formActionsInner.className = 'px-4 pt-3 pb-4 md:px-5 md:pb-5';

    const btnRow = createModalActionRow({
      variant: 'form',
      className: 'border-t-0 pt-0',
    });
    const cancelBtn = createTextButton({
      text: this.t('common.cancel'),
      tone: 'text',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        void requestClose();
      },
    });
    const saveBtn = createTextButton({
      text: this.t('common.save'),
      tone: 'primary',
      size: 'md',
      className: getModalActionButtonClass('default'),
      onClick: () => {
        saveAndClose?.();
      },
    });
    btnRow.append(cancelBtn, saveBtn);
    formActionsInner.appendChild(btnRow);
    formActions.appendChild(formActionsInner);
    formLayout.appendChild(formActions);
    titleField.focusPreview();

    container.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        const target = event.target;
        const targetEl = target instanceof HTMLElement ? target : null;
        const isTextarea = target instanceof HTMLTextAreaElement;
        const isInlineTitleInput =
          targetEl?.closest('[data-inline-title-input="true"]') !== null;
        const isButton = target instanceof HTMLButtonElement;
        if (isInlineTitleInput) return;
        if (isTextarea && !event.metaKey && !event.ctrlKey) return;
        if (isButton) return;
        event.preventDefault();
        saveAndClose?.();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        void requestClose();
      }
    });
  }

  private loadStoryTasks(panel: StoryTasksPanelController): void {
    const localTasks = this.story.tasks.map((task) =>
      this.mapCanvasTaskToListItem(task)
    );
    const ref = this.getStoryRef();
    if (!ref) {
      panel.setTasks(localTasks);
      return;
    }

    panel.setLoading();
    const storiesApi = new StoriesApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    this.storyTaskLoadSubscription?.unsubscribe();
    this.storyTaskLoadSubscription = storiesApi.getStory(ref).subscribe({
      next: (loadedStory) => {
        const remoteTasks = Array.isArray(loadedStory.tasks)
          ? loadedStory.tasks.map((task) => this.mapPlatformTaskToListItem(task))
          : [];
        panel.setTasks(this.mergeStoryTaskItems(remoteTasks, localTasks));
      },
      error: () => {
        if (localTasks.length > 0) {
          panel.setTasks(localTasks);
          return;
        }
        panel.setError(this.t('planningDetails.story.tasks.loadFailed'));
      },
    });
  }

  private buildStoryTasksPanel(
    onHide: () => void,
    onCreateTask: () => void
  ): StoryTasksPanelController {
    const element = document.createElement('section');
    element.className = HIERARCHY_PANEL_SECTION_CLASS;
    element.setAttribute('data-story-tasks-panel', 'true');

    const panelLayout = document.createElement('div');
    panelLayout.className = 'flex h-full min-h-0 flex-col';
    element.appendChild(panelLayout);
    const rowMenus: AnchoredMenu[] = [];

    const header = document.createElement('div');
    header.className = HIERARCHY_PANEL_HEADER_CLASS;

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex min-w-0 items-center gap-2';

    const titleIcon = createPlanningEntityIcon({
      kind: 'task',
      variant: 'ghost',
      size: 'sm',
    });
    titleIcon.classList.add('!text-emerald-600');

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-900';
    title.textContent = this.t('planningDetails.story.tasks.title');

    const headerActions = document.createElement('div');
    headerActions.className = 'flex shrink-0 items-center gap-2';

    const createTaskButton = createTextButton({
      text: this.t('planningDetails.story.tasks.new'),
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.story.tasks.create'),
      ariaLabel: this.t('planningDetails.story.tasks.create'),
      className:
        '!h-8 !px-2.5 inline-flex items-center gap-1.5 whitespace-nowrap text-slate-500 hover:text-slate-700',
      onClick: () => {
        onCreateTask();
      },
    });
    const createTaskIcon = createIcon('plus', {
      size: 14,
      strokeWidth: 1.9,
    });
    createTaskIcon.className.baseVal = 'shrink-0 text-slate-500';
    createTaskIcon.setAttribute('aria-hidden', 'true');
    createTaskButton.prepend(createTaskIcon);
    createTaskButton.setAttribute('data-story-tasks-create', 'true');

    const hideButton = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.story.tasks.hide'),
      ariaLabel: this.t('planningDetails.story.tasks.hide'),
      onClick: () => {
        onHide();
      },
    });
    hideButton.setAttribute('data-story-tasks-hide', 'true');

    titleWrap.append(titleIcon, title);
    headerActions.append(createTaskButton, hideButton);
    header.append(titleWrap, headerActions);
    panelLayout.appendChild(header);

    const list = document.createElement('div');
    list.className = HIERARCHY_PANEL_LIST_CLASS;
    list.setAttribute('data-story-task-list', 'true');
    panelLayout.appendChild(list);

    const renderEmpty = (message: string): void => {
      rowMenus.splice(0).forEach((menu) => menu.unmount());
      list.innerHTML = '';
      list.appendChild(createHierarchyEmptyState(message));
    };

    return {
      element,
      setLoading: () => {
        renderEmpty(this.t('planningDetails.story.tasks.loading'));
      },
      setTasks: (tasks) => {
        rowMenus.splice(0).forEach((menu) => menu.unmount());
        list.innerHTML = '';
        if (tasks.length === 0) {
          renderEmpty(this.t('planningDetails.story.tasks.empty'));
          return;
        }
        tasks.forEach((task) => {
          const row = document.createElement('div');
          row.className = getHierarchyRowClass();
          row.setAttribute('data-story-task-item', 'true');

          const content = document.createElement('div');
          content.className = 'min-w-0 flex-1';

          const taskTitle = document.createElement('div');
          taskTitle.className =
            'min-w-0 flex-1 truncate text-sm font-medium leading-5 text-slate-800';
          taskTitle.textContent = task.title;
          taskTitle.title = task.title;

          const statusBadge = this.createTaskStatusBadge(task.status);
          statusBadge.setAttribute('data-story-task-status', task.status);
          statusBadge.classList.add('mt-1');

          const openDetailsButton = this.createOpenDetailsButton({
            dataAttribute: 'data-story-task-open-details',
            dataValue: task.key,
            title: this.t('planningDetails.actions.openDetailsFor', {
              title: task.title,
            }),
            unavailableTitle: this.t('planningDetails.story.tasks.notOnCanvas'),
            onOpen: task.canvasTask
              ? () => {
                  editElement$.next(task.canvasTask!);
                }
              : null,
          });
          const actionMenu = this.buildTaskActionMenu(task);
          styleHierarchyActionButton(openDetailsButton);
          styleHierarchyActionButton(actionMenu.button);
          rowMenus.push(actionMenu.controller);
          content.append(taskTitle, statusBadge);
          row.append(
            content,
            openDetailsButton,
            actionMenu.button,
            actionMenu.panel
          );
          list.appendChild(row);
        });
      },
      setError: (message) => {
        renderEmpty(message);
      },
    };
  }

  private createPriorityControl(
    value: UiPriority,
    onChange: (value: UiPriority) => void
  ): SegmentedControl<UiPriority> {
    return createSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: this.t('planningDetails.field.priority'),
      options: [
        {
          id: 'priority-lowest',
          value: 'lowest',
          label: this.t('priority.lowest'),
          icon: 'chevron-double-down',
          iconColorClassName: 'text-sky-500',
          title: this.t('planningDetails.priority.lowestTitle'),
        },
        {
          id: 'priority-low',
          value: 'low',
          label: this.t('priority.low'),
          icon: 'chevron-down',
          iconColorClassName: 'text-sky-500',
          title: this.t('planningDetails.priority.lowTitle'),
        },
        {
          id: 'priority-medium',
          value: 'medium',
          label: this.t('priority.medium'),
          icon: 'bars-2',
          iconColorClassName: 'text-orange-500',
          title: this.t('planningDetails.priority.mediumTitle'),
        },
        {
          id: 'priority-high',
          value: 'high',
          label: this.t('priority.high'),
          icon: 'chevron-up',
          iconColorClassName: 'text-red-500',
          title: this.t('planningDetails.priority.highTitle'),
        },
        {
          id: 'priority-highest',
          value: 'highest',
          label: this.t('priority.highest'),
          icon: 'chevron-double-up',
          iconColorClassName: 'text-red-500',
          title: this.t('planningDetails.priority.highestTitle'),
        },
      ],
      value,
      onChange,
    });
  }

  private buildTitleField(options: TitleFieldOptions): TitleFieldController {
    return buildPlanningTitleField({
      label: this.t('planningDetails.field.title'),
      placeholder: this.t('planningDetails.field.untitled'),
      previewAriaLabel: this.t('planningDetails.title.preview'),
      emptyPreviewAriaLabel: this.t('planningDetails.title.emptyPreview'),
      ...options,
    });
  }

  private buildDescriptionField(
    options: DescriptionFieldOptions
  ): DescriptionFieldController {
    return buildPlanningDescriptionField({
      label: this.t('planningDetails.field.description'),
      placeholder: this.t('planningDetails.description.placeholder'),
      previewAriaLabel: this.t('planningDetails.description.preview'),
      emptyPreviewAriaLabel: this.t('planningDetails.description.emptyPreview'),
      ...options,
    });
  }

  private mapPlatformTaskToListItem(task: PlatformTask): StoryTaskListItem {
    return {
      key: task.uuid ? `uuid:${task.uuid}` : `id:${task.id}`,
      title: task.title?.trim() || this.t('existingPicker.untitled.task'),
      status: mapStatus(task.status),
      canvasTask: null,
    };
  }

  private mapCanvasTaskToListItem(task: TaskElement): StoryTaskListItem {
    const backendRef =
      typeof task.backendId === 'number' ? `id:${task.backendId}` : null;
    return {
      key: task.uuid ? `uuid:${task.uuid}` : backendRef ?? `canvas:${task.id}`,
      title: task.title?.trim() || this.t('existingPicker.untitled.task'),
      status: task.status,
      canvasTask: task,
    };
  }

  private mergeStoryTaskItems(
    primary: StoryTaskListItem[],
    secondary: StoryTaskListItem[]
  ): StoryTaskListItem[] {
    const merged = new Map<string, StoryTaskListItem>();
    primary.forEach((item) => merged.set(item.key, item));
    secondary.forEach((item) => merged.set(item.key, item));
    return Array.from(merged.values());
  }

  private createOpenDetailsButton(options: {
    dataAttribute: string;
    dataValue: string;
    title: string;
    unavailableTitle: string;
    onOpen: (() => void) | null;
  }): HTMLButtonElement {
    const button = createIconButton({
      icon: 'eye',
      tone: 'text',
      size: 'sm',
      title: options.onOpen ? options.title : options.unavailableTitle,
      ariaLabel: options.onOpen ? options.title : options.unavailableTitle,
      className: 'shrink-0',
    });
    button.setAttribute(options.dataAttribute, options.dataValue);
    button.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });
    if (!options.onOpen) {
      button.disabled = true;
      return button;
    }
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onOpen?.();
    });
    return button;
  }

  private getStoryRef(): string | null {
    if (this.story.uuid) return this.story.uuid;
    if (typeof this.story.backendId === 'number') {
      return String(this.story.backendId);
    }
    return null;
  }

  private getStoryHeaderTitle(): string {
    const title = this.story.title.trim();
    return title.length > 0 ? title : this.t('existingPicker.untitled.story');
  }

  private decorateHeaderTitle(
    titleWrap: HTMLDivElement,
    titleElement: HTMLHeadingElement
  ): void {
    titleElement.className =
      'min-w-0 truncate text-base font-semibold leading-6 tracking-tight text-slate-900';
    titleElement.title = titleElement.textContent ?? '';

    const titleRow = document.createElement('div');
    titleRow.className = 'flex min-w-0 items-center gap-3';

    const storyIcon = createPlanningEntityIcon({
      kind: 'story',
      variant: 'solid',
      size: 'md',
    });

    titleElement.remove();
    titleRow.append(storyIcon, titleElement);
    titleWrap.prepend(titleRow);
  }

  private createTasksToggleButton(options: {
    getVisible: () => boolean;
    onToggle: () => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      tone: 'text',
      size: 'sm',
      className:
        '!h-9 !px-2.5 inline-flex items-center gap-2 whitespace-nowrap text-slate-600',
      ariaLabel: this.t('planningDetails.story.tasks.toggle'),
      onClick: () => {
        options.onToggle();
      },
    });
    this.updateTasksToggleButtonLabel(button, options.getVisible());
    return button;
  }

  private updateTasksToggleButtonLabel(
    button: HTMLButtonElement,
    visible: boolean
  ): void {
    button.replaceChildren();
    const icon = createIcon('check-box', {
      size: 15,
      strokeWidth: 1.9,
    });
    icon.className.baseVal = 'shrink-0 text-slate-500';
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = visible
      ? this.t('planningDetails.hierarchy.hide')
      : this.t('planningDetails.hierarchy.show');

    button.append(icon, label);
    button.title = label.textContent;
    button.setAttribute('aria-pressed', visible ? 'true' : 'false');
  }

  private createTaskInStory(): TaskElement {
    const layoutService = new StoryLayoutService();
    const tasks = this.scene
      .getElements()
      .filter((element) => element instanceof TaskElement) as TaskElement[];
    const plan = layoutService.planAddTask(this.story, tasks);
    const task = new TaskElement({
      x: plan.position.x,
      y: plan.position.y,
      title: this.t('planningDetails.story.newTaskTitle'),
    });

    if (plan.nextHeight > this.story.height) {
      const initial = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      initial.set(this.story.id, {
        x: this.story.x,
        y: this.story.y,
        width: this.story.width,
        height: this.story.height,
      });
      const final = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      final.set(this.story.id, {
        x: this.story.x,
        y: this.story.y,
        width: this.story.width,
        height: plan.nextHeight,
      });
      historyService.execute(new ResizeCommand(this.scene, initial, final));
    }

    historyService.execute(new AddElementCommand(this.scene, task));
    this.story.addTask(task);
    this.scene.setSelected([task]);
    emitTaskStoryLinkSet(task, this.story);
    return task;
  }

  private buildTaskActionMenu(task: StoryTaskListItem): {
    button: HTMLButtonElement;
    panel: HTMLDivElement;
    controller: AnchoredMenu;
  } {
    const button = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.story.tasks.actions'),
      ariaLabel: this.t('planningDetails.story.tasks.actionsFor', {
        title: task.title,
      }),
      className: 'shrink-0',
    });
    button.setAttribute('data-story-task-actions-trigger', task.key);
    button.setAttribute('aria-expanded', 'false');

    const panel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-40 hidden min-w-[220px] overflow-hidden',
    });
    panel.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    const controller = new AnchoredMenu({
      container: button,
      panel,
      positioning: 'viewport',
      onOpenChange: (open) => {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      },
    });
    controller.mount();

    const buildItemIcon = (name: 'edit' | 'map-pin' | 'slash'): SVGSVGElement => {
      const icon = createIcon(name, { size: 14, strokeWidth: 1.8 });
      icon.classList.add('shrink-0', 'text-slate-500');
      icon.setAttribute('aria-hidden', 'true');
      return icon;
    };

    const closeMenu = (): void => {
      controller.close();
    };

    const items: HTMLButtonElement[] = [];
    if (task.canvasTask) {
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.story.tasks.edit'),
          leading: buildItemIcon('edit'),
          onClick: (event) => {
            event.stopPropagation();
            closeMenu();
            editElement$.next(task.canvasTask!);
          },
        })
      );
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.story.tasks.selectOnCanvas'),
          leading: buildItemIcon('map-pin'),
          onClick: (event) => {
            event.stopPropagation();
            closeMenu();
            this.scene.setSelected([task.canvasTask!]);
          },
        })
      );
    } else {
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.story.tasks.notOnCanvas'),
          leading: buildItemIcon('slash'),
          disabled: true,
        })
      );
    }

    items.forEach((item) => {
      item.setAttribute('role', 'menuitem');
      item.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      panel.appendChild(item);
    });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (controller.isOpen()) {
        closeMenu();
        return;
      }
      controller.openAt({
        anchor: button,
        placement: 'bottom-end',
        fallbackPlacements: ['top-end', 'bottom-start', 'top-start'],
        gap: 8,
        margin: 12,
        lockPlacementAfterOpen: true,
      });
    });

    return { button, panel, controller };
  }

  private createTaskStatusBadge(status: ElementStatus): HTMLSpanElement {
    return createBadge({
      label: this.getStatusLabel(status),
      tone: 'neutral',
      className: `${HIERARCHY_STATUS_BADGE_CLASS} ${STATUS_BADGE_TONE_CLASS[status]}`,
      title: this.t('planningDetails.story.tasks.statusTitle', {
        status: this.getStatusLabel(status),
      }),
    });
  }

  private t(
    key: Parameters<AppRuntime['i18n']['t']>[0],
    params?: Parameters<AppRuntime['i18n']['t']>[1]
  ): string {
    return this.runtime.i18n.t(key, params);
  }

  private getStatusLabel(status: ElementStatus): string {
    return getStatusLabel(status, this.runtime.i18n);
  }

  private close(): void {
    this.destroyControls();
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  private destroyControls(): void {
    this.storyTaskLoadSubscription?.unsubscribe();
    this.storyTaskLoadSubscription = null;
    this.statusControl?.destroy();
    this.statusControl = null;
    this.priorityControl?.destroy();
    this.priorityControl = null;
  }
}
