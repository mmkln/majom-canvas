import {
  BehaviorSubject,
  firstValueFrom,
  of,
  Subject,
  Subscription,
} from 'rxjs';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import type {
  KanbanBoardState,
  KanbanColumnId,
  KanbanDataSnapshot,
  KanbanRefreshReason,
  KanbanTaskPatch,
} from '../types.ts';
import {
  buildKanbanColumns,
  buildStoryGroupCollapseKey,
  createEmptyKanbanColumns,
} from '../domain/buildBoard.ts';
import { getMsUntilNextLocalMidnight } from '../domain/dateUtils.ts';
import { notify } from '../../canvas/core/services/NotificationService.ts';
import { KanbanDataService } from '../services/KanbanDataService.ts';

type RefreshRequest = {
  reason: KanbanRefreshReason;
  silent: boolean;
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unable to refresh kanban board.';
}

export class KanbanStore {
  private readonly stateSubject = new BehaviorSubject<KanbanBoardState>({
    columns: createEmptyKanbanColumns(),
    loading: false,
    error: null,
    updatedAt: null,
  });
  private readonly refreshRequests$ = new Subject<RefreshRequest>();
  private readonly subscriptions = new Subscription();
  private readonly collapsedStoryGroups = new Set<string>();
  private latestSnapshot: KanbanDataSnapshot | null = null;
  private midnightTimer: number | null = null;
  private started = false;

  constructor(private readonly dataService: KanbanDataService) {
    this.subscriptions.add(
      this.refreshRequests$
        .pipe(
          tap(({ silent }) => {
            if (!silent) {
              this.patchState({ loading: true, error: null });
            }
          }),
          switchMap((request) =>
            this.dataService.loadSnapshot(new Date()).pipe(
              map((snapshot) => ({ ok: true as const, snapshot, request })),
              catchError((error: unknown) =>
                of({ ok: false as const, error, request })
              )
            )
          )
        )
        .subscribe((result) => {
          if (!result.ok) {
            this.patchState({
              loading: false,
              error: toErrorMessage(result.error),
            });
            return;
          }
          this.latestSnapshot = result.snapshot;
          this.rebuildFromSnapshot();
        })
    );
  }

  public get state$() {
    return this.stateSubject.asObservable();
  }

  public getState(): KanbanBoardState {
    return this.stateSubject.value;
  }

  public start(): void {
    if (this.started) return;
    this.started = true;
    this.scheduleMidnightRefresh();
    this.requestRefresh('initial');
  }

  public destroy(): void {
    if (this.midnightTimer !== null) {
      window.clearTimeout(this.midnightTimer);
      this.midnightTimer = null;
    }
    this.subscriptions.unsubscribe();
    this.stateSubject.complete();
    this.refreshRequests$.complete();
  }

  public requestRefresh(
    reason: KanbanRefreshReason = 'manual',
    silent = false
  ): void {
    this.refreshRequests$.next({ reason, silent });
  }

  public patchTask(taskId: number, patch: KanbanTaskPatch): void {
    if (!this.latestSnapshot) return;

    const hasPatch =
      patch.title !== undefined ||
      patch.status !== undefined ||
      patch.priority !== undefined ||
      patch.dueDate !== undefined;
    if (!hasPatch) return;

    this.applyTaskPatchOptimistic(taskId, patch);

    this.dataService.patchTask(taskId, patch).subscribe({
      next: () => {
        this.requestRefresh('task_patch', true);
      },
      error: (error: unknown) => {
        this.patchState({ error: toErrorMessage(error) });
        this.requestRefresh('manual');
      },
    });
  }

  public toggleStoryGroup(columnId: KanbanColumnId, storyKey: string): void {
    const collapseKey = buildStoryGroupCollapseKey(columnId, storyKey);
    if (this.collapsedStoryGroups.has(collapseKey)) {
      this.collapsedStoryGroups.delete(collapseKey);
    } else {
      this.collapsedStoryGroups.add(collapseKey);
    }
    this.rebuildFromSnapshot();
  }

  public setAllStoryGroupsCollapsed(
    columnId: KanbanColumnId,
    collapsed: boolean
  ): void {
    const column = this.stateSubject.value.columns.find(
      (item) => item.id === columnId
    );
    if (!column) return;

    column.sections.storyGroups.forEach((group) => {
      const collapseKey = buildStoryGroupCollapseKey(columnId, group.storyKey);
      if (collapsed) {
        this.collapsedStoryGroups.add(collapseKey);
      } else {
        this.collapsedStoryGroups.delete(collapseKey);
      }
    });
    this.rebuildFromSnapshot();
  }

  public async patchHabitTitle(
    habitUuid: string,
    title: string
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.dataService.patchHabitTitle(habitUuid, title).pipe(first())
      );
      notify('Routine updated', 'success');
      return true;
    } catch (error: unknown) {
      this.patchState({ error: toErrorMessage(error) });
      notify('Failed to update routine', 'error');
      return false;
    }
  }

  public async toggleHabitCompleted(
    habitUuid: string,
    _completed: boolean
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.dataService
          .toggleHabitCompletion(habitUuid, new Date())
          .pipe(first())
      );
      notify('Routine updated', 'success');
      return true;
    } catch (error: unknown) {
      this.patchState({ error: toErrorMessage(error) });
      notify('Failed to update routine', 'error');
      return false;
    }
  }

  private scheduleMidnightRefresh(): void {
    if (this.midnightTimer !== null) {
      window.clearTimeout(this.midnightTimer);
      this.midnightTimer = null;
    }
    const now = new Date();
    const timeoutMs = getMsUntilNextLocalMidnight(now);
    this.midnightTimer = window.setTimeout(() => {
      this.requestRefresh('midnight');
      this.scheduleMidnightRefresh();
    }, timeoutMs);
  }

  private applyTaskPatchOptimistic(
    taskId: number,
    patch: KanbanTaskPatch
  ): void {
    if (!this.latestSnapshot) return;
    this.latestSnapshot = {
      ...this.latestSnapshot,
      now: new Date(),
      tasks: this.latestSnapshot.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
          ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {}),
        };
      }),
    };
    this.rebuildFromSnapshot();
  }

  private rebuildFromSnapshot(): void {
    if (!this.latestSnapshot) {
      this.patchState({
        columns: createEmptyKanbanColumns(),
        loading: false,
      });
      return;
    }
    const snapshot: KanbanDataSnapshot = {
      ...this.latestSnapshot,
      now: new Date(),
    };
    this.latestSnapshot = snapshot;
    this.patchState({
      columns: buildKanbanColumns(snapshot, {
        collapsedStoryGroups: this.collapsedStoryGroups,
      }),
      loading: false,
      error: null,
      updatedAt: Date.now(),
    });
  }

  private patchState(patch: Partial<KanbanBoardState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch,
    });
  }
}
