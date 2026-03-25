import type { WorkspaceView } from './WorkspaceView.ts';

export const WORKSPACE_VIEW_CHANGE_REQUEST_EVENT =
  'workspaceViewChangeRequested';
export const WORKSPACE_VIEW_CHANGED_EVENT = 'workspaceViewChanged';
export const TIME_CLUSTERING_TOGGLE_REQUEST_EVENT =
  'timeClusteringToggleRequested';
export const TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT =
  'timeClusteringVisibilityChanged';

export type WorkspaceViewChangeRequestDetail = {
  view: WorkspaceView;
};

export type WorkspaceViewChangedDetail = {
  view: WorkspaceView;
};

export type TimeClusteringToggleRequestDetail = {
  open?: boolean;
};

export type TimeClusteringVisibilityChangedDetail = {
  open: boolean;
};

export function isWorkspaceView(value: unknown): value is WorkspaceView {
  return (
    value === 'canvas' || value === 'kanban' || value === 'time-clustering'
  );
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

export function isTimeClusteringToggleRequestDetail(
  detail: unknown
): detail is TimeClusteringToggleRequestDetail {
  if (detail === undefined) return true;
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<TimeClusteringToggleRequestDetail>;
  return value.open === undefined || typeof value.open === 'boolean';
}

export function emitTimeClusteringToggleRequested(open?: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TimeClusteringToggleRequestDetail>(
      TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
      {
        detail: typeof open === 'boolean' ? { open } : {},
      }
    )
  );
}

export function isTimeClusteringVisibilityChangedDetail(
  detail: unknown
): detail is TimeClusteringVisibilityChangedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<TimeClusteringVisibilityChangedDetail>;
  return typeof value.open === 'boolean';
}

export function emitTimeClusteringVisibilityChanged(open: boolean): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<TimeClusteringVisibilityChangedDetail>(
      TIME_CLUSTERING_VISIBILITY_CHANGED_EVENT,
      { detail: { open } }
    )
  );
}
