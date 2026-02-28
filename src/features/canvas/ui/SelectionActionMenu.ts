import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { historyService } from '../core/services/HistoryService.ts';
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

type ActionContext = {
  elements: PlanningElement[];
  primary: PlanningElement;
  isMulti: boolean;
};

type ActionButtonVariant = 'default' | 'danger' | 'warning';

const ACTION_BUTTON_VARIANT_CLASS: Record<ActionButtonVariant, string> = {
  default: '!text-slate-500 hover:!bg-slate-100 hover:!text-slate-700',
  danger: '!text-rose-500 hover:!bg-rose-50 hover:!text-rose-600',
  warning: '!text-amber-600 hover:!bg-amber-50 hover:!text-amber-700',
};

type ActionNode =
  | {
      kind: 'action';
      id: string;
      title: string;
      icon?: IconName;
      iconOptions?: IconOptions;
      variant?: 'icon' | 'status';
      isDanger?: boolean;
      isVisible?: (context: ActionContext) => boolean;
      onClick?: () => void;
    }
  | {
      kind: 'divider';
      id: string;
      isVisible?: (context: ActionContext) => boolean;
    };

export class SelectionActionMenu {
  private readonly container: HTMLDivElement;
  private actionNodes: ActionNode[] = [];
  private actionElements: Map<string, HTMLElement> = new Map();
  private statusSelector: StatusSelector | null = null;
  private subscriptions: Subscription[] = [];
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
  private layoutService = new StoryLayoutService();

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly bulkActions: BulkActionsController
  ) {
    this.container = createSurface({
      className:
        'fixed z-40 hidden translate-x-0 items-center gap-1 rounded-full bg-white/96 p-1.5 pr-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.12)] backdrop-blur-[2px]',
    });

    this.actionNodes = this.buildActionNodes();
    this.renderActions();
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
    this.requestUpdate();
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.statusSelector?.destroy();
    this.statusSelector = null;
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener(
      'canvasInteractionStart',
      this.interactionStartHandler
    );
    window.removeEventListener(
      'canvasInteractionEnd',
      this.interactionEndHandler
    );
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
    this.updateActionVisibility(context);
    this.updateDeleteConfirmation(planningSelected);
    this.updateStatusSelector(planningSelected);
    this.show();
    this.positionUnderBounds(bounds);
  }

  private show(): void {
    if (this.container.classList.contains('hidden')) {
      this.container.classList.remove('hidden');
      this.container.classList.add('flex');
    }
  }

  private hide(): void {
    this.activeElement = null;
    this.selectedElements = [];
    this.deleteConfirmState = null;
    this.clearDeleteConfirmTimer();
    this.statusSelector?.close();
    if (!this.container.classList.contains('hidden')) {
      this.container.classList.remove('flex');
      this.container.classList.add('hidden');
    }
  }

  private renderActions(): void {
    this.container.innerHTML = '';
    this.actionElements.clear();
    this.statusSelector?.destroy();
    this.statusSelector = null;
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
          onStatusChange: (status) => this.applyStatus(status),
        });
        this.statusSelector = selector;
        this.actionElements.set(node.id, selector.element);
        this.container.appendChild(selector.element);
        return;
      }
      const btn = this.createIconButton(
        node.title,
        node.icon ?? 'copy',
        node.onClick ?? (() => {}),
        {
          isDanger: node.isDanger,
          iconOptions: node.iconOptions,
        }
      );
      this.actionElements.set(node.id, btn);
      this.container.appendChild(btn);
    });
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
    const isStory = (context: ActionContext): boolean =>
      context.primary instanceof StoryElement;
    const isStoryOrGoal = (context: ActionContext): boolean =>
      context.primary instanceof StoryElement ||
      context.primary instanceof GoalElement;
    return [
      {
        kind: 'action',
        id: 'status',
        title: 'Change status',
        variant: 'status',
        onClick: () => {},
      },
      {
        kind: 'divider',
        id: 'divider-status',
        isVisible: isMulti,
      },
      {
        kind: 'action',
        id: 'copy-bulk',
        title: 'Copy',
        icon: 'copy',
        isVisible: isMulti,
        onClick: () => this.handleCopy(),
      },
      {
        kind: 'action',
        id: 'delete-bulk',
        title: 'Remove from Canvas',
        icon: 'minus',
        isVisible: isMulti,
        onClick: () => this.handleRemove(),
      },
      { kind: 'divider', id: 'divider-delete-bulk', isVisible: isMulti },
      {
        kind: 'action',
        id: 'delete-bulk-danger',
        title: 'Delete permanently',
        icon: 'trash',
        isDanger: true,
        isVisible: isMulti,
        onClick: () => {
          this.handleDeletePermanently();
        },
      },
      {
        kind: 'divider',
        id: 'divider-related',
        isVisible: (context) => isSingle(context) && isStoryOrGoal(context),
      },
      {
        kind: 'action',
        id: 'create-task',
        title: 'Create Task',
        icon: 'plus',
        isVisible: (context) => isSingle(context) && isStory(context),
        onClick: () => {
          this.handleCreateTask();
        },
      },
      {
        kind: 'action',
        id: 'add-related',
        title: 'Add related',
        icon: 'squares-plus',
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
        title: 'Edit',
        icon: 'pencil',
        isVisible: isSingle,
        onClick: () => this.handleEdit(),
      },
      {
        kind: 'action',
        id: 'copy',
        title: 'Copy',
        icon: 'square-2-stack',
        isVisible: isSingle,
        onClick: () => this.handleCopy(),
      },
      {
        kind: 'action',
        id: 'delete',
        title: 'Remove from Canvas',
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
        title: 'Delete permanently',
        icon: 'trash',
        isDanger: true,
        isVisible: isSingle,
        onClick: () => {
          this.handleDeletePermanently();
        },
      },
    ];
  }

  private positionUnderBounds(bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
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
    options: { isDanger?: boolean; iconOptions?: IconOptions } = {}
  ): HTMLButtonElement {
    const { isDanger = false, iconOptions } = options;
    const btn = createIconButton({
      icon,
      size: 'sm',
      tone: 'text',
      iconSize: iconOptions?.size,
      iconStrokeWidth: iconOptions?.strokeWidth,
      title,
      ariaLabel: title,
      className: 'rounded-lg border border-transparent bg-transparent',
    });
    this.setButtonVariant(btn, isDanger ? 'danger' : 'default');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
    return btn;
  }

  private applyStatus(status: ElementStatus): void {
    if (this.selectedElements.length === 0) return;
    this.bulkActions.updateStatus(this.selectedElements, status);
  }

  private handleEdit(): void {
    if (!this.activeElement) return;
    (this.activeElement as any).onDoubleClick?.();
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
    const title = confirming ? 'Confirm delete' : 'Delete permanently';
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
}
