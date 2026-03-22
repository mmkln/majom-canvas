import type { WorkspaceView } from './WorkspaceView.ts';

export const WORKSPACE_ACTIVE_VIEW_STORAGE_KEY = 'workspace-active-view';
export const WORKSPACE_CHAT_OPEN_STORAGE_KEY = 'workspace-chat-open';

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
  } catch {
    // no-op
  }
  return 'canvas';
}

export function persistWorkspaceView(view: WorkspaceView): void {
  try {
    localStorage.setItem(WORKSPACE_ACTIVE_VIEW_STORAGE_KEY, view);
  } catch {
    // no-op
  }
}

export function loadPersistedWorkspaceChatOpen(): boolean {
  try {
    const value = localStorage.getItem(WORKSPACE_CHAT_OPEN_STORAGE_KEY);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

export function persistWorkspaceChatOpen(open: boolean): void {
  try {
    localStorage.setItem(WORKSPACE_CHAT_OPEN_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // no-op
  }
}
