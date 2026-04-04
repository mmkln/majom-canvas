import { describe, expect, it } from 'vitest';
import { DEFAULT_CANVAS_THEME, resolveCanvasTheme, type CanvasThemePalette } from '../../theme/canvasTheme.ts';
import { ElementStatus } from '../ElementStatus.ts';
import { resolveGoalAppearance } from './goalAppearance.ts';

function getHexChannelPair(value: string, startIndex: number): number {
  return Number.parseInt(value.slice(startIndex, startIndex + 2), 16);
}

function getRelativeLuminance(hexColor: string): number {
  const red = getHexChannelPair(hexColor, 1) / 255;
  const green = getHexChannelPair(hexColor, 3) / 255;
  const blue = getHexChannelPair(hexColor, 5) / 255;
  const toLinear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
}

function getContrastRatio(foreground: string, background: string): number {
  const foregroundL = getRelativeLuminance(foreground);
  const backgroundL = getRelativeLuminance(background);
  const lighter = Math.max(foregroundL, backgroundL);
  const darker = Math.min(foregroundL, backgroundL);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('resolveGoalAppearance', () => {
  it('keeps the selected outline when a goal is focused', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Defined,
      focused: true,
      highlighted: false,
      selected: true,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe(DEFAULT_CANVAS_THEME.interaction.goalFocusFill);
    expect(appearance.selectionStrokeColor).toBe(DEFAULT_CANVAS_THEME.interaction.selection);
    expect(appearance.chromeColor).toBe(DEFAULT_CANVAS_THEME.interaction.focus);
    expect(appearance.textColor).toBe(DEFAULT_CANVAS_THEME.interaction.goalFocusText);
  });

  it('keeps the selected outline when a goal is highlighted', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.Pending,
      focused: false,
      highlighted: true,
      selected: true,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe(DEFAULT_CANVAS_THEME.interaction.goalHighlightFill);
    expect(appearance.selectionStrokeColor).toBe(DEFAULT_CANVAS_THEME.interaction.selection);
    expect(appearance.chromeColor).toBe(DEFAULT_CANVAS_THEME.interaction.highlight);
    expect(appearance.textColor).toBe(DEFAULT_CANVAS_THEME.interaction.goalHighlightText);
  });

  it('uses the status fill and status text color outside interaction states', () => {
    const appearance = resolveGoalAppearance({
      status: ElementStatus.InProgress,
      focused: false,
      highlighted: false,
      selected: false,
    }, DEFAULT_CANVAS_THEME);

    expect(appearance.fillColor).toBe('#5A9FF2');
    expect(appearance.selectionStrokeColor).toBeNull();
    expect(appearance.textColor).toBe(DEFAULT_CANVAS_THEME.nodes.goal.status[ElementStatus.InProgress].text);
  });

  it.each([
    ['light', DEFAULT_CANVAS_THEME],
    ['dark', resolveCanvasTheme('dark')],
  ])('uses light focus/highlight goal text in %s theme', (_themeName, palette: CanvasThemePalette) => {
    const focused = resolveGoalAppearance(
      { status: ElementStatus.Defined, focused: true, highlighted: false, selected: true },
      palette
    );
    const highlighted = resolveGoalAppearance(
      { status: ElementStatus.Defined, focused: false, highlighted: true, selected: true },
      palette
    );

    expect(focused.textColor).toBe('#f8fafc');
    expect(highlighted.textColor).toBe('#f8fafc');
    expect(getContrastRatio(palette.interaction.selection, focused.fillColor)).toBeGreaterThanOrEqual(2);
    expect(getContrastRatio(palette.interaction.selection, highlighted.fillColor)).toBeGreaterThanOrEqual(2);
  });
});
