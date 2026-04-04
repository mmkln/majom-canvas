import { firstValueFrom, type Observable } from 'rxjs';
import type {
  User,
  UserProfileUpdate,
} from '../../../majom-wrapper/interfaces/auth-interfaces.ts';
import type { WorkspaceView } from '../WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../../time-clustering/domain/types.ts';

type UserPreferencesApi = {
  updateUserProfile(payload: UserProfileUpdate): Observable<User>;
};

type UserMetaRecord = Record<string, unknown>;

export const USER_PREFERENCES_VERSION = 1;

export const LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY = 'workspace-active-view';
export const LEGACY_WORKSPACE_VIEW_SWITCHER_PINNED_STORAGE_KEY =
  'workspace-view-switcher-pinned';
export const LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY =
  'time-clustering-layout-mode';
export const LEGACY_TIME_CLUSTERING_OVERLAP_WARNINGS_VISIBLE_STORAGE_KEY =
  'time-clustering-overlap-warnings-visible';
export const LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY = 'ui:minimap-visible';
export const LEGACY_CANVAS_ANIMATIONS_ENABLED_STORAGE_KEY =
  'ui:canvas-animations-enabled';
export const LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY =
  'ui:canvas-autosave-enabled';
export const LEGACY_CANVAS_SMART_GUIDES_ENABLED_STORAGE_KEY =
  'ui:canvas-smart-guides-enabled';
export const LEGACY_CANVAS_SPACING_GUIDES_ENABLED_STORAGE_KEY =
  'ui:canvas-spacing-guides-enabled';
export const LEGACY_CANVAS_CONTAINER_GUIDES_ENABLED_STORAGE_KEY =
  'ui:canvas-container-guides-enabled';
export const LEGACY_CANVAS_VIEWPORT_CENTER_GUIDES_ENABLED_STORAGE_KEY =
  'ui:canvas-viewport-center-guides-enabled';

export type UserPreferencesMeta = {
  preferencesVersion?: number;
  workspace?: {
    defaultView?: WorkspaceView;
    viewSwitcherPinned?: boolean;
  };
  timeClustering?: {
    layoutMode?: TimeClusteringLayoutMode;
    overlapWarningsVisible?: boolean;
  };
  canvasPreferences?: {
    miniMapVisible?: boolean;
    animationsEnabled?: boolean;
    autosaveEnabled?: boolean;
    smartGuidesEnabled?: boolean;
    spacingGuidesEnabled?: boolean;
    containerGuidesEnabled?: boolean;
    viewportCenterGuidesEnabled?: boolean;
  };
};

type UserPreferencesState = {
  api: UserPreferencesApi | null;
  rawMeta: UserMetaRecord;
  preferences: UserPreferencesMeta;
  pendingPersist: UserMetaRecord | null;
  flushPromise: Promise<void> | null;
};

const state: UserPreferencesState = {
  api: null,
  rawMeta: {},
  preferences: {},
  pendingPersist: null,
  flushPromise: null,
};

export async function initializeUserPreferences(options: {
  user: User;
  userApiService: UserPreferencesApi;
}): Promise<User> {
  state.api = options.userApiService;

  const existingMeta = normalizeUserMeta(options.user.meta);
  const existingPreferences = extractUserPreferencesMeta(existingMeta);
  const migratedPreferences = ensurePreferencesVersion(
    mergePreferences(readLegacyPreferencesFromLocalStorage(), existingPreferences)
  );
  const nextMeta = mergeMetaObjects(
    existingMeta,
    preferencesToMetaPatch(migratedPreferences)
  );
  applyUserMeta(nextMeta);

  const needsMigration = !areMetaEqual(existingMeta, nextMeta);
  if (!needsMigration) {
    clearLegacyPreferenceStorage();
    return options.user;
  }

  try {
    const updatedUser = await firstValueFrom(
      options.userApiService.updateUserProfile({
        meta: nextMeta,
      })
    );
    applyUserMeta(normalizeUserMeta(updatedUser.meta));
    clearLegacyPreferenceStorage();
    return updatedUser;
  } catch (error) {
    console.warn('Failed to migrate user preferences from localStorage.', error);
    return options.user;
  }
}

export function clearUserPreferences(): void {
  state.api = null;
  state.rawMeta = {};
  state.preferences = {};
  state.pendingPersist = null;
  state.flushPromise = null;
}

export function getWorkspaceDefaultView(
  defaultView: WorkspaceView = 'canvas'
): WorkspaceView {
  return state.preferences.workspace?.defaultView ?? defaultView;
}

export function setWorkspaceDefaultView(view: WorkspaceView): void {
  updatePreferences({
    workspace: {
      defaultView: view,
    },
  });
}

