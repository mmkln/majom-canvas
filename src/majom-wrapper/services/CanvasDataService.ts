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
        const layoutRefs = {
          task: { ids: new Set<number>(), uuids: new Set<string>() },
          story: { ids: new Set<number>(), uuids: new Set<string>() },
          goal: { ids: new Set<number>(), uuids: new Set<string>() },
        };
        layout.forEach((pos) => {
          const type = pos.element_type;
          if (!type || !(type in layoutRefs)) return;
          const uuid = pos.element_uuid ?? pos.object_uuid;
          if (uuid) {
            layoutRefs[type as keyof typeof layoutRefs].uuids.add(uuid);
          }
          const id = pos.element_id ?? pos.object_id;
          if (id) {
            layoutRefs[type as keyof typeof layoutRefs].ids.add(id);
          }
        });
        const taskIds = Array.from(layoutRefs.task.ids);
        const storyIds = Array.from(layoutRefs.story.ids);
        const goalIds = Array.from(layoutRefs.goal.ids);
        const taskUuids = Array.from(layoutRefs.task.uuids);
        const storyUuids = Array.from(layoutRefs.story.uuids);
        const goalUuids = Array.from(layoutRefs.goal.uuids);
        return forkJoin({
          tasks: this.fetchTasksByRefsCached(taskIds, taskUuids),
          stories: this.fetchStoriesByRefsCached(storyIds, storyUuids),
          goals: this.fetchGoalsByRefsCached(goalIds, goalUuids),
          layout: of(layout),
        });
      }),
      map(({ tasks, stories, goals, layout }) => {
        const taskElements = tasks.map((t) => mapTask(t, layout));
        const storyElements = stories.map((s) => mapStory(s, layout));
        const goalElements = goals.map((g) => mapGoal(g, layout));
        this.linkTasksToStories(taskElements, storyElements, tasks);
        return [...taskElements, ...storyElements, ...goalElements];
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
        const ref = this.getBackendRef(req.element);
        if (!ref) {
          this.failedElementUpdates = true;
          this.elementUpdateStatus$.next({ status: 'failed' });
          return of(undefined);
        }
        const payload = this.buildBackendPatch(req.patch);
        if (Object.keys(payload).length === 0) {
          return of(undefined);
        }
        if (req.element instanceof TaskElement) {
          return this.tasksApi.patchTask(ref, payload as Partial<PlatformTask>);
        }
        if (req.element instanceof StoryElement) {
          return this.storiesApi.patchStory(ref, payload as Partial<Story>);
        }
        return this.goalsApi.patchGoal(ref, payload as Partial<Goal>);
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
        const taskRef = this.getBackendRef(task);
        if (!taskRef) return of(undefined);
        const storyId = story ? this.getBackendId(story) : null;
        if (story && !Number.isFinite(storyId)) return of(undefined);
        return this.tasksApi.patchTask(taskRef, {
          story_id: storyId ?? null,
        } as Partial<PlatformTask>);
      }),
      tap((updated) => {
        if (updated) {
          this.upsertTaskCache(updated);
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
    const toCreate = elements.filter(
      (el) => !Number.isFinite(this.getBackendId(el))
    );
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
              el.backendId = created.id;
              if (created.uuid) {
                el.uuid = created.uuid;
              }
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
              el.backendId = created.id;
              if (created.uuid) {
                el.uuid = created.uuid;
              }
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
              el.backendId = created.id;
              if (created.uuid) {
                el.uuid = created.uuid;
              }
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

  private fetchTasksByRefsCached(
    ids: number[],
    uuids: string[]
  ): Observable<PlatformTask[]> {
    if (ids.length === 0 && uuids.length === 0) return of([]);
    const { cached: cachedByIds, missing: missingIds } = this.getCachedByIds(
      this.tasksCache,
      ids
    );
    const { cached: cachedByUuids, missing: missingUuids } =
      this.getCachedByUuids(this.tasksCache, uuids);
    const cachedCombined = this.dedupeById([
      ...cachedByIds,
      ...cachedByUuids,
    ]);
    const requests: Observable<PlatformTask[]>[] = [];
    if (missingIds.length > 0) {
      requests.push(this.tasksApi.fetchTasksByIds(missingIds));
    }
    if (missingUuids.length > 0) {
      requests.push(this.tasksApi.fetchTasksByUuids(missingUuids));
    }
    if (requests.length === 0) {
      return of(cachedCombined);
    }
    return forkJoin(requests).pipe(
      map((results: PlatformTask[][]) => {
        const fetched = results.reduce<PlatformTask[]>(
          (acc, batch) => acc.concat(batch),
          []
        );
        this.tasksCache = this.mergeCache(this.tasksCache, fetched);
        return this.dedupeById([...cachedCombined, ...fetched]);
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

  private fetchStoriesByRefsCached(
    ids: number[],
    uuids: string[]
  ): Observable<Story[]> {
    if (ids.length === 0 && uuids.length === 0) return of([]);
    const { cached: cachedByIds, missing: missingIds } = this.getCachedByIds(
      this.storiesCache,
      ids
    );
    const { cached: cachedByUuids, missing: missingUuids } =
      this.getCachedByUuids(this.storiesCache, uuids);
    const cachedCombined = this.dedupeById([
      ...cachedByIds,
      ...cachedByUuids,
    ]);
    const requests: Observable<Story[]>[] = [];
    if (missingIds.length > 0) {
      requests.push(this.storiesApi.fetchStoriesByIds(missingIds));
    }
    if (missingUuids.length > 0) {
      requests.push(this.storiesApi.fetchStoriesByUuids(missingUuids));
    }
    if (requests.length === 0) {
      return of(cachedCombined);
    }
    return forkJoin(requests).pipe(
      map((results: Story[][]) => {
        const fetched = results.reduce<Story[]>(
          (acc, batch) => acc.concat(batch),
          []
        );
        this.storiesCache = this.mergeCache(this.storiesCache, fetched);
        return this.dedupeById([...cachedCombined, ...fetched]);
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

  private fetchGoalsByRefsCached(
    ids: number[],
    uuids: string[]
  ): Observable<Goal[]> {
    if (ids.length === 0 && uuids.length === 0) return of([]);
    const { cached: cachedByIds, missing: missingIds } = this.getCachedByIds(
      this.goalsCache,
      ids
    );
    const { cached: cachedByUuids, missing: missingUuids } =
      this.getCachedByUuids(this.goalsCache, uuids);
    const cachedCombined = this.dedupeById([
      ...cachedByIds,
      ...cachedByUuids,
    ]);
    const requests: Observable<Goal[]>[] = [];
    if (missingIds.length > 0) {
      requests.push(this.goalsApi.fetchGoalsByIds(missingIds));
    }
    if (missingUuids.length > 0) {
      requests.push(this.goalsApi.fetchGoalsByUuids(missingUuids));
    }
    if (requests.length === 0) {
      return of(cachedCombined);
    }
    return forkJoin(requests).pipe(
      map((results: Goal[][]) => {
        const fetched = results.reduce<Goal[]>(
          (acc, batch) => acc.concat(batch),
          []
        );
        this.goalsCache = this.mergeCache(this.goalsCache, fetched);
        return this.dedupeById([...cachedCombined, ...fetched]);
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

  private getCachedByUuids<T extends { uuid?: string }>(
    cache: T[] | null,
    uuids: string[]
  ): { cached: T[]; missing: string[] } {
    if (!cache || cache.length === 0) {
      return { cached: [], missing: uuids };
    }
    const cacheMap = new Map<string, T>();
    cache.forEach((item) => {
      if (item.uuid) {
        cacheMap.set(item.uuid, item);
      }
    });
    const cached: T[] = [];
    const missing: string[] = [];
    uuids.forEach((uuid) => {
      const item = cacheMap.get(uuid);
      if (item) cached.push(item);
      else missing.push(uuid);
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

  private dedupeById<T extends { id: number }>(items: T[]): T[] {
    const mapById = new Map<number, T>();
    items.forEach((item) => mapById.set(item.id, item));
    return Array.from(mapById.values());
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

  private linkTasksToStories(
    taskElements: TaskElement[],
    storyElements: StoryElement[],
    taskDtos: PlatformTask[]
  ): void {
    if (taskElements.length === 0 || storyElements.length === 0) return;
    const taskByRef = new Map<string, TaskElement>();
    taskElements.forEach((task) => {
      if (task.uuid) {
        taskByRef.set(task.uuid, task);
      }
      if (Number.isFinite(task.backendId)) {
        taskByRef.set(String(task.backendId), task);
      }
    });
    const storyByRef = new Map<string, StoryElement>();
    storyElements.forEach((story) => {
      if (story.uuid) {
        storyByRef.set(story.uuid, story);
      }
      if (Number.isFinite(story.backendId)) {
        storyByRef.set(String(story.backendId), story);
      }
    });
    taskDtos.forEach((task) => {
      const storyRef =
        task.story?.uuid ??
        (task.story_id !== null && task.story_id !== undefined
          ? String(task.story_id)
          : null);
      if (!storyRef) return;
      const taskRef = task.uuid ?? String(task.id);
      const taskEl = taskByRef.get(taskRef);
      const storyEl = storyByRef.get(storyRef);
      if (!taskEl || !storyEl) return;
      storyEl.addTask(taskEl);
    });
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
    const key = this.getPositionKeyForElement(element);
    if (!key) return null;
    return this.positionRegistry.get(key)?.id ?? null;
  }

  public deleteElement(
    element: TaskElement | StoryElement | GoalElement
  ): Observable<void> {
    const type = this.getElementType(element);
    if (!type) return of(undefined);
    const ref = this.getBackendRef(element);
    if (!ref) {
      return this.deletePositionForElement(element);
    }
    const deleteEntity$ =
      element instanceof TaskElement
        ? this.tasksApi.deleteTask(ref)
        : element instanceof StoryElement
          ? this.storiesApi.deleteStory(ref)
          : this.goalsApi.deleteGoal(ref);
    return deleteEntity$.pipe(
      switchMap(() =>
        this.deletePositionForElement(element).pipe(
          map(() => true),
          catchError((err) => {
            console.error('Failed to delete canvas position', err);
            return of(false);
          })
        )
      ),
        tap((positionDeleted) => {
          if (positionDeleted) {
            this.removePositionByKey(element);
          }
          if (element.uuid) {
            this.removeElementFromCache(type, element.uuid);
          }
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
      const key = this.getPositionKeyFromDto(pos);
      if (!key || !pos.id) return;
      this.positionRegistry.set(key, pos);
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
      const key = this.getPositionKeyForElement(el);
      if (key) keys.add(key);
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

  private getBackendRef(
    element: TaskElement | StoryElement | GoalElement
  ): string | null {
    if (element.uuid) return element.uuid;
    if (Number.isFinite(element.backendId)) {
      return String(element.backendId);
    }
    return null;
  }

  private getPositionKeyForElement(
    element: TaskElement | StoryElement | GoalElement
  ): string | null {
    const type = this.getElementType(element);
    if (!type) return null;
    const uuidKey = element.uuid
      ? this.buildPositionKey(type, `uuid:${element.uuid}`)
      : null;
    if (uuidKey && this.positionRegistry.has(uuidKey)) {
      return uuidKey;
    }
    const backendId = this.getBackendId(element);
    if (Number.isFinite(backendId)) {
      return this.buildPositionKey(type, `id:${backendId}`);
    }
    return uuidKey;
  }

  private getPositionKeyFromDto(pos: CanvasPositionDTO): string | null {
    const type = pos.element_type;
    if (!type) return null;
    const uuid = pos.element_uuid ?? pos.object_uuid;
    if (uuid) return this.buildPositionKey(type, `uuid:${uuid}`);
    const id = pos.element_id ?? pos.object_id;
    if (!id) return null;
    return this.buildPositionKey(type, `id:${id}`);
  }

  private buildPositionKey(type: string, key: string): string {
    return `${type}:${key}`;
  }

  private deletePositionForElement(
    element: TaskElement | StoryElement | GoalElement
  ): Observable<void> {
    const key = this.getPositionKeyForElement(element);
    if (!key) return of(undefined);
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
    element: TaskElement | StoryElement | GoalElement
  ): void {
    const key = this.getPositionKeyForElement(element);
    if (key) {
      this.positionRegistry.delete(key);
    }
  }

  private removeElementFromCache(
    type: 'task' | 'story' | 'goal',
    uuid: string
  ): void {
    if (type === 'task' && this.tasksCache) {
      this.tasksCache = this.tasksCache.filter((task) => task.uuid !== uuid);
    } else if (type === 'story' && this.storiesCache) {
      this.storiesCache = this.storiesCache.filter(
        (story) => story.uuid !== uuid
      );
    } else if (type === 'goal' && this.goalsCache) {
      this.goalsCache = this.goalsCache.filter((goal) => goal.uuid !== uuid);
    }
  }
}
