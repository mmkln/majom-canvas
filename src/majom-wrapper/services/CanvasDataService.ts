import { concat, forkJoin, Observable, of, Subject, throwError } from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  finalize,
  groupBy,
  map,
  mergeMap,
  retry,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs/operators';
import { CanvasPositionReadDTO, CanvasPositionWriteDTO } from '../data-access/canvas-position-dto.ts';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import { GoalsApiService } from '../data-access/goals-api-service.ts';
import { CanvasRelationsApiService } from '../data-access/canvas-relations-api-service.ts';
import {
  CanvasApiService,
  CanvasSummary,
} from '../data-access/canvas-api-service.ts';
import { mapTask } from '../../features/canvas/mappers/task-mapper.ts';
import { mapStory } from '../../features/canvas/mappers/story-mapper.ts';
import { mapGoal } from '../../features/canvas/mappers/goal-mapper.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';
import { StoryElement } from '../../features/canvas/elements/StoryElement.ts';
import { GoalElement } from '../../features/canvas/elements/GoalElement.ts';
import { mapStatusToBackend } from '../utils/statusMapping.ts';
import { mapPriorityToBackend } from '../utils/priorityMapping.ts';
import type {
  CanvasRelation,
  CanvasRelationCreate,
  CanvasRelationType,
  PlatformTask,
  Story,
  Goal,
} from '../interfaces/index.ts';
import { ElementStatus } from '../../features/canvas/elements/ElementStatus.ts';
import Connection from '../../features/canvas/core/shapes/Connection.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../../features/canvas/core/interfaces/connection.ts';
import type { CanvasLoadingPlaceholder } from '../../features/canvas/core/types/canvasLoading.ts';
import { CanvasClientStorage } from '../../features/canvas/core/services/CanvasClientStorage.ts';

type ElementPatch = Partial<{
  title: string;
  description: string;
  status: ElementStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
}>;

type RelationElementType = 'task' | 'story' | 'goal';

type ElementUpdateStatus = {
  status: 'saving' | 'saved' | 'failed';
  error?: unknown;
};

type ElementUpdateRequest = {
  key: string;
  element: TaskElement | StoryElement | GoalElement;
  patch: ElementPatch;
};

type PositionSnapshot = {
  id?: string;
  canvas?: string;
  element_type: string;
  element_uuid: string;
  x: number;
  y: number;
  meta?: Record<string, any> | null;
};

export type CanvasElementsLoadState =
  | {
      phase: 'layout-ready';
      placeholders: CanvasLoadingPlaceholder[];
      focusedElementUuid: string | null;
    }
  | {
      phase: 'elements-partial-ready';
      elements: Array<TaskElement | StoryElement | GoalElement>;
      placeholders: CanvasLoadingPlaceholder[];
      focusedElementUuid: string | null;
    }
  | {
      phase: 'elements-ready';
      elements: Array<TaskElement | StoryElement | GoalElement>;
      focusedElementUuid: string | null;
    };

export type CanvasListItem = Pick<CanvasSummary, 'id' | 'name' | 'meta'>;

export type CanvasBootstrapResult = {
  canvases: CanvasListItem[];
  activeCanvas: CanvasListItem;
};

export type SceneViewportBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CanvasElementsLoadOptions = {
  viewportBounds?: SceneViewportBounds;
  viewportFirstThreshold?: number;
  viewportBufferPx?: number;
};

export type StoryGoalLinkResult =
  | { status: 'updated'; goalId: number }
  | { status: 'unchanged'; goalId: number }
  | { status: 'conflict'; currentGoalId: number; requestedGoalId: number }
  | { status: 'skipped' };

export type StoryGoalLinkOptions = {
  allowReplace?: boolean;
};

/**
 * Service to load and persist canvas elements and layout.
 */
export class CanvasDataService {
  private canvasId: string | null = null;
  private canvasName: string | null = null;
  private tasks$?: Observable<PlatformTask[]>;
  private stories$?: Observable<Story[]>;
  private goals$?: Observable<Goal[]>;
  private tasksCache: PlatformTask[] | null = null;
  private storiesCache: Story[] | null = null;
  private goalsCache: Goal[] | null = null;
  private positionRegistry: Map<string, PositionSnapshot> = new Map();
  private positionDirtyKeys = new Set<string>();
  private relationRegistry: Map<string, CanvasRelation> = new Map();
  private elementUpdate$ = new Subject<ElementUpdateRequest>();
  private elementUpdateStatus$ = new Subject<ElementUpdateStatus>();
  private pendingElementUpdates = 0;
  private failedElementUpdates = false;
  private readonly positionPrecision = 2;
  private readonly defaultViewportFirstThreshold = 250;
  private readonly defaultViewportBufferPx = 600;

  constructor(
    private tasksApi: TasksApiService,
    private storiesApi: StoriesApiService,
    private goalsApi: GoalsApiService,
    private canvasApi: CanvasApiService,
    private relationsApi: CanvasRelationsApiService
  ) {
    this.initElementUpdatePipeline();
  }

  /**
   * Load tasks, stories, goals along with their canvas positions.
   */
  public loadElements(): Observable<
    Array<TaskElement | StoryElement | GoalElement>
  > {
    return this.loadElementsProgressive({
      viewportFirstThreshold: this.defaultViewportFirstThreshold,
    }).pipe(
      filter(
        (state): state is Extract<CanvasElementsLoadState, { phase: 'elements-ready' }> =>
          state.phase === 'elements-ready'
      ),
      map((state) => state.elements),
      shareReplay(1)
    );
  }

