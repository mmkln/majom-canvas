import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import {
  getAiAssistantOpenPreference,
  getTimeClusteringLayoutMode,
  getTimeClusteringOpenPreference,
  getTimeClusteringOverlapWarningsVisible,
  getWorkspaceDefaultView,
  getWorkspaceViewSwitcherPinned,
  hasUserPreferencesPersistence,
  setAiAssistantOpenPreference,
  setTimeClusteringLayoutModePreference,
  setTimeClusteringOpenPreference,
  setTimeClusteringOverlapWarningsVisiblePreference,
  setWorkspaceDefaultView,
  setWorkspaceViewSwitcherPinned,
} from './services/UserPreferencesService.ts';

export const WORKSPACE_ACTIVE_VIEW_STORAGE_KEY = 'workspace-active-view';
export const AI_ASSISTANT_OPEN_STORAGE_KEY = 'ai-assistant-open';
export const TIME_CLUSTERING_OPEN_STORAGE_KEY = 'time-clustering-open';
export const WORKSPACE_VIEW_SWITCHER_PINNED_STORAGE_KEY =
  'workspace-view-switcher-pinned';
export const TIME_CLUSTERING_LAYOUT_MODE_STORAGE_KEY =
  'time-clustering-layout-mode';
export const TIME_CLUSTERING_OVERLAP_WARNINGS_VISIBLE_STORAGE_KEY =
  'time-clustering-overlap-warnings-visible';
const LEGACY_WORKSPACE_CHAT_OPEN_STORAGE_KEY = 'workspace-chat-open';

type LoadPersistedWorkspaceViewOptions = {
  allowKanban?: boolean;
  allowFocusBoard?: boolean;
  allowLearningStudio?: boolean;
};

export function loadPersistedWorkspaceView(
  options: LoadPersistedWorkspaceViewOptions = {}
): WorkspaceView {
  const allowKanban = options.allowKanban ?? true;
  const allowFocusBoard = options.allowFocusBoard ?? true;
  const allowLearningStudio = options.allowLearningStudio ?? true;
  const value = getWorkspaceDefaultView('canvas');
  if (value === 'kanban' && allowKanban) return 'kanban';
  if (value === 'focus-board' && allowFocusBoard) return 'focus-board';
  if (value === 'learning-studio' && allowLearningStudio) {
    return 'learning-studio';
  }
  return 'canvas';
}

export function persistWorkspaceView(view: WorkspaceView): void {
  setWorkspaceDefaultView(view);
}

export function loadPersistedTimeClusteringOpen(
  allowTimeClustering = true
): boolean {
  if (!allowTimeClustering) return false;
  if (hasUserPreferencesPersistence()) {
    return getTimeClusteringOpenPreference(false);
  }
  try {
    const value = localStorage.getItem(TIME_CLUSTERING_OPEN_STORAGE_KEY);
    if (value === '1' || value === 'true') return true;
    if (
      localStorage.getItem(WORKSPACE_ACTIVE_VIEW_STORAGE_KEY) ===
      'time-clustering'
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function persistTimeClusteringOpen(open: boolean): void {
  if (hasUserPreferencesPersistence()) {
    setTimeClusteringOpenPreference(open);
    try {
      localStorage.removeItem(TIME_CLUSTERING_OPEN_STORAGE_KEY);
    } catch {
      // no-op
    }
    return;
  }
  try {
    localStorage.setItem(TIME_CLUSTERING_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // no-op
  }
}

export function loadPersistedTimeClusteringLayoutMode(
  defaultMode: TimeClusteringLayoutMode = 'docked-left'
): TimeClusteringLayoutMode {
  return getTimeClusteringLayoutMode(defaultMode);
}

export function persistTimeClusteringLayoutMode(
  mode: TimeClusteringLayoutMode
): void {
  setTimeClusteringLayoutModePreference(mode);
}

export function loadPersistedTimeClusteringOverlapWarningsVisible(
  defaultVisible = true
): boolean {
  return getTimeClusteringOverlapWarningsVisible(defaultVisible);
}

export function persistTimeClusteringOverlapWarningsVisible(
  visible: boolean
): void {
  setTimeClusteringOverlapWarningsVisiblePreference(visible);
}

export function loadPersistedAiAssistantOpen(): boolean {
  if (hasUserPreferencesPersistence()) {
    return getAiAssistantOpenPreference(false);
  }
  try {
    const value =
      localStorage.getItem(AI_ASSISTANT_OPEN_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_WORKSPACE_CHAT_OPEN_STORAGE_KEY);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

export function persistAiAssistantOpen(open: boolean): void {
  if (hasUserPreferencesPersistence()) {
    setAiAssistantOpenPreference(open);
    try {
      localStorage.removeItem(AI_ASSISTANT_OPEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_WORKSPACE_CHAT_OPEN_STORAGE_KEY);
    } catch {
      // no-op
    }
    return;
  }
  try {
    localStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // no-op
  }
}

export function loadPersistedWorkspaceViewSwitcherPinned(): boolean {
  return getWorkspaceViewSwitcherPinned(false);
}

export function persistWorkspaceViewSwitcherPinned(pinned: boolean): void {
  setWorkspaceViewSwitcherPinned(pinned);
}
