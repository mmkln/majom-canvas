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

export const CANVAS_PERF_LOG =
  parseOptionalBoolean(import.meta.env.VITE_CANVAS_PERF_LOG) ?? false;
export const KANBAN_DEV_ENABLED =
  import.meta.env.DEV &&
  (parseOptionalBoolean(import.meta.env.VITE_ENABLE_KANBAN_DEV) ?? true);
export const API_URL =
  parseOptionalString(import.meta.env.VITE_API_URL) ?? DEFAULT_API_URL;
