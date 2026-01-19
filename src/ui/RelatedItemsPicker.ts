import { Subscription } from 'rxjs';
import { Scene } from '../core/scene/Scene.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { historyService } from '../core/services/HistoryService.ts';
import { AddElementCommand } from '../core/commands/AddElementCommand.ts';
import { ResizeCommand } from '../core/commands/ResizeCommand.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { environment } from '../config/environment.ts';
import { HttpInterceptorClient } from '../majom-wrapper/data-access/http-interceptor.ts';
import { StoriesApiService } from '../majom-wrapper/data-access/stories-api-service.ts';
import { GoalsApiService } from '../majom-wrapper/data-access/goals-api-service.ts';
import { mapStatus } from '../majom-wrapper/utils/statusMapping.ts';
import type { PlatformTask, Story, Goal } from '../majom-wrapper/interfaces/index.ts';

type RelatedItem = PlatformTask;

export class RelatedItemsPicker {
  private readonly container: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly titleEl: HTMLSpanElement;
  private readonly closeBtn: HTMLButtonElement;
  private readonly searchInput: HTMLInputElement;
  private readonly list: HTMLDivElement;
  private visible = false;
  private activeElement: ICanvasElement | null = null;
  private allItems: RelatedItem[] = [];
  private filteredItems: RelatedItem[] = [];
  private subscriptions: Subscription[] = [];
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private eventHandler: ((event: Event) => void) | null = null;
  private layoutService = new StoryLayoutService();

  private readonly storiesApi: StoriesApiService;
  private readonly goalsApi: GoalsApiService;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {
    const http = new HttpInterceptorClient(environment.apiUrl);
    this.storiesApi = new StoriesApiService(http);
    this.goalsApi = new GoalsApiService(http);

    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.minWidth = '260px';
    this.container.style.maxWidth = '320px';
    this.container.style.maxHeight = '320px';
    this.container.style.background = 'white';
    this.container.style.border = '1px solid #e5e7eb';
    this.container.style.borderRadius = '12px';
    this.container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.15)';
    this.container.style.padding = '10px';
    this.container.style.zIndex = '130';
    this.container.style.display = 'none';

    this.header = document.createElement('div');
    this.header.style.display = 'flex';
    this.header.style.alignItems = 'center';
    this.header.style.justifyContent = 'space-between';
    this.header.style.marginBottom = '8px';

    this.titleEl = document.createElement('span');
    this.titleEl.textContent = 'Add related';
    this.titleEl.style.fontWeight = '600';
    this.titleEl.style.fontSize = '14px';
    this.titleEl.style.color = '#111827';

    this.closeBtn = document.createElement('button');
    this.closeBtn.type = 'button';
    this.closeBtn.textContent = 'x';
    this.closeBtn.style.border = 'none';
    this.closeBtn.style.background = 'transparent';
    this.closeBtn.style.cursor = 'pointer';
    this.closeBtn.style.fontSize = '14px';
    this.closeBtn.style.color = '#6b7280';
    this.closeBtn.addEventListener('click', () => this.hide());

    this.header.appendChild(this.titleEl);
    this.header.appendChild(this.closeBtn);
    this.container.appendChild(this.header);

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.placeholder = 'Search...';
    this.searchInput.style.width = '100%';
    this.searchInput.style.border = '1px solid #e5e7eb';
    this.searchInput.style.borderRadius = '8px';
    this.searchInput.style.padding = '6px 8px';
    this.searchInput.style.marginBottom = '8px';
    this.searchInput.addEventListener('input', () => this.applyFilter());
    this.container.appendChild(this.searchInput);

