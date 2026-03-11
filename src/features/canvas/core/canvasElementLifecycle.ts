import type { ElementStatus } from '../elements/ElementStatus.ts';
import type { TaskElement } from '../elements/TaskElement.ts';
import type { StoryElement } from '../elements/StoryElement.ts';
import type { GoalElement } from '../elements/GoalElement.ts';
import { isPlanningElement } from '../elements/utils/typeGuards.ts';

export type CanvasPlanningElement = TaskElement | StoryElement | GoalElement;

export type CanvasElementUpdatePatch = Partial<{
  title: string;
  description: string;
  status: ElementStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
}>;

export type CanvasElementDetailsEditedDetail = {
  element: CanvasPlanningElement;
  patch: CanvasElementUpdatePatch;
};

export type CanvasElementDeleteRequestedDetail = {
  element: CanvasPlanningElement;
};

export const CANVAS_ELEMENT_DETAILS_EDITED_EVENT = 'elementDetailsEdited';
export const CANVAS_ELEMENT_DELETE_REQUESTED_EVENT = 'elementDeleteRequested';

export function emitCanvasElementDetailsEdited(
  element: CanvasPlanningElement,
  patch: CanvasElementUpdatePatch
): void {
  if (typeof window === 'undefined') return;
  if (!patch || Object.keys(patch).length === 0) return;
  window.dispatchEvent(
    new CustomEvent<CanvasElementDetailsEditedDetail>(
      CANVAS_ELEMENT_DETAILS_EDITED_EVENT,
      {
        detail: { element, patch },
      }
    )
  );
}

export function emitCanvasElementDeleteRequested(
  element: CanvasPlanningElement
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CanvasElementDeleteRequestedDetail>(
      CANVAS_ELEMENT_DELETE_REQUESTED_EVENT,
      {
        detail: { element },
      }
    )
  );
}

export function isCanvasElementDetailsEditedDetail(
  detail: unknown
): detail is CanvasElementDetailsEditedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasElementDetailsEditedDetail>;
  if (!value.element || !isPlanningElement(value.element)) return false;
  if (!value.patch || typeof value.patch !== 'object') return false;
  return true;
}

export function isCanvasElementDeleteRequestedDetail(
  detail: unknown
): detail is CanvasElementDeleteRequestedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasElementDeleteRequestedDetail>;
  return Boolean(value.element) && isPlanningElement(value.element);
}
