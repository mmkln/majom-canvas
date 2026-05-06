import { buildUserScopedStorageKey } from './UserScopedStorage.ts';
import {
  getCanvasAnimationsEnabled,
  getCanvasAutosaveEnabled,
  getCanvasContainerGuidesEnabled,
  getLastOpenedCanvasIdPreference,
  getCanvasMiniMapVisible,
  getCanvasSmartGuidesEnabled,
  getCanvasSpacingGuidesEnabled,
  getCanvasViewportCenterGuidesEnabled,
  hasUserPreferencesPersistence,
  setCanvasAnimationsEnabled,
  setCanvasAutosaveEnabled,
  setCanvasContainerGuidesEnabled,
  setLastOpenedCanvasIdPreference,
  setCanvasMiniMapVisible,
  setCanvasSmartGuidesEnabled,
  setCanvasSpacingGuidesEnabled,
  setCanvasViewportCenterGuidesEnabled,
} from '../../../shell/services/UserPreferencesService.ts';
import type { IViewState } from '../interfaces/interfaces.ts';

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
const CANVAS_TAB_SESSION_KEY = 'canvas-tab-session';
const DRAFTS_KEY_PREFIX = 'draft-unsynced-changes';
const DRAFTS_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type CanvasTabSessionState = {
  activeCanvasId?: string;
  viewsByCanvasId?: Record<string, IViewState>;
};

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

function normalizeCanvasId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function isValidViewState(value: unknown): value is IViewState {
  const state = value as IViewState;
  return (
    state !== null &&
    typeof state === 'object' &&
    Number.isFinite(state.scrollX) &&
    Number.isFinite(state.scrollY) &&
    Number.isFinite(state.scale) &&
    state.scale > 0
  );
}

function cloneViewState(state: IViewState): IViewState {
  return {
    scrollX: state.scrollX,
    scrollY: state.scrollY,
    scale: state.scale,
  };
}

function getCanvasTabSessionStorageKey(): string {
  return buildUserScopedStorageKey(CANVAS_TAB_SESSION_KEY);
}

function readCanvasTabSessionState(): CanvasTabSessionState {
  try {
    const raw = sessionStorage.getItem(getCanvasTabSessionStorageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CanvasTabSessionState;
    if (!parsed || typeof parsed !== 'object') return {};
    const activeCanvasId =
      normalizeCanvasId(parsed.activeCanvasId) ?? undefined;
    const viewsByCanvasId: Record<string, IViewState> = {};
    const rawViews =
      parsed.viewsByCanvasId && typeof parsed.viewsByCanvasId === 'object'
        ? parsed.viewsByCanvasId
        : {};
    for (const [canvasId, view] of Object.entries(rawViews)) {
      const normalizedCanvasId = normalizeCanvasId(canvasId);
      if (!normalizedCanvasId || !isValidViewState(view)) continue;
      viewsByCanvasId[normalizedCanvasId] = cloneViewState(view);
    }
    return {
      activeCanvasId,
      viewsByCanvasId:
        Object.keys(viewsByCanvasId).length > 0 ? viewsByCanvasId : undefined,
    };
  } catch {
    return {};
  }
}

function writeCanvasTabSessionState(state: CanvasTabSessionState): void {
  try {
    sessionStorage.setItem(
      getCanvasTabSessionStorageKey(),
      JSON.stringify(state)
    );
  } catch {
    // no-op
  }
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
    return (
      getLastOpenedCanvasIdPreference() ??
      readEnvelope<string>(LAST_OPENED_CANVAS_KEY)
    );
  }

  public static setLastOpenedCanvasId(canvasId: string): void {
    if (!canvasId) return;
    if (hasUserPreferencesPersistence()) {
      setLastOpenedCanvasIdPreference(canvasId);
      try {
        localStorage.removeItem(buildUserScopedStorageKey(LAST_OPENED_CANVAS_KEY));
      } catch {
        // no-op
      }
      return;
    }
    writeEnvelope(LAST_OPENED_CANVAS_KEY, canvasId, null);
  }

  public static readCanvasSessionActiveCanvasId(): string | null {
    return normalizeCanvasId(readCanvasTabSessionState().activeCanvasId);
  }

  public static persistCanvasSessionActiveCanvasId(canvasId: string): void {
    const normalizedCanvasId = normalizeCanvasId(canvasId);
    if (!normalizedCanvasId) return;
    writeCanvasTabSessionState({
      ...readCanvasTabSessionState(),
      activeCanvasId: normalizedCanvasId,
    });
  }

  public static resolveInitialCanvasId(
    availableCanvasIds: readonly string[]
  ): string | null {
    const availableCanvasIdSet = new Set(
      availableCanvasIds
        .map((canvasId) => normalizeCanvasId(canvasId))
        .filter((canvasId): canvasId is string => canvasId !== null)
    );
    if (availableCanvasIdSet.size === 0) return null;

    const sessionCanvasId = this.readCanvasSessionActiveCanvasId();
    if (sessionCanvasId && availableCanvasIdSet.has(sessionCanvasId)) {
      return sessionCanvasId;
    }

    const fallbackCanvasId = this.getLastOpenedCanvasId();
    if (fallbackCanvasId && availableCanvasIdSet.has(fallbackCanvasId)) {
      return fallbackCanvasId;
    }

    return availableCanvasIdSet.values().next().value ?? null;
  }

  public static readCanvasSessionViewState(
    canvasId?: string | null
  ): IViewState | null {
    const state = readCanvasTabSessionState();
    const normalizedCanvasId =
      normalizeCanvasId(canvasId) ?? normalizeCanvasId(state.activeCanvasId);
    if (!normalizedCanvasId) return null;
    const view = state.viewsByCanvasId?.[normalizedCanvasId];
    return isValidViewState(view) ? cloneViewState(view) : null;
  }

  public static persistCanvasSessionViewState(
    view: IViewState,
    canvasId?: string | null
  ): void {
    if (!isValidViewState(view)) return;
    const currentState = readCanvasTabSessionState();
    const normalizedCanvasId =
      normalizeCanvasId(canvasId) ??
      normalizeCanvasId(currentState.activeCanvasId);
    if (!normalizedCanvasId) return;
    writeCanvasTabSessionState({
      ...currentState,
      viewsByCanvasId: {
        ...(currentState.viewsByCanvasId ?? {}),
        [normalizedCanvasId]: cloneViewState(view),
      },
    });
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
