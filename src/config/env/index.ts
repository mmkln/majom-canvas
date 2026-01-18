export const CANVAS_PERF_LOG = import.meta.env.VITE_CANVAS_PERF_LOG === 'true';

const parseOptionalNumber = (value?: string): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const CONTENT_TYPE_IDS = {
  task: parseOptionalNumber(import.meta.env.VITE_CONTENT_TYPE_TASK),
  story: parseOptionalNumber(import.meta.env.VITE_CONTENT_TYPE_STORY),
  goal: parseOptionalNumber(import.meta.env.VITE_CONTENT_TYPE_GOAL),
};
