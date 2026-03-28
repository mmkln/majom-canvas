import { Subscription } from 'rxjs';
import { historyService } from '../core/services/HistoryService.ts';
import { DeleteCommand } from '../core/commands/DeleteCommand.ts';
import { CopyCommand } from '../core/commands/CopyCommand.ts';
import { PasteCommand } from '../core/commands/PasteCommand.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { SetFocusCommand } from '../core/commands/SetFocusCommand.ts';
import { SetHighlightCommand } from '../core/commands/SetHighlightCommand.ts';
import { Scene } from '../core/scene/Scene.ts';
import { clipboardService } from '../core/services/ClipboardService.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { HabitElement } from '../elements/HabitElement.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { ElementStatus } from '../elements/ElementStatus.ts';
import { addTaskToStory } from './storyTaskActions.ts';
import { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import { ExistingHabitPicker } from './components/ExistingHabitPicker.ts';
import { createMenuBadge } from './components/MenuBadge.ts';
import { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';
import { AddExistingHabitService } from '../core/services/AddExistingHabitService.ts';
import {
  createSurface,
  createDivider,
  createDropdownItem,
  createDropdownControlItem,
  createDropdownIconRow,
  createSplitDropdownItem,
  type MenuItemVariant,
  type DropdownIconActionTone,
} from './primitives/index.ts';
import { createIcon, type IconName } from './icons.ts';
import {
  getStatusLabel,
  STATUS_ICON_MAP,
  STATUS_ICON_TONE_CLASS,
  STATUS_ORDER,
} from './statusPresentation.ts';
import {
  getRoutineStatusLabel,
  ROUTINE_STATUS_ICON_MAP,
  ROUTINE_STATUS_ICON_TONE_CLASS,
  ROUTINE_STATUS_ORDER,
} from './routineStatusPresentation.ts';
import { emitAiAssistantIntentRequested } from '../../ai-assistant/aiAssistantEvents.ts';
import {
  getAiAssistantBreakdownHint,
  getAiAssistantClarifyHint,
  getAiAssistantFillDetailsHint,
  getAiAssistantLinkBlockersHint,
} from '../../ai-assistant/aiAssistantHints.ts';
import {
  SelectionContext,
  type PlanningElement,
} from '../core/services/SelectionContext.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import {
  getPlanningElementCapabilities,
  isHabitElement,
  isTaskStoryGoalPlanningElement,
} from '../elements/utils/planningElementCapabilities.ts';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import { Checkbox } from '../../../ui-lib/src/components/Checkbox.ts';

type ContextMenuDetail = {
  element: ICanvasElement | null;
  sceneX: number;
  sceneY: number;
};

type MenuActionResult = 'keep-open' | void;

type ContextMenuActionItem = {
  label: string;
  hint?: string;
  action: () => MenuActionResult;
  tone?: 'danger' | 'warning';
  className?: string;
  variant?: MenuItemVariant;
  leading?: HTMLElement | null;
  trailing?: HTMLElement | null;
};

type ContextMenuSubmenuItem = {
  label: string;
  submenu: ContextMenuActionItem[];
  tone?: 'danger' | 'warning';
};

type ContextMenuSplitActionItem = ContextMenuActionItem & {
  secondaryAction: () => MenuActionResult;
  secondaryIcon: IconName;
  secondaryLabel: string;
};

type ContextMenuRowButton = {
  icon: IconName;
  label: string;
  action: () => MenuActionResult;
  tone?: DropdownIconActionTone;
  disabled?: boolean;
};

type ContextMenuRowItem = {
  row: ContextMenuRowButton[];
  dividerAfter?: boolean;
};

type ContextMenuControlItem = {
  control: HTMLElement;
  dividerAfter?: boolean;
};

type ContextMenuItem =
  | ContextMenuActionItem
  | ContextMenuSubmenuItem
  | ContextMenuSplitActionItem
  | ContextMenuRowItem
  | ContextMenuControlItem;

type ContextMenuSection = {
  title?: string;
  items: ContextMenuItem[];
};

export class ContextMenu {
  private menu: HTMLDivElement;
  private submenu: HTMLDivElement;
  private visible = false;
  private handler: ((event: Event) => void) | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private viewSubscription: Subscription | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private confirmState: { key: string; expiresAt: number } | null = null;
  private lastDetail: ContextMenuDetail | null = null;
  private submenuTrigger: HTMLButtonElement | null = null;
  private submenuCloseTimeoutId: number | null = null;
  private layoutService = new StoryLayoutService();
  private bulkActions: BulkActionsController;
  private readonly confirmTimeoutMs = 4000;
  private readonly submenuCloseDelayMs = 120;

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager,
    private existingTaskPicker: ExistingTaskPicker,
    private existingGoalPicker: ExistingGoalPicker,
    private existingStoryPicker: ExistingStoryPicker,
    private existingHabitPicker: ExistingHabitPicker,
    private addExistingTaskService: AddExistingTaskService,
    private addExistingGoalService: AddExistingGoalService,
    private addExistingStoryService: AddExistingStoryService,
    private addExistingHabitService: AddExistingHabitService,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
    this.bulkActions = new BulkActionsController(scene);
    this.menu = createSurface({
      elevated: true,
      className:
        'fixed z-50 min-w-[200px] overflow-hidden rounded-xl p-0 text-sm text-slate-800',
    });
    this.menu.style.display = 'none';
    this.menu.setAttribute('role', 'menu');

    this.submenu = createSurface({
      elevated: true,
      className:
        'fixed z-[60] min-w-[180px] overflow-hidden rounded-xl p-0 text-sm text-slate-800',
    });
    this.submenu.style.display = 'none';
    this.submenu.setAttribute('role', 'menu');
    this.submenu.addEventListener('mouseenter', () => {
      this.clearSubmenuCloseTimer();
    });
    this.submenu.addEventListener('mouseleave', () => {
      this.scheduleSubmenuClose();
    });
    this.submenu.addEventListener('keydown', this.onSubmenuKeyDown);
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.menu);
    parent.appendChild(this.submenu);
    this.handler = (event: Event) => {
      const customEvent = event as CustomEvent<ContextMenuDetail>;
      this.show(customEvent.detail);
    };
    window.addEventListener('contextMenuRequested', this.handler);
    this.viewSubscription = this.canvasManager
      .getPanZoomManager()
      .viewChanges.subscribe(() => this.onViewportChange());
    this.disposeRuntimeSubscription = this.runtime.subscribe(() => {
      if (this.visible) {
        this.render();
      }
    });
  }

  unmount(): void {
    if (this.handler) {
      window.removeEventListener('contextMenuRequested', this.handler);
      this.handler = null;
    }
    if (this.viewSubscription) {
      this.viewSubscription.unsubscribe();
      this.viewSubscription = null;
    }
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.hide();
    this.existingTaskPicker.close();
    this.existingGoalPicker.close();
    this.existingStoryPicker.close();
    this.existingHabitPicker.close();
    this.closeSubmenu();
    this.submenu.removeEventListener('keydown', this.onSubmenuKeyDown);
    this.submenu.remove();
    this.menu.remove();
  }

  private show(detail: ContextMenuDetail): void {
    this.syncConfirmState(detail.element);
    this.lastDetail = detail;
    this.render();

    const { x, y } = this.getScreenCoords(detail.sceneX, detail.sceneY);
    this.menu.style.display = 'block';
    this.menu.style.visibility = 'hidden';
    this.positionMenu({ x, y });
    this.menu.style.visibility = 'visible';
    this.visible = true;

    this.attachOutsideHandler();
  }

  private render(): void {
    if (!this.lastDetail) return;
    const sections = this.buildSections(this.lastDetail);
    this.renderSections(sections);
    if (this.visible && this.lastDetail) {
      const { x, y } = this.getScreenCoords(
        this.lastDetail.sceneX,
        this.lastDetail.sceneY
      );
      this.positionMenu({ x, y });
    }
  }

  private hide(): void {
    if (!this.visible) return;
    this.menu.style.display = 'none';
    this.visible = false;
    this.closeSubmenu();
    this.confirmState = null;
    if (this.outsideHandler) {
      window.removeEventListener('mousedown', this.outsideHandler);
      this.outsideHandler = null;
    }
  }

  private onViewportChange(): void {
    if (this.visible) {
      this.hide();
    }
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!this.menu.contains(target) && !this.submenu.contains(target)) {
        this.hide();
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);
  }

  private buildSections(detail: ContextMenuDetail): ContextMenuSection[] {
    const { element, sceneX, sceneY } = detail;
    if (!element) {
      const sections: ContextMenuSection[] = [];
      if (clipboardService.getItems().length > 0) {
        sections.push({
          title: this.runtime.i18n.t('canvasContextMenu.clipboard'),
          items: [
            {
              label: this.runtime.i18n.t('canvasContextMenu.paste'),
              action: () =>
                historyService.execute(
                  new PasteCommand(this.scene, this.canvasManager)
                ),
            },
          ],
        });
      }
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.addItem'),
        items: [
          {
            label: this.getPlanningElementLabel('goal', { capitalize: true }),
            action: () => this.createGoalAt(sceneX, sceneY),
            secondaryAction: () => this.openExistingGoalPicker(sceneX, sceneY),
            secondaryIcon: 'magnifying-glass',
            secondaryLabel: this.runtime.i18n.t(
              'canvasContextMenu.findExistingGoal'
            ),
          },
          {
            label: this.getPlanningElementLabel('story', { capitalize: true }),
            action: () => this.createStoryAt(sceneX, sceneY),
            secondaryAction: () => this.openExistingStoryPicker(sceneX, sceneY),
            secondaryIcon: 'magnifying-glass',
            secondaryLabel: this.runtime.i18n.t(
              'canvasContextMenu.findExistingStory'
            ),
          },
          {
            label: this.getPlanningElementLabel('task', { capitalize: true }),
            action: () => this.createTaskAt(sceneX, sceneY),
            secondaryAction: () => this.openExistingTaskPicker(sceneX, sceneY),
            secondaryIcon: 'magnifying-glass',
            secondaryLabel: this.runtime.i18n.t(
              'canvasContextMenu.findExistingTask'
            ),
          },
          {
            label: this.getPlanningElementLabel('habit', { capitalize: true }),
            action: () => this.createRoutineAt(sceneX, sceneY),
            secondaryAction: () => this.openExistingHabitPicker(sceneX, sceneY),
            secondaryIcon: 'magnifying-glass',
            secondaryLabel: this.runtime.i18n.t(
              'canvasContextMenu.findExistingHabit'
            ),
          },
        ],
      });
      return sections;
    }

    const isPlanningElement =
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement ||
      element instanceof HabitElement;
    const confirmKey = this.getElementConfirmKey(element);
    const isConfirming = this.isConfirmingDelete(confirmKey);
    const elementLabel = this.getElementLabel(element);
    const deleteLabel = isConfirming
      ? this.runtime.i18n.t('canvasContextMenu.confirmDelete')
      : this.runtime.i18n.t('canvasContextMenu.deleteElement', {
          element: elementLabel,
        });

    const sections: ContextMenuSection[] = [];
    const actionItems: ContextMenuItem[] = [];
    const planningElement = isPlanningElement ? element : null;
    const selectionScopedElements = planningElement
      ? this.getSelectionScopedElements(planningElement)
      : [];
    const selectionConnectionItems = planningElement
      ? this.buildSelectionConnectionItems(
          planningElement,
          selectionScopedElements
        )
      : [];

    if (selectionConnectionItems.length > 0) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.selection'),
        items: selectionConnectionItems,
      });
    }

    const connectionItems =
      planningElement && selectionScopedElements.length === 0
        ? this.buildConnectionItems(planningElement)
        : [];
    if (connectionItems.length > 0) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.connections'),
        items: connectionItems,
      });
    }

    actionItems.push(this.buildElementActionRow(element, planningElement));
    if (
      planningElement &&
      isTaskStoryGoalPlanningElement(planningElement) &&
      getPlanningElementCapabilities(planningElement).supportsAiActions
    ) {
      actionItems.push({
        label: this.runtime.i18n.t('canvasContextMenu.aiAssist'),
        submenu: this.buildPlanningElementAiItems(planningElement),
      });
    }

    const getTitleByElement = (el: ICanvasElement): string | undefined => {
      if (el instanceof TaskElement) {
        return this.getPlanningElementLabel('task', { capitalize: true });
      }
      if (el instanceof StoryElement) {
        return this.getPlanningElementLabel('story', { capitalize: true });
      }
      if (el instanceof GoalElement) {
        return this.getPlanningElementLabel('goal', { capitalize: true });
      }
      if (el instanceof HabitElement) {
        return this.getPlanningElementLabel('habit', { capitalize: true });
      }
      return undefined;
    };

    sections.push({
      title: getTitleByElement(element),
      items: actionItems,
    });

    if (element instanceof StoryElement) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.addItemToStory'),
        items: [
          {
            label: this.getPlanningElementLabel('task', { capitalize: true }),
            action: () => this.createTaskInStory(element),
            secondaryAction: () => {
              this.openRelatedItemsPicker(element);
            },
            secondaryIcon: 'magnifying-glass',
            secondaryLabel: this.runtime.i18n.t(
              'canvasContextMenu.addRelatedTasks'
            ),
          },
        ],
      });
    }

    if (planningElement && isHabitElement(planningElement)) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.habitActions'),
        items: [this.buildHabitCompletionControl(planningElement)],
      });
    }

    if (planningElement) {
      const isFocused = this.scene.isFocused(planningElement);
      const isHighlighted = this.scene.isHighlighted(planningElement);
      sections.push({
        items: [
          {
            label: this.runtime.i18n.t('canvasContextMenu.focus'),
            action: () =>
              historyService.execute(
                new SetFocusCommand(
                  this.scene,
                  isFocused ? null : planningElement.id
                )
              ),
            variant: isFocused ? 'selected' : 'default',
            leading: createMenuBadge('focus'),
          },
          {
            label: this.runtime.i18n.t('canvasContextMenu.highlight'),
            action: () =>
              historyService.execute(
                new SetHighlightCommand(
                  this.scene,
                  planningElement.id,
                  !isHighlighted
                )
              ),
            variant: isHighlighted ? 'selected' : 'default',
            leading: createMenuBadge('highlight'),
          },
        ],
      });
    }

    if (
      planningElement &&
      getPlanningElementCapabilities(planningElement).supportsLifecycleStatus
    ) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.setStatus'),
        items: STATUS_ORDER.map((status) => {
          const isCurrent = planningElement.status === status;
          return {
            label: getStatusLabel(status, this.runtime.i18n),
            leading: this.createStatusIcon(status),
            trailing: isCurrent ? this.createActiveStatusCheck() : null,
            variant: isCurrent ? 'selected' : 'default',
            action: () => {
              if (isCurrent) return 'keep-open';
              this.bulkActions.updateStatus([planningElement], status);
            },
          };
        }),
      });
    } else if (planningElement && isHabitElement(planningElement)) {
      sections.push({
        title: this.runtime.i18n.t('canvasContextMenu.setStatus'),
        items: this.buildRoutineStatusItems(planningElement),
      });
    }

    if (
      planningElement &&
      getPlanningElementCapabilities(planningElement).supportsPermanentDelete
    ) {
      sections.push({
        items: [
          {
            label: deleteLabel,
            tone: isConfirming ? ('warning' as const) : ('danger' as const),
            action: () => {
              if (!confirmKey) return;
              const stillConfirming = this.isConfirmingDelete(confirmKey);
              if (!stillConfirming) {
                this.confirmState = {
                  key: confirmKey,
                  expiresAt: Date.now() + this.confirmTimeoutMs,
                };
                return 'keep-open';
              }
              this.confirmState = null;
              window.dispatchEvent(
                new CustomEvent('elementDeleteRequested', {
                  detail: { element },
                })
              );
            },
          },
        ],
      });
    }

    return sections;
  }

  private getSelectionScopedElements(
    target: PlanningElement
  ): PlanningElement[] {
    return SelectionContext.getPlanningSelectionExcluding(
      this.scene,
      target.id
    );
  }

  private buildSelectionConnectionItems(
    target: PlanningElement,
    selected: PlanningElement[]
  ): ContextMenuActionItem[] {
    if (!getPlanningElementCapabilities(target).supportsRelations) {
      return [];
    }
    if (selected.length === 0) return [];

    const items: ContextMenuActionItem[] = [];
    const connectToTargetLabel = this.getConnectToTargetLabel(target);

    const eligibleSources = this.bulkActions.getEligibleLinkSourcesToTarget(
      selected,
      target
    )
      .filter((element) =>
        this.shouldExposeRequestedConnectionDirection(element, target)
      );
    if (
      eligibleSources.length > 0 &&
      this.bulkActions.canConnectToTarget(eligibleSources, target)
    ) {
      items.push({
        label: connectToTargetLabel,
        leading: this.createLeadingIcon('link'),
        action: () => {
          this.bulkActions.connectToTarget(eligibleSources, target);
        },
      });
    }

    const redirectableSources =
      this.bulkActions
        .getRedirectableLinkSourcesToTarget(selected, target)
        .filter((element) =>
          this.shouldExposeRequestedConnectionDirection(element, target)
        );
    if (
      redirectableSources.length > 0 &&
      this.bulkActions.canRedirectToTarget(redirectableSources, target)
    ) {
      items.push({
        label: this.getRedirectConnectionLabel(redirectableSources.length),
        leading: this.createLeadingIcon('arrows-right-left'),
        action: () => {
          this.bulkActions.redirectToTarget(redirectableSources, target);
        },
      });
    }

    let eligibleTargets = this.bulkActions
      .getEligibleLinkTargetsFromSource(target, selected)
      .filter((element) =>
        this.shouldExposeRequestedConnectionDirection(target, element)
      );
    if (this.shouldCollapseConnectTargetsAction(target, eligibleSources, eligibleTargets)) {
      eligibleTargets = [];
    }
    if (
      eligibleTargets.length > 0 &&
      this.bulkActions.canConnectFromSourceToTargets(target, eligibleTargets)
    ) {
      items.push({
        label: this.getConnectFromTargetLabel(
          target,
          eligibleTargets,
          connectToTargetLabel
        ),
        leading: this.createLeadingIcon('link'),
        action: () => {
          this.bulkActions.connectFromSourceToTargets(target, eligibleTargets);
        },
      });
    }

    const redirectableTargets =
      this.bulkActions
        .getRedirectableLinkTargetsFromSource(target, selected)
        .filter((element) =>
          this.shouldExposeRequestedConnectionDirection(target, element)
        );
    if (
      redirectableTargets.length > 0 &&
      this.bulkActions.canRedirectFromSourceToTargets(
        target,
        redirectableTargets
      )
    ) {
      items.push({
        label: this.getRedirectConnectionLabel(redirectableTargets.length),
        leading: this.createLeadingIcon('arrows-right-left'),
        action: () => {
          this.bulkActions.redirectFromSourceToTargets(
            target,
            redirectableTargets
          );
        },
      });
    }

    if (
      this.bulkActions.hasConnectionsBetweenElementAndTargets(target, selected)
    ) {
      items.push({
        label: this.runtime.i18n.t('canvasContextMenu.removeConnections'),
        leading: this.createLeadingIcon('link-slash'),
        action: () => {
          this.bulkActions.removeConnectionsBetweenElementAndTargets(
            target,
            selected
          );
        },
      });
    }

    return items;
  }

  private shouldExposeRequestedConnectionDirection(
    source: PlanningElement,
    target: PlanningElement
  ): boolean {
    return this.getConnectionUiMode(source, target) !== 'story-goal-reverse';
  }

  private shouldCollapseConnectTargetsAction(
    source: PlanningElement,
    eligibleSources: PlanningElement[],
    eligibleTargets: PlanningElement[]
  ): boolean {
    return (
      eligibleSources.length > 0 &&
      eligibleTargets.length > 0 &&
      eligibleTargets.every(
        (target) => this.getConnectionUiMode(source, target) === 'undirected'
      )
    );
  }

  private getConnectionUiMode(
    source: PlanningElement,
    target: PlanningElement
  ): 'story-goal-forward' | 'story-goal-reverse' | 'directional' | 'undirected' {
    if (source instanceof StoryElement && target instanceof GoalElement) {
      return 'story-goal-forward';
    }
    if (source instanceof GoalElement && target instanceof StoryElement) {
      return 'story-goal-reverse';
    }
    if (source instanceof GoalElement && target instanceof GoalElement) {
      return 'directional';
    }
    return 'undirected';
  }

  private getConnectToTargetLabel(target: PlanningElement): string {
    return this.runtime.i18n.t('canvasContextMenu.connectTo', {
      target: this.describePlanningElements([target], { capitalize: true }),
    });
  }

  private getConnectFromTargetLabel(
    source: PlanningElement,
    targets: PlanningElement[],
    existingConnectToLabel: string
  ): string {
    const connectToTargetsLabel = this.runtime.i18n.t(
      'canvasContextMenu.connectTo',
      {
        target: this.describePlanningElements(targets, { capitalize: true }),
      }
    );
    if (connectToTargetsLabel !== existingConnectToLabel) {
      return connectToTargetsLabel;
    }
    return this.runtime.i18n.t('canvasContextMenu.connectFrom', {
      target: this.describePlanningElements([source], { capitalize: true }),
    });
  }

  private getRedirectConnectionLabel(count: number): string {
    return count === 1
      ? this.runtime.i18n.t('canvasContextMenu.redirectConnection')
      : this.runtime.i18n.t('canvasContextMenu.redirectConnections');
  }

  private describePlanningElements(
    elements: PlanningElement[],
    options: { capitalize?: boolean } = {}
  ): string {
    const goalCount = elements.filter(
      (element) => element instanceof GoalElement
    ).length;
    const storyCount = elements.filter(
      (element) => element instanceof StoryElement
    ).length;
    const taskCount = elements.filter(
      (element) => element instanceof TaskElement
    ).length;
    const habitCount = elements.filter(
      (element) => element instanceof HabitElement
    ).length;
    const kinds = [
      goalCount > 0 ? 'goal' : null,
      storyCount > 0 ? 'story' : null,
      taskCount > 0 ? 'task' : null,
      habitCount > 0 ? 'habit' : null,
    ].filter(Boolean);

    if (kinds.length !== 1) {
      return this.getGenericLabel(
        elements.length === 1 ? 'item' : 'selection',
        options
      );
    }

    if (goalCount > 0) {
      return this.getPlanningElementLabel('goal', {
        capitalize: options.capitalize,
        plural: goalCount > 1,
      });
    }
    if (storyCount > 0) {
      return this.getPlanningElementLabel('story', {
        capitalize: options.capitalize,
        plural: storyCount > 1,
      });
    }
    if (taskCount > 0) {
      return this.getPlanningElementLabel('task', {
        capitalize: options.capitalize,
        plural: taskCount > 1,
      });
    }
    return this.getPlanningElementLabel('habit', {
      capitalize: options.capitalize,
      plural: habitCount > 1,
    });
  }

  private buildConnectionItems(
    target: PlanningElement
  ): ContextMenuActionItem[] {
    if (!getPlanningElementCapabilities(target).supportsRelations) {
      return [];
    }
    if (!this.bulkActions.hasConnectionsForElement(target)) {
      return [];
    }

    return [
      {
        label: this.runtime.i18n.t('canvasContextMenu.removeConnections'),
        leading: this.createLeadingIcon('link-slash'),
        action: () => {
          this.bulkActions.removeConnectionsForElement(target);
        },
      },
    ];
  }

  private renderSections(sections: ContextMenuSection[]): void {
    this.closeSubmenu();
    this.menu.innerHTML = '';
    const visibleSections = sections.filter(
      (section) => section.items.length > 0
    );
    visibleSections.forEach((section, index) => {
      if (index > 0) {
        this.menu.appendChild(createDivider({ inset: false }));
      }
      if (section.title) {
        const header = document.createElement('div');
        header.className =
          'px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400';
        header.textContent = section.title;
        this.menu.appendChild(header);
      }
      section.items.forEach((item, itemIndex) => {
        if (this.isRowItem(item)) {
          this.menu.appendChild(this.createRow(item));
          if (item.dividerAfter && itemIndex < section.items.length - 1) {
            this.menu.appendChild(createDivider({ inset: false }));
          }
          return;
        }
        if (this.isControlItem(item)) {
          this.menu.appendChild(this.createControlItem(item));
          if (item.dividerAfter && itemIndex < section.items.length - 1) {
            this.menu.appendChild(createDivider({ inset: false }));
          }
          return;
        }

        if (this.isSubmenuItem(item)) {
          const btn = createDropdownItem({
            label: item.label ?? '',
            tone: item.tone === 'danger' ? 'danger' : 'default',
            trailing: this.createSubmenuChevron(),
            onClick: (event) => {
              event.preventDefault();
              event.stopPropagation();
              this.toggleSubmenu(item, btn);
            },
          });
          btn.setAttribute('aria-haspopup', 'menu');
          btn.setAttribute('aria-expanded', 'false');
          btn.setAttribute('role', 'menuitem');
          btn.addEventListener('mouseenter', () => {
            this.openSubmenu(item, btn);
          });
          btn.addEventListener('mouseleave', () => {
            this.scheduleSubmenuClose();
          });
          btn.addEventListener('focus', () => {
            this.openSubmenu(item, btn);
          });
          btn.addEventListener('keydown', (event: KeyboardEvent) => {
            this.onSubmenuTriggerKeyDown(event, item, btn);
          });
          this.menu.appendChild(btn);
          return;
        }

        if (this.isSplitActionItem(item)) {
          this.menu.appendChild(this.createSplitActionRow(item));
          return;
        }

        const btn = this.createActionButton(item);
        btn.addEventListener('mouseenter', () => {
          this.closeSubmenu();
        });
        btn.addEventListener('focus', () => {
          this.closeSubmenu();
        });
        this.menu.appendChild(btn);
      });
    });
  }

  private isSubmenuItem(item: ContextMenuItem): item is ContextMenuSubmenuItem {
    return 'submenu' in item;
  }

  private isRowItem(item: ContextMenuItem): item is ContextMenuRowItem {
    return 'row' in item;
  }

  private isControlItem(
    item: ContextMenuItem
  ): item is ContextMenuControlItem {
    return 'control' in item;
  }

  private isSplitActionItem(
    item: ContextMenuItem
  ): item is ContextMenuSplitActionItem {
    return 'secondaryAction' in item;
  }

  private createSubmenuChevron(): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className =
      'ml-auto inline-flex items-center justify-center text-slate-400';
    const chevron = createIcon('chevron-right', { size: 14, strokeWidth: 2 });
    chevron.setAttribute('aria-hidden', 'true');
    wrap.appendChild(chevron);
    return wrap;
  }

  private createLeadingIcon(
    name: IconName,
    className = 'text-slate-400'
  ): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className = `inline-flex items-center justify-center ${className}`.trim();
    const icon = createIcon(name, { size: 14, strokeWidth: 1.9 });
    icon.classList.add('shrink-0');
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    return wrap;
  }

  private buildPlanningElementAiItems(
    planningElement: TaskElement | StoryElement | GoalElement
  ): ContextMenuActionItem[] {
    const targetIds = [planningElement.id];
    const kind =
      planningElement instanceof GoalElement
        ? 'goal'
        : planningElement instanceof StoryElement
          ? 'story'
          : 'task';
    const items: ContextMenuActionItem[] = [];

    if (kind !== 'task') {
      items.push({
        label:
          kind === 'goal'
            ? this.runtime.i18n.t('canvasContextMenu.breakIntoStories')
            : this.runtime.i18n.t('canvasContextMenu.breakIntoTasks'),
        hint: getAiAssistantBreakdownHint(kind, this.runtime.i18n),
        action: () =>
          emitAiAssistantIntentRequested('breakdown', {
            scope: 'selection',
            targetIds,
          }),
      });
    }

    items.push(
      {
        label: this.runtime.i18n.t('canvasContextMenu.clarify'),
        hint: getAiAssistantClarifyHint(kind, this.runtime.i18n),
        action: () =>
          emitAiAssistantIntentRequested('clarify', {
            scope: 'selection',
            targetIds,
          }),
      },
      {
        label: this.runtime.i18n.t('canvasContextMenu.fillMissingDetails'),
        hint: getAiAssistantFillDetailsHint(this.runtime.i18n),
        action: () =>
          emitAiAssistantIntentRequested('fill_details', {
            scope: 'selection',
            targetIds,
          }),
      },
      {
        label: this.runtime.i18n.t('canvasContextMenu.linkBlockers'),
        hint: getAiAssistantLinkBlockersHint(this.runtime.i18n),
        action: () =>
          emitAiAssistantIntentRequested('dependencies', {
            scope: 'selection',
            targetIds,
          }),
      }
    );

    return items;
  }

  private buildElementActionRow(
    element: ICanvasElement,
    planningElement: PlanningElement | null
  ): ContextMenuRowItem {
    const row: ContextMenuRowButton[] = [];
    if (planningElement) {
      row.push({
        icon: 'pencil',
        label: this.runtime.i18n.t('canvasContextMenu.edit'),
        action: () => {
          planningElement.onDoubleClick?.();
        },
      });
    }
    if (
      planningElement &&
      getPlanningElementCapabilities(planningElement).supportsDuplication
    ) {
      row.push({
        icon: 'square-2-stack',
        label: this.runtime.i18n.t('canvasContextMenu.copy'),
        action: () =>
          historyService.execute(new CopyCommand(this.scene, [element])),
      });
    }
    row.push({
      icon: 'minus',
      label: this.runtime.i18n.t('canvasContextMenu.removeFromCanvas'),
      action: () =>
        historyService.execute(new DeleteCommand(this.scene, [element])),
    });
    return {
      row,
      dividerAfter: true,
    };
  }

  private buildHabitCompletionControl(
    habit: HabitElement
  ): ContextMenuControlItem {
    const checkbox = new Checkbox({
      checked: habit.completedToday,
      ariaLabel: this.runtime.i18n.t('common.doneToday'),
      stopPropagation: true,
      onChange: (checked) => {
        this.emitHabitAction(habit, 'set-completion-date', {
          completed: checked,
          date: this.getTodayKey(),
        });
        this.hide();
      },
    });
    checkbox.getElement().classList.add('shrink-0');
    const control = createDropdownControlItem({
      label: this.runtime.i18n.t('common.doneToday'),
      control: checkbox.getElement(),
      onClick: () => {
        checkbox.toggleChecked();
      },
    });

    return { control };
  }

  private buildRoutineStatusItems(
    habit: HabitElement
  ): ContextMenuActionItem[] {
    return ROUTINE_STATUS_ORDER.map((status) => {
      const isCurrent = habit.habitStatus === status;
      return {
        label: getRoutineStatusLabel(status, this.runtime.i18n),
        leading: this.createRoutineStatusIcon(status),
        trailing: isCurrent ? this.createActiveStatusCheck() : null,
        variant: isCurrent ? 'selected' : 'default',
        action: () => {
          if (isCurrent) return 'keep-open';
          this.emitHabitAction(
            habit,
            status === Status.Archived ? 'archive' : 'restore'
          );
        },
      };
    });
  }

  private emitHabitAction(
    habit: HabitElement,
    action:
      | 'mark-done-today'
      | 'undo-today'
      | 'archive'
      | 'restore'
      | 'set-completion-date',
    options: {
      date?: string;
      completed?: boolean;
    } = {}
  ): void {
    window.dispatchEvent(
      new CustomEvent('habitCanvasMutationRequested', {
        detail: {
          element: habit,
          action,
          date: options.date,
          completed: options.completed,
        },
      })
    );
  }

  private getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private createStatusIcon(status: ElementStatus): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className = 'inline-flex items-center justify-center';
    const icon = createIcon(STATUS_ICON_MAP[status], {
      size: 14,
      strokeWidth: 1.7,
    });
    icon.classList.add('shrink-0', STATUS_ICON_TONE_CLASS[status]);
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    return wrap;
  }

  private createActiveStatusCheck(): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className =
      'ml-auto inline-flex items-center justify-center text-indigo-700';
    const check = createIcon('check', { size: 14, strokeWidth: 2 });
    check.setAttribute('aria-hidden', 'true');
    wrap.appendChild(check);
    return wrap;
  }

  private createRoutineStatusIcon(
    status: Status.Active | Status.Archived
  ): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className = 'inline-flex items-center justify-center';
    const icon = createIcon(ROUTINE_STATUS_ICON_MAP[status], {
      size: 14,
      strokeWidth: 1.7,
    });
    icon.classList.add('shrink-0', ROUTINE_STATUS_ICON_TONE_CLASS[status]);
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    return wrap;
  }

  private createActionButton(item: ContextMenuActionItem): HTMLButtonElement {
    const warningClassName =
      item.tone === 'warning'
        ? 'font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-800'
        : '';
    const customClassName = item.className ?? '';
    const btn = createDropdownItem({
      label: item.label ?? '',
      hint: item.hint,
      variant: item.variant,
      tone: item.tone === 'danger' ? 'danger' : 'default',
      className: `${warningClassName} ${customClassName}`.trim(),
      leading: item.leading ?? null,
      trailing: item.trailing ?? null,
      onClick: () => this.executeItemAction(item.action),
    });
    btn.setAttribute('role', 'menuitem');
    return btn;
  }

  private createRow(item: ContextMenuRowItem): HTMLDivElement {
    const row = createDropdownIconRow({
      actions: item.row.map((button) => ({
        icon: button.icon,
        label: button.label,
        tone: button.tone,
        disabled: button.disabled,
        onClick: () => this.executeItemAction(button.action),
      })),
    });
    row.addEventListener('mouseenter', () => {
      this.closeSubmenu();
    });
    row.addEventListener('focusin', () => {
      this.closeSubmenu();
    });
    return row;
  }

  private createControlItem(item: ContextMenuControlItem): HTMLElement {
    const row = item.control;
    row.addEventListener('mouseenter', () => {
      this.closeSubmenu();
    });
    row.addEventListener('focusin', () => {
      this.closeSubmenu();
    });
    return row;
  }

  private createSplitActionRow(
    item: ContextMenuSplitActionItem
  ): HTMLDivElement {
    const warningClassName =
      item.tone === 'warning'
        ? 'font-medium text-amber-700 hover:bg-amber-50 hover:text-amber-800'
        : '';
    return createSplitDropdownItem({
      label: item.label ?? '',
      hint: item.hint,
      variant: item.variant,
      tone: item.tone === 'danger' ? 'danger' : 'default',
      className: `${warningClassName} ${item.className ?? ''}`.trim(),
      primaryTransparent: true,
      leading: item.leading ?? null,
      trailing: item.trailing ?? null,
      secondaryIcon: item.secondaryIcon,
      secondaryLabel: item.secondaryLabel,
      onPrimaryClick: () => this.executeItemAction(item.action),
      onSecondaryClick: () => this.executeItemAction(item.secondaryAction),
      onPointerEnter: () => this.closeSubmenu(),
      onFocusWithin: () => this.closeSubmenu(),
    });
  }

  private executeItemAction(action: () => MenuActionResult): void {
    const result = action();
    if (result === 'keep-open') {
      this.render();
      return;
    }
    this.hide();
  }

  private toggleSubmenu(
    item: ContextMenuSubmenuItem,
    trigger: HTMLButtonElement
  ): void {
    if (
      this.submenu.style.display === 'block' &&
      this.submenuTrigger === trigger
    ) {
      this.closeSubmenu();
      return;
    }
    this.openSubmenu(item, trigger);
  }

  private openSubmenu(
    item: ContextMenuSubmenuItem,
    trigger: HTMLButtonElement
  ): void {
    if (item.submenu.length === 0) return;
    this.clearSubmenuCloseTimer();
    this.renderSubmenuItems(item.submenu);
    this.positionSubmenu(trigger);
    this.submenu.style.display = 'block';
    this.submenu.style.visibility = 'hidden';
    this.positionSubmenu(trigger);
    this.submenu.style.visibility = 'visible';

    if (this.submenuTrigger && this.submenuTrigger !== trigger) {
      this.setSubmenuTriggerExpanded(this.submenuTrigger, false);
    }
    this.submenuTrigger = trigger;
    this.setSubmenuTriggerExpanded(trigger, true);
  }

  private closeSubmenu(): void {
    this.clearSubmenuCloseTimer();
    if (this.submenu.style.display !== 'none') {
      this.submenu.style.display = 'none';
      this.submenu.innerHTML = '';
    }
    if (this.submenuTrigger) {
      this.setSubmenuTriggerExpanded(this.submenuTrigger, false);
      this.submenuTrigger = null;
    }
  }

  private scheduleSubmenuClose(): void {
    this.clearSubmenuCloseTimer();
    this.submenuCloseTimeoutId = window.setTimeout(() => {
      this.closeSubmenu();
    }, this.submenuCloseDelayMs);
  }

  private clearSubmenuCloseTimer(): void {
    if (this.submenuCloseTimeoutId === null) return;
    window.clearTimeout(this.submenuCloseTimeoutId);
    this.submenuCloseTimeoutId = null;
  }

  private setSubmenuTriggerExpanded(
    trigger: HTMLButtonElement,
    expanded: boolean
  ): void {
    trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    trigger.classList.toggle('bg-indigo-50', expanded);
    trigger.classList.toggle('text-slate-800', expanded);
  }

  private renderSubmenuItems(items: ContextMenuActionItem[]): void {
    this.submenu.innerHTML = '';
    items.forEach((item) => {
      const btn = this.createActionButton(item);
      this.submenu.appendChild(btn);
    });
  }

  private positionSubmenu(trigger: HTMLButtonElement): void {
    const triggerRect = trigger.getBoundingClientRect();
    const submenuWidth = this.measureFloatingWidth(this.submenu);
    const gap = 4;
    const openLeft =
      triggerRect.right + gap + submenuWidth > window.innerWidth - 8;

    positionFixedElement(this.submenu, {
      anchorX: openLeft ? triggerRect.left - gap : triggerRect.right + gap,
      anchorY: triggerRect.top,
      alignX: openLeft ? 'right' : 'left',
      alignY: 'top',
    });
  }

  private measureFloatingWidth(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0) return rect.width;

    const previousDisplay = element.style.display;
    const previousVisibility = element.style.visibility;
    const previousPointerEvents = element.style.pointerEvents;
    element.style.display = 'block';
    element.style.visibility = 'hidden';
    element.style.pointerEvents = 'none';
    const measured = element.getBoundingClientRect().width;
    element.style.display = previousDisplay;
    element.style.visibility = previousVisibility;
    element.style.pointerEvents = previousPointerEvents;
    return measured;
  }

  private focusFirstSubmenuItem(): void {
    const first = this.submenu.querySelector('button:not([disabled])');
    if (!(first instanceof HTMLButtonElement)) return;
    first.focus();
  }

  private onSubmenuTriggerKeyDown(
    event: KeyboardEvent,
    item: ContextMenuSubmenuItem,
    trigger: HTMLButtonElement
  ): void {
    if (
      event.key === 'ArrowRight' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.openSubmenu(item, trigger);
      this.focusFirstSubmenuItem();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.closeSubmenu();
    }
  }

  private onSubmenuKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const trigger = this.submenuTrigger;
      this.closeSubmenu();
      trigger?.focus();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide();
    }
  };

  private syncConfirmState(element: ICanvasElement | null): void {
    if (!this.confirmState) return;
    if (Date.now() > this.confirmState.expiresAt) {
      this.confirmState = null;
      return;
    }
    const nextKey = this.getElementConfirmKey(element);
    if (!nextKey || this.confirmState.key !== nextKey) {
      this.confirmState = null;
    }
  }

  private isConfirmingDelete(confirmKey: string | null): boolean {
    if (!confirmKey || !this.confirmState) return false;
    if (Date.now() > this.confirmState.expiresAt) {
      this.confirmState = null;
      return false;
    }
    return this.confirmState.key === confirmKey;
  }

  private getScreenCoords(
    sceneX: number,
    sceneY: number
  ): { x: number; y: number } {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const x = sceneX * panZoom.scale - panZoom.scrollX + rect.left;
    const y = sceneY * panZoom.scale - panZoom.scrollY + rect.top;
    return { x, y };
  }

  private positionMenu(coords: { x: number; y: number }): void {
    positionFixedElement(this.menu, {
      anchorX: coords.x,
      anchorY: coords.y,
      alignX: 'left',
      alignY: 'top',
    });
  }

  private getElementConfirmKey(element: ICanvasElement | null): string | null {
    if (!element) return null;
    if (element instanceof TaskElement) return `task:${element.id}`;
    if (element instanceof StoryElement) return `story:${element.id}`;
    if (element instanceof GoalElement) return `goal:${element.id}`;
    if (element instanceof HabitElement) return `habit:${element.id}`;
    return null;
  }

  private getElementLabel(element: ICanvasElement): string {
    if (element instanceof TaskElement) {
      return this.getPlanningElementLabel('task');
    }
    if (element instanceof StoryElement) {
      return this.getPlanningElementLabel('story');
    }
    if (element instanceof GoalElement) {
      return this.getPlanningElementLabel('goal');
    }
    if (element instanceof HabitElement) {
      return this.getPlanningElementLabel('habit');
    }
    return this.getGenericLabel('item');
  }

  private getPlanningElementLabel(
    kind: 'goal' | 'story' | 'task' | 'habit',
    options: { plural?: boolean; capitalize?: boolean } = {}
  ): string {
    const key =
      kind === 'goal'
        ? options.plural
          ? 'canvasContextMenu.goals'
          : 'canvasContextMenu.goal'
        : kind === 'story'
          ? options.plural
            ? 'canvasContextMenu.stories'
            : 'canvasContextMenu.story'
          : kind === 'task'
            ? options.plural
              ? 'canvasContextMenu.tasks'
              : 'canvasContextMenu.task'
            : options.plural
              ? 'canvasContextMenu.habits'
              : 'canvasContextMenu.habit';
    return this.formatLabelCase(this.runtime.i18n.t(key), options.capitalize);
  }

  private getGenericLabel(
    kind: 'item' | 'selection',
    options: { capitalize?: boolean } = {}
  ): string {
    const key =
      kind === 'selection'
        ? 'canvasContextMenu.selectionTarget'
        : 'canvasContextMenu.item';
    return this.formatLabelCase(this.runtime.i18n.t(key), options.capitalize);
  }

  private formatLabelCase(label: string, capitalize = false): string {
    if (!capitalize || label.length === 0) {
      return label;
    }
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private createTaskAt(sceneX: number, sceneY: number): void {
    const task = new TaskElement({
      x: sceneX - TaskElement.width / 2,
      y: sceneY - TaskElement.height / 2,
    });
    historyService.execute(new AddElementCommand(this.scene, task));
    this.scene.setSelected([task]);
    this.canvasManager.draw();
  }

  private createTaskInStory(story: StoryElement): void {
    addTaskToStory({
      story,
      scene: this.scene,
      canvasManager: this.canvasManager,
      layoutService: this.layoutService,
    });
  }

  private openRelatedItemsPicker(element: StoryElement | GoalElement): void {
    window.dispatchEvent(
      new CustomEvent('relatedItemsPickerRequested', {
        detail: { element },
      })
    );
  }

  private createStoryAt(sceneX: number, sceneY: number): void {
    const story = new StoryElement({
      x: sceneX - StoryElement.width / 2,
      y: sceneY - StoryElement.height / 2,
    });
    historyService.execute(new AddElementCommand(this.scene, story));
    this.scene.setSelected([story]);
    this.canvasManager.draw();
  }

  private createGoalAt(sceneX: number, sceneY: number): void {
    const goal = new GoalElement({
      x: sceneX - GoalElement.width / 2,
      y: sceneY - GoalElement.height / 2,
    });
    historyService.execute(new AddElementCommand(this.scene, goal));
    this.scene.setSelected([goal]);
    this.canvasManager.draw();
  }

  private createRoutineAt(sceneX: number, sceneY: number): void {
    const routine = new HabitElement({
      x: sceneX - HabitElement.radius,
      y: sceneY - HabitElement.radius,
      title: this.runtime.i18n.t('habits.newRoutine'),
      habitStatus: Status.Active,
    });
    historyService.execute(new AddElementCommand(this.scene, routine));
    this.scene.setSelected([routine]);
    this.canvasManager.draw();
  }

  private openExistingGoalPicker(sceneX: number, sceneY: number): void {
    this.existingGoalPicker.open({
      sceneX,
      sceneY,
      canvasChanges: this.scene.changes,
      isOnCanvas: (goal) => this.addExistingGoalService.isOnCanvas(goal),
      onPick: (goal, goalX, goalY) => {
        this.addExistingGoalService.addOrFocus(goal, goalX, goalY);
      },
    });
  }

  private openExistingTaskPicker(sceneX: number, sceneY: number): void {
    this.existingTaskPicker.open({
      sceneX,
      sceneY,
      canvasChanges: this.scene.changes,
      isOnCanvas: (task) => this.addExistingTaskService.isOnCanvas(task),
      onPick: (task, taskX, taskY) => {
        this.addExistingTaskService.addOrFocus(task, taskX, taskY);
      },
    });
  }

  private openExistingStoryPicker(sceneX: number, sceneY: number): void {
    this.existingStoryPicker.open({
      sceneX,
      sceneY,
      canvasChanges: this.scene.changes,
      isOnCanvas: (story) => this.addExistingStoryService.isOnCanvas(story),
      onPick: (story, storyX, storyY) => {
        this.addExistingStoryService.addOrFocus(story, storyX, storyY);
      },
    });
  }

  private openExistingHabitPicker(sceneX: number, sceneY: number): void {
    this.existingHabitPicker.open({
      sceneX,
      sceneY,
      canvasChanges: this.scene.changes,
      isOnCanvas: (habit) => this.addExistingHabitService.isOnCanvas(habit),
      onPick: (habit, habitX, habitY) => {
        this.addExistingHabitService.addOrFocus(habit, habitX, habitY);
      },
    });
  }
}
