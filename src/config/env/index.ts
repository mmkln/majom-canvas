const DEFAULT_API_URL = 'https://mxll.pythonanywhere.com';

const parseOptionalBoolean = (value?: string): boolean | null => {
  if (value === undefined) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const parseOptionalString = (value?: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const resolveBoardsFeatureFlag = (
  value?: string,
  legacyDevValue?: string
): boolean =>
  parseOptionalBoolean(value) ?? parseOptionalBoolean(legacyDevValue) ?? true;

export const IS_DEVELOPMENT_MODE = __DEV_BUILD__;
export const CANVAS_PERF_LOG =
  parseOptionalBoolean(import.meta.env.VITE_CANVAS_PERF_LOG) ?? false;
export const BOARDS_ENABLED = resolveBoardsFeatureFlag(
  import.meta.env.VITE_ENABLE_BOARDS,
  import.meta.env.VITE_ENABLE_BOARDS_DEV
);
export const BOARDS_DEV_ENABLED = BOARDS_ENABLED;
export const KANBAN_DEV_ENABLED =
  IS_DEVELOPMENT_MODE &&
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_KANBAN_DEV) ?? true);
export const FLOWS_DEV_ENABLED =
  IS_DEVELOPMENT_MODE &&
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_FLOWS_DEV) ?? true);
export const FOCUS_BOARD_DEV_ENABLED =
  IS_DEVELOPMENT_MODE &&
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_FOCUS_BOARD_DEV) ?? true);
export const LEARNING_STUDIO_DEV_ENABLED =
  IS_DEVELOPMENT_MODE &&
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_LEARNING_STUDIO_DEV) ??
    true);
export const TIME_CLUSTERING_DEV_ENABLED =
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_TIME_CLUSTERING_DEV) ??
    true);
export const ROUTINES_ENABLED =
  parseOptionalBoolean(import.meta.env.VITE_ENABLE_ROUTINES) ?? true;
export const API_URL =
  parseOptionalString(import.meta.env.VITE_API_URL) ?? DEFAULT_API_URL;
// Allow the browser-exposed Grok key only for development-mode runs/builds.
export const GROK_API_KEY =
  IS_DEVELOPMENT_MODE
    ? (parseOptionalString(import.meta.env.VITE_GROK_API_KEY) ?? '')
    : '';
