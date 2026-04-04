import type {
  CanvasDraftRepository,
  CanvasDraftSnapshot,
} from '../../drafts/CanvasDraftRepository.ts';
import {
  canvasMetaFingerprintsMatch,
} from '../../drafts/canvasMetaFingerprint.ts';
import {
  diffCanvasRestoreSnapshots,
  type CanvasRestoreDiff,
} from '../../drafts/CanvasRestoreDiff.ts';

export type ConfirmRestoreCanvasDraftAction = 'restore' | 'discard';

type ConfirmRestoreCanvasDraftInput = {
  savedAt: string;
  hasCanvasMetaChanges: boolean;
};

type CanvasDraftRecoveryCoordinatorOptions = {
  draftRepository: CanvasDraftRepository;
  confirmRestore: (
    input: ConfirmRestoreCanvasDraftInput
  ) => Promise<ConfirmRestoreCanvasDraftAction>;
  applySnapshot: (
    snapshot: CanvasDraftSnapshot,
    restoreDiff: CanvasRestoreDiff | null
  ) => void;
};

type ReconcileCanvasDraftInput = {
  canvasId: string;
  hydratedSnapshot: CanvasDraftSnapshot;
  isStillCurrent: () => boolean;
};

export class CanvasDraftRecoveryCoordinator {
  constructor(
    private readonly options: CanvasDraftRecoveryCoordinatorOptions
  ) {}

  public async reconcile(input: ReconcileCanvasDraftInput): Promise<void> {
    const localDraft = await this.options.draftRepository.load(input.canvasId);
    if (!localDraft || !input.isStillCurrent()) {
      return;
    }

    if (localDraft.fingerprint === input.hydratedSnapshot.fingerprint) {
      await this.options.draftRepository.clear(input.canvasId);
      return;
    }

    const action = await this.options.confirmRestore({
      savedAt: localDraft.savedAt,
      hasCanvasMetaChanges: !canvasMetaFingerprintsMatch(
        localDraft.baseCanvasMetaFingerprint,
        input.hydratedSnapshot.baseCanvasMetaFingerprint
      ),
    });

    if (!input.isStillCurrent()) {
      return;
    }

    if (action === 'discard') {
      await this.options.draftRepository.clear(input.canvasId);
      return;
    }

    const restoreDiff = diffCanvasRestoreSnapshots(
      input.hydratedSnapshot,
      localDraft
    );
    this.options.applySnapshot(localDraft, restoreDiff);
  }
}
