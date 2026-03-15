export type CanvasAutosaveToggleDetail = {
  enabled: boolean;
};

export const CANVAS_AUTOSAVE_TOGGLE_EVENT = 'canvasAutosaveToggled';

export function emitCanvasAutosaveToggled(enabled: boolean): void {
  window.dispatchEvent(
    new CustomEvent<CanvasAutosaveToggleDetail>(CANVAS_AUTOSAVE_TOGGLE_EVENT, {
      detail: { enabled },
    })
  );
}

export function isCanvasAutosaveToggleDetail(
  detail: unknown
): detail is CanvasAutosaveToggleDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasAutosaveToggleDetail>;
  return typeof value.enabled === 'boolean';
}
