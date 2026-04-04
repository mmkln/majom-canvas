import { firstValueFrom } from 'rxjs';
import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../../majom-wrapper/interfaces/index.ts';
import { normalizeUiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import type {
  CanvasRelatedItem,
  CanvasRelatedItemsAdapter,
  CanvasRelatedItemsLoadContext,
  CanvasRelatedItemsLoadResult,
  CanvasRelatedItemsMutationContext,
} from '../CanvasRelatedItemsAdapter.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { AddElementCommand } from '../../core/commands/AddElementCommand.ts';
import { AddTasksToStoryCommand } from '../../core/commands/AddTasksToStoryCommand.ts';
import { ResizeCommand } from '../../core/commands/ResizeCommand.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { StoryLayoutService } from '../../core/services/StoryLayoutService.ts';
import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';

export class PlanningCanvasRelatedItemsAdapter
  implements CanvasRelatedItemsAdapter
{
  private readonly layoutService = new StoryLayoutService();

  public isSupportedHost(element: ICanvasElement): element is IPlanningElement {
    return element instanceof StoryElement || element instanceof GoalElement;
  }

  public async loadRelatedItems(
    context: CanvasRelatedItemsLoadContext
  ): Promise<CanvasRelatedItemsLoadResult> {
    const ref = this.getBackendRef(context.host);
    if (!ref) {
      return {
        title: context.runtime.i18n.t('relatedItems.title.default'),
        availableTabs: ['tasks'],
        defaultTab: 'tasks',
        tasks: [],
        stories: [],
      };
    }

    if (context.host instanceof StoryElement) {
      const story = await firstValueFrom(context.lookupAdapter.getStory(ref));
      return {
        title: context.runtime.i18n.t('relatedItems.title.storyTasks'),
        availableTabs: ['tasks'],
        defaultTab: 'tasks',
        tasks: this.filterMissingTasks(context, story.tasks || []),
        stories: [],
      };
    }

    if (context.host instanceof GoalElement) {
      const goal = await firstValueFrom(context.lookupAdapter.getGoal(ref));
      const goalTasks = this.getGoalTasks(goal);
      const directStories = this.getGoalStories(goal);
      const embeddedStories = this.extractStoriesFromGoalTasks(goalTasks);
      const knownStories = this.mergeStories(directStories, embeddedStories);
      const storyIds = this.extractStoryIdsFromGoalTasks(goalTasks);
      const loadedIds = new Set(knownStories.map((story) => story.id));
      const missingIds = storyIds.filter((id) => !loadedIds.has(id));
      const fetchedStories =
        missingIds.length > 0
          ? await firstValueFrom(context.lookupAdapter.fetchStoriesByIds(missingIds))
          : [];
      const allStories = this.mergeStories(knownStories, fetchedStories);

      return {
        title: context.runtime.i18n.t('relatedItems.title.goalRelated'),
        availableTabs: ['tasks', 'stories'],
        defaultTab: 'tasks',
        tasks: this.filterMissingTasks(context, goalTasks),
        stories: this.filterMissingStories(context, allStories),
      };
    }

    return {
      title: context.runtime.i18n.t('relatedItems.title.default'),
      availableTabs: ['tasks'],
      defaultTab: 'tasks',
      tasks: [],
      stories: [],
    };
  }

  public addItemToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      item: CanvasRelatedItem;
      index: number;
    }
  ): void {
    if (context.item.kind === 'task') {
      this.addTaskItemToCanvas(context, context.item.payload as PlatformTask);
      return;
    }
    this.addStoryItemToCanvas(context, context.item.payload as Story);
  }

  public addAllToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      tab: 'tasks' | 'stories';
      items: CanvasRelatedItem[];
    }
  ): void {
    if (context.host instanceof StoryElement) {
      this.addAllMissingStoryTasks(
        context,
        context.items
          .filter((item) => item.kind === 'task')
          .map((item) => item.payload as PlatformTask)
      );
      return;
    }

    if (!(context.host instanceof GoalElement)) {
      return;
    }

    if (context.tab === 'tasks') {
      const tasksToAdd = context.items
        .filter((item) => item.kind === 'task')
        .map((item, index) => {
          const payload = item.payload as PlatformTask;
          const position = this.getTaskInsertPosition(context.host, index);
          return this.createTaskElement(payload, position.x, position.y);
        });
      if (tasksToAdd.length > 0) {
        historyService.execute(new AddElementCommand(context.scene, tasksToAdd));
      }
      return;
    }

    const storiesToAdd = context.items
      .filter((item) => item.kind === 'story')
      .map((item, index) => {
        const payload = item.payload as Story;
        const position = this.getStoryInsertPosition(context.host, index);
        return this.createStoryElement(payload, position.x, position.y);
      });
    if (storiesToAdd.length > 0) {
      historyService.execute(new AddElementCommand(context.scene, storiesToAdd));
    }
  }

  private addTaskItemToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      item: CanvasRelatedItem;
      index: number;
    },
    item: PlatformTask
  ): void {
    const position =
      context.host instanceof StoryElement
        ? { x: 0, y: 0 }
        : this.getTaskInsertPosition(context.host, context.index);
    const task = this.createTaskElement(item, position.x, position.y);
    if (context.host instanceof StoryElement) {
      const story = context.host;
      const tasks = context.scene
        .getElements()
        .filter((element): element is TaskElement => element instanceof TaskElement);
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
        historyService.execute(new ResizeCommand(context.scene, initial, final));
      }
    }
    historyService.execute(new AddElementCommand(context.scene, task));
    if (context.host instanceof StoryElement) {
      context.host.addTask(task);
    }
  }

  private addStoryItemToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      item: CanvasRelatedItem;
      index: number;
    },
    item: Story
  ): void {
    if (!(context.host instanceof GoalElement)) return;
    const position = this.getStoryInsertPosition(context.host, context.index);
    const story = this.createStoryElement(item, position.x, position.y);
    historyService.execute(new AddElementCommand(context.scene, story));
  }

  private addAllMissingStoryTasks(
    context: CanvasRelatedItemsMutationContext,
    items: PlatformTask[]
  ): void {
    if (!(context.host instanceof StoryElement) || items.length === 0) return;

    const story = context.host;
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
    const sceneTasks = context.scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    const planningTasks = [...sceneTasks];
    const tasksToAdd: TaskElement[] = [];
    let nextHeight = story.height;

    items.forEach((item) => {
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
      new AddTasksToStoryCommand(context.scene, story, tasksToAdd, nextHeight)
    );
  }

  private filterMissingTasks(
    context: CanvasRelatedItemsLoadContext,
    tasks: PlatformTask[]
  ): CanvasRelatedItem[] {
    const existingRefs = new Set<string>();
    context.scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement)
      .forEach((task) => {
        if (task.uuid) existingRefs.add(`uuid:${task.uuid}`);
        if (Number.isFinite(task.backendId)) {
          existingRefs.add(`id:${String(task.backendId)}`);
        }
      });
    return tasks
      .filter((task) =>
        this.getTaskRefKeys(task).every((key) => !existingRefs.has(key))
      )
      .map((task) => ({
        key: this.getRelatedKey('task', task.uuid ?? String(task.id)),
        kind: 'task' as const,
        title: task.title,
        description: task.description,
        fallbackMeta: context.runtime.i18n.t('relatedItems.meta.task', {
          id: task.id,
        }),
        payload: task,
      }));
  }

  private filterMissingStories(
    context: CanvasRelatedItemsLoadContext,
    stories: Story[]
  ): CanvasRelatedItem[] {
    const existingRefs = new Set<string>();
    context.scene
      .getElements()
      .filter(
        (element): element is StoryElement => element instanceof StoryElement
      )
      .forEach((story) => {
        if (story.uuid) existingRefs.add(`uuid:${story.uuid}`);
        if (Number.isFinite(story.backendId)) {
          existingRefs.add(`id:${String(story.backendId)}`);
        }
      });
    return stories
      .filter((story) =>
        this.getStoryRefKeys(story).every((key) => !existingRefs.has(key))
      )
      .map((story) => ({
        key: this.getRelatedKey('story', story.uuid ?? String(story.id)),
        kind: 'story' as const,
        title: story.title,
        description: story.description,
        fallbackMeta: context.runtime.i18n.t('relatedItems.meta.story', {
          id: story.id,
        }),
        payload: story,
      }));
  }

  private getGoalTasks(goal: Goal): PlatformTask[] {
    const rawTasks = (goal as { tasks?: unknown }).tasks;
    if (Array.isArray(rawTasks)) {
      return rawTasks as PlatformTask[];
    }
    const rawItems = (rawTasks as { items?: unknown[] } | undefined)?.items;
    if (Array.isArray(rawItems)) {
      return rawItems as PlatformTask[];
    }
    return [];
  }

  private getGoalStories(goal: Goal): Story[] {
    const rawStories = (goal as { stories?: unknown }).stories;
    return Array.isArray(rawStories) ? (rawStories as Story[]) : [];
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
      const numericId = Number(id);
      if (seen.has(numericId)) return;
      seen.add(numericId);
      ids.push(numericId);
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

  private createTaskElement(item: PlatformTask, x: number, y: number): TaskElement {
    return new TaskElement({
      id: item.uuid ?? item.id.toString(),
      x,
      y,
      backendId: item.id,
      uuid: item.uuid,
      title: item.title,
      description: item.description,
      status: mapStatus(item.status),
      priority: normalizeUiPriority(item.priority),
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
      priority: normalizeUiPriority(item.priority),
    });
  }

  private getTaskInsertPosition(
    host: IPlanningElement,
    index: number
  ): { x: number; y: number } {
    const startX = host.x + host.width / 2 - TaskElement.width / 2;
    const startY = host.y + host.height + 24;
    const gap = 12;
    return { x: startX, y: startY + index * (TaskElement.height + gap) };
  }

  private getStoryInsertPosition(
    host: GoalElement,
    index: number
  ): { x: number; y: number } {
    const startX = host.x + host.width / 2 - StoryElement.width / 2;
    const startY = host.y + host.height + 32;
    const gap = 32;
    return { x: startX, y: startY + index * (StoryElement.height + gap) };
  }

  private getBackendRef(element: IPlanningElement): string | null {
    if (element.uuid) return element.uuid;
    if (Number.isFinite(element.backendId)) return String(element.backendId);
    return null;
  }

  private getRelatedKey(kind: 'task' | 'story', ref: string): string {
    return `${kind}:${ref}`;
  }
}
