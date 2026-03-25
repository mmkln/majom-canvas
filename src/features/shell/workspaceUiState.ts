import type { WorkspaceView } from './WorkspaceView.ts';

export const WORKSPACE_ACTIVE_VIEW_STORAGE_KEY = 'workspace-active-view';
export const AI_ASSISTANT_OPEN_STORAGE_KEY = 'ai-assistant-open';
export const TIME_CLUSTERING_OPEN_STORAGE_KEY = 'time-clustering-open';
const LEGACY_WORKSPACE_CHAT_OPEN_STORAGE_KEY = 'workspace-chat-open';

type LoadPersistedWorkspaceViewOptions = {
  allowKanban?: boolean;
};

export function loadPersistedWorkspaceView(
  options: LoadPersistedWorkspaceViewOptions = {}
): WorkspaceView {
  const allowKanban = options.allowKanban ?? true;
  try {
    const value = localStorage.getItem(WORKSPACE_ACTIVE_VIEW_STORAGE_KEY);
    if (value === 'kanban' && allowKanban) return 'kanban';
    if (value === 'time-clustering') {
      return 'canvas';
    }
  } catch {
    // no-op
  }
  return 'canvas';
}

export function persistWorkspaceView(view: WorkspaceView): void {
  try {
    localStorage.setItem(
      WORKSPACE_ACTIVE_VIEW_STORAGE_KEY,
      view === 'kanban' ? 'kanban' : 'canvas'
    );
  } catch {
    // no-op
  }
}

export function loadPersistedTimeClusteringOpen(
  allowTimeClustering = true
): boolean {
  if (!allowTimeClustering) return false;
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
  try {
    localStorage.setItem(TIME_CLUSTERING_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // no-op
  }
}

export function loadPersistedAiAssistantOpen(): boolean {
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
  try {
    localStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // no-op
  }
}
