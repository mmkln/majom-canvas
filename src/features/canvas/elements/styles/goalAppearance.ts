import { ElementStatus } from '../ElementStatus.ts';
import type { CanvasThemePalette } from '../../theme/canvasTheme.ts';
import { getGoalStyle } from './goalStyles.ts';

const GOAL_FOCUS_FILL = '#a57aff';
const GOAL_HIGHLIGHT_FILL = '#F2A03D';

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
  const hasInteractionFill = state.focused || state.highlighted;
  const fillColor = state.focused
    ? GOAL_FOCUS_FILL
    : state.highlighted
      ? GOAL_HIGHLIGHT_FILL
      : style.fillColor;

  return {
    fillColor,
    chromeColor: state.focused
      ? palette.interaction.focus
      : state.highlighted
        ? palette.interaction.highlight
        : style.borderColor,
    selectionStrokeColor: state.selected ? palette.interaction.selection : null,
    textColor: hasInteractionFill ? '#f8fafc' : style.textColor,
  };
}
