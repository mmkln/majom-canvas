import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalsApiService } from '../../../../majom-wrapper/data-access/goals-api-service.ts';
import { StoriesApiService } from '../../../../majom-wrapper/data-access/stories-api-service.ts';
import type {
  Goal,
  PlatformTask,
  Story,
} from '../../../../majom-wrapper/interfaces/index.ts';
import {
  collectStoriesFromGoalTasks,
  matchesRef,
  mergeStoriesDedup,
  normalizeBackendRef,
  type BackendRef,
} from './relationshipResolvers.ts';
import { Scene } from '../scene/Scene.ts';

type CanvasElement = TaskElement | StoryElement | GoalElement;

export type StoryListItemVM = {
  id: number;
  uuid?: string;
  title: string;
  status?: string;
  tasksCount: number;
  isOnCanvas: boolean;
};

export type TaskListItemVM = {
  id: number;
  uuid?: string;
  title: string;
  status?: string;
  isOnCanvas: boolean;
};

export class ElementDetailsService {
  private readonly storiesCache = new Map<string, Observable<StoryListItemVM[]>>();
  private readonly tasksCache = new Map<string, Observable<TaskListItemVM[]>>();

  constructor(
    private readonly scene: Scene,
    private readonly goalsApi: GoalsApiService,
    private readonly storiesApi: StoriesApiService
  ) {}

  public loadStoriesForElement(
    element: CanvasElement
  ): Observable<StoryListItemVM[]> {
    const key = this.getElementCacheKey(element);
    const cached = this.storiesCache.get(key);
    if (cached) return cached;

    const source = this.loadStoriesForElementUncached(element).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.storiesCache.set(key, source);
    return source;
  }

  public loadTasksForStory(ref: BackendRef): Observable<TaskListItemVM[]> {
    const normalizedRef = normalizeBackendRef(ref);
    const cacheKey = this.getStoryRefKey(normalizedRef);
    const cached = this.tasksCache.get(cacheKey);
    if (cached) return cached;

    const source = this.loadTasksForStoryUncached(normalizedRef).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.tasksCache.set(cacheKey, source);
    return source;
  }

  private loadStoriesForElementUncached(
    element: CanvasElement
  ): Observable<StoryListItemVM[]> {
    if (element instanceof StoryElement) {
      const ref = normalizeBackendRef({ id: element.backendId, uuid: element.uuid });
      return this.loadSingleStory(ref);
    }

    if (element instanceof TaskElement) {
      return this.getTaskStoryList(element);
    }

    return this.getGoalStories(element);
  }

  private loadTasksForStoryUncached(ref: BackendRef): Observable<TaskListItemVM[]> {
    if (ref.id !== null) {
      return this.storiesApi.getStory(ref.id).pipe(
        map((story) =>
          (Array.isArray(story.tasks) ? story.tasks : []).map((task) =>
            this.mapTask(task)
          )
        ),
        catchError(() => of([]))
      );
    }

    if (ref.uuid) {
      return this.storiesApi.fetchStoriesByUuids([ref.uuid]).pipe(
        map((stories) => stories[0]),
        map((story) => (story && Array.isArray(story.tasks) ? story.tasks : [])),
        map((tasks) => tasks.map((task) => this.mapTask(task))),
        catchError(() => of([]))
      );
    }

    return of([]);
  }

  private loadSingleStory(ref: BackendRef): Observable<StoryListItemVM[]> {
    if (ref.id !== null) {
      return this.storiesApi.getStory(ref.id).pipe(
        map((story) => [this.mapStory(story)]),
        catchError(() => of([]))
      );
    }

    if (ref.uuid) {
      return this.storiesApi.fetchStoriesByUuids([ref.uuid]).pipe(
        map((stories) => stories.map((story) => this.mapStory(story))),
        catchError(() => of([]))
      );
    }

    return of([]);
  }

  private getTaskStoryList(element: TaskElement): Observable<StoryListItemVM[]> {
    const taskRef = normalizeBackendRef({ id: element.backendId, uuid: element.uuid });
    if (taskRef.id === null && !taskRef.uuid) return of([]);

    return this.storiesApi.getStories().pipe(
      map((stories) =>
        stories.filter((story) =>
          (story.tasks || []).some((task) => matchesRef(task, taskRef))
        )
      ),
      map((stories) => stories.map((story) => this.mapStory(story))),
      catchError(() => of([]))
    );
  }

  private getGoalStories(element: GoalElement): Observable<StoryListItemVM[]> {
    const ref = normalizeBackendRef({ id: element.backendId, uuid: element.uuid });
    if (ref.id === null) return of([]);
    return this.goalsApi.getGoal(ref.id).pipe(
      map((goal) => this.extractGoalStories(goal)),
      map((stories) => stories.map((story) => this.mapStory(story))),
      catchError(() => of([]))
    );
  }

  private extractGoalStories(goal: Goal): Story[] {
    const directStories = Array.isArray(goal.stories) ? goal.stories : [];
    const fromTasks = collectStoriesFromGoalTasks(goal);
    return mergeStoriesDedup(directStories, fromTasks);
  }

  private mapStory(story: Story): StoryListItemVM {
    return {
      id: story.id,
      uuid: story.uuid,
      title: story.title,
      status: String(story.status ?? ''),
      tasksCount: Array.isArray(story.tasks) ? story.tasks.length : 0,
      isOnCanvas: this.hasStoryOnCanvas(story),
    };
  }

  private mapTask(task: PlatformTask): TaskListItemVM {
    return {
      id: task.id,
      uuid: task.uuid,
      title: task.title,
      status: String(task.status ?? ''),
      isOnCanvas: this.hasTaskOnCanvas(task),
    };
  }

  private hasStoryOnCanvas(story: Story): boolean {
    return this.scene.getElements().some((el) => {
      if (!(el instanceof StoryElement)) return false;
      if (story.uuid && el.uuid && story.uuid === el.uuid) return true;
      return Number.isFinite(el.backendId) && el.backendId === story.id;
    });
  }

  private hasTaskOnCanvas(task: PlatformTask): boolean {
    return this.scene.getElements().some((el) => {
      if (!(el instanceof TaskElement)) return false;
      if (task.uuid && el.uuid && task.uuid === el.uuid) return true;
      return Number.isFinite(el.backendId) && el.backendId === task.id;
    });
  }

  private getElementCacheKey(element: CanvasElement): string {
    if (element.uuid) return `uuid:${element.uuid}`;
    if (Number.isFinite(element.backendId)) return `id:${String(element.backendId)}`;
    return `canvas:${element.id}`;
  }

  private getStoryRefKey(ref: BackendRef): string {
    if (ref.uuid) return `uuid:${ref.uuid}`;
    if (ref.id !== null) return `id:${String(ref.id)}`;
    return 'empty';
  }
}
