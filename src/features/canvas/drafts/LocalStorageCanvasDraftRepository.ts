import { buildUserScopedStorageKey } from '../core/services/UserScopedStorage.ts';
import type {
  CanvasDraftRepository,
  CanvasDraftSnapshot,
} from './CanvasDraftRepository.ts';

type StorageEnvelope<T> = {
  data: T;
  updatedAt: number;
  expiresAt: number | null;
};

const DRAFT_STORAGE_KEY_PREFIX = 'canvas-local-draft';
const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getDraftStorageKey(canvasId: string): string {
  return buildUserScopedStorageKey(`${DRAFT_STORAGE_KEY_PREFIX}:${canvasId}`);
}

export class LocalStorageCanvasDraftRepository
  implements CanvasDraftRepository
{
  constructor(private readonly storage: Storage = localStorage) {}

  public async load(canvasId: string): Promise<CanvasDraftSnapshot | null> {
    if (!canvasId) return null;
    const raw = this.storage.getItem(getDraftStorageKey(canvasId));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as
        | StorageEnvelope<CanvasDraftSnapshot>
        | CanvasDraftSnapshot;
      const snapshot = this.unwrapEnvelope(parsed, canvasId);
      return snapshot && isCanvasDraftSnapshot(snapshot, canvasId)
        ? normalizeCanvasDraftSnapshot(snapshot)
        : null;
    } catch {
      return null;
    }
  }

  public async save(snapshot: CanvasDraftSnapshot): Promise<void> {
    if (!snapshot.canvasId) return;
    const now = Date.now();
    const envelope: StorageEnvelope<CanvasDraftSnapshot> = {
      data: snapshot,
      updatedAt: now,
      expiresAt: now + DRAFT_TTL_MS,
    };
    this.storage.setItem(
      getDraftStorageKey(snapshot.canvasId),
      JSON.stringify(envelope)
    );
  }

  public async clear(canvasId: string): Promise<void> {
    if (!canvasId) return;
    this.storage.removeItem(getDraftStorageKey(canvasId));
  }

  private unwrapEnvelope(
    parsed: StorageEnvelope<CanvasDraftSnapshot> | CanvasDraftSnapshot,
    canvasId: string
  ): CanvasDraftSnapshot | null {
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'updatedAt' in parsed
    ) {
      const envelope = parsed as StorageEnvelope<CanvasDraftSnapshot>;
      if (
        typeof envelope.expiresAt === 'number' &&
        Number.isFinite(envelope.expiresAt) &&
        Date.now() > envelope.expiresAt
      ) {
        this.storage.removeItem(getDraftStorageKey(canvasId));
        return null;
      }
      return envelope.data;
    }
    return parsed as CanvasDraftSnapshot;
  }
}

function isCanvasDraftSnapshot(
  value: unknown,
  canvasId: string
): value is CanvasDraftSnapshot {
  const snapshot = value as CanvasDraftSnapshot | null;
  return (
    Boolean(snapshot) &&
    (snapshot?.version === 1 || snapshot?.version === 2) &&
    snapshot.canvasId === canvasId &&
    typeof snapshot.savedAt === 'string' &&
    typeof snapshot.fingerprint === 'string' &&
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.connections) &&
    Array.isArray(snapshot.highlightedElementIds)
  );
}

function normalizeCanvasDraftSnapshot(
  snapshot: CanvasDraftSnapshot & {
    baseSyncRevision?: number | null;
    baseSyncUpdatedAt?: string | null;
    baseCanvasMetaFingerprint?: string | null;
  }
): CanvasDraftSnapshot {
  return {
    ...snapshot,
    version: 2,
    baseCanvasMetaFingerprint:
      typeof snapshot.baseCanvasMetaFingerprint === 'string'
        ? snapshot.baseCanvasMetaFingerprint
        : null,
  };
}
