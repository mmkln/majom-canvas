// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  AI_ASSISTANT_OPEN_STORAGE_KEY,
} from '../../shell/workspaceUiState.ts';
import { emitAiAssistantVisibilityChanged } from '../../ai-assistant/aiAssistantEvents.ts';
import { CanvasHudLayoutController } from './CanvasHudLayoutController.ts';
import {
  CANVAS_HUD_EDGE_INSET_COMPACT_PX,
  CANVAS_HUD_EDGE_INSET_DEFAULT_PX,
  CANVAS_HUD_EDGE_INSET_VAR,
} from './canvasHudLayout.ts';

describe('CanvasHudLayoutController', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies the persisted compact inset on mount', () => {
    localStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, '1');
    const root = document.createElement('div');
    const controller = new CanvasHudLayoutController();

    controller.mount(root);

    expect(root.style.getPropertyValue(CANVAS_HUD_EDGE_INSET_VAR)).toBe(
      `${CANVAS_HUD_EDGE_INSET_COMPACT_PX}px`
    );
  });

  it('updates the inset when chat visibility changes', () => {
    const root = document.createElement('div');
    const controller = new CanvasHudLayoutController();

    controller.mount(root);
    expect(root.style.getPropertyValue(CANVAS_HUD_EDGE_INSET_VAR)).toBe(
      `${CANVAS_HUD_EDGE_INSET_DEFAULT_PX}px`
    );

    emitAiAssistantVisibilityChanged(true);
    expect(root.style.getPropertyValue(CANVAS_HUD_EDGE_INSET_VAR)).toBe(
      `${CANVAS_HUD_EDGE_INSET_COMPACT_PX}px`
    );

    emitAiAssistantVisibilityChanged(false);
    expect(root.style.getPropertyValue(CANVAS_HUD_EDGE_INSET_VAR)).toBe(
      `${CANVAS_HUD_EDGE_INSET_DEFAULT_PX}px`
    );
  });
});
