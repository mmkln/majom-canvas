import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';

export const CANVAS_QUICK_CREATE_TASK_REQUESTED_EVENT =
  'canvasQuickCreateTaskRequested';

export type CanvasQuickCreateTaskRequestedDetail = {
  element?: ICanvasElement | null;
};

export function emitCanvasQuickCreateTaskRequested(
  element: ICanvasElement
): void {
  window.dispatchEvent(
    new CustomEvent<CanvasQuickCreateTaskRequestedDetail>(
      CANVAS_QUICK_CREATE_TASK_REQUESTED_EVENT,
      {
        detail: { element },
      }
    )
  );
}
