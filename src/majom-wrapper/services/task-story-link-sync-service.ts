import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TasksApiService } from '../data-access/tasks-api-service.ts';
import type { PlatformTask } from '../interfaces/index.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';
import { StoryElement } from '../../features/canvas/elements/StoryElement.ts';
import { GoalElement } from '../../features/canvas/elements/GoalElement.ts';
import { CanvasClientStorage } from '../../features/canvas/core/services/CanvasClientStorage.ts';

type PersistablePlanningElement = TaskElement | StoryElement | GoalElement;

type TaskStoryLinkSyncDeps = {
  ensureElementsPersisted: (
    elements: PersistablePlanningElement[]
  ) => Observable<void>;
  getBackendRef: (element: PersistablePlanningElement) => string | null;
  getBackendId: (element: PersistablePlanningElement) => number | null;
  getCanvasId: () => string | null;
  upsertTaskCache: (task: PlatformTask) => void;
};

export class TaskStoryLinkSyncService {
  constructor(
    private readonly tasksApi: TasksApiService,
    private readonly deps: TaskStoryLinkSyncDeps
  ) {}

  public updateLink(
    task: TaskElement,
    story: StoryElement | null
  ): Observable<void> {
    const elementsToPersist = [task, story].filter(
      Boolean
    ) as PersistablePlanningElement[];
    return this.deps.ensureElementsPersisted(elementsToPersist).pipe(
      switchMap(() => {
        const taskRef = this.deps.getBackendRef(task);
        if (!taskRef) return of(undefined);
        const storyId = story ? this.deps.getBackendId(story) : null;
        if (story && !Number.isFinite(storyId)) return of(undefined);
        return this.tasksApi.patchTask(taskRef, {
          story_id: storyId ?? null,
        } as Partial<PlatformTask>);
      }),
      tap((updated) => {
        if (updated) {
          this.deps.upsertTaskCache(updated);
        }
        const canvasId = this.deps.getCanvasId();
        if (!canvasId) return;
        CanvasClientStorage.removeUnsyncedDraft(
          canvasId,
          `task-story-link:${task.uuid ?? task.id}`
        );
      }),
      catchError((err) => {
        const canvasId = this.deps.getCanvasId();
        if (canvasId) {
          CanvasClientStorage.upsertUnsyncedDraft(canvasId, {
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
}
