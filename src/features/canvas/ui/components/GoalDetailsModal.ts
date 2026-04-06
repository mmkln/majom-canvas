import { firstValueFrom, of, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GoalElement, GoalScale } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { Scene } from '../../core/scene/Scene.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import {
  PatchPlanningElementCommand,
  type PlanningElementPatch,
} from '../../core/commands/PatchPlanningElementCommand.ts';
import { AddElementCommand } from '../../core/commands/AddElementCommand.ts';
import { ConnectCommand } from '../../core/commands/ConnectCommand.ts';
import { editElement$ } from '../../core/eventBus.ts';
import {
  createModalActionRow,
  getModalActionButtonClass,
} from '../../../../ui-lib/src/components/Modal.ts';
import { createPaneModalShell } from '../../../../ui-lib/src/components/PaneModal.ts';
import { TagPickerField } from '../../../../ui-lib/src/components/TagPickerField.ts';
import {
  type ConfirmUnsavedChangesAction,
  confirmUnsavedChangesModal,
} from './ConfirmUnsavedChangesModal.ts';
import {
  AnchoredMenu,
  createBadge,
  createDropdownItem,
  createField,
  createIconButton,
  createSegmentedControl,
  createSurface,
  createTextButton,
  type SegmentedControl,
} from '../primitives/index.ts';
import { createIcon, type IconName } from '../icons.ts';
import {
  ELEMENT_STATUS_VALUES,
  ElementStatus,
} from '../../elements/ElementStatus.ts';
import type {
  Goal,
  GoalRelation,
  GoalRelationType,
  PlatformTask,
  Story,
  Tag,
} from '../../../../majom-wrapper/interfaces/index.ts';
import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import { normalizeUiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import {
  getStatusLabel,
  STATUS_BADGE_TONE_CLASS,
  STATUS_ICON_MAP,
  STATUS_ICON_TONE_CLASS,
} from '../statusPresentation.ts';
import { environment } from '../../../../config/environment.ts';
import { HttpInterceptorClient } from '../../../../majom-wrapper/data-access/http-interceptor.ts';
import { TasksApiService } from '../../../../majom-wrapper/data-access/tasks-api-service.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import { GoalRelationsApiService } from '../../../../majom-wrapper/data-access/goal-relations-api-service.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { getDefaultTagColor } from '../../../../majom-wrapper/utils/tagColor.ts';
import { GoalRelatedItemsLookupService } from '../../../../majom-wrapper/services/goal-related-items-lookup-service.ts';
import { createPlanningEntityIcon } from './PlanningEntityIcon.ts';
import { emitStoryGoalLinkSet } from '../../core/canvasLinkLifecycle.ts';
import { ConnectionRelationType } from '../../core/interfaces/connection.ts';
import { notify } from '../../core/services/NotificationService.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import { AddGoalRelationModal } from './AddGoalRelationModal.ts';
import type { AddGoalRelationSearchPage } from '../addGoalRelationController.ts';
import {
  getGoalRelationBadgePresentation,
  mapGoalRelationSemanticOptionToPayload,
  type GoalRelationSemanticOption,
} from '../goalRelationSemantics.ts';
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

type GoalTagOption = Pick<Tag, 'id' | 'title' | 'color'>;

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

type GoalStoryListItem = {
  key: string;
  title: string;
  status: ElementStatus;
  canvasStory: StoryElement | null;
  backendRef: string | null;
};

type GoalStoriesPanelController = {
  element: HTMLDivElement;
  setLoading: () => void;
  setStories: (stories: GoalStoryListItem[]) => void;
  setError: (message: string) => void;
  setSelectedStoryKey: (key: string | null) => void;
};

type GoalStoryTaskListItem = {
  key: string;
  title: string;
  status: ElementStatus;
  canvasTask: TaskElement | null;
};

type GoalStoryTasksPanelController = {
  element: HTMLDivElement;
  setLoading: (story: GoalStoryListItem) => void;
  setTasks: (story: GoalStoryListItem, tasks: GoalStoryTaskListItem[]) => void;
  setError: (story: GoalStoryListItem, message: string) => void;
};

type GoalRelationBadgeType =
  | GoalRelationType
  | ConnectionRelationType.LeadsTo
  | ConnectionRelationType.Blocks
  | ConnectionRelationType.RelatesTo;

type RelatedGoalListItem = {
  key: string;
  relationId: string;
  title: string;
  status: ElementStatus;
  priority: UiPriority;
  relationType: GoalRelationBadgeType;
  relationDirection: 'incoming' | 'outgoing';
  canvasGoal: GoalElement | null;
};

type RelatedGoalsSectionController = {
  element: HTMLDivElement;
  setLoading: () => void;
  setItems: (items: RelatedGoalListItem[]) => void;
  setError: (message: string) => void;
};

const normalizeNumberSet = (values: Iterable<number>): number[] =>
  [...new Set(values)].sort((left, right) => left - right);

const haveSameNumberSetMembers = (
  left: Iterable<number>,
  right: Iterable<number>
): boolean => {
  const normalizedLeft = normalizeNumberSet(left);
  const normalizedRight = normalizeNumberSet(right);
  if (normalizedLeft.length !== normalizedRight.length) return false;
  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index]
  );
};

export class GoalDetailsModal {
  private modal: HTMLDivElement | null = null;
  private statusControl: SegmentedControl<ElementStatus> | null = null;
  private priorityControl: SegmentedControl<UiPriority> | null = null;
  private scaleControl: SegmentedControl<GoalScale> | null = null;
  private goalTagPicker: TagPickerField | null = null;
  private tagLoadSubscription: Subscription | null = null;
  private goalStoryLoadSubscription: Subscription | null = null;
  private goalStoryTaskLoadSubscription: Subscription | null = null;
  private relatedGoalsLoadSubscription: Subscription | null = null;

