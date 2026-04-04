import { describe, expect, it, vi } from 'vitest';
import type {
  CanvasDraftRepository,
  CanvasDraftSnapshot,
} from '../../drafts/CanvasDraftRepository.ts';
import { CanvasDraftRecoveryCoordinator } from './CanvasDraftRecoveryCoordinator.ts';

function createSnapshot(
  overrides?: Partial<CanvasDraftSnapshot>
): CanvasDraftSnapshot {
  return {
    version: 2,
    canvasId: 'canvas-1',
    savedAt: '2026-04-04T10:00:00.000Z',
    baseCanvasMetaFingerprint: 'meta-v1',
    fingerprint: 'fingerprint-v1',
    nodes: [],
    connections: [],
    focusedElementId: null,
    highlightedElementIds: [],
    ...overrides,
  };
}

function createRepository(
  overrides?: Partial<CanvasDraftRepository>
): CanvasDraftRepository {
  return {
    load: vi.fn(async () => null),
    save: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('CanvasDraftRecoveryCoordinator', () => {
  it('clears matching drafts without prompting the user', async () => {
    const snapshot = createSnapshot();
    const draftRepository = createRepository({
      load: vi.fn(async () => snapshot),
    });
    const coordinator = new CanvasDraftRecoveryCoordinator({
      draftRepository,
      confirmRestore: vi.fn(async () => 'restore'),
      applySnapshot: vi.fn(),
    });

    await coordinator.reconcile({
      canvasId: 'canvas-1',
      hydratedSnapshot: snapshot,
      isStillCurrent: () => true,
    });

    expect(draftRepository.clear).toHaveBeenCalledWith('canvas-1');
  });

  it('applies the local snapshot when the user chooses restore', async () => {
    const hydratedSnapshot = createSnapshot({
      fingerprint: 'server-fingerprint',
    });
    const localDraft = createSnapshot({
      fingerprint: 'local-fingerprint',
    });
    const draftRepository = createRepository({
      load: vi.fn(async () => localDraft),
    });
    const confirmRestore = vi.fn(async () => 'restore' as const);
    const applySnapshot = vi.fn();
    const coordinator = new CanvasDraftRecoveryCoordinator({
      draftRepository,
      confirmRestore,
      applySnapshot,
    });

    await coordinator.reconcile({
      canvasId: 'canvas-1',
      hydratedSnapshot,
      isStillCurrent: () => true,
    });

    expect(confirmRestore).toHaveBeenCalledWith({
      savedAt: localDraft.savedAt,
      hasCanvasMetaChanges: false,
    });
    expect(applySnapshot).toHaveBeenCalledWith(
      localDraft,
      expect.objectContaining({
        hasStructuralChanges: false,
      })
    );
    expect(draftRepository.clear).not.toHaveBeenCalled();
  });

  it('discards the local snapshot when the user chooses current canvas state', async () => {
    const hydratedSnapshot = createSnapshot({
      fingerprint: 'server-fingerprint',
      baseCanvasMetaFingerprint: 'meta-v2',
    });
    const localDraft = createSnapshot({
      fingerprint: 'local-fingerprint',
      baseCanvasMetaFingerprint: 'meta-v1',
    });
    const draftRepository = createRepository({
      load: vi.fn(async () => localDraft),
    });
    const coordinator = new CanvasDraftRecoveryCoordinator({
      draftRepository,
      confirmRestore: vi.fn(async () => 'discard'),
      applySnapshot: vi.fn(),
    });

    await coordinator.reconcile({
      canvasId: 'canvas-1',
      hydratedSnapshot,
      isStillCurrent: () => true,
    });

    expect(draftRepository.clear).toHaveBeenCalledWith('canvas-1');
  });
});
