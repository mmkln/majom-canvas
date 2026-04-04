import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { StoriesApiService } from '../data-access/stories-api-service.ts';
import type { Goal, PlatformTask, Story } from '../interfaces/index.ts';
import type {
  StoryGoalLinkOptions,
  StoryGoalLinkResult,
} from './CanvasDataService.ts';
import { TaskElement } from '../../features/canvas/elements/TaskElement.ts';
import { StoryElement } from '../../features/canvas/elements/StoryElement.ts';
import { GoalElement } from '../../features/canvas/elements/GoalElement.ts';
import { CanvasClientStorage } from '../../features/canvas/core/services/CanvasClientStorage.ts';

type PersistablePlanningElement = TaskElement | StoryElement | GoalElement;

type StoryGoalLinkSyncDeps = {
  ensureElementsPersisted: (
    elements: PersistablePlanningElement[]
  ) => Observable<void>;
  getBackendRef: (element: PersistablePlanningElement) => string | null;
  getBackendId: (element: PersistablePlanningElement) => number | null;
  getCanvasId: () => string | null;
  upsertStoryCache: (story: Story) => void;
};

export class StoryGoalLinkSyncService {
  constructor(
    private readonly storiesApi: StoriesApiService,
    private readonly deps: StoryGoalLinkSyncDeps
  ) {}

  public updateLink(
    story: StoryElement,
    goal: GoalElement,
    options: StoryGoalLinkOptions = {}
  ): Observable<StoryGoalLinkResult> {
    const elementsToPersist = [story, goal].filter(
      Boolean
    ) as PersistablePlanningElement[];
    return this.deps.ensureElementsPersisted(elementsToPersist).pipe(
      switchMap(() => {
        const storyRef = this.deps.getBackendRef(story);
        const rawGoalId = this.deps.getBackendId(goal);
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
              this.deps.upsertStoryCache(updated);
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
        const canvasId = this.deps.getCanvasId();
        if (!canvasId) return;
        if (result.status === 'conflict') return;
        CanvasClientStorage.removeUnsyncedDraft(
          canvasId,
          `story-goal-link:${story.uuid ?? story.id}`
        );
      }),
      catchError((err) => {
        const canvasId = this.deps.getCanvasId();
        if (canvasId) {
          CanvasClientStorage.upsertUnsyncedDraft(canvasId, {
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
}
