import { buildUserScopedStorageKey } from './UserScopedStorage.ts';

export type UnsyncedDraftKind =
  | 'element-patch'
  | 'layout'
  | 'relations'
  | 'task-story-link'
  | 'story-goal-link';

export type UnsyncedDraftChange = {
  id: string;
  kind: UnsyncedDraftKind;
  payload: unknown;
  updatedAt: number;
};

type StorageEnvelope<T> = {
  data: T;
  updatedAt: number;
  expiresAt: number | null;
};

const LAST_OPENED_CANVAS_KEY = 'last-opened-canvas-id';
const DRAFTS_KEY_PREFIX = 'draft-unsynced-changes';
const DRAFTS_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MINI_MAP_VISIBLE_KEY = 'ui:minimap-visible';
const CANVAS_ANIMATIONS_ENABLED_KEY = 'ui:canvas-animations-enabled';
const CANVAS_AUTOSAVE_ENABLED_KEY = 'ui:canvas-autosave-enabled';

function getDraftsKey(canvasId: string): string {
  return `${DRAFTS_KEY_PREFIX}:${canvasId}`;
}

function readEnvelope<T>(baseKey: string): T | null {
  const key = buildUserScopedStorageKey(baseKey);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StorageEnvelope<T>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      'updatedAt' in parsed
    ) {
      if (
        typeof parsed.expiresAt === 'number' &&
        Number.isFinite(parsed.expiresAt) &&
        Date.now() > parsed.expiresAt
      ) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

function writeEnvelope<T>(
  baseKey: string,
  data: T,
  ttlMs: number | null = null
): void {
  const now = Date.now();
  const envelope: StorageEnvelope<T> = {
    data,
    updatedAt: now,
    expiresAt: ttlMs ? now + ttlMs : null,
  };
  localStorage.setItem(
    buildUserScopedStorageKey(baseKey),
    JSON.stringify(envelope)
  );
}

export class CanvasClientStorage {
  public static getCanvasAutosaveEnabled(defaultEnabled = true): boolean {
    const stored = readEnvelope<unknown>(CANVAS_AUTOSAVE_ENABLED_KEY);
    return typeof stored === 'boolean' ? stored : defaultEnabled;
  }

  public static setCanvasAutosaveEnabled(enabled: boolean): void {
    writeEnvelope(CANVAS_AUTOSAVE_ENABLED_KEY, enabled, null);
  }

  public static getCanvasAnimationsEnabled(defaultEnabled = true): boolean {
    const stored = readEnvelope<unknown>(CANVAS_ANIMATIONS_ENABLED_KEY);
    return typeof stored === 'boolean' ? stored : defaultEnabled;
  }

  public static setCanvasAnimationsEnabled(enabled: boolean): void {
    writeEnvelope(CANVAS_ANIMATIONS_ENABLED_KEY, enabled, null);
  }

  public static getMiniMapVisible(defaultVisible = true): boolean {
    const stored = readEnvelope<unknown>(MINI_MAP_VISIBLE_KEY);
    return typeof stored === 'boolean' ? stored : defaultVisible;
  }

  public static setMiniMapVisible(visible: boolean): void {
    writeEnvelope(MINI_MAP_VISIBLE_KEY, visible, null);
  }

  public static getLastOpenedCanvasId(): string | null {
    return readEnvelope<string>(LAST_OPENED_CANVAS_KEY);
  }

  public static setLastOpenedCanvasId(canvasId: string): void {
    if (!canvasId) return;
    writeEnvelope(LAST_OPENED_CANVAS_KEY, canvasId, null);
  }

  public static listUnsyncedDrafts(canvasId: string): UnsyncedDraftChange[] {
    if (!canvasId) return [];
    const drafts = readEnvelope<UnsyncedDraftChange[]>(getDraftsKey(canvasId));
    return Array.isArray(drafts) ? drafts : [];
  }

  public static upsertUnsyncedDraft(
    canvasId: string,
    draft: Omit<UnsyncedDraftChange, 'updatedAt'>
  ): void {
    if (!canvasId || !draft.id) return;
    const current = this.listUnsyncedDrafts(canvasId);
    const next: UnsyncedDraftChange = {
      ...draft,
      updatedAt: Date.now(),
    };
    const idx = current.findIndex((item) => item.id === draft.id);
    if (idx >= 0) {
      current[idx] = next;
    } else {
      current.push(next);
    }
    writeEnvelope(getDraftsKey(canvasId), current, DRAFTS_TTL_MS);
  }

  public static removeUnsyncedDraft(canvasId: string, draftId: string): void {
    if (!canvasId || !draftId) return;
    const current = this.listUnsyncedDrafts(canvasId);
    const filtered = current.filter((draft) => draft.id !== draftId);
    if (filtered.length === 0) {
      localStorage.removeItem(
        buildUserScopedStorageKey(getDraftsKey(canvasId))
      );
      return;
    }
    writeEnvelope(getDraftsKey(canvasId), filtered, DRAFTS_TTL_MS);
  }
}