export function getWorkspaceViewSwitcherPinned(defaultPinned = false): boolean {
  return state.preferences.workspace?.viewSwitcherPinned ?? defaultPinned;
}

export function setWorkspaceViewSwitcherPinned(pinned: boolean): void {
  updatePreferences({
    workspace: {
      viewSwitcherPinned: pinned,
    },
  });
}

export function getTimeClusteringLayoutMode(
  defaultMode: TimeClusteringLayoutMode = 'docked-left'
): TimeClusteringLayoutMode {
  return state.preferences.timeClustering?.layoutMode ?? defaultMode;
}

export function setTimeClusteringLayoutModePreference(
  mode: TimeClusteringLayoutMode
): void {
  updatePreferences({
    timeClustering: {
      layoutMode: mode,
    },
  });
}

export function getTimeClusteringOverlapWarningsVisible(
  defaultVisible = true
): boolean {
  return state.preferences.timeClustering?.overlapWarningsVisible ?? defaultVisible;
}

export function setTimeClusteringOverlapWarningsVisiblePreference(
  visible: boolean
): void {
  updatePreferences({
    timeClustering: {
      overlapWarningsVisible: visible,
    },
  });
}

export function getCanvasMiniMapVisible(defaultVisible = true): boolean {
  return state.preferences.canvasPreferences?.miniMapVisible ?? defaultVisible;
}

export function setCanvasMiniMapVisible(visible: boolean): void {
  updatePreferences({
    canvasPreferences: {
      miniMapVisible: visible,
    },
  });
}

export function getCanvasAnimationsEnabled(defaultEnabled = true): boolean {
  return state.preferences.canvasPreferences?.animationsEnabled ?? defaultEnabled;
}

export function setCanvasAnimationsEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      animationsEnabled: enabled,
    },
  });
}

export function getCanvasAutosaveEnabled(defaultEnabled = true): boolean {
  return state.preferences.canvasPreferences?.autosaveEnabled ?? defaultEnabled;
}

export function setCanvasAutosaveEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      autosaveEnabled: enabled,
    },
  });
}

export function getCanvasSmartGuidesEnabled(defaultEnabled = false): boolean {
  return state.preferences.canvasPreferences?.smartGuidesEnabled ?? defaultEnabled;
}

export function setCanvasSmartGuidesEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      smartGuidesEnabled: enabled,
    },
  });
}

export function getCanvasSpacingGuidesEnabled(defaultEnabled = true): boolean {
  return state.preferences.canvasPreferences?.spacingGuidesEnabled ?? defaultEnabled;
}

export function setCanvasSpacingGuidesEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      spacingGuidesEnabled: enabled,
    },
  });
}

export function getCanvasContainerGuidesEnabled(
  defaultEnabled = true
): boolean {
  return state.preferences.canvasPreferences?.containerGuidesEnabled ?? defaultEnabled;
}

export function setCanvasContainerGuidesEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      containerGuidesEnabled: enabled,
    },
  });
}

export function getCanvasViewportCenterGuidesEnabled(
  defaultEnabled = true
): boolean {
  return (
    state.preferences.canvasPreferences?.viewportCenterGuidesEnabled ?? defaultEnabled
  );
}

export function setCanvasViewportCenterGuidesEnabled(enabled: boolean): void {
  updatePreferences({
    canvasPreferences: {
      viewportCenterGuidesEnabled: enabled,
    },
  });
}

export function resetUserPreferencesForTests(): void {
  clearUserPreferences();
}

export function primeUserPreferencesForTests(meta: UserPreferencesMeta): void {
  applyUserMeta(preferencesToMetaPatch(ensurePreferencesVersion(meta)));
}

function updatePreferences(partial: UserPreferencesMeta): void {
  const nextMeta = mergeMetaObjects(
    state.rawMeta,
    preferencesToMetaPatch(ensurePreferencesVersion(partial))
  );
  applyUserMeta(nextMeta);
  queueMetaPersistence(nextMeta);
}

function queueMetaPersistence(nextMeta: UserMetaRecord): void {
  if (!state.api) return;
  state.pendingPersist = nextMeta;
  if (state.flushPromise) return;
  state.flushPromise = Promise.resolve().then(async () => {
    try {
      while (state.pendingPersist) {
        const snapshot = state.pendingPersist;
        state.pendingPersist = null;
        const updatedUser = await firstValueFrom(
          state.api!.updateUserProfile({
            meta: snapshot,
          })
        );
        applyUserMeta(normalizeUserMeta(updatedUser.meta));
      }
    } catch (error) {
      console.warn('Failed to persist user preferences.', error);
    } finally {
      state.flushPromise = null;
    }
  });
}

