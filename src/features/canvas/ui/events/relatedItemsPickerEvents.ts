import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';

export type RelatedItemsPickerRequestedDetail = {
  element: ICanvasElement;
};

export const RELATED_ITEMS_PICKER_REQUESTED_EVENT =
  'relatedItemsPickerRequested';

export function emitRelatedItemsPickerRequested(
  element: ICanvasElement
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<RelatedItemsPickerRequestedDetail>(
      RELATED_ITEMS_PICKER_REQUESTED_EVENT,
      {
        detail: { element },
      }
    )
  );
}

export function isRelatedItemsPickerRequestedDetail(
  detail: unknown
): detail is RelatedItemsPickerRequestedDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<RelatedItemsPickerRequestedDetail>;
  return Boolean(value.element);
}
