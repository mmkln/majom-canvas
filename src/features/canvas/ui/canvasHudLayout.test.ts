// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  applyCanvasHudCornerPosition,
  applyCanvasHudEdgeInset,
  CANVAS_HUD_EDGE_INSET_COMPACT_PX,
  CANVAS_HUD_EDGE_INSET_DEFAULT_PX,
  CANVAS_HUD_EDGE_INSET_VAR,
  getCanvasHudEdgeInsetPx,
} from './canvasHudLayout.ts';

describe('canvasHudLayout', () => {
  it('returns default and compact inset values', () => {
    expect(getCanvasHudEdgeInsetPx(false)).toBe(CANVAS_HUD_EDGE_INSET_DEFAULT_PX);
    expect(getCanvasHudEdgeInsetPx(true)).toBe(CANVAS_HUD_EDGE_INSET_COMPACT_PX);
  });

  it('applies inset CSS variable to the root', () => {
    const root = document.createElement('div');

    applyCanvasHudEdgeInset(root, true);

    expect(root.style.getPropertyValue(CANVAS_HUD_EDGE_INSET_VAR)).toBe(
      `${CANVAS_HUD_EDGE_INSET_COMPACT_PX}px`
    );
  });

  it('positions a HUD element against the requested corner', () => {
    const element = document.createElement('div');

    applyCanvasHudCornerPosition(element, 'bottom-right');

    expect(element.style.top).toBe('');
    expect(element.style.left).toBe('');
    expect(element.style.right).toBe(
      `var(${CANVAS_HUD_EDGE_INSET_VAR}, ${CANVAS_HUD_EDGE_INSET_DEFAULT_PX}px)`
    );
    expect(element.style.bottom).toBe(
      `var(${CANVAS_HUD_EDGE_INSET_VAR}, ${CANVAS_HUD_EDGE_INSET_DEFAULT_PX}px)`
    );
  });
});