function applyUserMeta(meta: UserMetaRecord): void {
  state.rawMeta = meta;
  state.preferences = extractUserPreferencesMeta(meta);
}

function preferencesToMetaPatch(preferences: UserPreferencesMeta): UserMetaRecord {
  const compact = compactPreferences(preferences);
  return compact ? (compact as UserMetaRecord) : {};
}

function readLegacyPreferencesFromLocalStorage(): UserPreferencesMeta {
  return compactPreferences({
    workspace: {
      defaultView: readLegacyWorkspaceDefaultView(),
      viewSwitcherPinned: readLegacyBoolean(
        LEGACY_WORKSPACE_VIEW_SWITCHER_PINNED_STORAGE_KEY
      ),
    },
    timeClustering: {
      layoutMode: readLegacyTimeClusteringLayoutMode(),
      overlapWarningsVisible: readLegacyBoolean(
        LEGACY_TIME_CLUSTERING_OVERLAP_WARNINGS_VISIBLE_STORAGE_KEY
      ),
    },
    canvasPreferences: {
      miniMapVisible: readLegacyBoolean(LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY),
      animationsEnabled: readLegacyBoolean(
        LEGACY_CANVAS_ANIMATIONS_ENABLED_STORAGE_KEY
      ),
      autosaveEnabled: readLegacyBoolean(
        LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY
      ),
      smartGuidesEnabled: readLegacyBoolean(
        LEGACY_CANVAS_SMART_GUIDES_ENABLED_STORAGE_KEY
      ),
      spacingGuidesEnabled: readLegacyBoolean(
        LEGACY_CANVAS_SPACING_GUIDES_ENABLED_STORAGE_KEY
      ),
      containerGuidesEnabled: readLegacyBoolean(
        LEGACY_CANVAS_CONTAINER_GUIDES_ENABLED_STORAGE_KEY
      ),
      viewportCenterGuidesEnabled: readLegacyBoolean(
        LEGACY_CANVAS_VIEWPORT_CENTER_GUIDES_ENABLED_STORAGE_KEY
      ),
    },
  }) ?? {};
}

function clearLegacyPreferenceStorage(): void {
  const keys = [
    LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY,
    LEGACY_WORKSPACE_VIEW_SWITCHER_PINNED_STORAGE_KEY,
    LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY,
    LEGACY_TIME_CLUSTERING_OVERLAP_WARNINGS_VISIBLE_STORAGE_KEY,
    LEGACY_MINI_MAP_VISIBLE_STORAGE_KEY,
    LEGACY_CANVAS_ANIMATIONS_ENABLED_STORAGE_KEY,
    LEGACY_CANVAS_AUTOSAVE_ENABLED_STORAGE_KEY,
    LEGACY_CANVAS_SMART_GUIDES_ENABLED_STORAGE_KEY,
    LEGACY_CANVAS_SPACING_GUIDES_ENABLED_STORAGE_KEY,
    LEGACY_CANVAS_CONTAINER_GUIDES_ENABLED_STORAGE_KEY,
    LEGACY_CANVAS_VIEWPORT_CENTER_GUIDES_ENABLED_STORAGE_KEY,
  ];
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // no-op
    }
  });
}

function normalizeUserMeta(meta: Record<string, unknown> | null | undefined): UserMetaRecord {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  return { ...meta };
}

function mergeMetaObjects(base: UserMetaRecord, patch: UserMetaRecord): UserMetaRecord {
  const next: UserMetaRecord = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    const currentValue = next[key];
    if (isPlainObject(currentValue) && isPlainObject(value)) {
      next[key] = mergeMetaObjects(currentValue, value);
      return;
    }
    next[key] = value;
  });
  return next;
}