  public loadElementsProgressive(
    options: CanvasElementsLoadOptions = {}
  ): Observable<CanvasElementsLoadState> {
    const canvasId = this.canvasId;
    if (!canvasId) {
      return of({
        phase: 'elements-ready',
        elements: [],
        focusedElementUuid: null,
      });
    }
    return this.canvasApi.fetchCanvasPositions(canvasId).pipe(
      tap((layout) => {
        this.updatePositionRegistry(layout);
      }),
      retry(2),
      switchMap((layout) => {
        const layoutPlan = this.prepareViewportLayoutPlan(layout, options);
        const focusedElementUuid = this.getFocusedElementUuid();
        const layoutState: CanvasElementsLoadState = {
          phase: 'layout-ready',
          placeholders: this.mapLayoutToLoadingPlaceholders(layout),
          focusedElementUuid,
        };
        if (!layoutPlan.enabled) {
          const elementsState$ = this.loadElementsByLayout(layout).pipe(
            map(
              (elements): CanvasElementsLoadState => ({
                phase: 'elements-ready',
                elements,
                focusedElementUuid,
              })
            )
          );
          return concat(of(layoutState), elementsState$);
        }

        const partialAndFinal$ = this.loadElementsByLayout(
          layoutPlan.visibleLayout
        ).pipe(
          switchMap((visibleElements) =>
            concat(
              of<CanvasElementsLoadState>({
                phase: 'elements-partial-ready',
                elements: visibleElements,
                placeholders: this.mapLayoutToLoadingPlaceholders(
                  layoutPlan.remainingLayout
                ),
                focusedElementUuid,
              }),
              this.loadElementsByLayout(layoutPlan.remainingLayout).pipe(
                map((remainingElements) =>
                  this.mergeLoadedElements(visibleElements, remainingElements)
                ),
                map(
                  (elements): CanvasElementsLoadState => ({
                    phase: 'elements-ready',
                    elements,
                    focusedElementUuid,
                  })
                )
              )
            )
          )
        );
        return concat(of(layoutState), partialAndFinal$);
      })
    );
  }

  private prepareViewportLayoutPlan(
    layout: CanvasPositionReadDTO[],
    options: CanvasElementsLoadOptions
  ): {
    enabled: boolean;
    visibleLayout: CanvasPositionReadDTO[];
    remainingLayout: CanvasPositionReadDTO[];
  } {
    const threshold =
      options.viewportFirstThreshold ?? this.defaultViewportFirstThreshold;
    const viewportBounds = options.viewportBounds;
    if (!viewportBounds || layout.length <= threshold) {
      return {
        enabled: false,
        visibleLayout: layout,
        remainingLayout: [],
      };
    }
    const bufferPx = options.viewportBufferPx ?? this.defaultViewportBufferPx;
    const visibleLayout: CanvasPositionReadDTO[] = [];
    const remainingLayout: CanvasPositionReadDTO[] = [];
    layout.forEach((entry) => {
      if (this.isLayoutEntryInViewport(entry, viewportBounds, bufferPx)) {
        visibleLayout.push(entry);
      } else {
        remainingLayout.push(entry);
      }
    });
    if (visibleLayout.length === 0 || remainingLayout.length === 0) {
      return {
        enabled: false,
        visibleLayout: layout,
        remainingLayout: [],
      };
    }
    return {
      enabled: true,
      visibleLayout,
      remainingLayout,
    };
  }

  private isLayoutEntryInViewport(
    entry: CanvasPositionReadDTO,
    viewport: SceneViewportBounds,
    bufferPx: number
  ): boolean {
    const bounds = this.getLayoutEntryBounds(entry);
    const minX = viewport.minX - bufferPx;
    const minY = viewport.minY - bufferPx;
    const maxX = viewport.maxX + bufferPx;
    const maxY = viewport.maxY + bufferPx;
    return !(
      bounds.maxX < minX ||
      bounds.minX > maxX ||
      bounds.maxY < minY ||
      bounds.minY > maxY
    );
  }

  private getLayoutEntryBounds(
    entry: CanvasPositionReadDTO
  ): { minX: number; minY: number; maxX: number; maxY: number } {
    const x = this.normalizeCoord(entry.x);
    const y = this.normalizeCoord(entry.y);
    if (entry.element_type === 'task') {
      return {
        minX: x,
        minY: y,
        maxX: x + TaskElement.width,
        maxY: y + TaskElement.height,
      };
    }
    if (entry.element_type === 'story') {
      const size = this.getMetaSize(entry.meta);
      const width =
        typeof size?.width === 'number' && size.width > 0
          ? this.normalizeCoord(size.width)
          : StoryElement.width;
      const height =
        typeof size?.height === 'number' && size.height > 0
          ? this.normalizeCoord(size.height)
          : StoryElement.height;
      return {
        minX: x,
        minY: y,
        maxX: x + width,
        maxY: y + height,
      };
    }
    if (entry.element_type === 'goal') {
      const scale = this.getGoalScale(entry.meta);
      const factor = scale === 3 ? 1.4 : scale === 2 ? 1 : 0.7;
      const diameter = this.normalizeCoord(GoalElement.baseDiameter * factor);
      return {
        minX: x,
        minY: y,
        maxX: x + diameter,
        maxY: y + diameter,
      };
    }
    return { minX: x, minY: y, maxX: x, maxY: y };
  }

