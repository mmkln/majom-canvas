import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { MoveCommand } from '../core/commands/MoveCommand.ts';
import { ResizeCommand } from '../core/commands/ResizeCommand.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import {
  SelectionContext,
  PlanningElement,
} from '../core/services/SelectionContext.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import { createIcon, IconName, IconOptions } from './icons.ts';
import {
  ElementStatus,
  ELEMENT_STATUS_OPTIONS,
} from '../elements/ElementStatus.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { getViewBounds, isRectVisible } from '../core/utils/viewBounds.ts';
import { SingleSelectGroup } from './components/SingleSelectGroup.ts';

type ActionContext = {
  elements: PlanningElement[];
  primary: PlanningElement;
  isMulti: boolean;
};

const STATUS_ORDER: ElementStatus[] = [
  ElementStatus.Defined,
  ElementStatus.Pending,
  ElementStatus.InProgress,
  ElementStatus.Done,
];

const STATUS_ICON_MAP: Record<ElementStatus, IconName> = {
  [ElementStatus.Done]: 'status-done',
  [ElementStatus.InProgress]: 'status-in-progress',
  [ElementStatus.Pending]: 'status-pending',
  [ElementStatus.Defined]: 'status-defined',
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
  private statusSelector: SingleSelectGroup<ElementStatus> | null = null;
  private subscriptions: Subscription[] = [];
  private resizeHandler = () => this.update();
  private activeElement: ICanvasElement | null = null;
  private selectedElements: PlanningElement[] = [];
  private layoutService = new StoryLayoutService();

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    private readonly bulkActions: BulkActionsController
  ) {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.alignItems = 'center';
    this.container.style.gap = '6px';
    this.container.style.padding = '6px';
    this.container.style.paddingRight = '12px';
    this.container.style.background = 'rgba(255,255,255,0.96)';
    this.container.style.border = '1px solid #e5e7eb';
    this.container.style.borderRadius = '9999px';
    this.container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    this.container.style.zIndex = '40';
    this.container.style.transform = 'translate(0, 0)';

    this.actionNodes = this.buildActionNodes();
    this.renderActions();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(this.scene.changes.subscribe(() => this.update()));
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.update())
    );
    window.addEventListener('resize', this.resizeHandler);
    this.update();
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    window.removeEventListener('resize', this.resizeHandler);
    this.container.remove();
  }

  private update(): void {
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
    this.updateStatusSelector(planningSelected);
    this.positionUnderBounds(bounds);
    this.show();
  }

  private show(): void {
    if (this.container.style.display !== 'flex') {
      this.container.style.display = 'flex';
    }
  }

  private hide(): void {
    this.activeElement = null;
    this.selectedElements = [];
    if (this.container.style.display !== 'none') {
      this.container.style.display = 'none';
    }
  }

  private renderActions(): void {
    this.container.innerHTML = '';
    this.actionElements.clear();
    this.statusSelector = null;
    this.actionNodes.forEach((node) => {
      if (node.kind === 'divider') {
        const divider = document.createElement('div');
        divider.style.width = '1px';
        divider.style.height = '20px';
        divider.style.background = '#e5e7eb';
        divider.style.margin = '0 4px';
        this.actionElements.set(node.id, divider);
        this.container.appendChild(divider);
        return;
      }
      if (node.variant === 'status') {
        const statusLabels = new Map(
          ELEMENT_STATUS_OPTIONS.map((option) => [option.value, option.label])
        );
        const selector = new SingleSelectGroup<ElementStatus>({
          options: STATUS_ORDER.map((value) => ({
            id: value,
            value,
            label: statusLabels.get(value) ?? value,
          })),
          onSelect: (status) => this.applyStatus(status),
          collapseMode: 'expand-active',
          buttonWidth: 32,
          buttonPadding: '0 8px',
          renderContent: (option) => {
            const wrapper = document.createElement('span');
            wrapper.style.display = 'inline-flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '6px';
            const icon = createIcon(STATUS_ICON_MAP[option.value], {
              size: 16,
              strokeWidth: 2,
            });
            icon.setAttribute('aria-hidden', 'true');
            icon.style.display = 'block';
            const label = document.createElement('span');
            label.textContent = option.label;
            label.setAttribute('data-role', 'label');
            label.style.fontSize = '12px';
            label.style.fontWeight = '600';
            label.style.whiteSpace = 'nowrap';
            wrapper.appendChild(icon);
            wrapper.appendChild(label);
            return wrapper;
          },
          applyStyles: ({ option, button, content, active, expanded }) => {
            const styles = this.getStatusStyles(option.value);
            content.style.color = styles.text;
            button.style.background = active ? styles.bg : 'transparent';
            button.style.borderColor = active ? styles.border : 'transparent';
            button.style.color = styles.text;
            button.style.opacity = active ? '1' : '0.7';
            const label = content.querySelector(
              '[data-role="label"]'
            ) as HTMLElement | null;
            if (label) {
              label.style.display = !expanded && active ? 'inline' : 'none';
            }
          },
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
        title: 'Remove from canvas',
        icon: 'delete',
        isDanger: true,
        isVisible: isMulti,
        onClick: () => this.handleDelete(),
      },
      {
        kind: 'divider',
        id: 'divider-related',
        isVisible: (context) => isSingle(context) && isStoryOrGoal(context),
      },
      {
        kind: 'action',
        id: 'add-related',
        title: 'Add related',
        icon: 'add-related',
        isVisible: (context) => isSingle(context) && isStoryOrGoal(context),
        onClick: () => this.handleAddRelated(),
      },
      {
        kind: 'action',
        id: 'align',
        title: 'Align',
        icon: 'align',
        iconOptions: { strokeWidth: 1.5 },
        isVisible: (context) => isSingle(context) && isStory(context),
        onClick: () => this.handleAlign(),
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
        icon: 'edit',
        isVisible: isSingle,
        onClick: () => this.handleEdit(),
      },
      {
        kind: 'action',
        id: 'copy',
        title: 'Copy',
        icon: 'copy',
        isVisible: isSingle,
        onClick: () => this.handleCopy(),
      },
      {
        kind: 'action',
        id: 'delete',
        title: 'Remove from canvas',
        icon: 'delete',
        isDanger: true,
        isVisible: isSingle,
        onClick: () => this.handleDelete(),
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
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.borderRadius = '10px';
    btn.style.border = '1px solid transparent';
    btn.style.background = isDanger ? '#fee2e2' : '#f3f4f6';
    btn.style.color = isDanger ? '#dc2626' : '#111827';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'background 150ms ease, border-color 150ms ease';
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = isDanger ? '#fca5a5' : '#d1d5db';
      btn.style.background = isDanger ? '#fecaca' : '#e5e7eb';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'transparent';
      btn.style.background = isDanger ? '#fee2e2' : '#f3f4f6';
    });
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
    btn.appendChild(createIcon(icon, iconOptions));
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

  private handleAlign(): void {
    if (!(this.activeElement instanceof StoryElement)) return;
    const story = this.activeElement;
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const plan = this.layoutService.planAlignTasks(story, tasks);
    const alignedTasks = tasks.filter((task) => plan.positions.has(task.id));
    story.tasks = [];
    alignedTasks.forEach((task) => story.addTask(task));
    if (plan.positions.size === 0) return;
    const initialPositions = new Map<string, { x: number; y: number }>();
    const finalPositions = new Map<string, { x: number; y: number }>();
    plan.positions.forEach((pos, id) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      initialPositions.set(id, { x: task.x, y: task.y });
      finalPositions.set(id, pos);
    });
    if (finalPositions.size > 0) {
      historyService.execute(
        new MoveCommand(this.scene, initialPositions, finalPositions)
      );
    }
    if (plan.nextHeight > story.height) {
      const initial = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      initial.set(story.id, {
        x: story.x,
        y: story.y,
        width: story.width,
        height: story.height,
      });
      const final = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      final.set(story.id, {
        x: story.x,
        y: story.y,
        width: story.width,
        height: plan.nextHeight,
      });
      historyService.execute(new ResizeCommand(this.scene, initial, final));
    }
  }

  private handleDelete(): void {
    this.bulkActions.removeFromCanvas(this.selectedElements);
  }

  private updateStatusSelector(elements: PlanningElement[]): void {
    if (!this.statusSelector || elements.length === 0) return;
    const status = SelectionContext.getMixedStatus(elements);
    this.statusSelector.setActive(status ?? null);
  }

  private getStatusStyles(status: ElementStatus): {
    bg: string;
    border: string;
    text: string;
  } {
    switch (status) {
      case ElementStatus.InProgress:
        return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
      case ElementStatus.Pending:
        return { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' };
      case ElementStatus.Done:
        return { bg: '#dcfce7', border: '#86efac', text: '#15803d' };
      case ElementStatus.Defined:
      default:
        return { bg: '#ecfeff', border: '#67e8f9', text: '#0e7490' };
    }
  }
}
