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
    return forkJoin({
      tasks: this.loadTasksCached(),
      stories: this.loadStoriesCached(),
      goals: this.loadGoalsCached(),
      layout: this.canvasId
        ? this.canvasApi.fetchCanvasPositions(this.canvasId)
        : of([]),
    }).pipe(
      retry(2),
      map(({ tasks, stories, goals, layout }) => {
        const targetCanvas = this.canvasId;
        const effectiveLayout = targetCanvas
          ? layout.filter((pos) => pos.canvas === targetCanvas)
          : layout;
        const layoutIds = {
          task: new Set<number>(),
          story: new Set<number>(),
          goal: new Set<number>(),
        };
        effectiveLayout.forEach((pos) => {
          const type = pos.element_type;
          const id = pos.element_id ?? pos.object_id;
          if (!type || !id) return;
          if (type in layoutIds) {
            layoutIds[type as keyof typeof layoutIds].add(id);
          }
        });
        const firstCanvas = effectiveLayout[0]?.canvas;
        if (firstCanvas) {
          this.canvasId = firstCanvas;
        }
        const elems: Array<TaskElement | StoryElement | GoalElement> = [];
        elems.push(
          ...tasks
            .filter((t) => layoutIds.task.has(t.id))
            .map((t) => mapTask(t, effectiveLayout))
        );
        elems.push(
          ...stories
            .filter((s) => layoutIds.story.has(s.id))
            .map((s) => mapStory(s, effectiveLayout))
        );
        elems.push(
          ...goals
            .filter((g) => layoutIds.goal.has(g.id))
            .map((g) => mapGoal(g, effectiveLayout))
        );
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
    const type = element instanceof TaskElement
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
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.status !== undefined) {
      payload.status = mapStatusToBackend(patch.status);
    }
    if (patch.priority !== undefined) {
      payload.priority = mapPriorityToBackend(patch.priority);
    }
    return payload;
  }

  private persistElementUpdate(
    req: ElementUpdateRequest
  ): Observable<void> {
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
    const elementsToPersist = [task, story].filter(
      Boolean
    ) as Array<TaskElement | StoryElement | GoalElement>;
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
        this.canvasId = canvas.id;
        this.canvasName = canvas.name;
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

  private loadTasksCached(force: boolean = false): Observable<PlatformTask[]> {
    if (!force && this.tasksCache) return of(this.tasksCache);
    if (!force && this.tasks$) return this.tasks$;
    this.tasks$ = this.tasksApi.getTasks().pipe(
      map((tasks) => {
        this.tasksCache = tasks;
        return tasks;
      }),
      shareReplay(1)
    );
    return this.tasks$;
  }

  private loadStoriesCached(force: boolean = false): Observable<Story[]> {
    if (!force && this.storiesCache) return of(this.storiesCache);
    if (!force && this.stories$) return this.stories$;
    this.stories$ = this.storiesApi.getStories().pipe(
      map((stories) => {
        this.storiesCache = stories;
        return stories;
      }),
      shareReplay(1)
    );
    return this.stories$;
  }

  private loadGoalsCached(force: boolean = false): Observable<Goal[]> {
    if (!force && this.goalsCache) return of(this.goalsCache);
    if (!force && this.goals$) return this.goals$;
    this.goals$ = this.goalsApi.getGoals().pipe(
      map((goals) => {
        this.goalsCache = goals;
        return goals;
      }),
      shareReplay(1)
    );
    return this.goals$;
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
        this.canvasId = canvas.id;
        this.canvasName = canvas.name;
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
        this.canvasId = canvas.id;
        this.canvasName = canvas.name;
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
          this.canvasId = updated.id;
          this.canvasName = updated.name;
          return updated;
        })
      );
    }
    return this.ensureCanvas().pipe(
      switchMap((canvas) => this.canvasApi.updateCanvas(canvas.id, safeName)),
      map((updated) => {
        this.canvasId = updated.id;
        this.canvasName = updated.name;
        return updated;
      })
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
}