  constructor(
    private readonly goal: GoalElement,
    private readonly scene: Scene,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {}

  public show(): void {
    this.destroyControls();

    const originalTitle = this.goal.title;
    const originalDescription = this.goal.description;
    const originalStatus = this.goal.status;
    const originalPriority = this.goal.priority;
    const originalScale = this.goal.scale;
    const originalTagIds = new Set(this.goal.tagIds ?? []);
    const originalTagTitles = new Set(this.goal.tags ?? []);
    const availableGoalTags: GoalTagOption[] = [];
    const initialHeaderTitle = this.getGoalHeaderTitle();

    let tempTitle = originalTitle;
    let tempDescription = originalDescription;
    let tempStatus = originalStatus;
    let tempPriority = originalPriority;
    let tempScale: GoalScale = originalScale;
    const tempTagIds = new Set(originalTagIds);
    let goalTagsLoading = false;
    let goalTagsLoadFailed = false;
    let storiesVisible = true;
    let selectedStory: GoalStoryListItem | null = null;
    let closeGuardOpen = false;
    let saveAndClose: (() => void) | null = null;

    const hasUnsavedChanges = (): boolean => {
      if (tempTitle.trim() !== originalTitle) return true;
      if (tempDescription !== originalDescription) return true;
      if (tempStatus !== originalStatus) return true;
      if (tempPriority !== originalPriority) return true;
      if (tempScale !== originalScale) return true;
      if (!haveSameNumberSetMembers(tempTagIds, originalTagIds)) return true;
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
    const storiesToggleButton = this.createStoriesToggleButton({
      getVisible: () => storiesVisible,
      onToggle: () => {
        storiesVisible = !storiesVisible;
        syncStoriesVisibility();
      },
    });
    storiesToggleButton.setAttribute('data-goal-stories-toggle', 'true');
    const headerDivider = document.createElement('div');
    headerDivider.className = 'h-5 w-px shrink-0 bg-slate-200';
    headerDivider.setAttribute('aria-hidden', 'true');
    if (closeButton) {
      actions.insertBefore(storiesToggleButton, closeButton);
      actions.insertBefore(headerDivider, closeButton);
    } else {
      actions.append(storiesToggleButton, headerDivider);
    }

    const contentLayout = document.createElement('div');
    const goalLayoutWidths = {
      compact: '34rem',
      stories: '62rem',
      'stories-tasks': '84rem',
    } as const;
    const getLayoutMode = (): 'compact' | 'stories' | 'stories-tasks' => {
      if (!storiesVisible) return 'compact';
      return selectedStory !== null ? 'stories-tasks' : 'stories';
    };
    const applyContainerWidth = (): void => {
      const width = goalLayoutWidths[getLayoutMode()];
      container.style.width = `min(${width}, calc(100vw - 2rem))`;
      container.style.maxWidth = width;
    };
    const applyContentLayout = (): void => {
      const layoutMode = getLayoutMode();
      contentLayout.className =
        layoutMode === 'stories-tasks'
          ? 'grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,34rem)_1px_minmax(0,1fr)_1px_minmax(0,1fr)]'
          : layoutMode === 'stories'
            ? 'grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,34rem)_1px_minmax(0,1fr)]'
            : 'grid h-full min-h-0 grid-cols-1 md:grid-cols-[minmax(0,34rem)]';
    };
    const syncStoriesVisibility = (): void => {
      const tasksVisible = storiesVisible && selectedStory !== null;
      applyContainerWidth();
      applyContentLayout();
      storiesDivider.hidden = !storiesVisible;
      goalStoriesPanel.element.hidden = !storiesVisible;
      tasksDivider.hidden = !tasksVisible;
      goalStoryTasksPanel.element.hidden = !tasksVisible;
      this.updateStoriesToggleButtonLabel(storiesToggleButton, storiesVisible);
    };

    this.modal = overlay;
    container.style.transition = 'width 180ms ease, max-width 180ms ease';
    container.style.height = 'min(46rem, calc(100dvh - 2rem))';
    container.style.maxHeight = 'min(46rem, calc(100dvh - 2rem))';

    applyContainerWidth();
    applyContentLayout();
    body.appendChild(contentLayout);

    const formPane = document.createElement('section');
    formPane.className = 'min-h-0 min-w-0 overflow-hidden';
    formPane.setAttribute('data-goal-form-pane', 'true');
    contentLayout.appendChild(formPane);

    const formLayout = document.createElement('div');
    formLayout.className = 'flex h-full min-h-0 flex-col';
    formPane.appendChild(formLayout);

    const formContent = document.createElement('div');
    formContent.className =
      'min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-4 md:px-5 md:pt-5 md:pb-5';
    formLayout.appendChild(formContent);

    const storiesDivider = document.createElement('div');
    storiesDivider.className = 'hidden h-full w-px bg-slate-200 md:block';

    const goalStoriesPanel = this.buildGoalStoriesPanel(
      () => {
        storiesVisible = false;
        syncStoriesVisibility();
      },
      () => {
        this.createStoryInGoal();
        this.loadGoalStories(goalStoriesPanel);
      },
      {
        onStorySelect: (story) => {
          selectedStory = story;
          goalStoriesPanel.setSelectedStoryKey(story.key);
          syncStoriesVisibility();
          this.loadGoalStoryTasks(story, goalStoryTasksPanel);
        },
        getSelectedStoryKey: () => selectedStory?.key ?? null,
      }
    );

    const tasksDivider = document.createElement('div');
    tasksDivider.className = 'hidden h-full w-px bg-slate-200 md:block';

    const goalStoryTasksPanel = this.buildGoalStoryTasksPanel(() => {
      selectedStory = null;
      goalStoriesPanel.setSelectedStoryKey(null);
      syncStoriesVisibility();
    });

    contentLayout.append(
      storiesDivider,
      goalStoriesPanel.element,
      tasksDivider,
      goalStoryTasksPanel.element
    );
    syncStoriesVisibility();
    this.loadGoalStories(goalStoriesPanel);

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

    this.scaleControl = createSegmentedControl({
      size: 'md',
      fullWidth: true,
      ariaLabel: this.t('planningDetails.field.scale'),
      options: [
        {
          id: 'scale-small',
          value: 1,
          label: this.t('planningDetails.goal.scale.small'),
          title: this.t('planningDetails.goal.scale.smallTitle'),
        },
        {
          id: 'scale-medium',
          value: 2,
          label: this.t('planningDetails.goal.scale.medium'),
          title: this.t('planningDetails.goal.scale.mediumTitle'),
        },
        {
          id: 'scale-large',
          value: 3,
          label: this.t('planningDetails.goal.scale.large'),
          title: this.t('planningDetails.goal.scale.largeTitle'),
        },
      ],
      value: tempScale,
      onChange: (value) => {
        tempScale = value;
      },
    });
    const scaleField = createField({
      label: this.t('planningDetails.field.scale'),
      control: this.scaleControl.element,
    });
    formContent.appendChild(scaleField.element);

    const tasksApi = new TasksApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    this.goalTagPicker = new TagPickerField({
      items: availableGoalTags,
      selectedIds: [...tempTagIds],
      loading: true,
      onCreate: async (title) => {
        try {
          const created = await firstValueFrom(
            tasksApi.createTag({
              title,
              color: getDefaultTagColor(title),
            })
          );
          const createdOption = {
            id: created.id,
            title: created.title,
            color: created.color,
          };
          const existingIndex = availableGoalTags.findIndex(
            (tag) => tag.id === createdOption.id
          );
          if (existingIndex >= 0) {
            availableGoalTags[existingIndex] = createdOption;
          } else {
            availableGoalTags.push(createdOption);
          }
          goalTagsLoadFailed = false;
          return createdOption;
        } catch {
          throw new Error(this.t('planningDetails.goal.tags.createFailed'));
        }
      },
      onChange: (selectedIds) => {
        tempTagIds.clear();
        selectedIds.forEach((id) => tempTagIds.add(id));
      },
    });
    const tagsField = createField({
      label: this.t('planningDetails.field.tags'),
      control: this.goalTagPicker.element,
    });
    formContent.appendChild(tagsField.element);

    const relatedGoalsSection = this.buildRelatedGoalsSection(
      () => {
        this.openAddRelationModal(() => {
          this.loadRelatedGoalsSection(relatedGoalsSection);
        });
      },
      async (item, relationType) => {
        await this.updateGoalRelationType(item, relationType);
        this.loadRelatedGoalsSection(relatedGoalsSection);
      }
    );
    formContent.appendChild(relatedGoalsSection.element);
    this.loadRelatedGoalsSection(relatedGoalsSection);

    const syncGoalTagPicker = (): void => {
      this.goalTagPicker?.update({
        items: availableGoalTags,
        selectedIds: [...tempTagIds],
        loading: goalTagsLoading,
        errorMessage: goalTagsLoadFailed
          ? this.t('planningDetails.goal.tags.loadFailed')
          : null,
      });
    };
    goalTagsLoading = true;
    syncGoalTagPicker();
    this.tagLoadSubscription = tasksApi.getTags().subscribe({
      next: (tags) => {
        availableGoalTags.splice(
          0,
          availableGoalTags.length,
          ...tags.map((tag) => ({
            id: tag.id,
            title: tag.title,
            color: tag.color,
          }))
        );
        if (originalTagIds.size === 0 && originalTagTitles.size > 0) {
          const resolvedIds = tags
            .filter((tag) => originalTagTitles.has(tag.title))
            .map((tag) => tag.id);
          if (resolvedIds.length > 0 && tempTagIds.size === 0) {
            resolvedIds.forEach((id) => {
              originalTagIds.add(id);
              tempTagIds.add(id);
            });
          }
        }
        goalTagsLoading = false;
        goalTagsLoadFailed = false;
        syncGoalTagPicker();
      },
      error: () => {
        goalTagsLoading = false;
        goalTagsLoadFailed = true;
        syncGoalTagPicker();
      },
    });

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
      if (tempScale !== originalScale) patch.scale = tempScale;

      const tagsChanged = !haveSameNumberSetMembers(tempTagIds, originalTagIds);
      if (tagsChanged) {
        patch.tagIds = normalizeNumberSet(tempTagIds);
        patch.tags = availableGoalTags
          .filter((tag) => tempTagIds.has(tag.id))
          .map((tag) => tag.title);
      }

      if (Object.keys(patch).length > 0) {
        historyService.execute(
          new PatchPlanningElementCommand(this.scene, this.goal, patch)
        );
      }
      this.close();
    };

    const formActions = document.createElement('div');
    formActions.className = 'shrink-0 border-t border-slate-200';
    formActions.setAttribute('data-goal-form-actions', 'true');

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

  private loadGoalStories(panel: GoalStoriesPanelController): void {
    const localStories = this.getLocalStoriesForGoal().map((story) =>
      this.mapCanvasStoryToListItem(story)
    );
    const ref = this.getGoalRef();
    if (!ref) {
      panel.setStories(localStories);
      return;
    }

    panel.setLoading();
    const http = new HttpInterceptorClient(environment.apiUrl);
    const relatedLookup = new GoalRelatedItemsLookupService(
      new GoalsApiService(http),
      new StoriesApiService(http),
      new GoalRelationsApiService(http)
    );
    this.goalStoryLoadSubscription?.unsubscribe();
    this.goalStoryLoadSubscription = relatedLookup.getRelatedItems(ref).subscribe({
      next: (related) => {
        const remoteStories = Array.isArray(related.stories)
          ? related.stories.map((story) => this.mapPlatformStoryToListItem(story))
          : [];
        panel.setStories(this.mergeGoalStoryItems(remoteStories, localStories));
      },
      error: () => {
        if (localStories.length > 0) {
          panel.setStories(localStories);
          return;
        }
        panel.setError(this.t('planningDetails.goal.stories.loadFailed'));
      },
    });
  }

  private buildGoalStoriesPanel(
    onHide: () => void,
    onCreateStory: () => void,
    options: {
      onStorySelect: (story: GoalStoryListItem) => void;
      getSelectedStoryKey: () => string | null;
    }
  ): GoalStoriesPanelController {
    const element = document.createElement('section');
    element.className = HIERARCHY_PANEL_SECTION_CLASS;
    element.setAttribute('data-goal-stories-panel', 'true');

    const panelLayout = document.createElement('div');
    panelLayout.className = 'flex h-full min-h-0 flex-col';
    element.appendChild(panelLayout);
    const rowMenus: AnchoredMenu[] = [];

    const header = document.createElement('div');
    header.className = HIERARCHY_PANEL_HEADER_CLASS;

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex min-w-0 items-center gap-2';

    const titleIcon = createPlanningEntityIcon({
      kind: 'story',
      variant: 'ghost',
      size: 'sm',
    });

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-900';
    title.textContent = this.t('planningDetails.goal.stories.title');

    const headerActions = document.createElement('div');
    headerActions.className = 'flex shrink-0 items-center gap-2';

    const createStoryButton = createTextButton({
      text: this.t('planningDetails.goal.stories.new'),
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.goal.stories.create'),
      ariaLabel: this.t('planningDetails.goal.stories.create'),
      className:
        '!h-8 !px-2.5 inline-flex items-center gap-1.5 whitespace-nowrap text-slate-500 hover:text-slate-700',
      onClick: () => {
        onCreateStory();
      },
    });
    const createStoryIcon = createIcon('plus', {
      size: 14,
      strokeWidth: 1.9,
    });
    createStoryIcon.className.baseVal = 'shrink-0 text-slate-500';
    createStoryIcon.setAttribute('aria-hidden', 'true');
    createStoryButton.prepend(createStoryIcon);
    createStoryButton.setAttribute('data-goal-stories-create', 'true');

    const hideButton = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.goal.stories.hide'),
      ariaLabel: this.t('planningDetails.goal.stories.hide'),
      onClick: () => {
        onHide();
      },
    });
    hideButton.setAttribute('data-goal-stories-hide', 'true');

    titleWrap.append(titleIcon, title);
    headerActions.append(createStoryButton, hideButton);
    header.append(titleWrap, headerActions);
    panelLayout.appendChild(header);

    const list = document.createElement('div');
    list.className = HIERARCHY_PANEL_LIST_CLASS;
    list.setAttribute('data-goal-story-list', 'true');
    panelLayout.appendChild(list);
    const storyRows = new Map<string, HTMLDivElement>();

    const renderEmpty = (message: string): void => {
      rowMenus.splice(0).forEach((menu) => menu.unmount());
      storyRows.clear();
      list.innerHTML = '';
      list.appendChild(createHierarchyEmptyState(message));
    };

    const setSelectedStoryKey = (key: string | null): void => {
      storyRows.forEach((row, storyKey) => {
        const selected = key === storyKey;
        row.className = getHierarchyRowClass({
          interactive: true,
          selected,
        });
        row.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
    };

    return {
      element,
      setLoading: () => {
        renderEmpty(this.t('planningDetails.goal.stories.loading'));
      },
      setStories: (stories) => {
        rowMenus.splice(0).forEach((menu) => menu.unmount());
        storyRows.clear();
        list.innerHTML = '';
        if (stories.length === 0) {
          renderEmpty(this.t('planningDetails.goal.stories.empty'));
          return;
        }
        stories.forEach((story) => {
          const row = document.createElement('div');
          const selected = options.getSelectedStoryKey() === story.key;
          row.className = getHierarchyRowClass({
            interactive: true,
            selected,
          });
          row.setAttribute('data-goal-story-item', 'true');
          row.setAttribute('data-goal-story-key', story.key);
          row.setAttribute('role', 'button');
          row.setAttribute('tabindex', '0');
          row.setAttribute('aria-pressed', selected ? 'true' : 'false');

          const content = document.createElement('div');
          content.className = 'min-w-0 flex-1';

          const storyTitle = document.createElement('div');
          storyTitle.className =
            'min-w-0 truncate text-sm font-medium leading-5 text-slate-800';
          storyTitle.textContent = story.title;
          storyTitle.title = story.title;

          const statusBadge = this.createStoryStatusBadge(story.status);
          statusBadge.setAttribute('data-goal-story-status', story.status);
          statusBadge.classList.add('mt-1');

          const openDetailsButton = this.createOpenDetailsButton({
            dataAttribute: 'data-goal-story-open-details',
            dataValue: story.key,
            title: this.t('planningDetails.actions.openDetailsFor', {
              title: story.title,
            }),
            unavailableTitle: this.t('planningDetails.goal.stories.notOnCanvas'),
            onOpen: story.canvasStory
              ? () => {
                  editElement$.next(story.canvasStory!);
                }
              : null,
          });
          const actionMenu = this.buildStoryActionMenu(story);
          styleHierarchyActionButton(openDetailsButton);
          styleHierarchyActionButton(actionMenu.button);
          rowMenus.push(actionMenu.controller);
          storyRows.set(story.key, row);
          content.append(storyTitle, statusBadge);
          row.append(
            content,
            openDetailsButton,
            actionMenu.button,
            actionMenu.panel
          );
          row.addEventListener('click', () => {
            options.onStorySelect(story);
          });
          row.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            options.onStorySelect(story);
          });
          list.appendChild(row);
        });
        setSelectedStoryKey(options.getSelectedStoryKey());
      },
      setError: (message) => {
        renderEmpty(message);
      },
      setSelectedStoryKey,
    };
  }

