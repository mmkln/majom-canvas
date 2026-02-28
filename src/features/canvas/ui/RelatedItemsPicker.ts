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
import { AddTasksToStoryCommand } from '../core/commands/AddTasksToStoryCommand.ts';
import { StoryLayoutService } from '../core/services/StoryLayoutService.ts';
import { elementPlacementPolicy } from '../core/services/ElementPlacementPolicy.ts';
import { environment } from '../../../config/environment.ts';
import { HttpInterceptorClient, StoriesApiService, GoalsApiService } from '../../../majom-wrapper/index.ts';
import { mapStatus } from '../../../majom-wrapper/utils/statusMapping.ts';
import type {
  PlatformTask,
  Story,
  Goal,
} from '../../../majom-wrapper/interfaces/index.ts';
import { positionFixedElement } from './overlayPosition.ts';
import {
  createHudDivider,
  createHudIconButton,
  createHudInputBase,
  createHudSegmentedControl,
  createHudSurface,
  createHudTextButton,
  type HudSegmentedControl,
} from './primitives/index.ts';

type RelatedItem =
  | { kind: 'task'; value: PlatformTask }
  | { kind: 'story'; value: Story };

type GoalTab = 'tasks' | 'stories';

export class RelatedItemsPicker {
  private readonly container: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private readonly titleEl: HTMLSpanElement;
  private readonly closeBtn: HTMLButtonElement;
  private readonly searchInput: HTMLInputElement;
  private readonly tabsRow: HTMLDivElement;
  private readonly goalTabControl: HudSegmentedControl<GoalTab>;
  private readonly actionsRow: HTMLDivElement;
  private readonly addAllBtn: HTMLButtonElement;
  private readonly list: HTMLDivElement;
  private visible = false;
  private loading = false;
  private activeElement: TaskElement | StoryElement | GoalElement | null = null;
  private allItems: RelatedItem[] = [];
  private filteredItems: RelatedItem[] = [];
  private storyTaskItems: PlatformTask[] = [];
  private goalTaskItems: PlatformTask[] = [];
  private goalStoryItems: Story[] = [];
  private activeGoalTab: GoalTab = 'tasks';
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

    this.container = createHudSurface({
      elevated: true,
      className:
        'fixed z-[130] hidden w-[320px] max-w-[calc(100vw-1rem)] max-h-[320px] overflow-hidden p-2.5',
    });
    this.container.style.position = 'fixed';
    this.container.style.display = 'none';
    this.container.style.maxHeight = '320px';

    this.header = document.createElement('div');
    this.header.className = 'mb-2 flex items-center justify-between';

    this.titleEl = document.createElement('span');
    this.titleEl.textContent = 'Add related';
    this.titleEl.className = 'text-sm font-semibold text-slate-900';

    this.closeBtn = createHudIconButton({
      icon: 'x-mark',
      size: 'sm',
      tone: 'text',
      title: 'Close',
      ariaLabel: 'Close',
      onClick: () => this.hide(),
    });

    this.header.appendChild(this.titleEl);
    this.header.appendChild(this.closeBtn);
    this.container.appendChild(this.header);

    this.searchInput = createHudInputBase({
      type: 'search',
      placeholder: 'Search...',
      className: 'mb-2 h-9',
    });
    this.searchInput.addEventListener('input', () => this.applyFilter());
    this.container.appendChild(this.searchInput);

    this.container.appendChild(createHudDivider({ inset: false }));

    this.tabsRow = document.createElement('div');
    this.tabsRow.className = 'mb-2 mt-2 hidden';
    this.goalTabControl = createHudSegmentedControl<GoalTab>({
      size: 'sm',
      fullWidth: true,
      ariaLabel: 'Related item type',
      options: [
        { id: 'related-tab-tasks', value: 'tasks', label: 'Tasks' },
        { id: 'related-tab-stories', value: 'stories', label: 'Stories' },
      ],
      value: this.activeGoalTab,
      onChange: (tab) => this.setGoalTab(tab),
    });
    this.tabsRow.appendChild(this.goalTabControl.element);
    this.container.appendChild(this.tabsRow);

    this.actionsRow = document.createElement('div');
    this.actionsRow.className = 'mb-2 mt-1 flex justify-end';

    this.addAllBtn = createHudTextButton({
      text: 'Add all',
      tone: 'text',
      className: 'px-2 py-1 text-xs font-medium',
      onClick: () => this.handleAddAllClick(),
    });
    this.actionsRow.appendChild(this.addAllBtn);
    this.container.appendChild(this.actionsRow);

