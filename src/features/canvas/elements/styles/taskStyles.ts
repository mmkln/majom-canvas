import { ElementStatus } from '../ElementStatus.ts';
import type { CanvasThemePalette } from '../../theme/canvasTheme.ts';

export interface TaskStyle {
  fillColor: string;
  borderColor: string;
  textColor: string;
}

export function getTaskStyle(
  status: ElementStatus,
  palette: CanvasThemePalette
): TaskStyle {
  const nodeStyle = palette.nodes.task.status[status];
  return {
    fillColor: nodeStyle.fill,
    borderColor: nodeStyle.border,
    textColor: nodeStyle.text,
  };
}
