export type ExistingPickerKind =
  | 'existing-goal'
  | 'existing-story'
  | 'existing-task'
  | 'existing-routine';

export const EXISTING_PICKER_EVENT_NAMES = {
  dragStateChanged: 'existingPickerDragStateChanged',
  dragMoved: 'existingPickerDragMoved',
  dropCompleted: 'existingPickerDropCompleted',
} as const;

export type ExistingPickerDragStateDetail = {
  kind: ExistingPickerKind;
  active: boolean;
};

export type ExistingPickerDragMovedDetail = {
  kind: ExistingPickerKind;
  clientX: number;
  clientY: number;
};

export type ExistingPickerDropCompletedDetail = {
  kind: ExistingPickerKind;
};

export const emitExistingPickerDragStateChanged = (
  kind: ExistingPickerKind,
  active: boolean
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingPickerDragStateDetail>(
      EXISTING_PICKER_EVENT_NAMES.dragStateChanged,
      {
        detail: { kind, active },
      }
    )
  );
};

export const emitExistingPickerDragMoved = (
  kind: ExistingPickerKind,
  clientX: number,
  clientY: number
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingPickerDragMovedDetail>(
      EXISTING_PICKER_EVENT_NAMES.dragMoved,
      {
        detail: { kind, clientX, clientY },
      }
    )
  );
};

export const emitExistingPickerDropCompleted = (
  kind: ExistingPickerKind
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingPickerDropCompletedDetail>(
      EXISTING_PICKER_EVENT_NAMES.dropCompleted,
      {
        detail: { kind },
      }
    )
  );
};
