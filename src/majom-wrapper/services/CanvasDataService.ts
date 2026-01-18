import { forkJoin, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  finalize,
  groupBy,
  map,
  mergeMap,
  retry,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { CanvasPositionDTO } from '../data-access/canvas-position-dto.ts';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import {
  CanvasApiService,
  CanvasSummary,
  ContentTypeInfo,
} from '../data-access/canvas-api-service.ts';
import { mapTask } from '../mappers/task-mapper.ts';
import { mapStory } from '../mappers/story-mapper.ts';
import { mapGoal } from '../mappers/goal-mapper.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { mapStatusToBackend } from '../utils/statusMapping.ts';
import { mapPriorityToBackend } from '../utils/priorityMapping.ts';
import type { PlatformTask, Story, Goal } from '../interfaces/index.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';

type ElementPatch = Partial<{
  title: string;
  description: string;
  status: ElementStatus;
  priority: 'low' | 'medium' | 'high';
}>;

type ElementUpdateStatus = {
  status: 'saving' | 'saved' | 'failed';
  error?: unknown;
};

type ElementUpdateRequest = {
  key: string;
  element: TaskElement | StoryElement | GoalElement;
  patch: ElementPatch;
};

/**
 * Service to load and persist canvas elements and layout.
 */
export class CanvasDataService {
  private canvasId: string | null = null;
  private canvasName: string | null = null;
  private contentTypeMap$?: Observable<Record<string, number>>;
  private tasks$?: Observable<PlatformTask[]>;
  private stories$?: Observable<Story[]>;
  private goals$?: Observable<Goal[]>;
  private tasksCache: PlatformTask[] | null = null;
  private storiesCache: Story[] | null = null;
  private goalsCache: Goal[] | null = null;
  private positionRegistry: Map<string, CanvasPositionDTO> = new Map();
  private elementUpdate$ = new Subject<ElementUpdateRequest>();
  private elementUpdateStatus$ = new Subject<ElementUpdateStatus>();
  private pendingElementUpdates = 0;
  private failedElementUpdates = false;

  constructor(
    private tasksApi: TasksApiService,
    private storiesApi: StoriesApiService,
    private goalsApi: GoalsApiService,
    private canvasApi: CanvasApiService
  ) {
    this.initElementUpdatePipeline();
  }

  /**
   * Load tasks, stories, goals along with their canvas positions.
   */
  public loadElements(): Observable<
    Array<TaskElement | StoryElement | GoalElement>
  > {
    const canvasId = this.canvasId;
    if (!canvasId) {
      return of([]);
    }
    return this.canvasApi.fetchCanvasPositions(canvasId).pipe(
      tap((layout) => {
        this.updatePositionRegistry(layout);
      }),
      retry(2),
      switchMap((layout) => {
        const layoutIds = {
          task: new Set<number>(),
          story: new Set<number>(),
          goal: new Set<number>(),
        };
        layout.forEach((pos) => {
          const type = pos.element_type;
          const id = pos.element_id ?? pos.object_id;
          if (!type || !id) return;
          if (type in layoutIds) {
            layoutIds[type as keyof typeof layoutIds].add(id);
          }
        });
        const taskIds = Array.from(layoutIds.task);
        const storyIds = Array.from(layoutIds.story);
        const goalIds = Array.from(layoutIds.goal);
        return forkJoin({
          tasks: this.fetchTasksByIdsCached(taskIds),
          stories: this.fetchStoriesByIdsCached(storyIds),
          goals: this.fetchGoalsByIdsCached(goalIds),
          layout: of(layout),
        });
      }),
      map(({ tasks, stories, goals, layout }) => {
        const elems: Array<TaskElement | StoryElement | GoalElement> = [];
        elems.push(...tasks.map((t) => mapTask(t, layout)));
        elems.push(...stories.map((s) => mapStory(s, layout)));
        elems.push(...goals.map((g) => mapGoal(g, layout)));
        return elems;
      }),
      shareReplay(1)
    );
  }

  private initElementUpdatePipeline(): void {
    this.elementUpdate$
      .pipe(
        groupBy((req) => req.key),
        mergeMap((group$) =>
          group$.pipe(
            debounceTime(800),
            switchMap((req) => this.persistElementUpdate(req))
          )
        )
      )
      .subscribe();
  }

  private getElementUpdateKey(
    element: TaskElement | StoryElement | GoalElement
  ): string {
    const type =
      element instanceof TaskElement
        ? 'task'
        : element instanceof StoryElement
          ? 'story'
          : 'goal';
    return `${type}:${element.id}`;
  }

  private buildBackendPatch(patch: ElementPatch): Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
  }> {
    const payload: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
    }> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.description !== undefined)
      payload.description = patch.description;
    if (patch.status !== undefined) {
      payload.status = mapStatusToBackend(patch.status);
    }
    if (patch.priority !== undefined) {
      payload.priority = mapPriorityToBackend(patch.priority);
    }
    return payload;
  }

  private persistElementUpdate(req: ElementUpdateRequest): Observable<void> {
    if (this.pendingElementUpdates === 0) {
      this.failedElementUpdates = false;
    }
    this.pendingElementUpdates += 1;
    this.elementUpdateStatus$.next({ status: 'saving' });

    return this.ensureElementsPersisted([req.element]).pipe(
      switchMap(() => {
        const id = Number(req.element.id);
        if (!Number.isFinite(id)) {
          this.failedElementUpdates = true;
          this.elementUpdateStatus$.next({ status: 'failed' });
          return of(undefined);
        }
        const payload = this.buildBackendPatch(req.patch);
        if (Object.keys(payload).length === 0) {
          return of(undefined);
        }
        if (req.element instanceof TaskElement) {
          return this.tasksApi.patchTask(id, payload as Partial<PlatformTask>);
        }
        if (req.element instanceof StoryElement) {
          return this.storiesApi.patchStory(id, payload as Partial<Story>);
        }
        return this.goalsApi.patchGoal(id, payload as Partial<Goal>);
      }),
      tap((updated) => {
        if (!updated) return;
        if (updated && req.element instanceof TaskElement) {
          this.upsertTaskCache(updated as PlatformTask);
        } else if (updated && req.element instanceof StoryElement) {
          this.upsertStoryCache(updated as Story);
        } else if (updated) {
          this.upsertGoalCache(updated as Goal);
        }
      }),
      map(() => undefined),
      catchError((err) => {
        this.failedElementUpdates = true;
        this.elementUpdateStatus$.next({ status: 'failed', error: err });
        return of(undefined);
      }),
      finalize(() => {
        this.pendingElementUpdates = Math.max(
          0,
          this.pendingElementUpdates - 1
        );
        if (this.pendingElementUpdates === 0 && !this.failedElementUpdates) {
          this.elementUpdateStatus$.next({ status: 'saved' });
        }
      })
    );
  }

  public updateTaskStoryLink(
    task: TaskElement,
    story: StoryElement | null
  ): Observable<void> {
    const elementsToPersist = [task, story].filter(Boolean) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    return this.ensureElementsPersisted(elementsToPersist).pipe(
      switchMap(() => {
        const taskId = Number(task.id);
        if (!Number.isFinite(taskId)) return of(undefined);
        const storyId = story ? Number(story.id) : null;
        if (story && !Number.isFinite(storyId)) return of(undefined);
        return this.tasksApi.patchTask(taskId, {
          story_id: storyId ?? null,
        } as Partial<PlatformTask>);
      }),
      tap((updated) => {
        if (updated) {
          this.upsertTaskCache(updated as PlatformTask);
        }
      }),
      map(() => undefined)
    );
  }

  public readonly elementUpdateStatusChanges =
    this.elementUpdateStatus$.asObservable();

  public queueElementUpdate(
    element: TaskElement | StoryElement | GoalElement,
    patch: ElementPatch
  ): void {
    if (!patch || Object.keys(patch).length === 0) return;
    this.elementUpdate$.next({
      key: this.getElementUpdateKey(element),
      element,
      patch,
    });
  }

  public loadCanvases(): Observable<CanvasSummary[]> {
    return this.canvasApi.loadCanvases();
  }

  public loadCanvasDetails(id: string): Observable<CanvasSummary> {
    return this.canvasApi.loadCanvas(id).pipe(
      map((canvas) => {
        this.setActiveCanvas(canvas);
        return canvas;
      })
    );
  }

  public loadContentTypeMap(): Observable<Record<string, number>> {
    if (!this.contentTypeMap$) {
      this.contentTypeMap$ = this.canvasApi.loadContentTypes().pipe(
        map((items: ContentTypeInfo[]) => {
          const mapByModel: Record<string, number> = {};
          items.forEach((item) => {
            mapByModel[item.model] = item.id;
          });
          return mapByModel;
        }),
        shareReplay(1)
      );
    }
    return this.contentTypeMap$;
  }

  public clearElementCache(): void {
    this.tasksCache = null;
    this.storiesCache = null;
    this.goalsCache = null;
    this.tasks$ = undefined;
    this.stories$ = undefined;
    this.goals$ = undefined;
    this.positionRegistry.clear();
  }

  public ensureElementsPersisted(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): Observable<void> {
    const toCreate = elements.filter((el) => !Number.isFinite(Number(el.id)));
    if (toCreate.length === 0) return of(undefined);
    const creates: Observable<any>[] = [];

    toCreate.forEach((el) => {
      if (el instanceof TaskElement) {
        const payload: Partial<PlatformTask> = {
          title: el.title,
          description: el.description,
          status: mapStatusToBackend(el.status),
          priority: mapPriorityToBackend(el.priority),
        };
        creates.push(
          this.tasksApi.createTask(payload).pipe(
            map((created) => {
              el.id = created.id.toString();
              this.upsertTaskCache(created);
              return created;
            })
          )
        );
      } else if (el instanceof StoryElement) {
        const payload: Partial<Story> = {
          title: el.title,
          description: el.description,
          status: mapStatusToBackend(el.status),
          priority: mapPriorityToBackend(el.priority),
        };
        creates.push(
          this.storiesApi.createStory(payload).pipe(
            map((created) => {
              el.id = created.id.toString();
              this.upsertStoryCache(created);
              return created;
            })
          )
        );
      } else if (el instanceof GoalElement) {
        const payload: Partial<Goal> = {
          title: el.title,
          description: el.description,
          status: mapStatusToBackend(el.status),
          priority: mapPriorityToBackend(el.priority),
        };
        creates.push(
          this.goalsApi.createGoal(payload).pipe(
            map((created) => {
              el.id = created.id.toString();
              this.upsertGoalCache(created);
              return created;
            })
          )
        );
      }
    });

    if (creates.length === 0) return of(undefined);
    return forkJoin(creates).pipe(map(() => undefined));
  }

  private fetchTasksByIdsCached(ids: number[]): Observable<PlatformTask[]> {
    if (ids.length === 0) return of([]);
    const { cached, missing } = this.getCachedByIds(this.tasksCache, ids);
    if (missing.length === 0) {
      return of(this.orderByIds(cached, ids));
    }
    return this.tasksApi.fetchTasksByIds(missing).pipe(
      map((fetched) => {
        this.tasksCache = this.mergeCache(this.tasksCache, fetched);
        return this.orderByIds([...cached, ...fetched], ids);
      })
    );
  }

  private fetchStoriesByIdsCached(ids: number[]): Observable<Story[]> {
    if (ids.length === 0) return of([]);
    const { cached, missing } = this.getCachedByIds(this.storiesCache, ids);
    if (missing.length === 0) {
      return of(this.orderByIds(cached, ids));
    }
    return this.storiesApi.fetchStoriesByIds(missing).pipe(
      map((fetched) => {
        this.storiesCache = this.mergeCache(this.storiesCache, fetched);
        return this.orderByIds([...cached, ...fetched], ids);
      })
    );
  }

  private fetchGoalsByIdsCached(ids: number[]): Observable<Goal[]> {
    if (ids.length === 0) return of([]);
    const { cached, missing } = this.getCachedByIds(this.goalsCache, ids);
    if (missing.length === 0) {
      return of(this.orderByIds(cached, ids));
    }
    return this.goalsApi.fetchGoalsByIds(missing).pipe(
      map((fetched) => {
        this.goalsCache = this.mergeCache(this.goalsCache, fetched);
        return this.orderByIds([...cached, ...fetched], ids);
      })
    );
  }

  private loadTasksCached(force: boolean = false): Observable<PlatformTask[]> {
    if (!force && this.tasksCache) return of(this.tasksCache);
    if (!force && this.tasks$) return this.tasks$;
    this.tasks$ = this.tasksApi.fetchTasks({ page: 1, pageSize: 100 }).pipe(
      map((res) => {
        this.tasksCache = res.results;
        return res.results;
      }),
      shareReplay(1)
    );
    return this.tasks$;
  }

  private loadStoriesCached(force: boolean = false): Observable<Story[]> {
    if (!force && this.storiesCache) return of(this.storiesCache);
    if (!force && this.stories$) return this.stories$;
    this.stories$ = this.storiesApi
      .fetchStories({ page: 1, pageSize: 100 })
      .pipe(
        map((res) => {
          this.storiesCache = res.results;
          return res.results;
        }),
        shareReplay(1)
      );
    return this.stories$;
  }

  private loadGoalsCached(force: boolean = false): Observable<Goal[]> {
    if (!force && this.goalsCache) return of(this.goalsCache);
    if (!force && this.goals$) return this.goals$;
    this.goals$ = this.goalsApi.fetchGoals({ page: 1, pageSize: 100 }).pipe(
      map((res) => {
        this.goalsCache = res.results;
        return res.results;
      }),
      shareReplay(1)
    );
    return this.goals$;
  }

  private getCachedByIds<T extends { id: number }>(
    cache: T[] | null,
    ids: number[]
  ): { cached: T[]; missing: number[] } {
    if (!cache || cache.length === 0) {
      return { cached: [], missing: ids };
    }
    const cacheMap = new Map<number, T>();
    cache.forEach((item) => cacheMap.set(item.id, item));
    const cached: T[] = [];
    const missing: number[] = [];
    ids.forEach((id) => {
      const item = cacheMap.get(id);
      if (item) cached.push(item);
      else missing.push(id);
    });
    return { cached, missing };
  }

  private mergeCache<T extends { id: number }>(
    cache: T[] | null,
    items: T[]
  ): T[] {
    const next = cache ? [...cache] : [];
    items.forEach((item) => {
      const idx = next.findIndex((entry) => entry.id === item.id);
      if (idx >= 0) next[idx] = item;
      else next.push(item);
    });
    return next;
  }

  private orderByIds<T extends { id: number }>(items: T[], ids: number[]): T[] {
    const mapById = new Map<number, T>();
    items.forEach((item) => mapById.set(item.id, item));
    return ids
      .map((id) => mapById.get(id))
      .filter((item): item is T => Boolean(item));
  }

  private upsertTaskCache(task: PlatformTask): void {
    if (!this.tasksCache) {
      this.tasksCache = [task];
      return;
    }
    const idx = this.tasksCache.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      this.tasksCache[idx] = task;
    } else {
      this.tasksCache.push(task);
    }
  }

  private upsertStoryCache(story: Story): void {
    if (!this.storiesCache) {
      this.storiesCache = [story];
      return;
    }
    const idx = this.storiesCache.findIndex((s) => s.id === story.id);
    if (idx >= 0) {
      this.storiesCache[idx] = story;
    } else {
      this.storiesCache.push(story);
    }
  }

  private upsertGoalCache(goal: Goal): void {
    if (!this.goalsCache) {
      this.goalsCache = [goal];
      return;
    }
    const idx = this.goalsCache.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      this.goalsCache[idx] = goal;
    } else {
      this.goalsCache.push(goal);
    }
  }

  public setActiveCanvas(canvas: Pick<CanvasSummary, 'id' | 'name'>): void {
    if (this.canvasId !== canvas.id) {
      this.positionRegistry.clear();
    }
    this.canvasId = canvas.id;
    this.canvasName = canvas.name;
  }

  public getActiveCanvasId(): string | null {
    return this.canvasId;
  }

  public createCanvas(
    name: string = 'New canvas'
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.canvasApi.createCanvas(name).pipe(
      map((canvas) => {
        this.setActiveCanvas(canvas);
        return canvas;
      })
    );
  }

  public ensureCanvas(): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    return this.canvasApi.loadCanvases().pipe(
      switchMap((canvases) => {
        if (canvases.length > 0) {
          const canvas = canvases[0];
          return of({ id: canvas.id, name: canvas.name });
        }
        return this.canvasApi.createCanvas('New canvas');
      }),
      map((canvas) => {
        this.setActiveCanvas(canvas);
        return canvas;
      })
    );
  }

  public updateCanvasName(
    name: string
  ): Observable<Pick<CanvasSummary, 'id' | 'name'>> {
    const safeName = name.trim() || 'New canvas';
    if (this.canvasId) {
      return this.canvasApi.updateCanvas(this.canvasId, safeName).pipe(
        map((updated) => {
          this.setActiveCanvas(updated);
          return updated;
        })
      );
    }
    return this.ensureCanvas().pipe(
      switchMap((canvas) => this.canvasApi.updateCanvas(canvas.id, safeName)),
      map((updated) => {
        this.setActiveCanvas(updated);
        return updated;
      })
    );
  }

  public getRemovedPositionIds(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): string[] {
    if (this.positionRegistry.size === 0) return [];
    const activeKeys = this.getElementKeys(elements);
    const removed: string[] = [];
    this.positionRegistry.forEach((pos, key) => {
      if (!activeKeys.has(key) && pos.id) {
        removed.push(pos.id);
      }
    });
    return removed;
  }

  public needsPositionRefresh(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): boolean {
    const keys = this.getElementKeys(elements);
    for (const key of keys) {
      if (!this.positionRegistry.has(key)) {
        return true;
      }
    }
    return false;
  }

  public refreshPositions(): Observable<void> {
    if (!this.canvasId) return of(undefined);
    return this.canvasApi.fetchCanvasPositions(this.canvasId).pipe(
      tap((layout) => this.updatePositionRegistry(layout)),
      map(() => undefined)
    );
  }

  public deletePositions(positionIds: string[]): Observable<void> {
    const ids = positionIds.filter(Boolean);
    if (ids.length === 0) return of(undefined);
    return forkJoin(
      ids.map((id) => this.canvasApi.deleteCanvasPosition(id))
    ).pipe(
      tap(() => this.removePositionsFromRegistry(ids)),
      map(() => undefined)
    );
  }

  public getPositionIdForElement(
    element: TaskElement | StoryElement | GoalElement
  ): string | null {
    const type = this.getElementType(element);
    if (!type) return null;
    const id = Number(element.id);
    if (!Number.isFinite(id)) return null;
    const key = this.buildPositionKey(type, id);
    return this.positionRegistry.get(key)?.id ?? null;
  }

  public deleteElement(
    element: TaskElement | StoryElement | GoalElement
  ): Observable<void> {
    const type = this.getElementType(element);
    if (!type) return of(undefined);
    const id = Number(element.id);
    if (!Number.isFinite(id)) {
      return this.deletePositionForElement(type, id);
    }
    const deleteEntity$ =
      element instanceof TaskElement
        ? this.tasksApi.deleteTask(id)
        : element instanceof StoryElement
          ? this.storiesApi.deleteStory(id)
          : this.goalsApi.deleteGoal(id);
    return deleteEntity$.pipe(
      switchMap(() =>
        this.deletePositionForElement(type, id).pipe(
          map(() => true),
          catchError((err) => {
            console.error('Failed to delete canvas position', err);
            return of(false);
          })
        )
      ),
      tap((positionDeleted) => {
        if (positionDeleted) {
          this.removePositionByKey(type, id);
        }
        this.removeElementFromCache(type, id);
      }),
      map(() => undefined)
    );
  }

  /**
   * Batch update canvas layout positions.
   */
  public updateLayoutBatch(changes: CanvasPositionDTO[]): Observable<void> {
    if (changes.length === 0) return of(undefined);
    if (this.canvasId) {
      return this.canvasApi.saveCanvasPositions(this.canvasId, changes);
    }
    return this.canvasApi.createCanvas().pipe(
      switchMap(({ id }) => {
        this.canvasId = id;
        return this.canvasApi.saveCanvasPositions(id, changes);
      })
    );
  }

  private updatePositionRegistry(layout: CanvasPositionDTO[]): void {
    this.positionRegistry.clear();
    layout.forEach((pos) => {
      const type = pos.element_type;
      const elementId = pos.element_id ?? pos.object_id;
      if (!type || !elementId || !pos.id) return;
      this.positionRegistry.set(this.buildPositionKey(type, elementId), pos);
    });
  }

  private removePositionsFromRegistry(positionIds: string[]): void {
    if (positionIds.length === 0) return;
    const idSet = new Set(positionIds);
    Array.from(this.positionRegistry.entries()).forEach(([key, pos]) => {
      if (pos.id && idSet.has(pos.id)) {
        this.positionRegistry.delete(key);
      }
    });
  }

  private getElementKeys(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): Set<string> {
    const keys = new Set<string>();
    elements.forEach((el) => {
      const type = this.getElementType(el);
      if (!type) return;
      const id = Number(el.id);
      if (!Number.isFinite(id)) return;
      keys.add(this.buildPositionKey(type, id));
    });
    return keys;
  }

  private getElementType(
    element: TaskElement | StoryElement | GoalElement
  ): 'task' | 'story' | 'goal' | null {
    if (element instanceof TaskElement) return 'task';
    if (element instanceof StoryElement) return 'story';
    if (element instanceof GoalElement) return 'goal';
    return null;
  }

  private buildPositionKey(type: string, id: number): string {
    return `${type}:${id}`;
  }

  private deletePositionForElement(
    type: 'task' | 'story' | 'goal',
    id: number
  ): Observable<void> {
    if (!Number.isFinite(id)) return of(undefined);
    const key = this.buildPositionKey(type, id);
    const positionId = this.positionRegistry.get(key)?.id;
    if (positionId) {
      return this.deletePositions([positionId]);
    }
    return this.refreshPositions().pipe(
      switchMap(() => {
        const refreshedId = this.positionRegistry.get(key)?.id;
        if (!refreshedId) return of(undefined);
        return this.deletePositions([refreshedId]);
      })
    );
  }

  private removePositionByKey(
    type: 'task' | 'story' | 'goal',
    id: number
  ): void {
    this.positionRegistry.delete(this.buildPositionKey(type, id));
  }

  private removeElementFromCache(
    type: 'task' | 'story' | 'goal',
    id: number
  ): void {
    if (type === 'task' && this.tasksCache) {
      this.tasksCache = this.tasksCache.filter((task) => task.id !== id);
    } else if (type === 'story' && this.storiesCache) {
      this.storiesCache = this.storiesCache.filter((story) => story.id !== id);
    } else if (type === 'goal' && this.goalsCache) {
      this.goalsCache = this.goalsCache.filter((goal) => goal.id !== id);
    }
  }
}
