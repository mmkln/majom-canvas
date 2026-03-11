import type { ICanvasElement } from './interfaces/canvasElement.ts';

export type CanvasContextMenuDetail = {
  element: ICanvasElement | null;
  sceneX: number;
  sceneY: number;
};

export const CANVAS_CONTEXT_MENU_REQUESTED_EVENT = 'contextMenuRequested';

export function emitCanvasContextMenuRequested(
  detail: CanvasContextMenuDetail
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CanvasContextMenuDetail>(
      CANVAS_CONTEXT_MENU_REQUESTED_EVENT,
      {
        detail,
      }
    )
  );
}

export function isCanvasContextMenuDetail(
  detail: unknown
): detail is CanvasContextMenuDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasContextMenuDetail>;
  return (
    typeof value.sceneX === 'number' &&
    Number.isFinite(value.sceneX) &&
    typeof value.sceneY === 'number' &&
    Number.isFinite(value.sceneY)
  );
}
