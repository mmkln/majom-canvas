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

export class SelectionActionMenu {
  private readonly container: HTMLDivElement;
  private readonly editBtn: HTMLButtonElement;
  private readonly addRelatedBtn: HTMLButtonElement;
  private readonly alignBtn: HTMLButtonElement;
  private readonly addRelatedDivider: HTMLDivElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly deleteBtn: HTMLButtonElement;
  private subscriptions: Subscription[] = [];
  private resizeHandler = () => this.update();
  private activeElement: ICanvasElement | null = null;
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
    this.container.style.background = 'rgba(255,255,255,0.96)';
    this.container.style.border = '1px solid #e5e7eb';
    this.container.style.borderRadius = '9999px';
    this.container.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
    this.container.style.zIndex = '40';
    this.container.style.transform = 'translate(-50%, 10px)';

    this.editBtn = this.createIconButton(
      'Edit',
      'edit',
      this.handleEdit.bind(this)
    );
    this.addRelatedBtn = this.createIconButton(
      'Add related',
      'add-related',
      this.handleAddRelated.bind(this)
    );
    this.alignBtn = this.createIconButton(
      'Align',
      'align',
      this.handleAlign.bind(this),
      { iconOptions: { strokeWidth: 1.5 } }
    );
    this.addRelatedDivider = document.createElement('div');
    this.addRelatedDivider.style.width = '1px';
    this.addRelatedDivider.style.height = '20px';
    this.addRelatedDivider.style.background = '#e5e7eb';
    this.addRelatedDivider.style.margin = '0 4px';
    this.copyBtn = this.createIconButton(
      'Copy',
      'copy',
      this.handleCopy.bind(this)
    );
    this.deleteBtn = this.createIconButton(
      'Delete element',
      'delete',
      this.handleDelete.bind(this),
      { isDanger: true }
    );

    this.container.appendChild(this.addRelatedBtn);
    this.container.appendChild(this.alignBtn);
    this.container.appendChild(this.addRelatedDivider);
    this.container.appendChild(this.editBtn);
    this.container.appendChild(this.copyBtn);
    this.container.appendChild(this.deleteBtn);
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
    if (selected.length !== 1) {
      this.hide();
      return;
    }
    const element = selected[0];
    if (!this.isPlanningElement(element)) {
      this.hide();
      return;
    }
    this.activeElement = element;
    const showAddRelated =
      element instanceof StoryElement || element instanceof GoalElement;
    const showAlign = element instanceof StoryElement;
    if (showAddRelated) {
      this.addRelatedBtn.style.display = 'inline-flex';
    } else {
      this.addRelatedBtn.style.display = 'none';
    }
    if (showAlign) {
      this.alignBtn.style.display = 'inline-flex';
    } else {
      this.alignBtn.style.display = 'none';
    }
    if (showAddRelated || showAlign) {
      this.addRelatedDivider.style.display = 'block';
    } else {
      this.addRelatedDivider.style.display = 'none';
    }
    this.positionUnderElement(element);
    this.show();
  }

  private show(): void {
    if (this.container.style.display !== 'flex') {
      this.container.style.display = 'flex';
    }
  }

  private hide(): void {
    this.activeElement = null;
    if (this.container.style.display !== 'none') {
      this.container.style.display = 'none';
    }
  }

  private positionUnderElement(element: ICanvasElement): void {
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const bounds = this.getElementBounds(element);
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

  private handleEdit(): void {
    if (!this.activeElement) return;
    (this.activeElement as any).onDoubleClick?.();
  }

  private handleCopy(): void {
    if (!this.activeElement) return;
    historyService.execute(new CopyCommand(this.scene, [this.activeElement]));
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
    if (!this.activeElement) return;
    window.dispatchEvent(
      new CustomEvent('elementDeleteRequested', {
        detail: { element: this.activeElement },
      })
    );
  }

  private isPlanningElement(element: ICanvasElement): boolean {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }
}