    this.list = document.createElement('div');
    this.list.style.display = 'flex';
    this.list.style.flexDirection = 'column';
    this.list.style.gap = '6px';
    this.list.style.overflowY = 'auto';
    this.list.style.maxHeight = '220px';
    this.container.appendChild(this.list);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(this.scene.changes.subscribe(() => this.onSceneChange()));
    this.subscriptions.push(
      this.canvasManager.getPanZoomManager().viewChanges.subscribe(() =>
        this.updatePosition()
      )
    );
    this.eventHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ element?: ICanvasElement }>;
      const element = customEvent.detail?.element ?? null;
      if (!element) return;
      if (!this.isPlanningElement(element)) return;
      this.activeElement = element;
      this.searchInput.value = '';
      this.loadRelatedItems();
      this.show();
    };
    window.addEventListener('relatedItemsPickerRequested', this.eventHandler);
  }

  public unmount(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.eventHandler) {
      window.removeEventListener('relatedItemsPickerRequested', this.eventHandler);
      this.eventHandler = null;
    }
    this.detachOutsideHandler();
    this.container.remove();
  }

  private onSceneChange(): void {
    if (!this.visible) return;
    const selected = this.scene.getSelectedElements();
    if (
      !this.activeElement ||
      selected.length !== 1 ||
      selected[0] !== this.activeElement
    ) {
      this.hide();
      return;
    }
    this.updatePosition();
  }

  private show(): void {
    if (!this.activeElement) return;
    this.visible = true;
    this.container.style.display = 'block';
    this.updatePosition();
    this.attachOutsideHandler();
  }

  private hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
    this.activeElement = null;
    this.allItems = [];
    this.filteredItems = [];
    this.renderList();
    this.detachOutsideHandler();
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      if (!this.container.contains(event.target as Node)) {
        this.hide();
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);
  }

  private detachOutsideHandler(): void {
    if (!this.outsideHandler) return;
    window.removeEventListener('mousedown', this.outsideHandler);
    this.outsideHandler = null;
  }

  private updatePosition(): void {
    if (!this.visible || !this.activeElement) return;
    const panZoom = this.canvasManager.getPanZoomManager();
    const rect = this.canvasManager.getCanvas().getBoundingClientRect();
    const bounds = this.getElementBounds(this.activeElement);
    const anchorX = bounds.x + bounds.width / 2;
    const anchorY = bounds.y + bounds.height;
    const screenX = anchorX * panZoom.scale - panZoom.scrollX + rect.left;
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top + 46;
    this.container.style.left = `${screenX}px`;
    this.container.style.top = `${screenY}px`;
    this.container.style.transform = 'translate(-50%, 0)';
  }

  private loadRelatedItems(): void {
    if (!this.activeElement) return;
    this.allItems = [];
    this.filteredItems = [];
    this.renderList(true);
    const id = this.getBackendId(
      this.activeElement as TaskElement | StoryElement | GoalElement
    );
    if (!Number.isFinite(id)) {
      this.renderEmpty('No related items');
      return;
    }
    if (this.activeElement instanceof StoryElement) {
      this.titleEl.textContent = 'Add story tasks';
      this.storiesApi.getStory(id).subscribe({
        next: (story: Story) => {
          const tasks = story.tasks || [];
          this.allItems = this.filterMissingTasks(tasks);
          this.applyFilter();
        },
        error: () => {
          this.renderEmpty('Failed to load tasks');
        },
      });
      return;
    }
    if (this.activeElement instanceof GoalElement) {
      this.titleEl.textContent = 'Add goal tasks';
      this.goalsApi.getGoal(id).subscribe({
        next: (goal: Goal) => {
          const tasks = goal.tasks || [];
          this.allItems = this.filterMissingTasks(tasks);
          this.applyFilter();
        },
        error: () => {
          this.renderEmpty('Failed to load tasks');
        },
      });
      return;
    }
    this.renderEmpty('No related items');
  }

  private applyFilter(): void {
    const term = this.searchInput.value.trim().toLowerCase();
    if (!term) {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter((item) => {
        return (
          item.title.toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term)
        );
      });
    }
    this.renderList();
  }

  private filterMissingTasks(tasks: PlatformTask[]): PlatformTask[] {
    const existingIds = new Set<number>();
    this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement)
      .forEach((el) => {
        const id = this.getBackendId(el as TaskElement);
        if (Number.isFinite(id)) existingIds.add(id);
      });
    return tasks.filter((task) => !existingIds.has(task.id));
  }

  private renderList(loading: boolean = false): void {
    this.list.innerHTML = '';
    if (loading) {
      const row = document.createElement('div');
      row.textContent = 'Loading...';
      row.style.color = '#6b7280';
      row.style.fontSize = '13px';
      this.list.appendChild(row);
      return;
    }
    if (this.filteredItems.length === 0) {
      this.renderEmpty('No items found');
      return;
    }
    this.filteredItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.padding = '6px 6px';
      row.style.border = '1px solid #f3f4f6';
      row.style.borderRadius = '8px';
      row.style.background = '#fafafa';

      const label = document.createElement('div');
      label.style.display = 'flex';
      label.style.flexDirection = 'column';
      label.style.gap = '2px';
      const title = document.createElement('span');
      title.textContent = item.title;
      title.style.fontSize = '13px';
      title.style.fontWeight = '600';
      const meta = document.createElement('span');
      meta.textContent = item.description ? item.description : `Task #${item.id}`;
      meta.style.fontSize = '11px';
      meta.style.color = '#6b7280';
      label.appendChild(title);
      label.appendChild(meta);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = 'Add';
      addBtn.style.border = '1px solid #e5e7eb';
      addBtn.style.background = 'white';
      addBtn.style.borderRadius = '6px';
      addBtn.style.padding = '4px 8px';
      addBtn.style.cursor = 'pointer';
      addBtn.style.fontSize = '12px';
      addBtn.addEventListener('click', () => {
        this.addItemToCanvas(item, idx);
      });

      row.appendChild(label);
      row.appendChild(addBtn);
      this.list.appendChild(row);
    });
  }

  private renderEmpty(message: string): void {
    this.list.innerHTML = '';
    const row = document.createElement('div');
    row.textContent = message;
    row.style.color = '#6b7280';
    row.style.fontSize = '13px';
    this.list.appendChild(row);
  }

  private addItemToCanvas(item: PlatformTask, index: number): void {
    if (!this.activeElement) return;
    const position = this.getInsertPosition(index);
    const task = new TaskElement({
      id: item.uuid ?? item.id.toString(),
      x: position.x,
      y: position.y,
      backendId: item.id,
      uuid: item.uuid,
      title: item.title,
      description: item.description,
      status: mapStatus(item.status),
      priority: 'medium',
    });
    if (this.activeElement instanceof StoryElement) {
      const story = this.activeElement;
      const tasks = this.scene
        .getElements()
        .filter((el) => el instanceof TaskElement) as TaskElement[];
      const plan = this.layoutService.planAddTask(story, tasks);
      task.x = plan.position.x;
      task.y = plan.position.y;
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
    historyService.execute(new AddElementCommand(this.scene, task));
    if (this.activeElement instanceof StoryElement) {
      this.activeElement.addTask(task);
    }
    this.allItems = this.allItems.filter((t) => t.id !== item.id);
    this.applyFilter();
  }

  private getInsertPosition(index: number): { x: number; y: number } {
    if (!this.activeElement) return { x: 0, y: 0 };
    const el = this.activeElement as any;
    if (this.activeElement instanceof StoryElement) {
      return { x: el.x + 16, y: el.y + 56 };
    }
    const startX = el.x + (el.width ?? 0) / 2 - TaskElement.width / 2;
    const startY = el.y + (el.height ?? 0) + 24;
    const gap = 12;
    return { x: startX, y: startY + index * (TaskElement.height + gap) };
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

  private isPlanningElement(element: ICanvasElement): boolean {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }

  private getBackendId(
    element: TaskElement | StoryElement | GoalElement
  ): number | null {
    if (Number.isFinite(element.backendId)) {
      return element.backendId ?? null;
    }
    const legacyId = Number(element.id);
    if (Number.isFinite(legacyId)) return legacyId;
    return null;
  }
}
