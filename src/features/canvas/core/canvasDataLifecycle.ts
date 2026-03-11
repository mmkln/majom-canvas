export const CANVAS_REFRESH_DATA_EVENT = 'refreshCanvasData';
export const CANVAS_SAVE_LAYOUT_REQUESTED_EVENT = 'saveCanvasLayout';

export function emitCanvasSaveLayoutRequested(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CANVAS_SAVE_LAYOUT_REQUESTED_EVENT));
}