function readLegacyWorkspaceDefaultView(): WorkspaceView | undefined {
  try {
    const value = localStorage.getItem(LEGACY_WORKSPACE_ACTIVE_VIEW_STORAGE_KEY);
    if (value === 'canvas' || value === 'kanban' || value === 'learning-studio') {
      return value;
    }
    if (value === 'time-clustering') {
      return 'canvas';
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function readLegacyTimeClusteringLayoutMode():
  | TimeClusteringLayoutMode
  | undefined {
  try {
    const value = localStorage.getItem(
      LEGACY_TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY
    );
    if (value === 'docked-left' || value === 'fullscreen') {
      return value;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function readLegacyBoolean(key: string): boolean | undefined {
  try {
    const value = localStorage.getItem(key);
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
  } catch {
    return undefined;
  }
  return undefined;
}

function extractUserPreferencesMeta(meta: UserMetaRecord): UserPreferencesMeta {
  const rawWorkspace = asObject(meta.workspace);
  const rawTimeClustering = asObject(meta.timeClustering);
  const rawCanvasPreferences = asObject(meta.canvasPreferences);
  const preferencesVersion =
    typeof meta.preferencesVersion === 'number'
      ? meta.preferencesVersion
      : undefined;

  return (
    compactPreferences({
      preferencesVersion,
      workspace: rawWorkspace
        ? {
            defaultView: isWorkspaceView(rawWorkspace.defaultView)
              ? rawWorkspace.defaultView
              : undefined,
            viewSwitcherPinned:
              typeof rawWorkspace.viewSwitcherPinned === 'boolean'
                ? rawWorkspace.viewSwitcherPinned
                : undefined,
          }
        : undefined,
      timeClustering: rawTimeClustering
        ? {
            layoutMode: isTimeClusteringLayoutMode(rawTimeClustering.layoutMode)
              ? rawTimeClustering.layoutMode
              : undefined,
            overlapWarningsVisible:
              typeof rawTimeClustering.overlapWarningsVisible === 'boolean'
                ? rawTimeClustering.overlapWarningsVisible
                : undefined,
          }
        : undefined,
      canvasPreferences: rawCanvasPreferences
        ? {
            miniMapVisible:
              typeof rawCanvasPreferences.miniMapVisible === 'boolean'
                ? rawCanvasPreferences.miniMapVisible
                : undefined,
            animationsEnabled:
              typeof rawCanvasPreferences.animationsEnabled === 'boolean'
                ? rawCanvasPreferences.animationsEnabled
                : undefined,
            autosaveEnabled:
              typeof rawCanvasPreferences.autosaveEnabled === 'boolean'
                ? rawCanvasPreferences.autosaveEnabled
                : undefined,
            smartGuidesEnabled:
              typeof rawCanvasPreferences.smartGuidesEnabled === 'boolean'
                ? rawCanvasPreferences.smartGuidesEnabled
                : undefined,
            spacingGuidesEnabled:
              typeof rawCanvasPreferences.spacingGuidesEnabled === 'boolean'
                ? rawCanvasPreferences.spacingGuidesEnabled
                : undefined,
            containerGuidesEnabled:
              typeof rawCanvasPreferences.containerGuidesEnabled === 'boolean'
                ? rawCanvasPreferences.containerGuidesEnabled
                : undefined,
            viewportCenterGuidesEnabled:
              typeof rawCanvasPreferences.viewportCenterGuidesEnabled === 'boolean'
                ? rawCanvasPreferences.viewportCenterGuidesEnabled
                : undefined,
          }
        : undefined,
    }) ?? {}
  );
}

function ensurePreferencesVersion(meta: UserPreferencesMeta): UserPreferencesMeta {
  return {
    ...meta,
    preferencesVersion: USER_PREFERENCES_VERSION,
  };
}

function mergePreferences(
  base: UserPreferencesMeta,
  patch: UserPreferencesMeta
): UserPreferencesMeta {
  return compactPreferences({
    preferencesVersion:
      patch.preferencesVersion ??
      base.preferencesVersion ??
      USER_PREFERENCES_VERSION,
    workspace: {
      ...base.workspace,
      ...patch.workspace,
    },
    timeClustering: {
      ...base.timeClustering,
      ...patch.timeClustering,
    },
    canvasPreferences: {
      ...base.canvasPreferences,
      ...patch.canvasPreferences,
    },
  }) ?? {};
}

function compactPreferences(
  meta: UserPreferencesMeta
): UserPreferencesMeta | undefined {
  const workspace = compactObject(meta.workspace);
  const timeClustering = compactObject(meta.timeClustering);
  const canvasPreferences = compactObject(meta.canvasPreferences);
  return compactObject({
    preferencesVersion: meta.preferencesVersion,
    workspace,
    timeClustering,
    canvasPreferences,
  }) as UserPreferencesMeta | undefined;
}

function compactObject<T extends Record<string, unknown> | undefined>(
  value: T
): T | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const next = Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, entry]) => {
      if (entry !== undefined) {
        acc[key] = entry;
      }
      return acc;
    },
    {}
  );
  return Object.keys(next).length > 0 ? (next as T) : undefined;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!isPlainObject(value)) {
    return null;
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isWorkspaceView(value: unknown): value is WorkspaceView {
  return (
    value === 'canvas' || value === 'kanban' || value === 'learning-studio'
  );
}

function isTimeClusteringLayoutMode(
  value: unknown
): value is TimeClusteringLayoutMode {
  return value === 'docked-left' || value === 'fullscreen';
}

function areMetaEqual(left: UserMetaRecord, right: UserMetaRecord): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