  private loadElementsByLayout(
    layout: CanvasPositionReadDTO[]
  ): Observable<Array<TaskElement | StoryElement | GoalElement>> {
    const layoutRefs = {
      task: { ids: new Set<number>(), uuids: new Set<string>() },
      story: { ids: new Set<number>(), uuids: new Set<string>() },
      goal: { ids: new Set<number>(), uuids: new Set<string>() },
    };
    layout.forEach((pos) => {
      const type = pos.element_type;
      if (!type || !(type in layoutRefs)) return;
      const uuid = pos.element_uuid;
      if (uuid) {
        layoutRefs[type as keyof typeof layoutRefs].uuids.add(uuid);
      }
    });
    const taskIds = Array.from(layoutRefs.task.ids);
    const storyIds = Array.from(layoutRefs.story.ids);
    const goalIds = Array.from(layoutRefs.goal.ids);
    const taskUuids = Array.from(layoutRefs.task.uuids);
    const storyUuids = Array.from(layoutRefs.story.uuids);
    const goalUuids = Array.from(layoutRefs.goal.uuids);
    return this.fetchTasksByRefsCached(taskIds, taskUuids).pipe(
      switchMap((tasks) =>
        this.fetchStoriesByRefsCached(storyIds, storyUuids).pipe(
          switchMap((stories) =>
            this.fetchGoalsByRefsCached(goalIds, goalUuids).pipe(
              map((goals) => {
                const taskElements = tasks.map((t) => mapTask(t, layout));
                const storyElements = stories.map((s) => mapStory(s, layout));
                const goalElements = goals.map((g) => mapGoal(g, layout));
                this.linkTasksToStories(taskElements, storyElements, tasks);
                return [...taskElements, ...storyElements, ...goalElements];
              })
            )
          )
        )
      )
    );
  }

  private mergeLoadedElements(
    primary: Array<TaskElement | StoryElement | GoalElement>,
    secondary: Array<TaskElement | StoryElement | GoalElement>
  ): Array<TaskElement | StoryElement | GoalElement> {
    const mergedById = new Map<string, TaskElement | StoryElement | GoalElement>();
    primary.forEach((element) => mergedById.set(element.id, element));
    secondary.forEach((element) => mergedById.set(element.id, element));
    return Array.from(mergedById.values());
  }

  private mapLayoutToLoadingPlaceholders(
    layout: CanvasPositionReadDTO[]
  ): CanvasLoadingPlaceholder[] {
    const placeholders: CanvasLoadingPlaceholder[] = [];
    layout.forEach((entry) => {
      if (!entry.element_uuid) return;
      if (entry.element_type === 'task') {
        placeholders.push({
          elementType: 'task',
          elementUuid: entry.element_uuid,
          x: this.normalizeCoord(entry.x),
          y: this.normalizeCoord(entry.y),
          width: TaskElement.width,
          height: TaskElement.height,
        });
        return;
      }
      if (entry.element_type === 'story') {
        const size = this.getMetaSize(entry.meta);
        placeholders.push({
          elementType: 'story',
          elementUuid: entry.element_uuid,
          x: this.normalizeCoord(entry.x),
          y: this.normalizeCoord(entry.y),
          width:
            typeof size?.width === 'number' && size.width > 0
              ? this.normalizeCoord(size.width)
              : StoryElement.width,
          height:
            typeof size?.height === 'number' && size.height > 0
              ? this.normalizeCoord(size.height)
              : StoryElement.height,
        });
        return;
      }
      if (entry.element_type === 'goal') {
        const goalScale = this.getGoalScale(entry.meta);
        const factor = goalScale === 3 ? 1.4 : goalScale === 2 ? 1 : 0.7;
        const diameter = GoalElement.baseDiameter * factor;
        placeholders.push({
          elementType: 'goal',
          elementUuid: entry.element_uuid,
          x: this.normalizeCoord(entry.x),
          y: this.normalizeCoord(entry.y),
          width: this.normalizeCoord(diameter),
          height: this.normalizeCoord(diameter),
        });
      }
    });
    return placeholders;
  }

  private getGoalScale(meta: Record<string, any> | null | undefined): 1 | 2 | 3 {
    const value = meta ? meta.goalScale : undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
    const rounded = Math.round(value);
    if (rounded <= 1) return 1;
    if (rounded >= 3) return 3;
    return 2;
  }

  public loadRelations(): Observable<Connection[]> {
    if (!this.canvasId) {
      return of([]);
    }
    return this.relationsApi.fetchCanvasRelations(this.canvasId).pipe(
      tap((relations) => this.updateRelationRegistry(relations)),
      map((relations) => this.mapRelationsToConnections(relations))
    );
  }

