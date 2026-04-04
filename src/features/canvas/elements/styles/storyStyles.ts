import { ElementStatus } from '../ElementStatus.ts';
import type { CanvasThemePalette } from '../../theme/canvasTheme.ts';

export interface StoryStyle {
  fillColor: string;
  borderColor: string;
  textColor: string;
}

export function getStoryStyle(
  status: ElementStatus,
  palette: CanvasThemePalette
): StoryStyle {
  const nodeStyle = palette.nodes.story.status[status];
  return {
    fillColor: nodeStyle.fill,
    borderColor: nodeStyle.border,
    textColor: nodeStyle.text,
  };
}