  private loadGoalStoryTasks(
    story: GoalStoryListItem,
    panel: GoalStoryTasksPanelController
  ): void {
    const localTasks = (story.canvasStory?.tasks ?? []).map((task) =>
      this.mapCanvasTaskToListItem(task)
    );
    const ref = story.backendRef;
    if (!ref) {
      panel.setTasks(story, localTasks);
      return;
    }

    panel.setLoading(story);
    const storiesApi = new StoriesApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    this.goalStoryTaskLoadSubscription?.unsubscribe();
    this.goalStoryTaskLoadSubscription = storiesApi.getStory(ref).subscribe({
      next: (loadedStory) => {
        const remoteTasks = Array.isArray(loadedStory.tasks)
          ? loadedStory.tasks.map((task) => this.mapPlatformTaskToListItem(task))
          : [];
        panel.setTasks(story, this.mergeGoalStoryTaskItems(remoteTasks, localTasks));
      },
      error: () => {
        if (localTasks.length > 0) {
          panel.setTasks(story, localTasks);
          return;
        }
        panel.setError(story, this.t('planningDetails.goal.tasks.loadFailed'));
      },
    });
  }

  private buildGoalStoryTasksPanel(
    onHide: () => void
  ): GoalStoryTasksPanelController {
    const element = document.createElement('section');
    element.className = HIERARCHY_PANEL_SECTION_CLASS;
    element.setAttribute('data-goal-story-tasks-panel', 'true');

    const panelLayout = document.createElement('div');
    panelLayout.className = 'flex h-full min-h-0 flex-col';
    element.appendChild(panelLayout);

    const header = document.createElement('div');
    header.className = HIERARCHY_PANEL_HEADER_CLASS;

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex min-w-0 items-center gap-2';

    const titleIcon = createPlanningEntityIcon({
      kind: 'task',
      variant: 'ghost',
      size: 'sm',
    });

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-900';
    title.textContent = this.t('planningDetails.goal.tasks.title');

    const storyTitle = document.createElement('p');
    storyTitle.className = 'min-w-0 truncate text-xs text-slate-500';

    const titleStack = document.createElement('div');
    titleStack.className = 'flex min-w-0 flex-col';
    titleStack.append(title, storyTitle);

    const hideButton = createIconButton({
      icon: 'x-mark',
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.goal.tasks.hide'),
      ariaLabel: this.t('planningDetails.goal.tasks.hide'),
      onClick: () => {
        onHide();
      },
    });
    hideButton.setAttribute('data-goal-story-tasks-hide', 'true');

    titleWrap.append(titleIcon, titleStack);
    header.append(titleWrap, hideButton);
    panelLayout.appendChild(header);

    const list = document.createElement('div');
    list.className = HIERARCHY_PANEL_LIST_CLASS;
    list.setAttribute('data-goal-story-task-list', 'true');
    panelLayout.appendChild(list);

    const renderEmpty = (story: GoalStoryListItem, message: string): void => {
      storyTitle.textContent = story.title;
      list.innerHTML = '';
      list.appendChild(createHierarchyEmptyState(message));
    };

    return {
      element,
      setLoading: (story) => {
        renderEmpty(story, this.t('planningDetails.goal.tasks.loading'));
      },
      setTasks: (story, tasks) => {
        storyTitle.textContent = story.title;
        list.innerHTML = '';
        if (tasks.length === 0) {
          renderEmpty(story, this.t('planningDetails.goal.tasks.empty'));
          return;
        }
        tasks.forEach((task) => {
          const row = document.createElement('div');
          row.className = getHierarchyRowClass();
          row.setAttribute('data-goal-story-task-item', 'true');

          const content = document.createElement('div');
          content.className = 'min-w-0 flex-1';

          const taskTitle = document.createElement('div');
          taskTitle.className =
            'min-w-0 truncate text-sm font-medium leading-5 text-slate-800';
          taskTitle.textContent = task.title;
          taskTitle.title = task.title;

          const statusBadge = this.createTaskStatusBadge(task.status);
          statusBadge.setAttribute('data-goal-story-task-status', task.status);
          statusBadge.classList.add('mt-1');

          const openDetailsButton = this.createOpenDetailsButton({
            dataAttribute: 'data-goal-story-task-open-details',
            dataValue: task.key,
            title: this.t('planningDetails.actions.openDetailsFor', {
              title: task.title,
            }),
            unavailableTitle: this.t('planningDetails.goal.tasks.notOnCanvas'),
            onOpen: task.canvasTask
              ? () => {
                  editElement$.next(task.canvasTask!);
                }
              : null,
          });
          styleHierarchyActionButton(openDetailsButton);
          content.append(taskTitle, statusBadge);
          row.append(content, openDetailsButton);
          list.appendChild(row);
        });
      },
      setError: (story, message) => {
        renderEmpty(story, message);
      },
    };
  }