  public updateCanvasRelations(
    connections: IConnection[],
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): Observable<void> {
    if (!this.canvasId) return of(undefined);
    const elementRefs = this.buildElementRefMap(elements);
    const activeKeys = new Set<string>();
    const creates: CanvasRelationCreate[] = [];

    connections.forEach((conn) => {
      const relationType = this.mapRelationTypeToBackend(conn.relationType);
      if (!relationType) return;
      const fromRef = this.resolveElementRef(conn.fromId, elementRefs);
      const toRef = this.resolveElementRef(conn.toId, elementRefs);
      if (!fromRef || !toRef) return;
      const key = this.buildRelationKey({
        from_type: fromRef.type,
        from_uuid: fromRef.uuid,
        to_type: toRef.type,
        to_uuid: toRef.uuid,
        relation_type: relationType,
      });
      if (activeKeys.has(key)) return;
      activeKeys.add(key);
      if (!this.relationRegistry.has(key) && this.canvasId) {
        creates.push({
          canvas: this.canvasId,
          from_type: fromRef.type,
          from_uuid: fromRef.uuid,
          to_type: toRef.type,
          to_uuid: toRef.uuid,
          relation_type: relationType,
          meta: null,
        });
      }
    });

    const deletes: string[] = [];
    this.relationRegistry.forEach((relation, key) => {
      if (!activeKeys.has(key)) {
        deletes.push(relation.id);
      }
    });

    const delete$ = deletes.length
      ? this.relationsApi
        .batchDelete(deletes)
        .pipe(tap(() => this.removeRelationsById(deletes)))
      : of(undefined);
    return delete$.pipe(
      switchMap(() =>
        creates.length
          ? this.relationsApi
            .batchCreate(creates)
            .pipe(tap((created) => this.mergeRelationRegistry(created)))
          : of([])
      ),
      map(() => undefined)
    );
  }

