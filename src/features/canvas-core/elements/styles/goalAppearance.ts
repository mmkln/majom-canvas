import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SELECT_COLOR,
} from '../../core/constants.ts';
import { ElementStatus } from '../ElementStatus.ts';
import { goalStyles } from './goalStyles.ts';

const GOAL_FOCUS_FILL = '#a57aff';
const GOAL_HIGHLIGHT_FILL = '#F2A03D';
const GOAL_TEXT_COLOR_LIGHT = '#f8fafc';
const GOAL_TEXT_COLOR_DARK = '#0f172a';

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

function getHexChannelPair(value: string, startIndex: number): number | null {
  const pair = value.slice(startIndex, startIndex + 2);
  if (pair.length !== 2) return null;
  const parsed = Number.parseInt(pair, 16);
  return Number.isNaN(parsed) ? null : parsed;
}

function getGoalTextColor(fillColor: string): string {
  if (!fillColor.startsWith('#') || fillColor.length !== 7) {
    return GOAL_TEXT_COLOR_DARK;
  }

  const red = getHexChannelPair(fillColor, 1);
  const green = getHexChannelPair(fillColor, 3);
  const blue = getHexChannelPair(fillColor, 5);
  if (red === null || green === null || blue === null) {
    return GOAL_TEXT_COLOR_DARK;
  }

  const perceivedBrightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return perceivedBrightness < 150
    ? GOAL_TEXT_COLOR_LIGHT
    : GOAL_TEXT_COLOR_DARK;
}

export function resolveGoalAppearance(
  state: GoalAppearanceState
): GoalAppearance {
  const style = goalStyles[state.status];
  const hasInteractionFill = state.focused || state.highlighted;
  const fillColor = state.focused
    ? GOAL_FOCUS_FILL
    : state.highlighted
      ? GOAL_HIGHLIGHT_FILL
      : style.fillColor;

  return {
    fillColor,
    chromeColor: state.focused
      ? FOCUS_COLOR
      : state.highlighted
        ? HIGHLIGHT_COLOR
        : style.borderColor,
    selectionStrokeColor: state.selected ? SELECT_COLOR : null,
    textColor: hasInteractionFill
      ? GOAL_TEXT_COLOR_LIGHT
      : getGoalTextColor(fillColor),
  };
}
