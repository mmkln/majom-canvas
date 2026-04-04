import { ElementStatus } from '../ElementStatus.ts';
import type { CanvasThemePalette } from '../../theme/canvasTheme.ts';
import { getGoalStyle } from './goalStyles.ts';

export type GoalAppearanceState = {
  status: ElementStatus;
  focused: boolean;
  highlighted: boolean;
  selected: boolean;
};

export type GoalAppearance = {
  fillColor: string;
  chromeColor: string;
  selectionStrokeColor: string | null;
  textColor: string;
};

export function resolveGoalAppearance(
  state: GoalAppearanceState,
  palette: CanvasThemePalette
): GoalAppearance {
  const style = getGoalStyle(state.status, palette);
  const fillColor = state.focused
    ? palette.interaction.goalFocusFill
    : state.highlighted
      ? palette.interaction.goalHighlightFill
      : style.fillColor;

  return {
    fillColor,
    chromeColor: state.focused
      ? palette.interaction.focus
      : state.highlighted
        ? palette.interaction.highlight
        : style.borderColor,
    selectionStrokeColor: state.selected ? palette.interaction.selection : null,
    textColor: state.focused
      ? palette.interaction.goalFocusText
      : state.highlighted
        ? palette.interaction.goalHighlightText
        : style.textColor,
  };
}
