import { buildUserScopedStorageKey } from './UserScopedStorage.ts';
import {
  getCanvasAnimationsEnabled,
  getCanvasAutosaveEnabled,
  getCanvasContainerGuidesEnabled,
  getCanvasMiniMapVisible,
  getCanvasSmartGuidesEnabled,
  getCanvasSpacingGuidesEnabled,
  getCanvasViewportCenterGuidesEnabled,
  setCanvasAnimationsEnabled,
  setCanvasAutosaveEnabled,
  setCanvasContainerGuidesEnabled,
  setCanvasMiniMapVisible,
  setCanvasSmartGuidesEnabled,
  setCanvasSpacingGuidesEnabled,
  setCanvasViewportCenterGuidesEnabled,
} from '../../../shell/services/UserPreferencesService.ts';

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
    return getCanvasAutosaveEnabled(defaultEnabled);
  }

  public static setCanvasAutosaveEnabled(enabled: boolean): void {
    setCanvasAutosaveEnabled(enabled);
  }

  public static getCanvasAnimationsEnabled(defaultEnabled = true): boolean {
    return getCanvasAnimationsEnabled(defaultEnabled);
  }

  public static setCanvasAnimationsEnabled(enabled: boolean): void {
    setCanvasAnimationsEnabled(enabled);
  }

  public static getCanvasSmartGuidesEnabled(defaultEnabled = false): boolean {
    return getCanvasSmartGuidesEnabled(defaultEnabled);
  }

  public static setCanvasSmartGuidesEnabled(enabled: boolean): void {
    setCanvasSmartGuidesEnabled(enabled);
  }

  public static getCanvasSpacingGuidesEnabled(defaultEnabled = true): boolean {
    return getCanvasSpacingGuidesEnabled(defaultEnabled);
  }

  public static setCanvasSpacingGuidesEnabled(enabled: boolean): void {
    setCanvasSpacingGuidesEnabled(enabled);
  }

  public static getCanvasContainerGuidesEnabled(
    defaultEnabled = true
  ): boolean {
    return getCanvasContainerGuidesEnabled(defaultEnabled);
  }

  public static setCanvasContainerGuidesEnabled(enabled: boolean): void {
    setCanvasContainerGuidesEnabled(enabled);
  }

  public static getCanvasViewportCenterGuidesEnabled(
    defaultEnabled = true
  ): boolean {
    return getCanvasViewportCenterGuidesEnabled(defaultEnabled);
  }

  public static setCanvasViewportCenterGuidesEnabled(enabled: boolean): void {
    setCanvasViewportCenterGuidesEnabled(enabled);
  }

  public static getMiniMapVisible(defaultVisible = true): boolean {
    return getCanvasMiniMapVisible(defaultVisible);
  }

  public static setMiniMapVisible(visible: boolean): void {
    setCanvasMiniMapVisible(visible);
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
