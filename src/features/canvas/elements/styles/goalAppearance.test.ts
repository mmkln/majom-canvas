import { describe, expect, it } from 'vitest';
import { DEFAULT_CANVAS_THEME } from '../../theme/canvasTheme.ts';
import { ElementStatus } from '../ElementStatus.ts';
import { resolveGoalAppearance } from './goalAppearance.ts';

describe('resolveGoalAppearance', () => {
  it('keeps the selected outline when a goal is focused', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Defined,
      focused: true,
      highlighted: false,
      selected: true,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe('#a57aff');
    expect(appearance.selectionStrokeColor).toBe(DEFAULT_CANVAS_THEME.interaction.selection);
    expect(appearance.chromeColor).toBe(DEFAULT_CANVAS_THEME.interaction.focus);
    expect(appearance.textColor).toBe('#f8fafc');
  });

  it('keeps the selected outline when a goal is highlighted', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Pending,
      focused: false,
      highlighted: true,
      selected: true,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe('#F2A03D');
    expect(appearance.selectionStrokeColor).toBe(DEFAULT_CANVAS_THEME.interaction.selection);
    expect(appearance.chromeColor).toBe(DEFAULT_CANVAS_THEME.interaction.highlight);
    expect(appearance.textColor).toBe('#f8fafc');
  });

  it('uses the status fill and readable text color outside interaction states', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.InProgress,
      focused: false,
      highlighted: false,
      selected: false,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe('#5A9FF2');
    expect(appearance.selectionStrokeColor).toBeNull();
    expect(appearance.textColor).toBe('#f8fafc');
  });
});