  private loadRelatedGoalsSection(
    section: RelatedGoalsSectionController
  ): void {
    const ref = this.getGoalRef();
    if (!ref) {
      section.setItems([]);
      return;
    }

    section.setLoading();
    const http = new HttpInterceptorClient(environment.apiUrl);
    const goalsApi = new GoalsApiService(http);
    const relationsApi = new GoalRelationsApiService(http);

    this.relatedGoalsLoadSubscription?.unsubscribe();
    this.relatedGoalsLoadSubscription = goalsApi
      .getGoal(ref)
      .pipe(
        switchMap((currentGoal) =>
          relationsApi.listRelations({ goal_id: ref }).pipe(
            switchMap((relations) => {
              const relatedUuids = this.extractRelatedGoalUuidsForSection(
                relations,
                currentGoal.uuid ?? null
              );
              if (relatedUuids.length === 0) {
                return of<RelatedGoalListItem[]>([]);
              }
              return goalsApi.fetchGoalsByUuids(relatedUuids).pipe(
                map((goals) =>
                  this.mapRemoteRelatedGoals(relations, currentGoal.uuid ?? null, goals)
                )
              );
            })
          )
        )
      )
      .subscribe({
        next: (items) => {
          section.setItems(items);
        },
        error: () => {
          section.setError(this.t('planningDetails.goal.relatedGoals.loadFailed'));
        },
      });
  }

