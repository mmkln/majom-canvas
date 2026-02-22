import { Subscription } from 'rxjs';
import { historyService } from '../core/services/HistoryService.ts';
import { DeleteCommand } from '../core/commands/DeleteCommand.ts';
import { CopyCommand } from '../core/commands/CopyCommand.ts';
import { PasteCommand } from '../core/commands/PasteCommand.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { SetFocusCommand } from '../core/commands/SetFocusCommand.ts';
import { Scene } from '../core/scene/Scene.ts';
import { clipboardService } from '../core/services/ClipboardService.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { positionFixedElement } from './overlayPosition.ts';
import { BulkActionsController } from '../core/services/BulkActionsController.ts';
import {
  ElementStatus,
  ELEMENT_STATUS_OPTIONS,
} from '../elements/ElementStatus.ts';
import { addTaskToStory } from './storyTaskActions.ts';
import { ExistingTaskPicker } from './components/ExistingTaskPicker.ts';
import { ExistingGoalPicker } from './components/ExistingGoalPicker.ts';
import { ExistingStoryPicker } from './components/ExistingStoryPicker.ts';
import { AddExistingTaskService } from '../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../core/services/AddExistingStoryService.ts';

type ContextMenuDetail = {
  element: ICanvasElement | null;
  sceneX: number;
  sceneY: number;
};

type MenuActionResult = 'keep-open' | void;

type ContextMenuItem = {
  label: string;
  action: () => MenuActionResult;
  tone?: 'danger' | 'warning';
};

type ContextMenuSection = {
  title?: string;
  items: ContextMenuItem[];
};

export class ContextMenu {
  private menu: HTMLDivElement;
  private visible = false;
  private handler: ((event: Event) => void) | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private viewSubscription: Subscription | null = null;
  private confirmState: { key: string; expiresAt: number } | null = null;
  private lastDetail: ContextMenuDetail | null = null;
  private layoutService = new StoryLayoutService();
  private bulkActions: BulkActionsController;
  private readonly confirmTimeoutMs = 4000;

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager,
    private existingTaskPicker: ExistingTaskPicker,
    private existingGoalPicker: ExistingGoalPicker,
    private existingStoryPicker: ExistingStoryPicker,
    private addExistingTaskService: AddExistingTaskService,
    private addExistingGoalService: AddExistingGoalService,
    private addExistingStoryService: AddExistingStoryService
  ) {
    this.bulkActions = new BulkActionsController(scene);
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
    this.viewSubscription = this.canvasManager
      .getPanZoomManager()
      .viewChanges.subscribe(() => this.onViewportChange());
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
    this.hide();
    this.existingTaskPicker.close();
    this.existingGoalPicker.close();
    this.existingStoryPicker.close();
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
      if (!this.menu.contains(event.target as Node)) {
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
          title: 'Clipboard',
          items: [
            {
              label: 'Paste',
              action: () =>
                historyService.execute(
                  new PasteCommand(this.scene, this.canvasManager)
                ),
            },
          ],
        });
      }
      sections.push({
        title: 'Create new',
        items: [
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
          },
        ],
      });
      sections.push({
        title: 'Add existing',
        items: [
          {
            label: 'Task',
            action: () => this.openExistingTaskPicker(sceneX, sceneY),
          },
          {
            label: 'Goal',
            action: () => this.openExistingGoalPicker(sceneX, sceneY),
          },
          {
            label: 'Story',
            action: () => this.openExistingStoryPicker(sceneX, sceneY),
          },
        ],
      });
      return sections;
    }

    const isPlanningElement =
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement;
    const confirmKey = this.getElementConfirmKey(element);
    const isConfirming = this.isConfirmingDelete(confirmKey);
    const elementLabel = this.getElementLabel(element);
    const deleteLabel = isConfirming
      ? 'Confirm delete'
      : `Delete ${elementLabel}`;

    const sections: ContextMenuSection[] = [];
    const actionItems: ContextMenuItem[] = [];
    if (isPlanningElement) {
      const planningElement = element as TaskElement | StoryElement | GoalElement;
      const isFocused = this.scene.isFocused(planningElement);
      actionItems.push({
        label: isFocused ? 'Clear Focus' : 'Set Focus',
        action: () =>
          historyService.execute(
            new SetFocusCommand(
              this.scene,
              isFocused ? null : planningElement.id
            )
          ),
      });
      actionItems.push({
        label: 'Edit',
        action: () => {
          (element as any).onDoubleClick?.();
        },
      });
    }
    actionItems.push(
      {
        label: 'Copy',
        action: () =>
          historyService.execute(new CopyCommand(this.scene, [element])),
      },
      {
        label: 'Remove from Canvas',
        action: () =>
          historyService.execute(new DeleteCommand(this.scene, [element])),
      }
    );

    const getTitlteByElement = (el: ICanvasElement): string | undefined => {
      if (el instanceof TaskElement) return 'Task';
      if (el instanceof StoryElement) return 'Story';
      if (el instanceof GoalElement) return 'Goal';
      return undefined;
    }

    sections.push({ 
      title: getTitlteByElement(element),
      items: actionItems 
    });

    if (element instanceof StoryElement) {
      sections.push({
        items: [
          {
            label: 'Create Task',
            action: () => this.createTaskInStory(element),
          },
          {
            label: 'Related Tasks',
            action: () => {
              this.openRelatedItemsPicker(element);
            },
          },
        ],
      });
    }

    if (isPlanningElement) {
      const planningElement = element as TaskElement | StoryElement | GoalElement;
      const statusLabels = new Map(
        ELEMENT_STATUS_OPTIONS.map((option) => [option.value, option.label])
      );
      const statusOrder: ElementStatus[] = [
        ElementStatus.Done,
        ElementStatus.InProgress,
        ElementStatus.Pending,
        ElementStatus.Defined,
      ];
      sections.push({
        title: 'Set status',
        items: statusOrder.map((status) => ({
          label: statusLabels.get(status) ?? status,
          action: () => {
            if (planningElement.status === status) return;
            this.bulkActions.updateStatus([planningElement], status);
          },
        })),
      });
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

  private renderSections(sections: ContextMenuSection[]): void {
    this.menu.innerHTML = '';
    const visibleSections = sections.filter(
      (section) => section.items.length > 0
    );
    visibleSections.forEach((section, index) => {
      if (index > 0) {
        const divider = document.createElement('div');
        divider.className = 'my-1 border-t border-gray-200';
        this.menu.appendChild(divider);
      }
      if (section.title) {
        const header = document.createElement('div');
        header.className =
          'px-3 pt-2 text-xs font-semibold uppercase text-gray-400';
        header.textContent = section.title;
        this.menu.appendChild(header);
      }
      section.items.forEach((item) => {
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
        btn.textContent = item.label ?? '';
        btn.addEventListener('click', () => {
          const result = item.action ? item.action() : undefined;
          if (result === 'keep-open') {
            this.render();
            return;
          }
          this.hide();
        });
        this.menu.appendChild(btn);
      });
    });
  }

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
    return null;
  }

  private getElementLabel(element: ICanvasElement): string {
    if (element instanceof TaskElement) return 'task';
    if (element instanceof StoryElement) return 'story';
    if (element instanceof GoalElement) return 'goal';
    return 'element';
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

  private openExistingGoalPicker(sceneX: number, sceneY: number): void {
    this.existingGoalPicker.open({
      sceneX,
      sceneY,
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
      isOnCanvas: (story) => this.addExistingStoryService.isOnCanvas(story),
      onPick: (story, storyX, storyY) => {
        this.addExistingStoryService.addOrFocus(story, storyX, storyY);
      },
    });
  }
}