    this.list = document.createElement('div');
    this.list.className = 'flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-0.5';
    this.container.appendChild(this.list);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(
      this.scene.changes.subscribe(() => this.onSceneChange())
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.updatePosition())
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
      window.removeEventListener(
        'relatedItemsPickerRequested',
        this.eventHandler
      );
      this.eventHandler = null;
    }
    this.detachOutsideHandler();
    this.goalTabControl.destroy();
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
    this.loading = false;
    this.titleEl.textContent = 'Add related';
    this.activeElement = null;
    this.allItems = [];
    this.filteredItems = [];
    this.storyTaskItems = [];
    this.goalTaskItems = [];
    this.goalStoryItems = [];
    this.activeGoalTab = 'tasks';
    this.renderList();
    this.updateGoalTabsUi();
    this.updateAddAllButton();
    this.detachOutsideHandler();
  }

  private attachOutsideHandler(): void {
    if (this.outsideHandler) return;
    this.outsideHandler = (event: MouseEvent) => {
      if (!this.container.contains(event.target as Node)) {
        this.hide();
      }
      event.stopPropagation();
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
    const screenY = anchorY * panZoom.scale - panZoom.scrollY + rect.top;
    positionFixedElement(this.container, {
      anchorX: screenX,
      anchorY: screenY,
      alignX: 'center',
      alignY: 'top',
      offsetY: 46,
    });
  }

  private loadRelatedItems(): void {
    if (!this.activeElement) return;
    this.loading = true;
    this.allItems = [];
    this.filteredItems = [];
    this.storyTaskItems = [];
    this.goalTaskItems = [];
    this.goalStoryItems = [];
    this.activeGoalTab = 'tasks';
    this.renderList(true);
    this.updateGoalTabsUi();
    this.updateAddAllButton();

    const ref = this.getBackendRef(this.activeElement);
    if (!ref) {
      this.loading = false;
      this.renderEmpty('No related items');
      this.updateAddAllButton();
      return;
    }

    if (this.activeElement instanceof StoryElement) {
      this.titleEl.textContent = 'Add story tasks';
      this.storiesApi.getStory(ref).subscribe({
        next: (story: Story) => {
          this.loading = false;
          this.storyTaskItems = this.filterMissingTasks(story.tasks || []);
          this.syncItemsFromContext();
          this.applyFilter();
        },
        error: () => {
          this.loading = false;
          this.renderEmpty('Failed to load tasks');
          this.updateAddAllButton();
        },
      });
      return;
    }

    if (this.activeElement instanceof GoalElement) {
      this.titleEl.textContent = 'Add goal related';
      this.goalsApi.getGoal(ref).subscribe({
        next: (goal: Goal) => {
          const goalTasks = this.getGoalTasks(goal);
          this.goalTaskItems = this.filterMissingTasks(goalTasks);

          const directStories = this.getGoalStories(goal);
          const embeddedStories = this.extractStoriesFromGoalTasks(goalTasks);
          const knownStories = this.mergeStories(directStories, embeddedStories);
          const ids = this.extractStoryIdsFromGoalTasks(goalTasks);
          const loadedIds = new Set(knownStories.map((story) => story.id));
          const missingIds = ids.filter((id) => !loadedIds.has(id));

          const applyStories = (stories: Story[]): void => {
            this.loading = false;
            this.goalStoryItems = this.filterMissingStories(stories);
            this.syncItemsFromContext();
            this.applyFilter();
          };

          if (missingIds.length === 0) {
            applyStories(knownStories);
            return;
          }

          this.storiesApi.fetchStoriesByIds(missingIds).subscribe({
            next: (fetched) => {
              applyStories(this.mergeStories(knownStories, fetched));
            },
            error: () => {
              applyStories(knownStories);
            },
          });
        },
        error: () => {
          this.loading = false;
          this.renderEmpty('Failed to load related items');
          this.updateAddAllButton();
        },
      });
      return;
    }

    this.loading = false;
    this.renderEmpty('No related items');
    this.updateAddAllButton();
  }

  private getGoalTasks(goal: Goal): PlatformTask[] {
    const rawTasks = (goal as any)?.tasks;
    if (Array.isArray(rawTasks)) {
      return rawTasks as PlatformTask[];
    }
    const rawItems = rawTasks?.items;
    if (Array.isArray(rawItems)) {
      return rawItems as PlatformTask[];
    }
    return [];
  }

  private getGoalStories(goal: Goal): Story[] {
    const rawStories = (goal as any)?.stories;
    if (Array.isArray(rawStories)) {
      return rawStories as Story[];
    }
    return [];
  }

  private setGoalTab(tab: GoalTab): void {
    if (!(this.activeElement instanceof GoalElement)) return;
    if (this.activeGoalTab === tab) return;
    this.activeGoalTab = tab;
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private syncItemsFromContext(): void {
    if (this.activeElement instanceof StoryElement) {
      this.allItems = this.storyTaskItems.map((task) => ({
        kind: 'task',
        value: task,
      }));
      return;
    }
    if (this.activeElement instanceof GoalElement) {
      this.allItems =
        this.activeGoalTab === 'tasks'
          ? this.goalTaskItems.map((task) => ({ kind: 'task', value: task }))
          : this.goalStoryItems.map((story) => ({
              kind: 'story',
              value: story,
            }));
      return;
    }
    this.allItems = [];
  }

  private applyFilter(): void {
    const term = this.searchInput.value.trim().toLowerCase();
    if (!term) {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter((item) => {
        return (
          item.value.title.toLowerCase().includes(term) ||
          (item.value.description || '').toLowerCase().includes(term)
        );
      });
    }
    this.renderList();
    this.updateGoalTabsUi();
    this.updateAddAllButton();
  }

  private filterMissingTasks(tasks: PlatformTask[]): PlatformTask[] {
    const existingRefs = new Set<string>();
    this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement)
      .forEach((el) => {
        const task = el as TaskElement;
        if (task.uuid) existingRefs.add(`uuid:${task.uuid}`);
        if (Number.isFinite(task.backendId)) {
          existingRefs.add(`id:${String(task.backendId)}`);
        }
      });
    return tasks.filter((task) => {
      const keys = this.getTaskRefKeys(task);
      return keys.every((key) => !existingRefs.has(key));
    });
  }

  private filterMissingStories(stories: Story[]): Story[] {
    const existingRefs = new Set<string>();
    this.scene
      .getElements()
      .filter((el) => el instanceof StoryElement)
      .forEach((el) => {
        const story = el as StoryElement;
        if (story.uuid) existingRefs.add(`uuid:${story.uuid}`);
        if (Number.isFinite(story.backendId)) {
          existingRefs.add(`id:${String(story.backendId)}`);
        }
      });
    return stories.filter((story) => {
      const keys = this.getStoryRefKeys(story);
      return keys.every((key) => !existingRefs.has(key));
    });
  }

  private extractStoriesFromGoalTasks(tasks: PlatformTask[]): Story[] {
    const stories: Story[] = [];
    const seenIds = new Set<number>();
    tasks.forEach((task) => {
      if (!task.story) return;
      const storyId = task.story.id;
      if (seenIds.has(storyId)) return;
      seenIds.add(storyId);
      stories.push(task.story);
    });
    return stories;
  }

  private extractStoryIdsFromGoalTasks(tasks: PlatformTask[]): number[] {
    const seen = new Set<number>();
    const ids: number[] = [];
    tasks.forEach((task) => {
      const id = task.story_id;
      if (!Number.isFinite(id)) return;
      const value = Number(id);
      if (seen.has(value)) return;
      seen.add(value);
      ids.push(value);
    });
    return ids;
  }

  private mergeStories(primary: Story[], secondary: Story[]): Story[] {
    const merged = new Map<number, Story>();
    primary.forEach((story) => merged.set(story.id, story));
    secondary.forEach((story) => merged.set(story.id, story));
    return Array.from(merged.values());
  }

  private getTaskRefKeys(task: PlatformTask): string[] {
    const keys: string[] = [];
    if (task.uuid) keys.push(`uuid:${task.uuid}`);
    keys.push(`id:${task.id}`);
    return keys;
  }

  private getStoryRefKeys(story: Story): string[] {
    const keys: string[] = [];
    if (story.uuid) keys.push(`uuid:${story.uuid}`);
    keys.push(`id:${story.id}`);
    return keys;
  }

  private renderList(loading: boolean = false): void {
    this.list.innerHTML = '';
    if (loading) {
      const row = document.createElement('div');
      row.textContent = 'Loading...';
      row.className = 'px-2 py-2 text-sm text-slate-500';
      this.list.appendChild(row);
      return;
    }
    if (this.filteredItems.length === 0) {
      this.renderEmpty('No items found');
      return;
    }
    this.filteredItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className =
        'flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5';

      const label = document.createElement('div');
      label.className = 'flex min-w-0 flex-col gap-0.5';
      const title = document.createElement('span');
      title.textContent = item.value.title;
      title.className = 'truncate text-[13px] font-semibold text-slate-800';
      const meta = document.createElement('span');
      meta.textContent = item.value.description
        ? item.value.description
        : item.kind === 'task'
          ? `Task #${item.value.id}`
          : `Story #${item.value.id}`;
      meta.className = 'truncate text-[11px] text-slate-500';
      label.appendChild(title);
      label.appendChild(meta);

      const addBtn = createHudTextButton({
        text: 'Add',
        tone: 'soft',
        className: 'px-2 py-1 text-xs font-semibold',
        onClick: () => {
          this.addItemToCanvas(item, idx);
        },
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
    row.className = 'px-2 py-2 text-sm text-slate-500';
    this.list.appendChild(row);
  }

  private addItemToCanvas(item: RelatedItem, index: number): void {
    if (!this.activeElement) return;
    if (item.kind === 'task') {
      this.addTaskItemToCanvas(item.value, index);
    } else {
      this.addStoryItemToCanvas(item.value, index);
    }
    this.removeItemFromCaches(item);
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private addTaskItemToCanvas(item: PlatformTask, index: number): void {
    if (!this.activeElement) return;
    const position = this.getInsertPosition(index);
    const task = this.createTaskElement(item, position.x, position.y);
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
    } else {
      elementPlacementPolicy.placeElements([task], this.scene.getElements());
    }
    historyService.execute(new AddElementCommand(this.scene, task));
    if (this.activeElement instanceof StoryElement) {
      this.activeElement.addTask(task);
    }
  }

  private addStoryItemToCanvas(item: Story, index: number): void {
    if (!(this.activeElement instanceof GoalElement)) return;
    const position = this.getStoryInsertPosition(index);
    const story = this.createStoryElement(item, position.x, position.y);
    elementPlacementPolicy.placeElements([story], this.scene.getElements());
    historyService.execute(new AddElementCommand(this.scene, story));
  }

  private handleAddAllClick(): void {
    if (this.activeElement instanceof StoryElement) {
      this.addAllMissingStoryTasks();
      return;
    }
    if (this.activeElement instanceof GoalElement) {
      if (this.activeGoalTab === 'tasks') {
        this.addAllMissingGoalTasks();
      } else {
        this.addAllMissingGoalStories();
      }
    }
  }

  private addAllMissingStoryTasks(): void {
    if (!(this.activeElement instanceof StoryElement)) return;
    if (this.loading || this.storyTaskItems.length === 0) return;

    const story = this.activeElement;
    const planningStory = new StoryElement({
      x: story.x,
      y: story.y,
      width: story.width,
      height: story.height,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      tasks: [...story.tasks],
    });
    const sceneTasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const planningTasks = [...sceneTasks];
    const tasksToAdd: TaskElement[] = [];
    let nextHeight = story.height;

    this.storyTaskItems.forEach((item) => {
      const task = this.createTaskElement(item, 0, 0);
      const plan = this.layoutService.planAddTask(planningStory, planningTasks);
      task.x = plan.position.x;
      task.y = plan.position.y;
      planningStory.addTask(task);
      planningTasks.push(task);
      tasksToAdd.push(task);
      nextHeight = Math.max(nextHeight, plan.nextHeight);
    });

    if (tasksToAdd.length === 0) return;
    historyService.execute(
      new AddTasksToStoryCommand(this.scene, story, tasksToAdd, nextHeight)
    );
    this.storyTaskItems = [];
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private addAllMissingGoalTasks(): void {
    if (!(this.activeElement instanceof GoalElement)) return;
    if (this.loading || this.goalTaskItems.length === 0) return;
    const tasksToAdd = this.goalTaskItems.map((item, index) => {
      const position = this.getInsertPosition(index);
      return this.createTaskElement(item, position.x, position.y);
    });
    elementPlacementPolicy.placeElements(tasksToAdd, this.scene.getElements(), {
      preserveGroup: true,
    });
    historyService.execute(new AddElementCommand(this.scene, tasksToAdd));
    this.goalTaskItems = [];
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private addAllMissingGoalStories(): void {
    if (!(this.activeElement instanceof GoalElement)) return;
    if (this.loading || this.goalStoryItems.length === 0) return;
    const storiesToAdd = this.goalStoryItems.map((item, index) => {
      const position = this.getStoryInsertPosition(index);
      return this.createStoryElement(item, position.x, position.y);
    });
    elementPlacementPolicy.placeElements(storiesToAdd, this.scene.getElements(), {
      preserveGroup: true,
    });
    historyService.execute(new AddElementCommand(this.scene, storiesToAdd));
    this.goalStoryItems = [];
    this.syncItemsFromContext();
    this.applyFilter();
  }

  private removeItemFromCaches(item: RelatedItem): void {
    const key = this.getRelatedItemKey(item);
    if (item.kind === 'task') {
      this.storyTaskItems = this.storyTaskItems.filter(
        (candidate) =>
          this.getRelatedItemKey({ kind: 'task', value: candidate }) !== key
      );
      this.goalTaskItems = this.goalTaskItems.filter(
        (candidate) =>
          this.getRelatedItemKey({ kind: 'task', value: candidate }) !== key
      );
      return;
    }
    this.goalStoryItems = this.goalStoryItems.filter(
      (candidate) =>
        this.getRelatedItemKey({ kind: 'story', value: candidate }) !== key
    );
  }

  private createTaskElement(
    item: PlatformTask,
    x: number,
    y: number
  ): TaskElement {
    return new TaskElement({
      id: item.uuid ?? item.id.toString(),
      x,
      y,
      backendId: item.id,
      uuid: item.uuid,
      title: item.title,
      description: item.description,
      status: mapStatus(item.status),
      priority: 'medium',
    });
  }

  private createStoryElement(item: Story, x: number, y: number): StoryElement {
    return new StoryElement({
      id: item.uuid ?? item.id.toString(),
      x,
      y,
      backendId: item.id,
      uuid: item.uuid,
      title: item.title,
      description: item.description,
      status: mapStatus(item.status),
    });
  }

  private getRelatedItemKey(item: RelatedItem): string {
    const ref = item.value.uuid ?? String(item.value.id);
    return `${item.kind}:${ref}`;
  }

  private updateGoalTabsUi(): void {
    const isGoal = this.activeElement instanceof GoalElement;
    this.tabsRow.style.display = isGoal ? 'block' : 'none';
    if (!isGoal) return;
    this.goalTabControl.setValue(this.activeGoalTab);
  }

  private updateAddAllButton(): void {
    const isStory = this.activeElement instanceof StoryElement;
    const isGoal = this.activeElement instanceof GoalElement;
    if (!isStory && !isGoal) {
      this.actionsRow.style.display = 'none';
      return;
    }
    this.actionsRow.style.display = 'flex';
    const count = isStory
      ? this.storyTaskItems.length
      : this.activeGoalTab === 'tasks'
        ? this.goalTaskItems.length
        : this.goalStoryItems.length;
    this.addAllBtn.textContent = isGoal
      ? this.activeGoalTab === 'tasks'
        ? `Add all missing tasks (${count})`
        : `Add all missing stories (${count})`
      : `Add all missing tasks (${count})`;
    this.addAllBtn.disabled = this.loading || count === 0;
  }

  private getInsertPosition(index: number): { x: number; y: number } {
    if (!this.activeElement) return { x: 0, y: 0 };
    if (this.activeElement instanceof StoryElement) {
      return { x: this.activeElement.x + 16, y: this.activeElement.y + 56 };
    }
    const startX =
      this.activeElement.x +
      this.activeElement.width / 2 -
      TaskElement.width / 2;
    const startY = this.activeElement.y + this.activeElement.height + 24;
    const gap = 12;
    return { x: startX, y: startY + index * (TaskElement.height + gap) };
  }

  private getStoryInsertPosition(index: number): { x: number; y: number } {
    if (!(this.activeElement instanceof GoalElement)) return { x: 0, y: 0 };
    const startX =
      this.activeElement.x +
      this.activeElement.width / 2 -
      StoryElement.width / 2;
    const startY = this.activeElement.y + this.activeElement.height + 32;
    const gap = 32;
    return { x: startX, y: startY + index * (StoryElement.height + gap) };
  }

  private getElementBounds(element: TaskElement | StoryElement | GoalElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }

  private isPlanningElement(
    element: ICanvasElement
  ): element is TaskElement | StoryElement | GoalElement {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }

  private getBackendRef(
    element: TaskElement | StoryElement | GoalElement
  ): string | null {
    if (element.uuid) return element.uuid;
    if (Number.isFinite(element.backendId)) return String(element.backendId);
    return null;
  }
}
