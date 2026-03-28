export const CANVAS_HUD_EDGE_INSET_VAR = '--canvas-hud-edge-inset';
export const CANVAS_HUD_EDGE_INSET_DEFAULT_PX = 16;
export const CANVAS_HUD_EDGE_INSET_COMPACT_PX = 8;

export type CanvasHudCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left';

export function getCanvasHudEdgeInsetPx(compact: boolean): number {
  return compact
    ? CANVAS_HUD_EDGE_INSET_COMPACT_PX
    : CANVAS_HUD_EDGE_INSET_DEFAULT_PX;
}

export function applyCanvasHudEdgeInset(
  root: HTMLElement,
  compact: boolean
): void {
  root.style.setProperty(
    CANVAS_HUD_EDGE_INSET_VAR,
    `${getCanvasHudEdgeInsetPx(compact)}px`
  );
}

export function applyCanvasHudCornerPosition(
  element: HTMLElement,
  corner: CanvasHudCorner
): void {
  const insetValue = `var(${CANVAS_HUD_EDGE_INSET_VAR}, ${CANVAS_HUD_EDGE_INSET_DEFAULT_PX}px)`;
  element.style.top = '';
  element.style.right = '';
  element.style.bottom = '';
  element.style.left = '';

  if (corner === 'top-left' || corner === 'top-right') {
    element.style.top = insetValue;
  }
  if (corner === 'bottom-left' || corner === 'bottom-right') {
    element.style.bottom = insetValue;
  }
  if (corner === 'top-left' || corner === 'bottom-left') {
    element.style.left = insetValue;
  }
  if (corner === 'top-right' || corner === 'bottom-right') {
    element.style.right = insetValue;
  }
}
