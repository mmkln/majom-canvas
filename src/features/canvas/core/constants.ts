import { DEFAULT_CANVAS_THEME } from '../theme/canvasTheme.ts';

const palette = DEFAULT_CANVAS_THEME;

// Unified color constant for selected and hover highlights across the canvas
export const SELECT_COLOR = palette.interaction.selection;
export const FOCUS_COLOR = palette.interaction.focus;
export const HIGHLIGHT_COLOR = palette.interaction.highlight;
export const FOCUS_STORY_FILL = palette.interaction.storyFocusFill;
export const HIGHLIGHT_STORY_FILL = palette.interaction.storyHighlightFill;
export const HOVER_OVERLAY_FILL = palette.interaction.hoverOverlayFill;
export const HOVER_OUTLINE_COLOR = palette.interaction.hoverOutline;
// Region selection colors
export const REGION_SELECT_BORDER_COLOR = palette.interaction.regionSelectionBorder;
export const REGION_SELECT_FILL = palette.interaction.regionSelectionFill;
export const TASK_DROP_PLACEHOLDER_FILL = palette.interaction.taskDropPlaceholderFill;
export const SMART_GUIDE_COLOR = palette.guides.smartGuide;
export const SMART_GUIDE_SPACING_COLOR = palette.guides.spacing;
export const SMART_GUIDE_CONTAINER_COLOR = palette.guides.container;
export const SMART_GUIDE_VIEWPORT_CENTER_COLOR = palette.guides.viewportCenter;
export const SMART_GUIDE_LABEL_COLOR = palette.guides.label;
export const SMART_GUIDE_LINE_WIDTH = 1.5;
// Font settings
export const FONT_FAMILY = 'Arial';
export const TITLE_FONT_SIZE = 14; // px
export const SMALL_FONT_SIZE = 12; // px
// Render LOD thresholds (scale values)
export const SHOW_DETAILS_SCALE = 0.55;
export const SHOW_TASK_TEXT_SCALE = 0.25;
export const SHOW_STORY_TEXT_SCALE = 0.15;
export const SHOW_GOAL_TEXT_SCALE = 0.15;
export const SHOW_ANIM_SCALE = 0.2;
