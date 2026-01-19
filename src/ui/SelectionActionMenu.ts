import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { CopyCommand } from '../core/commands/CopyCommand.ts';
import { MoveCommand } from '../core/commands/MoveCommand.ts';
import { ResizeCommand } from '../core/commands/ResizeCommand.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { createIcon, IconName, IconOptions } from './icons.ts';
import {
  ElementStatus,
  ELEMENT_STATUS_OPTIONS,
} from '../elements/ElementStatus.ts';

type PlanningElement = TaskElement | StoryElement | GoalElement;

type ActionContext = {
  elements: PlanningElement[];
  primary: PlanningElement;
  isMulti: boolean;
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
      onClick: () => void;
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
  private statusControls: {
    button: HTMLButtonElement;
    label: HTMLSpanElement;
    dot: HTMLSpanElement;
  } | null = null;
  private subscriptions: Subscription[] = [];
  private resizeHandler = () => this.update();
  private activeElement: ICanvasElement | null = null;
  private selectedElements: PlanningElement[] = [];
  private layoutService = new StoryLayoutService();

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
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
    this.container.style.transform = 'translate(-50%, 10px)';

    this.actionNodes = this.buildActionNodes();
    this.renderActions();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(this.scene.changes.subscribe(() => this.update()));
    this.subscriptions.push(
      this.canvasManager.getPanZoomManager().viewChanges.subscribe(() =>
        this.update()
      )
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
    const planningSelected = selected.filter((el) =>
      this.isPlanningElement(el)
    ) as PlanningElement[];
    if (planningSelected.length !== selected.length) {
      this.hide();
      return;
    }
    this.selectedElements = planningSelected;
    const primary = planningSelected[0];
    this.activeElement = primary;
    const context: ActionContext = {
      elements: planningSelected,
      primary,
      isMulti: planningSelected.length > 1,
    };
    this.updateActionVisibility(context);
    this.updateStatusButton(planningSelected);
    this.positionUnderElement(primary, planningSelected);
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
    this.statusControls = null;
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
        const status = this.createStatusButton(node.onClick);
        this.statusControls = status;
        this.actionElements.set(node.id, status.button);
        this.container.appendChild(status.button);
        return;
      }
      const btn = this.createIconButton(
        node.title,
        node.icon ?? 'copy',
        node.onClick,
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
      const display =
        node.kind === 'divider' ? 'block' : 'inline-flex';
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
        onClick: () => this.handleStatus(),
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
        title: 'Delete element',
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
        title: 'Delete element',
        icon: 'delete',
        isDanger: true,
        isVisible: isSingle,
        onClick: () => this.handleDelete(),
      },
    ];
  }

  private positionUnderElement(
    element: ICanvasElement,
    elements: PlanningElement[]
  ): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const bounds =
      elements.length > 1
        ? this.getSelectionBounds(elements)
        : this.getElementBounds(element);
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    this.container.style.left = `${screenX}px`;
    this.container.style.top = `${screenY}px`;
  }

  private getElementBounds(element: ICanvasElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const el = element as any;
    if (typeof el.width === 'number' && typeof el.height === 'number') {
      return { x: el.x, y: el.y, width: el.width, height: el.height };
    }
    if (typeof el.radius === 'number') {
      return {
        x: el.x - el.radius,
        y: el.y - el.radius,
        width: el.radius * 2,
        height: el.radius * 2,
      };
    }
    return { x: el.x, y: el.y, width: 0, height: 0 };
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

  private createStatusButton(handler: () => void): {
    button: HTMLButtonElement;
    label: HTMLSpanElement;
    dot: HTMLSpanElement;
  } {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Change status');
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '6px';
    btn.style.height = '32px';
    btn.style.padding = '0 10px';
    btn.style.borderRadius = '999px';
    btn.style.border = '1px solid #e5e7eb';
    btn.style.background = '#f9fafb';
    btn.style.color = '#374151';
    btn.style.fontSize = '12px';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';

    const dot = document.createElement('span');
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '999px';
    dot.style.background = '#d1d5db';
    dot.style.display = 'inline-block';

    const label = document.createElement('span');
    label.textContent = 'Status';

    btn.appendChild(dot);
    btn.appendChild(label);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
    return { button: btn, label, dot };
  }

  private handleStatus(): void {
    if (this.selectedElements.length === 0) return;
    const bounds =
      this.selectedElements.length > 1
        ? this.getSelectionBounds(this.selectedElements)
        : this.getElementBounds(this.selectedElements[0]);
    window.dispatchEvent(
      new CustomEvent('statusPickerRequested', {
        detail: { elements: this.selectedElements, bounds },
      })
    );
  }

  private handleEdit(): void {
    if (!this.activeElement) return;
    (this.activeElement as any).onDoubleClick?.();
  }

  private handleCopy(): void {
    if (this.selectedElements.length === 0) return;
    historyService.execute(new CopyCommand(this.scene, this.selectedElements));
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
    const alignedTasks = tasks.filter((task) =>
      plan.positions.has(task.id)
    );
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
    if (this.selectedElements.length === 0) return;
    this.selectedElements.forEach((element) => {
      window.dispatchEvent(
        new CustomEvent('elementDeleteRequested', {
          detail: { element },
        })
      );
    });
  }

  private isPlanningElement(
    element: ICanvasElement
  ): element is PlanningElement {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }

  private updateStatusButton(elements: PlanningElement[]): void {
    if (!this.statusControls || elements.length === 0) return;
    const statuses = new Set(elements.map((el) => el.status));
    if (statuses.size > 1) {
      this.statusControls.label.textContent = 'Mixed';
      this.statusControls.button.style.background = '#f3f4f6';
      this.statusControls.button.style.borderColor = '#e5e7eb';
      this.statusControls.button.style.color = '#6b7280';
      this.statusControls.dot.style.background = '#9ca3af';
      return;
    }
    const status = elements[0].status;
    const label =
      ELEMENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
      'Status';
    const { bg, border, text } = this.getStatusStyles(status);
    this.statusControls.label.textContent = label;
    this.statusControls.button.style.background = bg;
    this.statusControls.button.style.borderColor = border;
    this.statusControls.button.style.color = text;
    this.statusControls.dot.style.background = text;
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
        return { bg: '#f3f4f6', border: '#e5e7eb', text: '#4b5563' };
    }
  }

  private getSelectionBounds(elements: PlanningElement[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    elements.forEach((el) => {
      const bounds = this.getElementBounds(el);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });
    if (!Number.isFinite(minX)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}
