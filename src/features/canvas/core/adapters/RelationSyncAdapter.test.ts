import { Observable, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { IConnection } from '../interfaces/connection.ts';
import { RelationSyncAdapter } from './RelationSyncAdapter.ts';

type DataServiceStub = {
  hasRelationChanges: ReturnType<typeof vi.fn>;
  updateCanvasRelations: ReturnType<typeof vi.fn>;
};

function createAdapter(stub?: Partial<DataServiceStub>) {
  const dataService: DataServiceStub = {
    hasRelationChanges: vi.fn(() => true),
    updateCanvasRelations: vi.fn(() => of(undefined)),
    ...stub,
  };
  const notifyError = vi.fn();
  const logError = vi.fn();
  const queueUnsyncedDraft = vi.fn();
  const connections: IConnection[] = [];
  const getConnections = () => connections;
  const adapter = new RelationSyncAdapter(
    dataService,
    getConnections,
    notifyError,
    logError,
    queueUnsyncedDraft
  );
  return {
    adapter,
    dataService,
    notifyError,
    logError,
    queueUnsyncedDraft,
    connections,
  };
}

describe('RelationSyncAdapter', () => {
  it('skips update when there are no relation changes', async () => {
    const { adapter, dataService } = createAdapter({
      hasRelationChanges: vi.fn(() => false),
    });

    await new Promise<void>((resolve, reject) => {
      adapter
        .sync$([], {
          showNotifications: true,
          throwOnError: false,
        })
        .subscribe({
          next: () => resolve(),
          error: reject,
        });
    });

    expect(dataService.updateCanvasRelations).not.toHaveBeenCalled();
  });

  it('queues draft and rethrows when throwOnError=true', async () => {
    const failure = new Error('relation-fail');
    const { adapter, queueUnsyncedDraft, notifyError } = createAdapter({
      updateCanvasRelations: vi.fn(
        () => throwError(() => failure) as Observable<void>
      ),
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        adapter
          .sync$([], {
            showNotifications: true,
            throwOnError: true,
            relationDraftId: 'relations-sync',
          })
          .subscribe({
            next: () => resolve(),
            error: reject,
          });
      })
    ).rejects.toBe(failure);

    expect(queueUnsyncedDraft).toHaveBeenCalledWith('relations-sync', {
      relationCount: 0,
      elementCount: 0,
    });
    expect(notifyError).toHaveBeenCalledWith('Failed to save relations');
  });

  it('swallows error when throwOnError=false', async () => {
    const failure = new Error('relation-fail');
    const { adapter } = createAdapter({
      updateCanvasRelations: vi.fn(
        () => throwError(() => failure) as Observable<void>
      ),
    });

    await new Promise<void>((resolve, reject) => {
      adapter
        .sync$([], {
          showNotifications: false,
          throwOnError: false,
        })
        .subscribe({
          next: () => resolve(),
          error: reject,
        });
    });
  });
});

