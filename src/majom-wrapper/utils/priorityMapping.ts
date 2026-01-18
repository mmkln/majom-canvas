import { Priority } from '../interfaces/index.ts';

type UiPriority = 'low' | 'medium' | 'high';

/**
 * Map UI priority to backend Priority enum
 */
export function mapPriorityToBackend(priority: UiPriority): Priority {
  switch (priority) {
    case 'low':
      return Priority.Low;
    case 'high':
      return Priority.High;
    case 'medium':
    default:
      return Priority.Medium;
  }
}
