export type CanvasBoardListItem = {
  id: string;
  name: string;
  isFavorite: boolean;
  groupId: string | null;
  groupName: string | null;
};

export type CanvasTitleEditedDetail = { title: string };
export type CanvasSelectedDetail = { id: string; name?: string };
export type CanvasFavoriteToggledDetail = {
  id: string;
  isFavorite: boolean;
  previousIsFavorite?: boolean;
};
export type CanvasGroupUpdatedDetail = {
  id: string;
  groupId: string | null;
  groupName: string | null;
  previousGroupId?: string | null;
  previousGroupName?: string | null;
};
export type CanvasRenameRequestedDetail = { id: string; name: string };
export type CanvasDeleteRequestedDetail = { id?: string };
export type CanvasTitleChangedDetail = { title: string };
export type CanvasListUpdatedDetail = {
  canvases: CanvasBoardListItem[];
  activeId: string | null;
};
export type CanvasFavoriteToggleFailedDetail = {
  id: string;
  previousIsFavorite: boolean;
};
export type CanvasGroupUpdateFailedDetail = {
  id: string;
  previousGroupId: string | null;
  previousGroupName: string | null;
};

export const CANVAS_TITLE_EDITED_EVENT = 'canvasTitleEdited';
export const CANVAS_SELECTED_EVENT = 'canvasSelected';
export const CANVAS_CREATE_REQUESTED_EVENT = 'canvasCreateRequested';
export const CANVAS_FAVORITE_TOGGLED_EVENT = 'canvasFavoriteToggled';
export const CANVAS_GROUP_UPDATED_EVENT = 'canvasGroupUpdated';
export const CANVAS_RENAME_REQUESTED_EVENT = 'canvasRenameRequested';
export const CANVAS_DELETE_REQUESTED_EVENT = 'canvasDeleteRequested';
export const CANVAS_TITLE_CHANGED_EVENT = 'canvasTitleChanged';
export const CANVAS_LIST_UPDATED_EVENT = 'canvasListUpdated';
export const CANVAS_FAVORITE_TOGGLE_FAILED_EVENT = 'canvasFavoriteToggleFailed';
export const CANVAS_GROUP_UPDATE_FAILED_EVENT = 'canvasGroupUpdateFailed';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isCanvasBoardListItem(value: unknown): value is CanvasBoardListItem {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.name !== 'string') return false;
  if (typeof value.isFavorite !== 'boolean') return false;
  const groupId = toNullableString(value.groupId);
  const groupName = toNullableString(value.groupName);
  if (groupId === null && value.groupId !== null) return false;
  if (groupName === null && value.groupName !== null) return false;
  return true;
}

function dispatchDetailEvent<T>(eventName: string, detail: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<T>(eventName, { detail }));
}

export function emitCanvasTitleEdited(title: string): void {
  dispatchDetailEvent<CanvasTitleEditedDetail>(CANVAS_TITLE_EDITED_EVENT, {
    title,
  });
}

export function emitCanvasSelected(id: string, name?: string): void {
  dispatchDetailEvent<CanvasSelectedDetail>(CANVAS_SELECTED_EVENT, {
    id,
    name,
  });
}

export function emitCanvasCreateRequested(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CANVAS_CREATE_REQUESTED_EVENT));
}

export function emitCanvasFavoriteToggled(
  detail: CanvasFavoriteToggledDetail
): void {
  dispatchDetailEvent<CanvasFavoriteToggledDetail>(
    CANVAS_FAVORITE_TOGGLED_EVENT,
    detail
  );
}

export function emitCanvasGroupUpdated(detail: CanvasGroupUpdatedDetail): void {
  dispatchDetailEvent<CanvasGroupUpdatedDetail>(CANVAS_GROUP_UPDATED_EVENT, detail);
}

export function emitCanvasRenameRequested(detail: CanvasRenameRequestedDetail): void {
  dispatchDetailEvent<CanvasRenameRequestedDetail>(
    CANVAS_RENAME_REQUESTED_EVENT,
    detail
  );
}

export function emitCanvasDeleteRequested(id?: string): void {
  dispatchDetailEvent<CanvasDeleteRequestedDetail>(CANVAS_DELETE_REQUESTED_EVENT, {
    id,
  });
}

export function emitCanvasTitleChanged(title: string): void {
  dispatchDetailEvent<CanvasTitleChangedDetail>(CANVAS_TITLE_CHANGED_EVENT, {
    title,
  });
}

