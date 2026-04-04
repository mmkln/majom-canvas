import { DEFAULT_CANVAS_THEME } from '../theme/canvasTheme.ts';

const palette = DEFAULT_CANVAS_THEME;

// Element-level style constants

// Story status colors
export const STORY_STATUS_DONE_FILL = palette.nodes.story.status.done.fill;
export const STORY_STATUS_DONE_BORDER = palette.nodes.story.status.done.border;
export const STORY_STATUS_IN_PROGRESS_FILL =
  palette.nodes.story.status['in-progress'].fill;
export const STORY_STATUS_IN_PROGRESS_BORDER =
  palette.nodes.story.status['in-progress'].border;
export const STORY_STATUS_PENDING_FILL =
  palette.nodes.story.status.pending.fill;
export const STORY_STATUS_PENDING_BORDER =
  palette.nodes.story.status.pending.border;
export const STORY_STATUS_DEFINED_FILL =
  palette.nodes.story.status.defined.fill;
export const STORY_STATUS_DEFINED_BORDER =
  palette.nodes.story.status.defined.border;

// Task status colors
export const TASK_STATUS_DONE_FILL = palette.nodes.task.status.done.fill;
export const TASK_STATUS_DONE_BORDER = palette.nodes.task.status.done.border;
export const TASK_STATUS_IN_PROGRESS_FILL =
  palette.nodes.task.status['in-progress'].fill;
export const TASK_STATUS_IN_PROGRESS_BORDER =
  palette.nodes.task.status['in-progress'].border;
export const TASK_STATUS_PENDING_FILL = palette.nodes.task.status.pending.fill;
export const TASK_STATUS_PENDING_BORDER =
  palette.nodes.task.status.pending.border;
export const TASK_STATUS_DEFINED_FILL = palette.nodes.task.status.defined.fill;
export const TASK_STATUS_DEFINED_BORDER =
  palette.nodes.task.status.defined.border;

// Goal status colors
export const GOAL_STATUS_DONE_FILL = palette.nodes.goal.status.done.fill;
export const GOAL_STATUS_DONE_BORDER = palette.nodes.goal.status.done.border;
export const GOAL_STATUS_IN_PROGRESS_FILL =
  palette.nodes.goal.status['in-progress'].fill;
export const GOAL_STATUS_IN_PROGRESS_BORDER =
  palette.nodes.goal.status['in-progress'].border;
export const GOAL_STATUS_PENDING_FILL = palette.nodes.goal.status.pending.fill;
export const GOAL_STATUS_PENDING_BORDER =
  palette.nodes.goal.status.pending.border;
export const GOAL_STATUS_DEFINED_FILL = palette.nodes.goal.status.defined.fill;
export const GOAL_STATUS_DEFINED_BORDER =
  palette.nodes.goal.status.defined.border;

// Habit state colors
export const HABIT_ACTIVE_FILL = '#3B82F6';
export const HABIT_ACTIVE_BORDER = 'transparent';
export const HABIT_ARCHIVED_FILL = '#CBD5E1';
export const HABIT_ARCHIVED_BORDER = 'transparent';
