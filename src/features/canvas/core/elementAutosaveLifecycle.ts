export type ElementAutosaveStatus = {
  status: 'saving' | 'saved' | 'failed';
  error?: unknown;
};

export const ELEMENT_AUTOSAVE_STATUS_EVENT = 'elementAutosaveStatus';

export function emitElementAutosaveStatus(status: ElementAutosaveStatus): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ElementAutosaveStatus>(ELEMENT_AUTOSAVE_STATUS_EVENT, {
      detail: status,
    })
  );
}
