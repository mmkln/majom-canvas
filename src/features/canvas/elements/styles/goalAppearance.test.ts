import { describe, expect, it } from 'vitest';
import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SELECT_COLOR,
} from '../../core/constants.ts';
import { ElementStatus } from '../ElementStatus.ts';
import { resolveGoalAppearance } from './goalAppearance.ts';

describe('resolveGoalAppearance', () => {
  it('keeps the selected outline when a goal is focused', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Defined,
      focused: true,
      highlighted: false,
      selected: true,
    });

    expect(appearance.fillColor).toBe('#a57aff');
    expect(appearance.selectionStrokeColor).toBe(SELECT_COLOR);
    expect(appearance.chromeColor).toBe(FOCUS_COLOR);
    expect(appearance.textColor).toBe('#f8fafc');
  });

  it('keeps the selected outline when a goal is highlighted', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Pending,
      focused: false,
      highlighted: true,
      selected: true,
    });

    expect(appearance.fillColor).toBe('#F2A03D');
    expect(appearance.selectionStrokeColor).toBe(SELECT_COLOR);
    expect(appearance.chromeColor).toBe(HIGHLIGHT_COLOR);
    expect(appearance.textColor).toBe('#f8fafc');
  });

  it('uses the status fill and readable text color outside interaction states', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.InProgress,
      focused: false,
      highlighted: false,
      selected: false,
    });

    expect(appearance.fillColor).toBe('#5A9FF2');
    expect(appearance.selectionStrokeColor).toBeNull();
    expect(appearance.textColor).toBe('#f8fafc');
  });
});
