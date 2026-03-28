export type CanvasSaveSource = 'manual' | 'autosave';

export type CanvasSaveLifecycleAction = 'started' | 'finished';

export type CanvasSaveLifecycleDetail = {
  action: CanvasSaveLifecycleAction;
  source: CanvasSaveSource;
};

export const CANVAS_SAVE_LIFECYCLE_EVENT = 'canvasSaveLifecycle';

function emitCanvasSaveLifecycle(detail: CanvasSaveLifecycleDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CanvasSaveLifecycleDetail>(CANVAS_SAVE_LIFECYCLE_EVENT, {
      detail,
    })
  );
}

export function emitCanvasSaveStarted(source: CanvasSaveSource): void {
  emitCanvasSaveLifecycle({ action: 'started', source });
}

export function emitCanvasSaveFinished(source: CanvasSaveSource): void {
  emitCanvasSaveLifecycle({ action: 'finished', source });
}

export function isCanvasSaveLifecycleDetail(
  detail: unknown
): detail is CanvasSaveLifecycleDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasSaveLifecycleDetail>;
  const validAction = value.action === 'started' || value.action === 'finished';
  const validSource = value.source === 'manual' || value.source === 'autosave';
  return validAction && validSource;
}
