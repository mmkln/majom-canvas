import type { WorkspaceView } from './WorkspaceView.ts';

export const WORKSPACE_VIEW_CHANGE_REQUEST_EVENT = 'workspaceViewChangeRequested';
export const WORKSPACE_VIEW_CHANGED_EVENT = 'workspaceViewChanged';

export type WorkspaceViewChangeRequestDetail = {
  view: WorkspaceView;
};

export type WorkspaceViewChangedDetail = {
  view: WorkspaceView;
};

export function isWorkspaceView(value: unknown): value is WorkspaceView {
  return value === 'canvas' || value === 'kanban' || value === 'calendar';
}

export function isWorkspaceViewChangeRequestDetail(
  detail: unknown
): detail is WorkspaceViewChangeRequestDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceViewChangeRequestDetail>;
  return isWorkspaceView(value.view);
}

export function isWorkspaceViewChangedDetail(
  detail: unknown
): detail is WorkspaceViewChangedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<WorkspaceViewChangedDetail>;
  return isWorkspaceView(value.view);
}

export function emitWorkspaceViewChangeRequested(view: WorkspaceView): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceViewChangeRequestDetail>(
      WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
      { detail: { view } }
    )
  );
}

export function emitWorkspaceViewChanged(view: WorkspaceView): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<WorkspaceViewChangedDetail>(WORKSPACE_VIEW_CHANGED_EVENT, {
      detail: { view },
    })
  );
}
