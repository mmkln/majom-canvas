export type CanvasInteractionKind = 'drag' | 'resize' | 'select';

export const CANVAS_INTERACTION_START_EVENT = 'canvasInteractionStart';
export const CANVAS_INTERACTION_END_EVENT = 'canvasInteractionEnd';

function emitCanvasInteractionEvent(
  eventName: string,
  kind: CanvasInteractionKind
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName, { detail: { kind } }));
}

export function emitCanvasInteractionStart(
  kind: CanvasInteractionKind
): void {
  emitCanvasInteractionEvent(CANVAS_INTERACTION_START_EVENT, kind);
}

export function emitCanvasInteractionEnd(kind: CanvasInteractionKind): void {
  emitCanvasInteractionEvent(CANVAS_INTERACTION_END_EVENT, kind);
}
