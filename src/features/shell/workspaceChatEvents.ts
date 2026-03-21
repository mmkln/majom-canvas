export const WORKSPACE_CHAT_TOGGLE_REQUEST_EVENT =
  'workspaceChatToggleRequested';
export const WORKSPACE_CHAT_VISIBILITY_CHANGED_EVENT =
  'workspaceChatVisibilityChanged';

export type WorkspaceChatToggleRequestDetail = {
  open?: boolean;
};

export type WorkspaceChatVisibilityChangedDetail = {
  open: boolean;
};

export function isWorkspaceChatToggleRequestDetail(
  detail: unknown
): detail is WorkspaceChatToggleRequestDetail {
  if (!detail) return true;
  if (typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceChatToggleRequestDetail>;
  return value.open === undefined || typeof value.open === 'boolean';
}

export function emitWorkspaceChatToggleRequested(open?: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatToggleRequestDetail>(
      WORKSPACE_CHAT_TOGGLE_REQUEST_EVENT,
      { detail: typeof open === 'boolean' ? { open } : {} }
    )
  );
}

export function emitWorkspaceChatVisibilityChanged(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceChatVisibilityChangedDetail>(
      WORKSPACE_CHAT_VISIBILITY_CHANGED_EVENT,
      { detail: { open } }
    )
  );
}
