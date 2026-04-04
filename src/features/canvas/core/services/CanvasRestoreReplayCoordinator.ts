import { Status } from '../../../../majom-wrapper/interfaces/index.ts';
import type { CanvasDataService } from '../../../../majom-wrapper/index.ts';
import type { CanvasElementAutosaveStatusDetail } from '../canvasElementAutosaveLifecycle.ts';
import { canvasPersistenceState } from './CanvasPersistenceState.ts';
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
  onSettled: () => void;
};

export class CanvasRestoreReplayCoordinator {
  private activeDiff: CanvasRestoreDiff | null = null;
  private pendingElementReplay = false;
  private pendingHabitReplayCount = 0;

  constructor(
    private readonly options: CanvasRestoreReplayCoordinatorOptions
  ) {}

  public reset(): void {
    this.activeDiff = null;
    this.pendingElementReplay = false;
    this.pendingHabitReplayCount = 0;
    canvasPersistenceState.clearRestoredReplayState();
  }

  public replay(restoreDiff: CanvasRestoreDiff | null): void {
    const hasReplayableWork =
      !!restoreDiff &&
      (restoreDiff.elementPatchIntents.length > 0 ||
        restoreDiff.habitMutationIntents.length > 0);

    this.activeDiff = hasReplayableWork ? restoreDiff : null;
    this.pendingElementReplay = false;
    this.pendingHabitReplayCount = 0;

    if (!restoreDiff || !hasReplayableWork) {
      canvasPersistenceState.clearRestoredReplayState();
      return;
    }

    canvasPersistenceState.startRestoredReplay();

    const elementsById = new Map(
      this.options.scene
        .getElements()
        .filter(isCanvasPlanningElement)
        .map((element) => [element.id, element] as const)
    );
    restoreDiff.elementPatchIntents.forEach((intent) => {
      const element = elementsById.get(intent.elementId);
      if (!element) return;
      this.pendingElementReplay = true;
      this.options.canvasDataService.queueElementUpdate(element, intent.patch);
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
          canvasPersistenceState.markRestoredReplayFailed();
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
      this.pendingElementReplay = false;
      canvasPersistenceState.markRestoredReplayFailed();
      return;
    }
    if (status.status === 'saved') {
      this.pendingElementReplay = false;
      this.finishIfSettled();
    }
  }

  private finishIfSettled(): void {
    if (!this.activeDiff) return;
    if (canvasPersistenceState.hasRestoredReplayFailed()) return;
    if (this.pendingElementReplay) return;
    if (this.pendingHabitReplayCount > 0) return;
    if (this.options.canvasDataService.hasUnpersistedElementUpdates()) return;

    this.activeDiff = null;
    canvasPersistenceState.clearRestoredReplayState();
    this.options.onSettled();
  }
}