  public hasRelationChanges(
    connections: IConnection[],
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): boolean {
    if (!this.canvasId) return connections.length > 0;
    const elementRefs = this.buildElementRefMap(elements);
    const activeKeys = new Set<string>();
    connections.forEach((conn) => {
      const relationType = this.mapRelationTypeToBackend(conn.relationType);
      if (!relationType) return;
      const fromRef = this.resolveElementRef(conn.fromId, elementRefs);
      const toRef = this.resolveElementRef(conn.toId, elementRefs);
      if (!fromRef || !toRef) return;
      const key = this.buildRelationKey({
        from_type: fromRef.type,
        from_uuid: fromRef.uuid,
        to_type: toRef.type,
        to_uuid: toRef.uuid,
        relation_type: relationType,
      });
      activeKeys.add(key);
    });

    for (const key of activeKeys) {
      if (!this.relationRegistry.has(key)) return true;
    }
    for (const key of this.relationRegistry.keys()) {
      if (!activeKeys.has(key)) return true;
    }
    return false;
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
    due_date: string | null;
  }> {
    const payload: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      due_date: string | null;
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

  private serializeDueDate(
    dueDate: Date | null | undefined
  ): string | null | undefined {
    if (dueDate === undefined) return undefined;
    if (dueDate === null) return null;
    if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
      return null;
    }
    return dueDate.toISOString();
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
        if (req.element instanceof TaskElement && 'dueDate' in req.patch) {
          const dueDate = this.serializeDueDate(req.patch.dueDate);
          if (dueDate !== undefined) {
            payload.due_date = dueDate;
          }
        }
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
        const activeCanvasId = this.canvasId;
        if (activeCanvasId) {
          CanvasClientStorage.removeUnsyncedDraft(
            activeCanvasId,
            this.getElementDraftId(req)
          );
        }
      }),
      map(() => undefined),
      catchError((err) => {
        this.failedElementUpdates = true;
        this.queueElementUnsyncedDraft(req, err);
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
        if (this.canvasId) {
          CanvasClientStorage.removeUnsyncedDraft(
            this.canvasId,
            `task-story-link:${task.uuid ?? task.id}`
          );
        }
      }),
      catchError((err) => {
        if (this.canvasId) {
          CanvasClientStorage.upsertUnsyncedDraft(this.canvasId, {
            id: `task-story-link:${task.uuid ?? task.id}`,
            kind: 'task-story-link',
            payload: {
              taskId: task.id,
              taskUuid: task.uuid ?? null,
              storyId: story?.id ?? null,
              storyUuid: story?.uuid ?? null,
            },
          });
        }
        return throwError(() => err);
      }),
      map(() => undefined)
    );
  }

  public updateStoryGoalLink(
    story: StoryElement,
    goal: GoalElement,
    options: StoryGoalLinkOptions = {}
  ): Observable<StoryGoalLinkResult> {
    const elementsToPersist = [story, goal].filter(Boolean) as Array<
      TaskElement | StoryElement | GoalElement
    >;
    return this.ensureElementsPersisted(elementsToPersist).pipe(
      switchMap(() => {
        const storyRef = this.getBackendRef(story);
        const rawGoalId = this.getBackendId(goal);
        if (!storyRef || !Number.isFinite(rawGoalId)) {
          return of<StoryGoalLinkResult>({ status: 'skipped' });
        }
        const goalId = Number(rawGoalId);
        const currentGoalId = Number.isFinite(story.goalBackendId)
          ? Number(story.goalBackendId)
          : null;
        if (
          Number.isFinite(currentGoalId) &&
          currentGoalId !== goalId &&
          !options.allowReplace
        ) {
          return of<StoryGoalLinkResult>({
            status: 'conflict',
            currentGoalId: Number(currentGoalId),
            requestedGoalId: goalId,
          });
        }
        if (currentGoalId === goalId) {
          return of<StoryGoalLinkResult>({
            status: 'unchanged',
            goalId,
          });
        }
        return this.storiesApi
          .patchStory(storyRef, { goal_id: goalId } as Partial<Story>)
          .pipe(
            tap((updated) => {
              this.upsertStoryCache(updated);
              story.goalBackendId =
                updated.goal?.id ?? updated.goal_id ?? goalId;
            }),
            map(
              (): StoryGoalLinkResult => ({
                status: 'updated',
                goalId,
              })
            ),
            catchError((err) => {
              const status = (err as { status?: number } | null)?.status;
              if (status !== 409) {
                return throwError(() => err);
              }
              const payload = err as {
                current_goal_id?: unknown;
                currentGoalId?: unknown;
                goal_id?: unknown;
                goalId?: unknown;
                error?: {
                  current_goal_id?: unknown;
                  currentGoalId?: unknown;
                  goal_id?: unknown;
                  goalId?: unknown;
                };
              };
              const currentGoalRaw =
                payload.error?.current_goal_id ??
                payload.error?.currentGoalId ??
                payload.error?.goal_id ??
                payload.error?.goalId ??
                payload.current_goal_id ??
                payload.currentGoalId ??
                payload.goal_id ??
                payload.goalId;
              const serverGoalId =
                typeof currentGoalRaw === 'number' &&
                Number.isFinite(currentGoalRaw)
                  ? currentGoalRaw
                  : null;
              if (Number.isFinite(serverGoalId)) {
                story.goalBackendId = Number(serverGoalId);
              }
              return of<StoryGoalLinkResult>({
                status: 'conflict',
                currentGoalId:
                  serverGoalId ??
                  (Number.isFinite(currentGoalId)
                    ? Number(currentGoalId)
                    : goalId),
                requestedGoalId: goalId,
              });
            })
        );
      }),
      tap((result) => {
        if (!this.canvasId) return;
        if (result.status === 'conflict') return;
        CanvasClientStorage.removeUnsyncedDraft(
          this.canvasId,
          `story-goal-link:${story.uuid ?? story.id}`
        );
      }),
      catchError((err) => {
        if (this.canvasId) {
          CanvasClientStorage.upsertUnsyncedDraft(this.canvasId, {
            id: `story-goal-link:${story.uuid ?? story.id}`,
            kind: 'story-goal-link',
            payload: {
              storyId: story.id,
              storyUuid: story.uuid ?? null,
              goalId: goal.id,
              goalUuid: goal.uuid ?? null,
            },
          });
        }
        return throwError(() => err);
      })
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

  public bootstrapCanvas(): Observable<CanvasBootstrapResult> {
    // TODO(snapshot-cache): replace bootstrap chain with a single backend snapshot
    // endpoint and per-canvas client cache (etag/version-based invalidation).
    return this.canvasApi.loadCanvases().pipe(
      switchMap((canvases) => {
        if (canvases.length > 0) {
          const preferredCanvasId = CanvasClientStorage.getLastOpenedCanvasId();
          const selectedCanvas =
            canvases.find((canvas) => canvas.id === preferredCanvasId) ??
            canvases[0];
          const activeCanvas = {
            id: selectedCanvas.id,
            name: selectedCanvas.name,
            meta: selectedCanvas.meta,
          };
          this.setActiveCanvas(activeCanvas);
          return of({
            canvases: canvases.map((canvas) => ({
              id: canvas.id,
              name: canvas.name,
              meta: canvas.meta,
            })),
            activeCanvas,
          });
        }
        return this.canvasApi.createCanvas('New canvas').pipe(
          map((created) => {
            const activeCanvas = {
              id: created.id,
              name: created.name,
              meta: created.meta,
            };
            this.setActiveCanvas(activeCanvas);
            return {
              canvases: [activeCanvas],
              activeCanvas,
            };
          })
        );
      })
    );
  }

  public getFocusedElementUuid(): string | null {
    for (const snapshot of this.positionRegistry.values()) {
      const isPlanningType =
        snapshot.element_type === 'task' ||
        snapshot.element_type === 'story' ||
        snapshot.element_type === 'goal';
      if (!isPlanningType) continue;
      if (!snapshot.meta || snapshot.meta.focused !== true) continue;
      return snapshot.element_uuid;
    }
    return null;
  }

  public getHighlightedElementUuids(): string[] {
    const highlighted: string[] = [];
    for (const snapshot of this.positionRegistry.values()) {
      const isPlanningType =
        snapshot.element_type === 'task' ||
        snapshot.element_type === 'story' ||
        snapshot.element_type === 'goal';
      if (!isPlanningType) continue;
      if (!snapshot.meta || snapshot.meta.highlighted !== true) continue;
      highlighted.push(snapshot.element_uuid);
    }
    return highlighted;
  }

  public loadCanvasDetails(id: string): Observable<CanvasSummary> {
    return this.canvasApi.loadCanvas(id).pipe(
      map((canvas) => {
        this.setActiveCanvas(canvas);
        return canvas;
      })
    );
  }

  public clearElementCache(): void {
    this.tasksCache = null;
    this.storiesCache = null;
    this.goalsCache = null;
    this.tasks$ = undefined;
    this.stories$ = undefined;
    this.goals$ = undefined;
    this.positionRegistry.clear();
    this.positionDirtyKeys.clear();
    this.relationRegistry.clear();
  }

  public markPositionsDirty(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): void {
    if (elements.length === 0) return;
    elements.forEach((el) => {
      const key = this.getPositionKeyForElement(el);
      if (key) {
        this.positionDirtyKeys.add(key);
      }
    });
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
        const dueDate = this.serializeDueDate(el.dueDate);
        if (dueDate !== undefined) {
          payload.due_date = dueDate;
        }
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
    const cachedCombined = this.dedupeById([...cachedByIds, ...cachedByUuids]);
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
    const cachedCombined = this.dedupeById([...cachedByIds, ...cachedByUuids]);
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
    const cachedCombined = this.dedupeById([...cachedByIds, ...cachedByUuids]);
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

  public setActiveCanvas(
    canvas: Pick<CanvasSummary, 'id' | 'name' | 'meta'>
  ): void {
    if (this.canvasId !== canvas.id) {
      this.positionRegistry.clear();
      this.positionDirtyKeys.clear();
      this.relationRegistry.clear();
    }
    this.canvasId = canvas.id;
    this.canvasName = canvas.name;
    CanvasClientStorage.setLastOpenedCanvasId(canvas.id);
  }

  private getElementDraftId(req: ElementUpdateRequest): string {
    return `element-patch:${req.key}`;
  }

  private queueElementUnsyncedDraft(
    req: ElementUpdateRequest,
    error: unknown
  ): void {
    if (!this.canvasId) return;
    const elementType =
      req.element instanceof TaskElement
        ? 'task'
        : req.element instanceof StoryElement
          ? 'story'
          : 'goal';
    CanvasClientStorage.upsertUnsyncedDraft(this.canvasId, {
      id: this.getElementDraftId(req),
      kind: 'element-patch',
      payload: {
        elementType,
        elementId: req.element.id,
        elementUuid: req.element.uuid ?? null,
        patch: req.patch,
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : null,
      },
    });
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
  ): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
    return this.canvasApi.createCanvas(name).pipe(
      map((canvas) => {
        this.setActiveCanvas(canvas);
        return canvas;
      })
    );
  }

  public ensureCanvas(): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
    return this.canvasApi.loadCanvases().pipe(
      switchMap((canvases) => {
        if (canvases.length > 0) {
          const canvas = canvases[0];
          return of({ id: canvas.id, name: canvas.name, meta: canvas.meta });
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
  ): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
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

  public updateCanvasFavorite(input: {
    id: string;
    name?: string;
    isFavorite: boolean;
    meta?: Record<string, unknown> | null;
  }): Observable<Pick<CanvasSummary, 'id' | 'name' | 'meta'>> {
    const sourceCanvas$ =
      input.name !== undefined && input.meta !== undefined
        ? of({ name: input.name, meta: input.meta })
        : this.canvasApi.loadCanvas(input.id).pipe(
            map((canvas) => ({
              name: canvas.name,
              meta: canvas.meta ?? null,
            })),
            catchError(() =>
              of({
                name: input.name ?? 'New canvas',
                meta: input.meta ?? null,
              })
            )
          );

    return sourceCanvas$.pipe(
      switchMap((sourceCanvas) => {
        const safeName =
          typeof sourceCanvas.name === 'string' &&
          sourceCanvas.name.trim().length > 0
            ? sourceCanvas.name.trim()
            : 'New canvas';
        const baseMeta: Record<string, unknown> =
          sourceCanvas.meta &&
          typeof sourceCanvas.meta === 'object' &&
          !Array.isArray(sourceCanvas.meta)
            ? { ...sourceCanvas.meta }
            : {};
        baseMeta.favorite = input.isFavorite;
        return this.canvasApi.updateCanvas(input.id, safeName, baseMeta);
      }),
      map((updated) => {
        if (this.canvasId === updated.id) {
          this.setActiveCanvas(updated);
        }
        return updated;
      })
    );
  }

  public deleteCanvas(id: string): Observable<void> {
    return this.canvasApi.deleteCanvas(id).pipe(
      tap(() => {
        if (this.canvasId !== id) return;
        this.canvasId = null;
        this.canvasName = null;
        this.positionRegistry.clear();
        this.positionDirtyKeys.clear();
        this.relationRegistry.clear();
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
      const snapshot = this.positionRegistry.get(key);
      if (!snapshot || !snapshot.id) {
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
  public filterPositionUpdates(
    changes: CanvasPositionWriteDTO[]
  ): CanvasPositionWriteDTO[] {
    if (changes.length === 0) return [];
    if (this.positionDirtyKeys.size === 0) {
      return changes.filter((pos) => this.isLayoutEntryChanged(pos));
    }
    return changes.filter((pos) => {
      const key = this.getPositionKeyFromWrite(pos);
      if (!key) return false;
      if (!this.positionRegistry.has(key)) return true;
      if (!this.positionDirtyKeys.has(key)) return false;
      const changed = this.isLayoutEntryChanged(pos);
      if (!changed) {
        this.positionDirtyKeys.delete(key);
      }
      return changed;
    });
  }

  public updateLayoutBatch(changes: CanvasPositionWriteDTO[]): Observable<void> {
    if (changes.length === 0) return of(undefined);
    const normalizedChanges = this.normalizePositionChanges(changes);
    if (this.canvasId) {
      return this.canvasApi
        .saveCanvasPositions(this.canvasId, normalizedChanges)
        .pipe(tap(() => this.mergePositionUpdates(normalizedChanges)));
    }
    return this.canvasApi.createCanvas().pipe(
      switchMap(({ id }) => {
        this.canvasId = id;
        return this.canvasApi
          .saveCanvasPositions(id, normalizedChanges)
          .pipe(tap(() => this.mergePositionUpdates(normalizedChanges)));
      })
    );
  }

  private isLayoutEntryChanged(pos: CanvasPositionWriteDTO): boolean {
    const key = this.getPositionKeyFromWrite(pos);
    if (!key) return false;
    const existing = this.positionRegistry.get(key);
    if (!existing) return true;
    const xChanged =
      pos.x !== undefined &&
      this.normalizeCoord(pos.x) !== this.normalizeCoord(existing.x);
    const yChanged =
      pos.y !== undefined &&
      this.normalizeCoord(pos.y) !== this.normalizeCoord(existing.y);
    const metaChanged = this.isMetaSizeChanged(pos.meta, existing.meta);
    const metaScaleChanged = this.isMetaValueChanged(
      pos.meta,
      existing.meta,
      'goalScale'
    );
    const metaFocusChanged = this.isMetaValueChanged(
      pos.meta,
      existing.meta,
      'focused'
    );
    const metaHighlightChanged = this.isMetaValueChanged(
      pos.meta,
      existing.meta,
      'highlighted'
    );
    return (
      xChanged ||
      yChanged ||
      metaChanged ||
      metaScaleChanged ||
      metaFocusChanged ||
      metaHighlightChanged
    );
  }

  private mergePositionUpdates(changes: CanvasPositionWriteDTO[]): void {
    if (changes.length === 0) return;
    changes.forEach((pos) => {
      const key = this.getPositionKeyFromWrite(pos);
      if (!key) return;
      const existing = this.positionRegistry.get(key);
      if (!existing && (pos.x === undefined || pos.y === undefined)) {
        return;
      }
      const nextX =
        pos.x !== undefined
          ? this.normalizeCoord(pos.x)
          : existing?.x ?? 0;
      const nextY =
        pos.y !== undefined
          ? this.normalizeCoord(pos.y)
          : existing?.y ?? 0;
      this.positionRegistry.set(key, {
        id: existing?.id,
        canvas: existing?.canvas ?? this.canvasId ?? undefined,
        element_type: pos.element_type,
        element_uuid: pos.element_uuid,
        x: nextX,
        y: nextY,
        meta: this.normalizeMeta(pos.meta ?? existing?.meta ?? null),
      });
      this.positionDirtyKeys.delete(key);
    });
  }

  private updatePositionRegistry(layout: CanvasPositionReadDTO[]): void {
    this.positionRegistry.clear();
    this.positionDirtyKeys.clear();
    layout.forEach((pos) => {
      const key = this.getPositionKeyFromDto(pos);
      if (!key || !pos.id) return;
      this.positionRegistry.set(key, {
        ...pos,
        x: this.normalizeCoord(pos.x),
        y: this.normalizeCoord(pos.y),
        meta: this.normalizeMeta(pos.meta),
      });
    });
  }

  private updateRelationRegistry(relations: CanvasRelation[]): void {
    this.relationRegistry.clear();
    relations.forEach((relation) => {
      const key = this.buildRelationKey(relation);
      this.relationRegistry.set(key, relation);
    });
  }

  private mergeRelationRegistry(relations: CanvasRelation[]): void {
    relations.forEach((relation) => {
      const key = this.buildRelationKey(relation);
      this.relationRegistry.set(key, relation);
    });
  }

  private removeRelationsById(ids: string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    Array.from(this.relationRegistry.entries()).forEach(([key, relation]) => {
      if (idSet.has(relation.id)) {
        this.relationRegistry.delete(key);
      }
    });
  }

  private removePositionsFromRegistry(positionIds: string[]): void {
    if (positionIds.length === 0) return;
    const idSet = new Set(positionIds);
    Array.from(this.positionRegistry.entries()).forEach(([key, pos]) => {
      if (pos.id && idSet.has(pos.id)) {
        this.positionRegistry.delete(key);
        this.positionDirtyKeys.delete(key);
      }
    });
  }

  private mapRelationsToConnections(relations: CanvasRelation[]): Connection[] {
    const connections: Connection[] = [];
    relations.forEach((relation) => {
      const relationType = this.mapRelationTypeToConnection(
        relation.relation_type
      );
      if (!relationType) return;
      connections.push(
        new Connection(
          relation.from_uuid,
          relation.to_uuid,
          relation.id,
          undefined,
          relationType
        )
      );
    });
    return connections;
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
  ): RelationElementType | null {
    if (element instanceof TaskElement) return 'task';
    if (element instanceof StoryElement) return 'story';
    if (element instanceof GoalElement) return 'goal';
    return null;
  }

  private buildRelationKey(relation: {
    from_type: string;
    from_uuid: string;
    to_type: string;
    to_uuid: string;
    relation_type: string;
  }): string {
    return `${relation.from_type}:${relation.from_uuid}->${relation.to_type}:${relation.to_uuid}:${relation.relation_type}`;
  }

  private mapRelationTypeToConnection(
    relationType: CanvasRelationType
  ): ConnectionRelationType | null {
    switch (relationType) {
      case 'parent_child':
        return ConnectionRelationType.ParentChild;
      case 'blocks':
        return ConnectionRelationType.Blocks;
      case 'leads_to':
        return ConnectionRelationType.LeadsTo;
      case 'relates_to':
        return ConnectionRelationType.RelatesTo;
      default:
        return null;
    }
  }

  private mapRelationTypeToBackend(
    relationType: ConnectionRelationType
  ): CanvasRelationType | null {
    switch (relationType) {
      case ConnectionRelationType.ParentChild:
        return 'parent_child';
      case ConnectionRelationType.Blocks:
        return 'blocks';
      case ConnectionRelationType.LeadsTo:
        return 'leads_to';
      case ConnectionRelationType.RelatesTo:
        return 'relates_to';
      default:
        return null;
    }
  }

  private buildElementRefMap(
    elements: Array<TaskElement | StoryElement | GoalElement>
  ): Map<string, { uuid: string; type: RelationElementType }> {
    const map = new Map<string, { uuid: string; type: RelationElementType }>();
    elements.forEach((element) => {
      const type = this.getElementType(element);
      if (!type || !element.uuid) return;
      map.set(element.uuid, { uuid: element.uuid, type });
      map.set(element.id, { uuid: element.uuid, type });
    });
    return map;
  }

  private resolveElementRef(
    ref: string,
    map: Map<string, { uuid: string; type: RelationElementType }>
  ): { uuid: string; type: RelationElementType } | null {
    return map.get(ref) ?? null;
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
    if (!type || !element.uuid) return null;
    return this.buildPositionKey(type, `uuid:${element.uuid}`);
  }

  private getPositionKeyFromWrite(pos: CanvasPositionWriteDTO): string | null {
    if (!pos.element_type || !pos.element_uuid) return null;
    return this.buildPositionKey(pos.element_type, `uuid:${pos.element_uuid}`);
  }

  private getPositionKeyFromDto(pos: CanvasPositionReadDTO): string | null {
    const type = pos.element_type;
    if (!type) return null;
    const uuid = pos.element_uuid;
    if (!uuid) return null;
    return this.buildPositionKey(type, `uuid:${uuid}`);
  }

  private normalizeCoord(value: number): number {
    const factor = 10 ** this.positionPrecision;
    return Math.round(value * factor) / factor;
  }

  private normalizePositionChanges(
    changes: CanvasPositionWriteDTO[]
  ): CanvasPositionWriteDTO[] {
    return changes.map((pos) => ({
      ...pos,
      x: pos.x !== undefined ? this.normalizeCoord(pos.x) : pos.x,
      y: pos.y !== undefined ? this.normalizeCoord(pos.y) : pos.y,
      meta: this.normalizeMeta(pos.meta),
    }));
  }

  private normalizeMeta(
    meta: Record<string, any> | null | undefined
  ): Record<string, any> | null {
    const base =
      meta && typeof meta === 'object' ? this.normalizeMetaSize(meta) ?? meta : {};
    const next =
      base && typeof base === 'object'
        ? { ...(base as Record<string, any>) }
        : {};
    next.focused = next.focused === true;
    next.highlighted = next.highlighted === true;
    return next;
  }

  private normalizeMetaSize(
    meta: Record<string, any> | null | undefined
  ): Record<string, any> | null | undefined {
    if (!meta) return meta;
    let changed = false;
    const next = { ...meta };
    (['width', 'height', 'w', 'h'] as const).forEach((key) => {
      const value = meta[key];
      if (typeof value !== 'number') return;
      const normalized = this.normalizeCoord(value);
      if (normalized !== value) {
        changed = true;
      }
      next[key] = normalized;
    });
    return changed ? next : meta;
  }

  private isMetaSizeChanged(
    meta: Record<string, any> | null | undefined,
    existingMeta: Record<string, any> | null | undefined
  ): boolean {
    if (meta === undefined) return false;
    const next = this.getMetaSize(meta);
    if (!next) return false;
    const prev = this.getMetaSize(existingMeta);
    if (next.width !== undefined) {
      if (prev?.width === undefined) return true;
      if (
        this.normalizeCoord(next.width) !== this.normalizeCoord(prev.width)
      ) {
        return true;
      }
    }
    if (next.height !== undefined) {
      if (prev?.height === undefined) return true;
      if (
        this.normalizeCoord(next.height) !== this.normalizeCoord(prev.height)
      ) {
        return true;
      }
    }
    return false;
  }

  private isMetaValueChanged(
    meta: Record<string, any> | null | undefined,
    existingMeta: Record<string, any> | null | undefined,
    key: string
  ): boolean {
    if (meta === undefined) return false;
    const next = meta ? meta[key] : undefined;
    if (next === undefined) return false;
    const prev = existingMeta ? existingMeta[key] : undefined;
    return next !== prev;
  }

  private getMetaSize(
    meta: Record<string, any> | null | undefined
  ): { width?: number; height?: number } | null {
    if (!meta) return null;
    const width =
      typeof meta.width === 'number'
        ? meta.width
        : typeof meta.w === 'number'
          ? meta.w
          : undefined;
    const height =
      typeof meta.height === 'number'
        ? meta.height
        : typeof meta.h === 'number'
          ? meta.h
          : undefined;
    if (width === undefined && height === undefined) return null;
    return { width, height };
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
      this.positionDirtyKeys.delete(key);
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