export function emitCanvasListUpdated(
  canvases: CanvasBoardListItem[],
  activeId: string | null
): void {
  dispatchDetailEvent<CanvasListUpdatedDetail>(CANVAS_LIST_UPDATED_EVENT, {
    canvases,
    activeId,
  });
}

export function emitCanvasFavoriteToggleFailed(
  id: string,
  previousIsFavorite: boolean
): void {
  dispatchDetailEvent<CanvasFavoriteToggleFailedDetail>(
    CANVAS_FAVORITE_TOGGLE_FAILED_EVENT,
    {
      id,
      previousIsFavorite,
    }
  );
}

export function emitCanvasGroupUpdateFailed(
  id: string,
  previousGroupId: string | null,
  previousGroupName: string | null
): void {
  dispatchDetailEvent<CanvasGroupUpdateFailedDetail>(
    CANVAS_GROUP_UPDATE_FAILED_EVENT,
    {
      id,
      previousGroupId,
      previousGroupName,
    }
  );
}

export function isCanvasTitleEditedDetail(
  detail: unknown
): detail is CanvasTitleEditedDetail {
  return isRecord(detail) && typeof detail.title === 'string';
}

export function isCanvasSelectedDetail(
  detail: unknown
): detail is CanvasSelectedDetail {
  return isRecord(detail) && typeof detail.id === 'string';
}

export function isCanvasFavoriteToggledDetail(
  detail: unknown
): detail is CanvasFavoriteToggledDetail {
  if (!isRecord(detail)) return false;
  if (typeof detail.id !== 'string') return false;
  if (typeof detail.isFavorite !== 'boolean') return false;
  return (
    detail.previousIsFavorite === undefined ||
    typeof detail.previousIsFavorite === 'boolean'
  );
}

export function isCanvasGroupUpdatedDetail(
  detail: unknown
): detail is CanvasGroupUpdatedDetail {
  if (!isRecord(detail) || typeof detail.id !== 'string') return false;
  if (!('groupId' in detail) || !('groupName' in detail)) return false;
  const groupId = toNullableString(detail.groupId);
  const groupName = toNullableString(detail.groupName);
  if (groupId === null && detail.groupId !== null) return false;
  if (groupName === null && detail.groupName !== null) return false;
  return true;
}

export function isCanvasRenameRequestedDetail(
  detail: unknown
): detail is CanvasRenameRequestedDetail {
  return (
    isRecord(detail) &&
    typeof detail.id === 'string' &&
    typeof detail.name === 'string'
  );
}

export function isCanvasDeleteRequestedDetail(
  detail: unknown
): detail is CanvasDeleteRequestedDetail {
  if (!isRecord(detail)) return false;
  return detail.id === undefined || typeof detail.id === 'string';
}

export function isCanvasTitleChangedDetail(
  detail: unknown
): detail is CanvasTitleChangedDetail {
  return isRecord(detail) && typeof detail.title === 'string';
}

export function isCanvasListUpdatedDetail(
  detail: unknown
): detail is CanvasListUpdatedDetail {
  if (!isRecord(detail)) return false;
  if (!Array.isArray(detail.canvases)) return false;
  if (!detail.canvases.every((item) => isCanvasBoardListItem(item))) {
    return false;
  }
  if (!('activeId' in detail)) return false;
  return detail.activeId === null || typeof detail.activeId === 'string';
}

export function isCanvasFavoriteToggleFailedDetail(
  detail: unknown
): detail is CanvasFavoriteToggleFailedDetail {
  return (
    isRecord(detail) &&
    typeof detail.id === 'string' &&
    typeof detail.previousIsFavorite === 'boolean'
  );
}

export function isCanvasGroupUpdateFailedDetail(
  detail: unknown
): detail is CanvasGroupUpdateFailedDetail {
  if (!isRecord(detail) || typeof detail.id !== 'string') return false;
  if (!('previousGroupId' in detail) || !('previousGroupName' in detail)) {
    return false;
  }
  const previousGroupId = toNullableString(detail.previousGroupId);
  const previousGroupName = toNullableString(detail.previousGroupName);
  if (previousGroupId === null && detail.previousGroupId !== null) return false;
  if (previousGroupName === null && detail.previousGroupName !== null) {
    return false;
  }
  return true;
}
