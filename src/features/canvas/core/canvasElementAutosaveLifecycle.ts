export type CanvasElementAutosaveStatus =
  | 'queued'
  | 'saving'
  | 'saved'
  | 'failed';

export type CanvasElementAutosaveStatusDetail = {
  canvasId: string | null;
  status: CanvasElementAutosaveStatus;
  key?: string;
  error?: unknown;
};

export const CANVAS_ELEMENT_AUTOSAVE_STATUS_EVENT =
  'canvasElementAutosaveStatus';

export function emitCanvasElementAutosaveStatus(
  detail: CanvasElementAutosaveStatusDetail
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CanvasElementAutosaveStatusDetail>(
      CANVAS_ELEMENT_AUTOSAVE_STATUS_EVENT,
      {
        detail,
      }
    )
  );
}

export function isCanvasElementAutosaveStatusDetail(
  detail: unknown
): detail is CanvasElementAutosaveStatusDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasElementAutosaveStatusDetail>;
  const validStatus =
    value.status === 'queued' ||
    value.status === 'saving' ||
    value.status === 'saved' ||
    value.status === 'failed';
  const validCanvasId =
    value.canvasId === null || typeof value.canvasId === 'string';
  const validKey = value.key === undefined || typeof value.key === 'string';
  return validStatus && validCanvasId && validKey;
}
