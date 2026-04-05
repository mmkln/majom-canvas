import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import type { CanvasDataService } from '../../../../majom-wrapper/index.ts';
import type { CanvasElementAutosaveStatusDetail } from '../canvasElementAutosaveLifecycle.ts';
import { CanvasPersistenceState } from './CanvasPersistenceState.ts';
import type { CanvasRestoreDiff } from '../../drafts/CanvasRestoreDiff.ts';
import { notify } from './NotificationService.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { isCanvasPlanningElement } from '../../elements/utils/planningElementCapabilities.ts';
import type { Scene } from '../scene/Scene.ts';

type RestoreReplayCanvasDataService = Pick<
  CanvasDataService,
  | 'queueElementUpdate'
  | 'setHabitCompletionToday'
  | 'updateHabitLifecycleStatus'
  | 'hasUnpersistedElementUpdates'
>;

type CanvasRestoreReplayCoordinatorOptions = {
  scene: Scene;
  canvasDataService: RestoreReplayCanvasDataService;
  persistenceState: CanvasPersistenceState;
  onSettled: () => void;
};

export class CanvasRestoreReplayCoordinator {
  private activeDiff: CanvasRestoreDiff | null = null;
  private pendingElementReplayKeys = new Set<string>();
  private pendingHabitReplayCount = 0;

  constructor(
    private readonly options: CanvasRestoreReplayCoordinatorOptions
  ) {}

  public reset(): void {
    this.activeDiff = null;
    this.pendingElementReplayKeys.clear();
    this.pendingHabitReplayCount = 0;
    this.options.persistenceState.clearRestoredReplayState();
  }

  public replay(restoreDiff: CanvasRestoreDiff | null): void {
    const hasReplayableWork =
      !!restoreDiff &&
      (restoreDiff.elementPatchIntents.length > 0 ||
        restoreDiff.habitMutationIntents.length > 0);

    this.activeDiff = hasReplayableWork ? restoreDiff : null;
    this.pendingElementReplayKeys.clear();
    this.pendingHabitReplayCount = 0;

    if (!restoreDiff || !hasReplayableWork) {
      this.options.persistenceState.clearRestoredReplayState();
      return;
    }

    this.options.persistenceState.startRestoredReplay();

    const elementsById = new Map(
      this.options.scene
        .getElements()
        .filter(isCanvasPlanningElement)
        .map((element) => [element.id, element] as const)
    );
    restoreDiff.elementPatchIntents.forEach((intent) => {
      const element = elementsById.get(intent.elementId);
      if (!element) return;
      const replayKey =
        this.options.canvasDataService.queueElementUpdate(element, intent.patch) ??
        `replay:${intent.elementId}`;
      this.pendingElementReplayKeys.add(replayKey);
    });

    const habitsById = new Map(
      this.options.scene
        .getElements()
        .filter((element): element is HabitElement => element instanceof HabitElement)
        .map((habit) => [habit.id, habit] as const)
    );
    restoreDiff.habitMutationIntents.forEach((intent) => {
      const habit = habitsById.get(intent.elementId);
      if (!habit) return;
      this.pendingHabitReplayCount += 1;
      const request$ =
        intent.action === 'set-completion-date'
          ? this.options.canvasDataService.setHabitCompletionToday(
              habit,
              intent.completed,
              new Date(`${intent.date}T12:00:00`)
            )
          : this.options.canvasDataService.updateHabitLifecycleStatus(
              habit,
              intent.action === 'archive' ? Status.Archived : Status.Active
            );

      request$.subscribe({
        next: () => {
          this.options.scene.changes.next();
        },
        error: (err) => {
          this.options.persistenceState.markRestoredReplayFailed();
          console.error('Failed to persist restored routine changes', err);
          notify('Failed to persist restored routine changes', 'error');
        },
        complete: () => {
          this.pendingHabitReplayCount = Math.max(
            0,
            this.pendingHabitReplayCount - 1
          );
          this.finishIfSettled();
        },
      });
    });

    this.finishIfSettled();
  }

  public retry(): void {
    if (!this.activeDiff) return;
    this.replay(this.activeDiff);
  }

  public handleElementAutosaveStatus(
    status: CanvasElementAutosaveStatusDetail,
    activeCanvasId: string | null
  ): void {
    if (!status.canvasId || status.canvasId !== activeCanvasId) return;
    if (status.status === 'failed' && this.activeDiff) {
      this.clearPendingElementReplay(status.key);
      this.options.persistenceState.markRestoredReplayFailed();
      return;
    }
    if (status.status === 'saved') {
      this.clearPendingElementReplay(status.key);
      this.finishIfSettled();
    }
  }

  private finishIfSettled(): void {
    if (!this.activeDiff) return;
    if (this.options.persistenceState.hasRestoredReplayFailed()) return;
    if (this.pendingElementReplayKeys.size > 0) return;
    if (this.pendingHabitReplayCount > 0) return;
    if (this.options.canvasDataService.hasUnpersistedElementUpdates()) return;

    this.activeDiff = null;
    this.options.persistenceState.clearRestoredReplayState();
    this.options.onSettled();
  }

  private clearPendingElementReplay(key?: string): void {
    if (key) {
      this.pendingElementReplayKeys.delete(key);
      return;
    }
    this.pendingElementReplayKeys.clear();
  }
}
