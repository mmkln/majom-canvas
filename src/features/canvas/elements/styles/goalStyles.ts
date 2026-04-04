import { ElementStatus } from '../ElementStatus.ts';
import type { CanvasThemePalette } from '../../theme/canvasTheme.ts';

export interface GoalStyle {
  fillColor: string;
  borderColor: string;
  textColor: string;
}

export function getGoalStyle(
  status: ElementStatus,
  palette: CanvasThemePalette
): GoalStyle {
  const nodeStyle = palette.nodes.goal.status[status];
  return {
    fillColor: nodeStyle.fill,
    borderColor: nodeStyle.border,
    textColor: nodeStyle.text,
  };
}
