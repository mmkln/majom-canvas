import { historyService } from '../core/services/HistoryService.ts';
import { DeleteCommand } from '../core/commands/DeleteCommand.ts';
import { CopyCommand } from '../core/commands/CopyCommand.ts';
import { PasteCommand } from '../core/commands/PasteCommand.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { ResizeCommand } from '../core/commands/ResizeCommand.ts';
import { Scene } from '../core/scene/Scene.ts';
import { clipboardService } from '../core/services/ClipboardService.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';

type ContextMenuDetail = {
  element: ICanvasElement | null;
  sceneX: number;
  sceneY: number;
};

type ContextMenuItem =
  | { kind: 'divider' }
  | { kind: 'header'; label: string }
  | {
      kind?: 'button';
      label: string;
      action: () => 'keep-open' | void;
      tone?: 'danger' | 'warning';
    };

export class ContextMenu {
  private menu: HTMLDivElement;
  private visible = false;
  private handler: ((event: Event) => void) | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private pendingDeleteConfirmKey: string | null = null;
  private lastDetail: ContextMenuDetail | null = null;
  private layoutService = new StoryLayoutService();

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager
  ) {
    this.menu = document.createElement('div');
    this.menu.className =
      'fixed z-50 min-w-[180px] rounded-md border border-gray-200 bg-white shadow-lg text-sm text-gray-800';
    this.menu.style.display = 'none';
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.menu);
    this.handler = (event: Event) => {
      const customEvent = event as CustomEvent<ContextMenuDetail>;
      this.show(customEvent.detail);
    };
    window.addEventListener('contextMenuRequested', this.handler);
  }

  unmount(): void {
    if (this.handler) {
      window.removeEventListener('contextMenuRequested', this.handler);
      this.handler = null;
    }
    this.hide();
    this.menu.remove();
  }

  private show(detail: ContextMenuDetail): void {
    const nextKey = this.getElementConfirmKey(detail.element);
    if (
      this.pendingDeleteConfirmKey &&
      this.pendingDeleteConfirmKey !== nextKey
    ) {
      this.pendingDeleteConfirmKey = null;
    }
    this.lastDetail = detail;
    this.render();

    const { x, y } = this.getScreenCoords(detail.sceneX, detail.sceneY);
    this.menu.style.left = `${x}px`;
    this.menu.style.top = `${y}px`;
    this.menu.style.display = 'block';
    this.visible = true;

    this.attachOutsideHandler();
  }

  private render(): void {
    if (!this.lastDetail) return;
    this.menu.innerHTML = '';
    const items = this.getItems(this.lastDetail);
    items.forEach((item) => {
      if (item.kind === 'divider') {
        const divider = document.createElement('div');
        divider.className = 'my-1 border-t border-gray-200';
        this.menu.appendChild(divider);
        return;
      }
      if (item.kind === 'header') {
        const header = document.createElement('div');
        header.className =
          'px-3 pt-2 text-xs font-semibold uppercase text-gray-400';
        header.textContent = item.label;
        this.menu.appendChild(header);
        return;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      const baseClasses =
        'w-full text-left px-3 py-2 hover:bg-gray-100 active:bg-gray-200';
      const dangerClasses = 'text-red-600 hover:bg-red-50 active:bg-red-100';
      const warningClasses =
        'text-orange-600 hover:bg-orange-50 active:bg-orange-100';
      btn.className =
        item.tone === 'danger'
          ? `${baseClasses} ${dangerClasses}`
          : item.tone === 'warning'
            ? `${baseClasses} ${warningClasses}`
            : baseClasses;
      btn.textContent = item.label;
      btn.addEventListener('click', () => {
        const result = item.action();
        if (result === 'keep-open') {
          this.render();
          return;
        }
        this.hide();
      });
      this.menu.appendChild(btn);
    });
  }

  private hide(): void {
    if (!this.visible) return;
    this.menu.style.display = 'none';
    this.visible = false;
    this.pendingDeleteConfirmKey = null;
    if (this.outsideHandler) {
      window.removeEventListener('mousedown', this.outsideHandler);
      this.outsideHandler = null;
    }
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      if (!this.menu.contains(event.target as Node)) {
        this.hide();
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);
  }

  private getItems(detail: ContextMenuDetail): ContextMenuItem[] {
    const { element, sceneX, sceneY } = detail;
    if (!element) {
      const items: ContextMenuItem[] = [];
      if (clipboardService.getItems().length > 0) {
        items.push({
          label: 'Paste',
          action: () =>
            historyService.execute(
              new PasteCommand(this.scene, this.canvasManager)
            ),
        });
        items.push({ kind: 'divider' });
      }
      items.push(
        { kind: 'header', label: 'Create new' },
        {
          label: 'Task',
          action: () => this.createTaskAt(sceneX, sceneY),
        },
        {
          label: 'Story',
          action: () => this.createStoryAt(sceneX, sceneY),
        },
        {
          label: 'Goal',
          action: () => this.createGoalAt(sceneX, sceneY),
        }
      );
      return items;
    }
    const isPlanningElement =
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement;
    const confirmKey = this.getElementConfirmKey(element);
    const isConfirming =
      Boolean(confirmKey) && this.pendingDeleteConfirmKey === confirmKey;
    const elementLabel =
      element instanceof TaskElement
        ? 'task'
        : element instanceof StoryElement
          ? 'story'
          : element instanceof GoalElement
            ? 'goal'
            : 'element';
    const deleteLabel = isConfirming
      ? 'Confirm delete'
      : `Delete ${elementLabel}`;
    const items: ContextMenuItem[] = [
      {
        label: 'Edit',
        action: () => {
          if (
            element instanceof TaskElement ||
            element instanceof StoryElement ||
            element instanceof GoalElement
          ) {
            (element as any).onDoubleClick?.();
          }
        },
      },
      {
        label: 'Copy',
        action: () =>
          historyService.execute(new CopyCommand(this.scene, [element])),
      },
      {
        label: 'Remove from canvas',
        action: () =>
          historyService.execute(new DeleteCommand(this.scene, [element])),
      },
    ];
    if (element instanceof StoryElement) {
      items.push(
        { kind: 'divider' as const },
        { kind: 'header' as const, label: 'Story' },
        {
          label: 'Add task',
          action: () => this.createTaskInStory(element),
        },
        {
          label: 'Related tasks',
          action: () => {
            this.openRelatedItemsPicker(element);
          },
        }
      );
    }
    if (isPlanningElement) {
      items.push(
        { kind: 'divider' as const },
        {
          label: deleteLabel,
          tone: isConfirming ? ('warning' as const) : ('danger' as const),
          action: () => {
            if (!confirmKey) return;
            if (!isConfirming) {
              this.pendingDeleteConfirmKey = confirmKey;
              return 'keep-open';
            }
            this.pendingDeleteConfirmKey = null;
            window.dispatchEvent(
              new CustomEvent('elementDeleteRequested', {
                detail: { element },
              })
            );
          },
        }
      );
    }
    return items;
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

  private getElementConfirmKey(element: ICanvasElement | null): string | null {
    if (!element) return null;
    if (element instanceof TaskElement) return `task:${element.id}`;
    if (element instanceof StoryElement) return `story:${element.id}`;
    if (element instanceof GoalElement) return `goal:${element.id}`;
    return null;
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
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const plan = this.layoutService.planAddTask(story, tasks);
    const task = new TaskElement({
      x: plan.position.x,
      y: plan.position.y,
    });
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
    historyService.execute(new AddElementCommand(this.scene, task));
    story.addTask(task);
    this.scene.setSelected([task]);
    this.canvasManager.draw();
    window.dispatchEvent(
      new CustomEvent('taskStoryLinkChanged', {
        detail: { task, story },
      })
    );
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
}