  private buildRelatedGoalsSection(
    onAddRelation: () => void,
    onRelationTypeChange: (
      item: RelatedGoalListItem,
      relationType: GoalRelationType
    ) => Promise<void>
  ): RelatedGoalsSectionController {
    const element = document.createElement('section');
    element.className = 'border-t border-slate-200 pt-4';
    element.setAttribute('data-goal-related-goals', 'true');
    const rowMenus: AnchoredMenu[] = [];

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between gap-3';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'flex min-w-0 items-center gap-2';

    const titleIcon = createIcon('link', {
      size: 14,
      strokeWidth: 1.9,
    });
    titleIcon.className.baseVal = 'shrink-0 text-slate-500';
    titleIcon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-900';
    title.setAttribute('data-goal-related-goals-title', 'true');
    titleWrap.append(titleIcon, title);

    const addRelationButton = createTextButton({
      text: this.t('planningDetails.goal.relatedGoals.add'),
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.goal.relatedGoals.add'),
      ariaLabel: this.t('planningDetails.goal.relatedGoals.add'),
      className:
        '!h-8 !px-2.5 inline-flex items-center gap-1.5 whitespace-nowrap text-slate-500 hover:text-slate-700',
      onClick: () => {
        onAddRelation();
      },
    });
    const addRelationIcon = createIcon('plus', {
      size: 14,
      strokeWidth: 1.9,
    });
    addRelationIcon.className.baseVal = 'shrink-0 text-slate-500';
    addRelationIcon.setAttribute('aria-hidden', 'true');
    addRelationButton.prepend(addRelationIcon);
    addRelationButton.setAttribute('data-goal-related-goals-add', 'true');

    header.append(titleWrap, addRelationButton);
    element.appendChild(header);

    const list = document.createElement('div');
    list.className = 'mt-3 flex flex-col gap-2';
    list.setAttribute('data-goal-related-goals-list', 'true');
    element.appendChild(list);

    const renderItems = (items: RelatedGoalListItem[]): void => {
        rowMenus.splice(0).forEach((menu) => menu.unmount());
        title.textContent = this.t('planningDetails.goal.relatedGoals.title', {
          count: items.length,
        });
        list.innerHTML = '';
        if (items.length === 0) {
          list.appendChild(
            createHierarchyEmptyState(
              this.t('planningDetails.goal.relatedGoals.empty')
            )
          );
          return;
        }

        items.forEach((item) => {
          const row = document.createElement('div');
          row.className =
            'group flex items-center gap-2 rounded-lg px-3 py-2 ring-1 ring-inset ring-slate-200/80 transition-[background-color,box-shadow,border-color] bg-slate-50/70 hover:bg-white hover:ring-slate-300';
          row.setAttribute('data-goal-related-goal-item', 'true');

          const contentStack = document.createElement('div');
          contentStack.className = 'min-w-0 flex-1 space-y-1';

          const goalTitle = document.createElement('div');
          goalTitle.className =
            'min-w-0 truncate text-sm font-medium leading-5 text-slate-800';
          goalTitle.textContent = item.title;
          goalTitle.title = item.title;

          const metaRow = document.createElement('div');
          metaRow.className = 'flex min-w-0 flex-wrap items-center gap-1.5';

          const priorityBadge = this.createGoalPriorityBadge(item.priority);
          priorityBadge.setAttribute('data-goal-related-goal-priority', item.priority);

          const statusBadge = this.createGoalStatusBadge(item.status);
          statusBadge.setAttribute('data-goal-related-goal-status', item.status);

          const relationSelector = this.createGoalRelationSelectorButton({
            item,
            onChange: (relationType) => onRelationTypeChange(item, relationType),
          });
          rowMenus.push(relationSelector.controller);

          const openDetailsButton = this.createOpenDetailsButton({
            dataAttribute: 'data-goal-related-goal-open-details',
            dataValue: item.key,
            title: this.t('planningDetails.actions.openDetailsFor', {
              title: item.title,
            }),
            unavailableTitle: this.t(
              'planningDetails.goal.relatedGoals.notOnCanvas'
            ),
            onOpen: item.canvasGoal
              ? () => {
                  editElement$.next(item.canvasGoal!);
                }
              : null,
            icon: 'arrow-top-right-on-square',
          });

          const actions = document.createElement('div');
          actions.className = 'flex shrink-0 items-center gap-1 self-start';
          styleHierarchyActionButton(openDetailsButton);
          actions.append(relationSelector.button, relationSelector.panel, openDetailsButton);

          metaRow.append(priorityBadge, statusBadge);
          contentStack.append(goalTitle, metaRow);
          row.append(contentStack, actions);
          list.appendChild(row);
        });
    };

    return {
      element,
      setLoading: () => {
        rowMenus.splice(0).forEach((menu) => menu.unmount());
        title.textContent = this.t('planningDetails.goal.relatedGoals.title', {
          count: 0,
        });
        list.innerHTML = '';
        list.appendChild(
          createHierarchyEmptyState(
            this.t('planningDetails.goal.relatedGoals.loading')
          )
        );
      },
      setItems: (items) => {
        renderItems(items);
      },
      setError: (message) => {
        rowMenus.splice(0).forEach((menu) => menu.unmount());
        title.textContent = this.t('planningDetails.goal.relatedGoals.title', {
          count: 0,
        });
        list.innerHTML = '';
        list.appendChild(createHierarchyEmptyState(message, 'error'));
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

  private getLocalStoriesForGoal(): StoryElement[] {
    const localStories = this.scene
      .getElements()
      .filter((element): element is StoryElement => element instanceof StoryElement);
    const connectedStoryIds = new Set(
      this.scene
        .getConnections()
        .filter(
          (connection) =>
            connection.relationType === ConnectionRelationType.ParentChild &&
            connection.fromId === this.goal.id
        )
        .map((connection) => connection.toId)
    );
    const goalBackendId = Number.isFinite(this.goal.backendId)
      ? Number(this.goal.backendId)
      : null;

    return localStories.filter((story) => {
      if (connectedStoryIds.has(story.id)) return true;
      if (goalBackendId === null) return false;
      return story.goalBackendId === goalBackendId;
    });
  }

  private mapPlatformTaskToListItem(task: PlatformTask): GoalStoryTaskListItem {
    return {
      key: task.uuid ? `uuid:${task.uuid}` : `id:${task.id}`,
      title: task.title?.trim() || this.t('existingPicker.untitled.task'),
      status: mapStatus(task.status),
      canvasTask: null,
    };
  }

  private mapCanvasTaskToListItem(task: TaskElement): GoalStoryTaskListItem {
    const backendRef =
      typeof task.backendId === 'number' ? `id:${task.backendId}` : null;
    return {
      key: task.uuid ? `uuid:${task.uuid}` : backendRef ?? `canvas:${task.id}`,
      title: task.title?.trim() || this.t('existingPicker.untitled.task'),
      status: task.status,
      canvasTask: task,
    };
  }

  private mergeGoalStoryTaskItems(
    primary: GoalStoryTaskListItem[],
    secondary: GoalStoryTaskListItem[]
  ): GoalStoryTaskListItem[] {
    const merged = new Map<string, GoalStoryTaskListItem>();
    primary.forEach((item) => merged.set(item.key, item));
    secondary.forEach((item) => merged.set(item.key, item));
    return Array.from(merged.values());
  }

  private extractRelatedGoalUuidsForSection(
    relations: GoalRelation[],
    currentGoalUuid: string | null
  ): string[] {
    if (!currentGoalUuid) return [];
    const uuids = new Set<string>();
    relations.forEach((relation) => {
      if (relation.from_goal_uuid === currentGoalUuid) {
        uuids.add(relation.to_goal_uuid);
        return;
      }
      if (relation.to_goal_uuid === currentGoalUuid) {
        uuids.add(relation.from_goal_uuid);
      }
    });
    uuids.delete(currentGoalUuid);
    return Array.from(uuids.values());
  }

  private mapRemoteRelatedGoals(
    relations: GoalRelation[],
    currentGoalUuid: string | null,
    goals: Goal[]
  ): RelatedGoalListItem[] {
    if (!currentGoalUuid) return [];
    const goalByUuid = new Map(
      goals
        .filter((goal): goal is Goal & { uuid: string } => typeof goal.uuid === 'string')
        .map((goal) => [goal.uuid, goal] as const)
    );
    const items: RelatedGoalListItem[] = [];

    relations.forEach((relation) => {
      const otherGoalUuid =
        relation.from_goal_uuid === currentGoalUuid
          ? relation.to_goal_uuid
          : relation.to_goal_uuid === currentGoalUuid
            ? relation.from_goal_uuid
            : null;
      if (!otherGoalUuid) return;
      const relatedGoal = goalByUuid.get(otherGoalUuid);
      if (!relatedGoal) return;
      items.push({
        relationId: relation.id,
        key: `${relation.relation_type}:${relatedGoal.uuid ?? relatedGoal.id}`,
        title: relatedGoal.title?.trim() || this.t('existingPicker.untitled.goal'),
        status: mapStatus(relatedGoal.status),
        priority: normalizeUiPriority(relatedGoal.priority),
        relationType: relation.relation_type,
        relationDirection:
          relation.from_goal_uuid === currentGoalUuid ? 'outgoing' : 'incoming',
        canvasGoal: this.findCanvasGoalForRemoteGoal(relatedGoal),
      });
    });

    return items;
  }

  private mapPlatformStoryToListItem(story: Story): GoalStoryListItem {
    return {
      key: story.uuid ? `uuid:${story.uuid}` : `id:${story.id}`,
      title: story.title?.trim() || this.t('existingPicker.untitled.story'),
      status: mapStatus(story.status),
      canvasStory: this.findCanvasStoryForRemoteStory(story),
      backendRef: story.uuid ?? String(story.id),
    };
  }

  private mapCanvasStoryToListItem(story: StoryElement): GoalStoryListItem {
    const backendRef =
      typeof story.backendId === 'number' ? `id:${story.backendId}` : null;
    return {
      key: story.uuid ? `uuid:${story.uuid}` : backendRef ?? `canvas:${story.id}`,
      title: story.title?.trim() || this.t('existingPicker.untitled.story'),
      status: story.status,
      canvasStory: story,
      backendRef: story.uuid ?? (backendRef ? String(story.backendId) : null),
    };
  }

  private mergeGoalStoryItems(
    primary: GoalStoryListItem[],
    secondary: GoalStoryListItem[]
  ): GoalStoryListItem[] {
    const merged = new Map<string, GoalStoryListItem>();
    primary.forEach((item) => merged.set(item.key, item));
    secondary.forEach((item) => merged.set(item.key, item));
    return Array.from(merged.values());
  }

  private findCanvasStoryForRemoteStory(story: Story): StoryElement | null {
    return (
      this.getLocalStoriesForGoal().find((candidate) => {
        if (story.uuid && candidate.uuid === story.uuid) return true;
        if (
          Number.isFinite(candidate.backendId) &&
          Number(candidate.backendId) === story.id
        ) {
          return true;
        }
        return false;
      }) ?? null
    );
  }

  private findCanvasGoalForRemoteGoal(goal: Goal): GoalElement | null {
    return (
      this.scene
        .getElements()
        .filter((element): element is GoalElement => element instanceof GoalElement)
        .find((candidate) => {
          if (goal.uuid && candidate.uuid === goal.uuid) return true;
          if (
            Number.isFinite(candidate.backendId) &&
            Number(candidate.backendId) === goal.id
          ) {
            return true;
          }
          return false;
        }) ?? null
    );
  }

  private getGoalRef(): string | null {
    if (this.goal.uuid) return this.goal.uuid;
    if (typeof this.goal.backendId === 'number') {
      return String(this.goal.backendId);
    }
    return null;
  }

  private createOpenDetailsButton(options: {
    dataAttribute: string;
    dataValue: string;
    title: string;
    unavailableTitle: string;
    onOpen: (() => void) | null;
    icon?: IconName;
  }): HTMLButtonElement {
    const button = createIconButton({
      icon: options.icon ?? 'eye',
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

  private async updateGoalRelationType(
    item: RelatedGoalListItem,
    relationType: GoalRelationType
  ): Promise<void> {
    if (item.relationType === relationType) return;
    try {
      const api = new GoalRelationsApiService(
        new HttpInterceptorClient(environment.apiUrl)
      );
      await firstValueFrom(
        api.updateRelation(item.relationId, {
          relation_type: relationType,
        })
      );
    } catch {
      notify(this.t('planningDetails.goal.relatedGoals.updateFailed'), 'error');
      throw new Error('Failed to update goal relation type.');
    }
  }

  private openAddRelationModal(onCreated: () => void): void {
    const goalRef = this.getGoalRef();
    if (!goalRef) {
      notify(this.t('planningDetails.goal.addRelation.currentGoalUnavailable'), 'info');
      return;
    }

    new AddGoalRelationModal({
      currentGoalTitle: this.getGoalHeaderTitle(),
      runtime: this.runtime,
      searchGoals: (term) => this.searchRelationGoals(term),
      validateSelection: async ({ targetGoal, semantic }) => {
        return await this.validateGoalRelation(targetGoal, semantic);
      },
      onCreate: async ({ targetGoal, semantic }) => {
        await this.createGoalRelation(targetGoal, semantic);
      },
      onCreated,
    }).show();
  }

  private async searchRelationGoals(
    term: string,
    page: number,
    pageSize: number
  ): Promise<AddGoalRelationSearchPage> {
    const api = new GoalsApiService(new HttpInterceptorClient(environment.apiUrl));
    const currentGoalRef = this.getGoalRef();
    const response = await firstValueFrom(
      api.searchGoalsForPicker({
        page,
        pageSize,
        search: term || undefined,
      })
    );
    const items = response.results ?? [];
    const filteredItems = items.filter((goal) => {
      if (!goal.uuid) return false;
      if (this.goal.uuid && goal.uuid === this.goal.uuid) return false;
      if (
        currentGoalRef &&
        typeof this.goal.backendId === 'number' &&
        goal.id === this.goal.backendId
      ) {
        return false;
      }
      return true;
    });
    return {
      items: filteredItems,
      hasMore: Boolean(response.next),
    };
  }

  private async createGoalRelation(
    targetGoal: Goal,
    semantic: GoalRelationSemanticOption
  ): Promise<void> {
    const validationError = await this.validateGoalRelation(targetGoal, semantic);
    if (validationError) {
      throw new Error(validationError);
    }

    const currentGoalUuid = await this.resolveCurrentGoalUuid();
    const targetGoalUuid = targetGoal.uuid;
    if (!targetGoalUuid) {
      throw new Error(this.t('planningDetails.goal.addRelation.targetGoalUnavailable'));
    }

    const api = new GoalRelationsApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    const payload = mapGoalRelationSemanticOptionToPayload(
      currentGoalUuid,
      targetGoalUuid,
      semantic
    );
    await firstValueFrom(
      api.createRelation({
        ...payload,
        meta: null,
      })
    );
  }

  private async validateGoalRelation(
    targetGoal: Goal,
    semantic: GoalRelationSemanticOption
  ): Promise<string | null> {
    const currentGoalUuid = await this.resolveCurrentGoalUuid();
    const targetGoalUuid = targetGoal.uuid;
    if (!targetGoalUuid) {
      return this.t('planningDetails.goal.addRelation.targetGoalUnavailable');
    }

    const api = new GoalRelationsApiService(
      new HttpInterceptorClient(environment.apiUrl)
    );
    const payload = mapGoalRelationSemanticOptionToPayload(
      currentGoalUuid,
      targetGoalUuid,
      semantic
    );
    const existing = await firstValueFrom(api.listRelations(payload));
    if (existing.length > 0) {
      return this.t('planningDetails.goal.addRelation.duplicate');
    }
    return null;
  }

  private async resolveCurrentGoalUuid(): Promise<string> {
    if (this.goal.uuid) return this.goal.uuid;
    const goalRef = this.getGoalRef();
    if (!goalRef) {
      throw new Error(this.t('planningDetails.goal.addRelation.currentGoalUnavailable'));
    }
    const api = new GoalsApiService(new HttpInterceptorClient(environment.apiUrl));
    const goal = await firstValueFrom(api.getGoal(goalRef));
    if (!goal.uuid) {
      throw new Error(this.t('planningDetails.goal.addRelation.currentGoalUnavailable'));
    }
    return goal.uuid;
  }

  private getGoalHeaderTitle(): string {
    const title = this.goal.title.trim();
    return title.length > 0 ? title : this.t('existingPicker.untitled.goal');
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

    const goalIcon = createPlanningEntityIcon({
      kind: 'goal',
      variant: 'solid',
      size: 'md',
    });

    titleElement.remove();
    titleRow.append(goalIcon, titleElement);
    titleWrap.prepend(titleRow);
  }

  private createStoriesToggleButton(options: {
    getVisible: () => boolean;
    onToggle: () => void;
  }): HTMLButtonElement {
    const button = createTextButton({
      tone: 'text',
      size: 'sm',
      className:
        '!h-9 !px-2.5 inline-flex items-center gap-2 whitespace-nowrap text-slate-600',
      ariaLabel: this.t('planningDetails.goal.stories.toggle'),
      onClick: () => {
        options.onToggle();
      },
    });
    this.updateStoriesToggleButtonLabel(button, options.getVisible());
    return button;
  }

  private updateStoriesToggleButtonLabel(
    button: HTMLButtonElement,
    visible: boolean
  ): void {
    button.replaceChildren();
    const icon = createIcon('book-open', {
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

  private createStoryInGoal(): StoryElement {
    const existingStories = this.getLocalStoriesForGoal();
    const x =
      this.goal.x +
      this.goal.width / 2 -
      StoryElement.width / 2 +
      existingStories.length * (StoryElement.width + 48);
    const y = this.goal.y + this.goal.height + 32;
    const goalBackendId = Number.isFinite(this.goal.backendId)
      ? Number(this.goal.backendId)
      : null;

    const story = new StoryElement({
      x,
      y,
      title: this.t('planningDetails.goal.newStoryTitle'),
      goalBackendId,
    });

    historyService.execute(new AddElementCommand(this.scene, story));
    historyService.execute(
      new ConnectCommand(
        this.scene,
        this.goal.id,
        story.id,
        ConnectionRelationType.ParentChild
      )
    );
    this.scene.setSelected([story]);
    emitStoryGoalLinkSet(story, this.goal);
    return story;
  }

  private buildStoryActionMenu(story: GoalStoryListItem): {
    button: HTMLButtonElement;
    panel: HTMLDivElement;
    controller: AnchoredMenu;
  } {
    const button = createIconButton({
      icon: 'ellipsis-vertical',
      tone: 'text',
      size: 'sm',
      title: this.t('planningDetails.goal.stories.actions'),
      ariaLabel: this.t('planningDetails.goal.stories.actionsFor', {
        title: story.title,
      }),
      className: 'shrink-0',
    });
    button.setAttribute('data-goal-story-actions-trigger', story.key);
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

    const buildItemIcon = (
      name: 'edit' | 'map-pin' | 'slash'
    ): SVGSVGElement => {
      const icon = createIcon(name, { size: 14, strokeWidth: 1.8 });
      icon.classList.add('shrink-0', 'text-slate-500');
      icon.setAttribute('aria-hidden', 'true');
      return icon;
    };

    const closeMenu = (): void => {
      controller.close();
    };

    const items: HTMLButtonElement[] = [];
    if (story.canvasStory) {
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.goal.stories.edit'),
          leading: buildItemIcon('edit'),
          onClick: (event) => {
            event.stopPropagation();
            closeMenu();
            editElement$.next(story.canvasStory!);
          },
        })
      );
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.goal.stories.selectOnCanvas'),
          leading: buildItemIcon('map-pin'),
          onClick: (event) => {
            event.stopPropagation();
            closeMenu();
            this.scene.setSelected([story.canvasStory!]);
          },
        })
      );
    } else {
      items.push(
        createDropdownItem({
          label: this.t('planningDetails.goal.stories.notOnCanvas'),
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

  private createStoryStatusBadge(status: ElementStatus): HTMLSpanElement {
    return createBadge({
      label: this.getStatusLabel(status),
      tone: 'neutral',
      className: `${HIERARCHY_STATUS_BADGE_CLASS} ${STATUS_BADGE_TONE_CLASS[status]}`,
      title: this.t('planningDetails.goal.stories.statusTitle', {
        status: this.getStatusLabel(status),
      }),
    });
  }

  private createTaskStatusBadge(status: ElementStatus): HTMLSpanElement {
    return createBadge({
      label: this.getStatusLabel(status),
      tone: 'neutral',
      className: `${HIERARCHY_STATUS_BADGE_CLASS} ${STATUS_BADGE_TONE_CLASS[status]}`,
      title: this.t('planningDetails.goal.tasks.statusTitle', {
        status: this.getStatusLabel(status),
      }),
    });
  }

  private createGoalStatusBadge(status: ElementStatus): HTMLSpanElement {
    return createBadge({
      label: this.getStatusLabel(status),
      tone: 'neutral',
      className: `${HIERARCHY_STATUS_BADGE_CLASS} ${STATUS_BADGE_TONE_CLASS[status]}`,
      title: this.t('planningDetails.goal.relatedGoals.statusTitle', {
        status: this.getStatusLabel(status),
      }),
    });
  }

  private createGoalPriorityBadge(priority: UiPriority): HTMLSpanElement {
    const iconSpec = this.getPriorityIconSpec(priority);
    const icon = createIcon(iconSpec?.icon ?? 'bars-2', {
      size: 12,
      strokeWidth: 2,
    });
    icon.classList.add('shrink-0', iconSpec?.iconColorClassName ?? 'text-slate-500');
    icon.setAttribute('aria-hidden', 'true');

    return createBadge({
      label: '',
      tone: 'neutral',
      leading: icon,
      title: this.getPriorityLabel(priority),
      className:
        `h-7 w-7 shrink-0 justify-center rounded-full px-0 py-0 ${this.getPriorityChipPalette(priority)}`.trim(),
    });
  }

  private createGoalRelationSelectorButton(options: {
    item: RelatedGoalListItem;
    onChange: (relationType: GoalRelationType) => Promise<void>;
  }): {
    button: HTMLButtonElement;
    panel: HTMLDivElement;
    controller: AnchoredMenu;
  } {
    const presentation = getGoalRelationBadgePresentation(
      options.item.relationType,
      options.item.relationDirection,
      this.runtime
    );
    const button = document.createElement('button');
    button.type = 'button';
    button.className =
      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-200/80 bg-white px-2.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300';
    button.setAttribute(
      'title',
      this.t('planningDetails.goal.relatedGoals.changeRelationFor', {
        title: options.item.title,
      })
    );
    button.setAttribute(
      'aria-label',
      this.t('planningDetails.goal.relatedGoals.changeRelationFor', {
        title: options.item.title,
      })
    );
    button.setAttribute('data-goal-related-goal-relation-selector', options.item.key);
    button.setAttribute('data-goal-related-goal-relation', options.item.relationType);
    button.setAttribute(
      'data-goal-related-goal-direction',
      options.item.relationDirection
    );
    button.setAttribute('aria-expanded', 'false');

    const leadingIcon = createIcon(presentation.icon, {
      size: 12,
      strokeWidth: 1.9,
    });
    leadingIcon.classList.add('shrink-0');
    leadingIcon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.textContent = presentation.label;

    const chevron = createIcon('chevron-down', {
      size: 12,
      strokeWidth: 1.9,
    });
    chevron.classList.add('shrink-0', 'text-slate-400');
    chevron.setAttribute('aria-hidden', 'true');

    button.append(leadingIcon, label, chevron);
    button.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    const panel = createSurface({
      elevated: true,
      className: 'absolute left-0 top-0 z-40 hidden min-w-[200px] overflow-hidden',
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

    (['leads_to', 'blocks', 'relates_to'] as const).forEach((relationType) => {
      const optionPresentation = getGoalRelationBadgePresentation(
        relationType,
        options.item.relationDirection,
        this.runtime
      );
      const itemIcon = createIcon(optionPresentation.icon, {
        size: 14,
        strokeWidth: 1.8,
      });
      itemIcon.classList.add('shrink-0');
      itemIcon.setAttribute('aria-hidden', 'true');
      const item = createDropdownItem({
        label: optionPresentation.label,
        leading: itemIcon,
        disabled: relationType === options.item.relationType,
        onClick: (event) => {
          event.stopPropagation();
          controller.close();
          void options.onChange(relationType).catch(() => {});
        },
      });
      item.setAttribute('role', 'menuitem');
      item.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      panel.appendChild(item);
    });

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (controller.isOpen()) {
        controller.close();
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

  private getPriorityChipPalette(priority: UiPriority): string {
    if (priority === 'highest' || priority === 'high') {
      return 'border-rose-200/80 bg-rose-50 text-rose-700';
    }
    if (priority === 'medium') {
      return 'border-orange-200/80 bg-orange-50 text-orange-700';
    }
    if (priority === 'low') {
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-700';
    }
    if (priority === 'lowest') {
      return 'border-teal-200/80 bg-teal-50 text-teal-700';
    }
    return 'border-slate-200/80 bg-white text-slate-600';
  }

  private getPriorityIconSpec(
    priority: UiPriority
  ): { icon: IconName; iconColorClassName: string } | null {
    if (priority === 'highest') {
      return { icon: 'chevron-double-up', iconColorClassName: 'text-red-500' };
    }
    if (priority === 'high') {
      return { icon: 'chevron-up', iconColorClassName: 'text-red-500' };
    }
    if (priority === 'medium') {
      return { icon: 'bars-2', iconColorClassName: 'text-orange-500' };
    }
    if (priority === 'low') {
      return { icon: 'chevron-down', iconColorClassName: 'text-sky-500' };
    }
    if (priority === 'lowest') {
      return {
        icon: 'chevron-double-down',
        iconColorClassName: 'text-sky-500',
      };
    }
    return null;
  }

  private getPriorityLabel(priority: UiPriority): string {
    switch (priority) {
      case 'highest':
        return this.t('priority.highest');
      case 'high':
        return this.t('priority.high');
      case 'medium':
        return this.t('priority.medium');
      case 'lowest':
        return this.t('priority.lowest');
      case 'low':
      default:
        return this.t('priority.low');
    }
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
    this.goalStoryLoadSubscription?.unsubscribe();
    this.goalStoryLoadSubscription = null;
    this.goalStoryTaskLoadSubscription?.unsubscribe();
    this.goalStoryTaskLoadSubscription = null;
    this.relatedGoalsLoadSubscription?.unsubscribe();
    this.relatedGoalsLoadSubscription = null;
    this.tagLoadSubscription?.unsubscribe();
    this.tagLoadSubscription = null;
    this.statusControl?.destroy();
    this.statusControl = null;
    this.priorityControl?.destroy();
    this.priorityControl = null;
    this.scaleControl?.destroy();
    this.scaleControl = null;
    this.goalTagPicker?.destroy();
    this.goalTagPicker = null;
  }
}
