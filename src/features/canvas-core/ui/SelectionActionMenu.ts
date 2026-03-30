import { firstValueFrom, Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import {
  SelectionContext,
  PlanningElement,
} from '../core/services/SelectionContext.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { createIcon, IconName, IconOptions } from './icons.ts';
import { ElementStatus } from '../elements/ElementStatus.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { getViewBounds, isRectVisible } from '../core/utils/viewBounds.ts';
import { addTaskToStory } from './storyTaskActions.ts';
import { createIconButton, createSurface } from './primitives/index.ts';
import { StatusSelector } from './components/StatusSelector.ts';
import { AiActionsDropdown } from './components/AiActionsDropdown.ts';
import { emitAiAssistantIntentRequested } from '../../ai-assistant/aiAssistantEvents.ts';
import {
  getAiAssistantBreakdownHint,
  getAiAssistantClarifyHint,
  getAiAssistantConnectSelectedHint,
  getAiAssistantFillDetailsHint,
  getAiAssistantLinkBlockersHint,
} from '../../ai-assistant/aiAssistantHints.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import { BulkTagActionPopover } from '../../../ui-lib/src/components/BulkTagActionPopover.ts';
import { type TagPickerItem } from '../../../ui-lib/src/components/TagPickerField.ts';
import { TasksApiService } from '../../../majom-wrapper/data-access/tasks-api-service.ts';
import { HttpInterceptorClient } from '../../../majom-wrapper/data-access/http-interceptor.js';
import { environment } from '../../../config/environment.ts';
import { getDefaultTagColor } from '../../../majom-wrapper/utils/tagColor.ts';
import type {
  CanvasActionDefinition,
  CanvasInteractionAdapter,
} from '../adapters/CanvasInteractionAdapter.ts';

type ActionContext = {
  elements: PlanningElement[];
  primary: PlanningElement;
  isMulti: boolean;
};

type InteractionActionContext = {
  selectedElements: ICanvasElement[];
  target: ICanvasElement | null;
};

type ActionButtonVariant = 'default' | 'danger' | 'warning' | 'primary';

const ACTION_BUTTON_VARIANT_CLASS: Record<ActionButtonVariant, string> = {
  default: '!text-slate-500 hover:!bg-slate-100 hover:!text-slate-700',
  danger: '!text-rose-500 hover:!bg-rose-50 hover:!text-rose-600',
  primary: '!text-indigo-600 hover:!bg-indigo-50 hover:!text-indigo-700',
  warning: '!text-amber-600 hover:!bg-amber-50 hover:!text-amber-700',
};

type ActionNode =
  | {
      kind: 'action';
      id: string;
      title: string;
      icon?: IconName;
      iconOptions?: IconOptions;
      variant?: 'icon' | 'status' | 'ai' | 'goal-tags';
      isDanger?: boolean;
      isVisible?: (context: ActionContext) => boolean;
      onClick?: () => void;
    }
  | {
      kind: 'divider';
      id: string;
      isVisible?: (context: ActionContext) => boolean;
    };

type SelectionActionMenuOptions = {
  enableLegacyPlanningActions?: boolean;
  positionStrategy?: 'below-bounds' | 'top-right-inset';
  omitDividerForInteractionActions?: boolean;
};

function selectionSupportsGoalTags(
  elements: PlanningElement[]
): elements is GoalElement[] {
  return (
    elements.length >= 1 &&
    elements.every((element) => element instanceof GoalElement)
  );
}

export class SelectionActionMenu {
  private readonly container: HTMLDivElement;
  private actionNodes: ActionNode[] = [];
  private actionElements: Map<string, HTMLElement> = new Map();
  private interactionActionElements: HTMLElement[] = [];
  private aiActionsDropdown: AiActionsDropdown | null = null;
  private statusSelector: StatusSelector | null = null;
  private goalTagsPopover: BulkTagActionPopover | null = null;
  private subscriptions: Subscription[] = [];
  private goalTagLoadSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private suspendUpdates = false;
  private activeInteractions = new Set<'drag' | 'resize' | 'select'>();
  private deleteConfirmState: { key: string; expiresAt: number } | null = null;
  private deleteConfirmTimer: number | null = null;
  private readonly confirmTimeoutMs = 4000;
  private resizeHandler = () => this.requestUpdate();
  private interactionStartHandler = (event: Event): void => {
    const detail = (
      event as CustomEvent<{ kind?: 'drag' | 'resize' | 'select' }>
    ).detail;
    const kind = detail?.kind;
    if (!kind) return;
    this.activeInteractions.add(kind);
    this.suspendUpdates = true;
    this.hide();
  };
  private interactionEndHandler = (event: Event): void => {
    const detail = (
      event as CustomEvent<{ kind?: 'drag' | 'resize' | 'select' }>
    ).detail;
    const kind = detail?.kind;
    if (!kind) return;
    this.activeInteractions.delete(kind);
    if (this.activeInteractions.size > 0) return;
    this.suspendUpdates = false;
    this.update();
  };
  private activeElement: ICanvasElement | null = null;
  private selectedElements: PlanningElement[] = [];
  private readonly tasksApi = new TasksApiService(
    new HttpInterceptorClient(environment.apiUrl)
  );
  private goalTagOptions: TagPickerItem[] = [];
  private goalTagsLoading = false;
  private goalTagsLoadFailed = false;
  private goalTagsSelectionKey: string | null = null;
  private layoutService = new StoryLayoutService();

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly bulkActions: BulkActionsController,
    private readonly interactionAdapter: CanvasInteractionAdapter | null = null,
    private readonly runtime: AppRuntime = createAppRuntime(),
    private readonly options: SelectionActionMenuOptions = {}
  ) {
    const useAttachedStyle =
      this.options.positionStrategy === 'top-right-inset';
    this.container = createSurface({
      className: useAttachedStyle
        ? 'fixed z-40 hidden translate-x-0 items-center gap-1 rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-sm'
        : 'fixed z-40 hidden translate-x-0 items-center gap-1 rounded-full p-1.5 pr-2.5',
    });

    this.actionNodes = this.enableLegacyPlanningActions
      ? this.buildActionNodes()
      : [];
    this.renderActions();
  }

  private get enableLegacyPlanningActions(): boolean {
    return this.options.enableLegacyPlanningActions ?? true;
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.requestUpdate())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.requestUpdate())
    );
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.addEventListener('canvasInteractionEnd', this.interactionEndHandler);
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      this.refreshRuntimeUi();
    }, { emitCurrent: true });
    this.requestUpdate();
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.goalTagLoadSubscription?.unsubscribe();
    this.goalTagLoadSubscription = null;
    this.statusSelector?.destroy();
    this.statusSelector = null;
    this.goalTagsPopover?.destroy();
    this.goalTagsPopover = null;
    this.aiActionsDropdown?.destroy();
    this.aiActionsDropdown = null;
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.removeEventListener(
      'canvasInteractionEnd',
      this.interactionEndHandler
    );
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.container.remove();
  }

  private requestUpdate(): void {
    if (this.suspendUpdates) {
      return;
    }
    this.update();
  }

  private update(): void {
    if (
      this.canvasManager.isDraggingElements ||
      this.canvasManager.isResizingStory
    ) {
      this.hide();
      return;
    }
    const selected = this.scene.getSelectedElements();
    if (selected.length === 0) {
      this.hide();
      return;
    }
    if (!this.enableLegacyPlanningActions) {
      const primary = selected[0] ?? null;
      const bounds = SelectionContext.getSelectionBounds(selected);
      if (!this.isBoundsVisible(bounds)) {
        this.hide();
        return;
      }
      this.activeElement = primary;
      this.renderInteractionActions({
        selectedElements: selected,
        target: primary,
      });
      this.show();
      this.positionForBounds(bounds);
      return;
    }

    const planningSelected = SelectionContext.getPlanningSelection(this.scene);
    if (planningSelected.length !== selected.length) {
      this.hide();
      return;
    }
    this.selectedElements = planningSelected;
    const primary = planningSelected[0];
    this.activeElement = primary;
    const bounds = SelectionContext.getSelectionBounds(planningSelected);
    if (!this.isBoundsVisible(bounds)) {
      this.hide();
      return;
    }
    const context: ActionContext = {
      elements: planningSelected,
      primary,
      isMulti: planningSelected.length > 1,
    };
    this.updateGoalTagsState(context);
    this.updateActionVisibility(context);
    this.renderInteractionActions({
      selectedElements: planningSelected,
      target: primary,
    });
    this.updateAiDropdown();
    this.updateDeleteConfirmation(planningSelected);
    this.updateStatusSelector(planningSelected);
    if (!this.hasVisibleActions()) {
      this.hide();
      return;
    }
    this.show();
    this.positionForBounds(bounds);
    this.aiActionsDropdown?.reposition();
  }

  private show(): void {
    if (this.container.classList.contains('hidden')) {
      this.container.classList.remove('hidden');
      this.container.classList.add('flex');
    }
  }

  private hide(): void {
    this.activeElement = null;
    this.aiActionsDropdown?.close();
    this.goalTagsPopover?.close();
    this.selectedElements = [];
    this.goalTagsSelectionKey = null;
    this.deleteConfirmState = null;
    this.clearDeleteConfirmTimer();
    this.statusSelector?.close();
    this.clearInteractionActionElements();
    if (!this.container.classList.contains('hidden')) {
      this.container.classList.remove('flex');
      this.container.classList.add('hidden');
    }
  }

  private renderActions(): void {
    this.container.innerHTML = '';
    this.actionElements.clear();
    this.aiActionsDropdown?.destroy();
    this.aiActionsDropdown = null;
    this.goalTagsPopover?.destroy();
    this.goalTagsPopover = null;
    this.statusSelector?.destroy();
    this.statusSelector = null;
    this.clearInteractionActionElements();
    this.actionNodes.forEach((node) => {
      if (node.kind === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'mx-1 h-4 w-px shrink-0 bg-slate-200/70';
        this.actionElements.set(node.id, divider);
        this.container.appendChild(divider);
        return;
      }
      if (node.variant === 'status') {
        const selector = new StatusSelector({
          i18n: this.runtime.i18n,
          onStatusChange: (status) => this.applyStatus(status),
        });
        this.statusSelector = selector;
        this.actionElements.set(node.id, selector.element);
        this.container.appendChild(selector.element);
        return;
      }
      if (node.variant === 'ai') {
        const dropdown = new AiActionsDropdown({
          triggerLabel: this.runtime.i18n.t('selectionMenu.aiTrigger'),
          openLabel: this.runtime.i18n.t('selectionMenu.openAiActions'),
          unavailableLabel: this.runtime.i18n.t(
            'selectionMenu.aiActionsUnavailable'
          ),
        });
        this.aiActionsDropdown = dropdown;
        this.actionElements.set(node.id, dropdown.element);
        this.container.appendChild(dropdown.element);
        return;
      }
      if (node.variant === 'goal-tags') {
        const btn = this.createIconButton(
          node.title,
          node.icon ?? 'tag',
          node.onClick ?? (() => {})
        );
        const popover = new BulkTagActionPopover({
          triggerButton: btn,
          items: this.goalTagOptions,
          loading: this.goalTagsLoading,
          errorMessage: this.goalTagsLoadFailed ? 'Failed to load tags.' : null,
          modeLabels: {
            add: this.runtime.i18n.t('selectionMenu.addTags'),
            remove: this.runtime.i18n.t('selectionMenu.removeTags'),
            replace: this.runtime.i18n.t('selectionMenu.replaceTags'),
          },
          applyLabels: {
            add: this.runtime.i18n.t('selectionMenu.applyAddTags'),
            remove: this.runtime.i18n.t('selectionMenu.applyRemoveTags'),
            replace: this.runtime.i18n.t('selectionMenu.applyReplaceTags'),
          },
          onCreate: async (title) => this.createGoalTag(title),
          onApply: ({ mode, tagIds }) => {
            this.bulkActions.updateGoalTags(this.selectedElements, {
              mode,
              tagIds,
              tagCatalog: this.goalTagOptions,
            });
          },
        });
        this.goalTagsPopover = popover;
        this.actionElements.set(node.id, popover.element);
        this.container.appendChild(popover.element);
        return;
      }
      const btn = this.createIconButton(
        node.title,
        node.icon ?? 'square-2-stack',
        node.onClick ?? (() => {}),
        {
          isDanger: node.isDanger,
          iconOptions: node.iconOptions,
        }
      );
      this.actionElements.set(node.id, btn);
      this.container.appendChild(btn);
    });
    this.updateAiDropdown();
  }

  private updateActionVisibility(context: ActionContext): void {
    this.actionNodes.forEach((node) => {
      const el = this.actionElements.get(node.id);
      if (!el) return;
      const visible = node.isVisible ? node.isVisible(context) : true;
      const display = node.kind === 'divider' ? 'block' : 'inline-flex';
      el.style.display = visible ? display : 'none';
    });
  }

  private buildActionNodes(): ActionNode[] {
    const isSingle = (context: ActionContext): boolean => !context.isMulti;
    const isMulti = (context: ActionContext): boolean => context.isMulti;
    const hasConnections = (context: ActionContext): boolean =>
      this.bulkActions.hasConnectionsForElements(context.elements);
    const isStory = (context: ActionContext): boolean =>
      context.primary instanceof StoryElement;
    const isStoryOrGoal = (context: ActionContext): boolean =>
      context.primary instanceof StoryElement ||
      context.primary instanceof GoalElement;
    const supportsGoalTags = (context: ActionContext): boolean =>
      selectionSupportsGoalTags(context.elements);
    return [
      {
        kind: 'action',
        id: 'status',
        title: this.runtime.i18n.t('selectionMenu.changeStatus'),
        variant: 'status',
        onClick: () => {},
      },
      {
        kind: 'divider',
        id: 'divider-status',
        isVisible: isMulti,
      },
      {
        kind: 'divider',
        id: 'divider-related',
        isVisible: (context) => isSingle(context) && isStoryOrGoal(context),
      },
      {
        kind: 'action',
        id: 'ai-menu',
        title: this.runtime.i18n.t('selectionMenu.aiActions'),
        variant: 'ai',
        isVisible: (context) => isSingle(context) || isMulti(context),
      },
      {
        kind: 'divider',
        id: 'divider-ai-tags',
        isVisible: (context) => supportsGoalTags(context),
      },
      {
        kind: 'action',
        id: 'goal-tags',
        title: this.runtime.i18n.t('selectionMenu.tags'),
        icon: 'tag',
        variant: 'goal-tags',
        isVisible: supportsGoalTags,
      },
      {
        kind: 'divider',
        id: 'divider-ai',
        isVisible: (context) => isSingle(context) || isMulti(context),
      },
      {
        kind: 'action',
        id: 'copy-bulk',
        title: this.runtime.i18n.t('selectionMenu.copy'),
        icon: 'square-2-stack',
        isVisible: isMulti,
        onClick: () => this.handleCopy(),
      },
      {
        kind: 'action',
        id: 'remove-connections-bulk',
        title: this.runtime.i18n.t('selectionMenu.removeConnections'),
        icon: 'link-slash',
        isVisible: (context) => isMulti(context) && hasConnections(context),
        onClick: () => this.handleRemoveConnections(),
      },
      {
        kind: 'action',
        id: 'delete-bulk',
        title: this.runtime.i18n.t('selectionMenu.removeFromCanvas'),
        icon: 'minus',
        isVisible: isMulti,
        onClick: () => this.handleRemove(),
      },
      { kind: 'divider', id: 'divider-delete-bulk', isVisible: isMulti },
      {
        kind: 'action',
        id: 'delete-bulk-danger',
        title: this.runtime.i18n.t('selectionMenu.deletePermanently'),
        icon: 'trash',
        isDanger: true,
        isVisible: isMulti,
        onClick: () => {
          this.handleDeletePermanently();
        },
      },
      {
        kind: 'action',
        id: 'create-task',
        title: this.runtime.i18n.t('selectionMenu.createTask'),
        icon: 'plus',
        isVisible: (context) => isSingle(context) && isStory(context),
        onClick: () => {
          this.handleCreateTask();
        },
      },
      {
        kind: 'action',
        id: 'add-related',
        title: this.runtime.i18n.t('selectionMenu.addRelated'),
        icon: 'magnifying-glass',
        isVisible: (context) => isSingle(context) && isStoryOrGoal(context),
        onClick: () => this.handleAddRelated(),
      },
      {
        kind: 'divider',
        id: 'divider-main',
        isVisible: isSingle,
      },
      {
        kind: 'action',
        id: 'edit',
        title: this.runtime.i18n.t('selectionMenu.edit'),
        icon: 'pencil',
        isVisible: isSingle,
        onClick: () => this.handleEdit(),
      },
      {
        kind: 'action',
        id: 'copy',
        title: this.runtime.i18n.t('selectionMenu.copy'),
        icon: 'square-2-stack',
        isVisible: isSingle,
        onClick: () => this.handleCopy(),
      },
      {
        kind: 'action',
        id: 'remove-connections',
        title: this.runtime.i18n.t('selectionMenu.removeConnections'),
        icon: 'link-slash',
        isVisible: (context) => isSingle(context) && hasConnections(context),
        onClick: () => this.handleRemoveConnections(),
      },
      {
        kind: 'action',
        id: 'delete',
        title: this.runtime.i18n.t('selectionMenu.removeFromCanvas'),
        icon: 'minus',
        isVisible: isSingle,
        onClick: () => this.handleRemove(),
      },
      {
        kind: 'divider',
        id: 'divider-delete',
        isVisible: isSingle,
      },
      {
        kind: 'action',
        id: 'delete-danger',
        title: this.runtime.i18n.t('selectionMenu.deletePermanently'),
        icon: 'trash',
        isDanger: true,
        isVisible: isSingle,
        onClick: () => {
          this.handleDeletePermanently();
        },
      },
    ];
  }

  private positionForBounds(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    if (this.options.positionStrategy === 'top-right-inset') {
      const anchorX = bounds.x + bounds.width - 12;
      const anchorY = bounds.y + 12;
      const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
      const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
      positionFixedElement(this.container, {
        anchorX: screenX,
        anchorY: screenY,
        alignX: 'right',
        alignY: 'top',
      });
      return;
    }

    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    positionFixedElement(this.container, {
      anchorX: screenX,
      anchorY: screenY,
      alignX: 'center',
      alignY: 'top',
      offsetY: 10,
    });
  }

  private isBoundsVisible(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const viewBounds = panZoom.viewBounds ?? getViewBounds(panZoom, canvas);
    return isRectVisible(
      viewBounds,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
  }

  private createIconButton(
    title: string,
    icon: IconName,
    handler: () => void,
    options: {
      isDanger?: boolean;
      iconOptions?: IconOptions;
      variant?: ActionButtonVariant;
      disabled?: boolean;
    } = {}
  ): HTMLButtonElement {
    const { isDanger = false, iconOptions, variant, disabled = false } = options;
    const btn = createIconButton({
      icon,
      size: 'sm',
      tone: 'text',
      iconSize: iconOptions?.size,
      iconStrokeWidth: iconOptions?.strokeWidth,
      title,
      ariaLabel: title,
      className: 'rounded-lg border border-transparent bg-transparent',
      disabled,
    });
    this.setButtonVariant(btn, variant ?? (isDanger ? 'danger' : 'default'));
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (disabled) {
        return;
      }
      this.aiActionsDropdown?.close();
      handler();
    });
    return btn;
  }

  private updateGoalTagsState(context: ActionContext): void {
    if (!selectionSupportsGoalTags(context.elements)) {
      this.goalTagsPopover?.close();
      this.goalTagsSelectionKey = null;
      return;
    }

    const nextSelectionKey = context.elements
      .map((element) => element.id)
      .sort()
      .join('|');
    if (this.goalTagsSelectionKey !== nextSelectionKey) {
      this.goalTagsSelectionKey = nextSelectionKey;
      this.goalTagsPopover?.reset();
    }
    this.ensureGoalTagsLoaded();
    this.syncGoalTagsPopover();
  }

  private ensureGoalTagsLoaded(): void {
    if (this.goalTagsLoading || this.goalTagLoadSubscription) {
      return;
    }
    if (this.goalTagOptions.length > 0 && !this.goalTagsLoadFailed) {
      return;
    }

    this.goalTagsLoading = true;
    this.goalTagsLoadFailed = false;
    this.syncGoalTagsPopover();
    this.goalTagLoadSubscription = this.tasksApi.getTags().subscribe({
      next: (tags) => {
        this.goalTagOptions = tags.map((tag) => ({
          id: tag.id,
          title: tag.title,
          color: tag.color,
        }));
        this.goalTagsLoading = false;
        this.goalTagsLoadFailed = false;
        this.syncGoalTagsPopover();
      },
      error: () => {
        this.goalTagsLoading = false;
        this.goalTagsLoadFailed = true;
        this.goalTagLoadSubscription = null;
        this.syncGoalTagsPopover();
      },
      complete: () => {
        this.goalTagLoadSubscription = null;
      },
    });
  }

  private syncGoalTagsPopover(): void {
    this.goalTagsPopover?.update({
      items: this.goalTagOptions,
      loading: this.goalTagsLoading,
      errorMessage: this.goalTagsLoadFailed ? 'Failed to load tags.' : null,
      onCreate: async (title) => this.createGoalTag(title),
      onApply: ({ mode, tagIds }) => {
        this.bulkActions.updateGoalTags(this.selectedElements, {
          mode,
          tagIds,
          tagCatalog: this.goalTagOptions,
        });
      },
    });
  }

  private async createGoalTag(title: string): Promise<TagPickerItem | null> {
    try {
      const created = await firstValueFrom(
        this.tasksApi.createTag({
          title,
          color: getDefaultTagColor(title),
        })
      );
      const createdOption = {
        id: created.id,
        title: created.title,
        color: created.color,
      };
      const existingIndex = this.goalTagOptions.findIndex(
        (tag) => tag.id === createdOption.id
      );
      if (existingIndex >= 0) {
        this.goalTagOptions[existingIndex] = createdOption;
      } else {
        this.goalTagOptions.push(createdOption);
      }
      this.goalTagsLoadFailed = false;
      this.syncGoalTagsPopover();
      return createdOption;
    } catch {
      throw new Error('Failed to create tag.');
    }
  }

  private renderInteractionActions(context: InteractionActionContext): void {
    this.clearInteractionActionElements();
    if (!this.interactionAdapter) {
      return;
    }

    const groups =
      this.interactionAdapter.getSelectionActions?.({
        scene: this.scene,
        canvasManager: this.canvasManager,
        runtime: this.runtime,
        selectedElements: context.selectedElements,
      }) ?? [];
    const actions = groups.reduce<CanvasActionDefinition[]>(
      (items, group) => items.concat(group.actions),
      []
    );
    if (actions.length === 0) {
      return;
    }

    if (
      !(
        (this.options.omitDividerForInteractionActions ?? false) &&
        !this.enableLegacyPlanningActions
      )
    ) {
      const divider = document.createElement('div');
      divider.className = 'mx-1 h-4 w-px shrink-0 bg-slate-200/70';
      this.container.appendChild(divider);
      this.interactionActionElements.push(divider);
    }

    actions.forEach((action) => {
      const button = this.createInteractionActionButton(action, context);
      this.container.appendChild(button);
      this.interactionActionElements.push(button);
    });
  }

  private clearInteractionActionElements(): void {
    this.interactionActionElements.forEach((element) => element.remove());
    this.interactionActionElements = [];
  }

  private createInteractionActionButton(
    action: CanvasActionDefinition,
    context: InteractionActionContext
  ): HTMLButtonElement {
    return this.createIconButton(
      action.label,
      action.icon ?? 'ellipsis-vertical',
      () => {
        void this.interactionAdapter?.executeAction?.({
          scene: this.scene,
          canvasManager: this.canvasManager,
          runtime: this.runtime,
          actionId: action.id,
          target: context.target,
          selectedElements: context.selectedElements,
        });
      },
      {
        disabled: action.disabled,
        variant:
          action.tone === 'primary'
            ? 'primary'
            : action.tone === 'danger'
              ? 'danger'
              : 'default',
      }
    );
  }

  private updateAiDropdown(): void {
    if (!this.aiActionsDropdown) return;
    this.aiActionsDropdown.setItems(
      this.getAiMenuItems().map((item) => ({
        id: item.label.toLowerCase().replace(/\s+/g, '-'),
        label: item.label,
        icon: item.icon,
        hint: item.hint,
        onSelect: item.onClick,
      }))
    );
  }

  private getAiMenuItems(): Array<{
    label: string;
    icon: IconName;
    hint: string;
    onClick: () => void;
  }> {
    if (this.selectedElements.length === 0) {
      return [];
    }

    const items: Array<{
      label: string;
      icon: IconName;
      hint: string;
      onClick: () => void;
    }> = [];
    if (this.selectedElements.length === 1) {
      const primary = this.selectedElements[0];
      const primaryKind =
        primary instanceof GoalElement
          ? 'goal'
          : primary instanceof StoryElement
            ? 'story'
            : 'task';
      if (primaryKind !== 'task') {
        items.push({
          label: this.getAiBreakdownLabel(),
          icon: 'slash',
          hint: getAiAssistantBreakdownHint(primaryKind, this.runtime.i18n),
          onClick: () => this.handleAiBreakdown(),
        });
      }
      items.push(
        {
          label: this.runtime.i18n.t('selectionMenu.clarify'),
          icon: 'light-bulb',
          hint: getAiAssistantClarifyHint(primaryKind, this.runtime.i18n),
          onClick: () => this.handleAiClarify(),
        },
        {
          label: this.runtime.i18n.t('selectionMenu.fillMissingDetails'),
          icon: 'puzzle-piece',
          hint: getAiAssistantFillDetailsHint(this.runtime.i18n),
          onClick: () => this.handleAiFillDetails(),
        },
        {
          label: this.runtime.i18n.t('selectionMenu.linkBlockers'),
          icon: 'arrow-path',
          hint: getAiAssistantLinkBlockersHint(this.runtime.i18n),
          onClick: () => this.handleAiDependencies(),
        }
      );
      return items;
    }

    items.push(
      {
        label: this.runtime.i18n.t('selectionMenu.connectSelected'),
        icon: 'arrow-path',
        hint: getAiAssistantConnectSelectedHint(this.runtime.i18n),
        onClick: () => this.handleAiDependencies(),
      },
      {
        label: this.runtime.i18n.t('selectionMenu.fillMissingDetails'),
        icon: 'puzzle-piece',
        hint: getAiAssistantFillDetailsHint(this.runtime.i18n),
        onClick: () => this.handleAiFillDetails(),
      }
    );
    return items;
  }

  private getAiBreakdownLabel(): string {
    const primary = this.selectedElements[0];
    if (primary instanceof GoalElement) {
      return this.runtime.i18n.t('selectionMenu.breakIntoStories');
    }
    if (primary instanceof StoryElement) {
      return this.runtime.i18n.t('selectionMenu.breakIntoTasks');
    }
    return this.runtime.i18n.t('selectionMenu.breakDown');
  }

  private applyStatus(status: ElementStatus): void {
    if (this.selectedElements.length === 0) return;
    this.bulkActions.updateStatus(this.selectedElements, status);
  }

  private handleEdit(): void {
    if (!this.activeElement) return;
    const editable = this.activeElement as ICanvasElement & {
      onDoubleClick?: (() => void) | unknown;
    };
    if (typeof editable.onDoubleClick === 'function') {
      editable.onDoubleClick();
    }
  }

  private handleCopy(): void {
    this.bulkActions.copy(this.selectedElements);
  }

  private handleAddRelated(): void {
    if (!this.activeElement) return;
    if (
      !(this.activeElement instanceof StoryElement) &&
      !(this.activeElement instanceof GoalElement)
    ) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('relatedItemsPickerRequested', {
        detail: { element: this.activeElement },
      })
    );
  }

  private handleCreateTask(): void {
    if (!(this.activeElement instanceof StoryElement)) return;
    addTaskToStory({
      story: this.activeElement,
      scene: this.scene,
      canvasManager: this.canvasManager,
      layoutService: this.layoutService,
    });
  }

  private handleAiBreakdown(): void {
    const targetId = this.selectedElements[0]?.id;
    if (!targetId) return;
    emitAiAssistantIntentRequested('breakdown', {
      scope: 'selection',
      targetIds: [targetId],
    });
  }

  private handleAiDependencies(): void {
    emitAiAssistantIntentRequested('dependencies', {
      scope: 'selection',
      targetIds: this.getSelectedTargetIds(),
    });
  }

  private handleAiClarify(): void {
    const targetId = this.selectedElements[0]?.id;
    if (!targetId) return;
    emitAiAssistantIntentRequested('clarify', {
      scope: 'selection',
      targetIds: [targetId],
    });
  }

  private handleAiFillDetails(): void {
    emitAiAssistantIntentRequested('fill_details', {
      scope: 'selection',
      targetIds: this.getSelectedTargetIds(),
    });
  }

  private handleDeletePermanently(): void {
    const confirmKey = this.getDeleteConfirmKey(this.selectedElements);
    if (!confirmKey) return;
    if (!this.isConfirmingDelete(confirmKey)) {
      this.deleteConfirmState = {
        key: confirmKey,
        expiresAt: Date.now() + this.confirmTimeoutMs,
      };
      this.clearDeleteConfirmTimer();
      this.deleteConfirmTimer = window.setTimeout(() => {
        if (!this.deleteConfirmState) return;
        if (Date.now() < this.deleteConfirmState.expiresAt) return;
        this.deleteConfirmState = null;
        this.deleteConfirmTimer = null;
        this.updateDeleteButtonLabels(false);
      }, this.confirmTimeoutMs + 50);
      this.updateDeleteButtonLabels(true);
      return;
    }
    this.deleteConfirmState = null;
    this.clearDeleteConfirmTimer();
    this.updateDeleteButtonLabels(false);
    this.bulkActions.deletePermanently(this.selectedElements);
  }

  private handleRemove(): void {
    this.bulkActions.removeFromCanvas(this.selectedElements);
  }

  private handleRemoveConnections(): void {
    this.bulkActions.removeConnectionsForElements(this.selectedElements);
  }

  private updateStatusSelector(elements: PlanningElement[]): void {
    if (!this.statusSelector || elements.length === 0) return;
    const status = SelectionContext.getMixedStatus(elements);
    this.statusSelector.setState(status ?? null);
  }

  private updateDeleteConfirmation(elements: PlanningElement[]): void {
    this.syncDeleteConfirmation(elements);
    const confirming = this.isConfirmingDelete(
      this.getDeleteConfirmKey(elements)
    );
    this.updateDeleteButtonLabels(confirming);
  }

  private updateDeleteButtonLabels(confirming: boolean): void {
    const title = confirming
      ? this.runtime.i18n.t('selectionMenu.confirmDelete')
      : this.runtime.i18n.t('selectionMenu.deletePermanently');
    const icon = confirming ? 'x-mark' : 'trash';
    const variant = confirming ? 'warning' : 'danger';
    ['delete-danger', 'delete-bulk-danger'].forEach((id) => {
      const el = this.actionElements.get(id);
      if (!el || !(el instanceof HTMLButtonElement)) return;
      el.title = title;
      el.setAttribute('aria-label', title);
      this.setButtonVariant(el, variant);
      const existingIcon = el.querySelector('svg');
      if (existingIcon) {
        existingIcon.remove();
      }
      el.appendChild(createIcon(icon));
    });
  }

  private syncDeleteConfirmation(elements: PlanningElement[]): void {
    if (!this.deleteConfirmState) return;
    if (Date.now() > this.deleteConfirmState.expiresAt) {
      this.deleteConfirmState = null;
      this.clearDeleteConfirmTimer();
      return;
    }
    const key = this.getDeleteConfirmKey(elements);
    if (!key || key !== this.deleteConfirmState.key) {
      this.deleteConfirmState = null;
      this.clearDeleteConfirmTimer();
    }
  }

  private isConfirmingDelete(confirmKey: string | null): boolean {
    if (!confirmKey || !this.deleteConfirmState) return false;
    if (Date.now() > this.deleteConfirmState.expiresAt) return false;
    return this.deleteConfirmState.key === confirmKey;
  }

  private getDeleteConfirmKey(elements: PlanningElement[]): string | null {
    if (elements.length === 0) return null;
    const keys = elements
      .map((el) => this.getElementConfirmKey(el))
      .filter(Boolean) as string[];
    if (keys.length === 0) return null;
    keys.sort();
    return keys.join('|');
  }

  private getElementConfirmKey(element: PlanningElement): string | null {
    if (element instanceof TaskElement) return `task:${element.id}`;
    if (element instanceof StoryElement) return `story:${element.id}`;
    if (element instanceof GoalElement) return `goal:${element.id}`;
    return null;
  }

  private clearDeleteConfirmTimer(): void {
    if (this.deleteConfirmTimer === null) return;
    window.clearTimeout(this.deleteConfirmTimer);
    this.deleteConfirmTimer = null;
  }

  private setButtonVariant(
    button: HTMLButtonElement,
    variant: ActionButtonVariant
  ): void {
    button.dataset.variant = variant;
    this.toggleClassNames(button, ACTION_BUTTON_VARIANT_CLASS.default, false);
    this.toggleClassNames(button, ACTION_BUTTON_VARIANT_CLASS.primary, false);
    this.toggleClassNames(button, ACTION_BUTTON_VARIANT_CLASS.danger, false);
    this.toggleClassNames(button, ACTION_BUTTON_VARIANT_CLASS.warning, false);
    this.toggleClassNames(button, ACTION_BUTTON_VARIANT_CLASS[variant], true);
  }

  private toggleClassNames(
    element: HTMLElement,
    classNames: string,
    enabled: boolean
  ): void {
    classNames
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => element.classList.toggle(token, enabled));
  }

  private getSelectedTargetIds(): string[] {
    return this.selectedElements.map((element) => element.id);
  }

  private hasVisibleActions(): boolean {
    return Array.from(this.container.children).some(
      (child) =>
        !(child instanceof HTMLElement) ||
        child.style.display === '' ||
        child.style.display !== 'none'
    );
  }

  private refreshRuntimeUi(): void {
    this.actionNodes = this.enableLegacyPlanningActions
      ? this.buildActionNodes()
      : [];
    this.renderActions();
    this.requestUpdate();
  }
}
