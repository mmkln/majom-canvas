import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';

const PRIORITY_STROKE_WIDTH: Record<UiPriority, number> = {
  lowest: 1.2,
  low: 1.6,
  medium: 2,
  high: 2.4,
  highest: 2.8,
};

export function getPriorityStrokeWidth(priority: UiPriority): number {
  return PRIORITY_STROKE_WIDTH[priority];
}
