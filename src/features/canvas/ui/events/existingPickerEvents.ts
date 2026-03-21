export type ExistingPickerKind =
  | 'existing-goal'
  | 'existing-story'
  | 'existing-task';

export const EXISTING_PICKER_EVENT_NAMES = {
  dragStarted: 'existingPickerDragStarted',
  dragMoved: 'existingPickerDragMoved',
  dragEnded: 'existingPickerDragEnded',
  dropCompleted: 'existingPickerDropCompleted',
} as const;

export type ExistingPickerDragStartedDetail = {
  kind: ExistingPickerKind;
  item: unknown;
  title: string;
  clientX: number;
  clientY: number;
};

export type ExistingPickerDragMovedDetail = {
  kind: ExistingPickerKind;
  clientX: number;
  clientY: number;
};

export type ExistingPickerDragEndedDetail = {
  kind: ExistingPickerKind;
  item: unknown;
  title: string;
  clientX: number;
  clientY: number;
  cancelled?: boolean;
};

export type ExistingPickerDropCompletedDetail = {
  kind: ExistingPickerKind;
};

export const emitExistingPickerDragStarted = (
  kind: ExistingPickerKind,
  item: unknown,
  title: string,
  clientX: number,
  clientY: number
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingPickerDragStartedDetail>(
      EXISTING_PICKER_EVENT_NAMES.dragStarted,
      {
        detail: { kind, item, title, clientX, clientY },
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

export const emitExistingPickerDragEnded = (
  kind: ExistingPickerKind,
  item: unknown,
  title: string,
  clientX: number,
  clientY: number,
  cancelled: boolean = false
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingPickerDragEndedDetail>(
      EXISTING_PICKER_EVENT_NAMES.dragEnded,
      {
        detail: { kind, item, title, clientX, clientY, cancelled },
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
