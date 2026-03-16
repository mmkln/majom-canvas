import { Priority } from '../interfaces/index.ts';

export const UI_PRIORITY_VALUES = [
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
] as const;

export type UiPriority = (typeof UI_PRIORITY_VALUES)[number];

const UI_PRIORITY_SET: ReadonlySet<string> = new Set(UI_PRIORITY_VALUES);

export function isUiPriority(value: unknown): value is UiPriority {
  return typeof value === 'string' && UI_PRIORITY_SET.has(value);
}

export function normalizeUiPriority(
  value: unknown,
  fallback: UiPriority = 'low'
): UiPriority {
  return isUiPriority(value) ? value : fallback;
}

/**
 * Map UI priority to backend Priority enum
 */
export function mapPriorityToBackend(priority: UiPriority): Priority {
  switch (priority) {
    case 'lowest':
      return Priority.Lowest;
    case 'low':
      return Priority.Low;
    case 'highest':
      return Priority.Highest;
    case 'high':
      return Priority.High;
    case 'medium':
    default:
      return Priority.Medium;
  }
}
