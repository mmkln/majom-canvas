import type { IPlanningElement } from '../elements/interfaces/planningElement.ts';

export type CanvasPositionsDirtyDetail = {
  elements: IPlanningElement[];
};

export const CANVAS_POSITIONS_DIRTY_EVENT = 'canvasPositionsDirty';

export function emitCanvasPositionsDirty(elements: IPlanningElement[]): void {
  if (typeof window === 'undefined') return;
  if (elements.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<CanvasPositionsDirtyDetail>(CANVAS_POSITIONS_DIRTY_EVENT, {
      detail: { elements },
    })
  );
}

export function isCanvasPositionsDirtyDetail(
  detail: unknown
): detail is CanvasPositionsDirtyDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasPositionsDirtyDetail>;
  return Array.isArray(value.elements);
}
