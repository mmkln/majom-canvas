export enum ElementStatus {
  Defined = 'defined',
  Pending = 'pending',
  InProgress = 'in-progress',
  Done = 'done'
}

const ELEMENT_STATUS_LABELS: Record<ElementStatus, string> = {
  [ElementStatus.Defined]: 'Defined',
  [ElementStatus.Pending]: 'Pending',
  [ElementStatus.InProgress]: 'In Progress',
  [ElementStatus.Done]: 'Done'
};

export const ELEMENT_STATUS_VALUES: ElementStatus[] = [
  ElementStatus.Defined,
  ElementStatus.Pending,
  ElementStatus.InProgress,
  ElementStatus.Done
];

export const ELEMENT_STATUS_OPTIONS: { value: ElementStatus; label: string }[] =
  ELEMENT_STATUS_VALUES.map((value: ElementStatus) => ({
    value,
    label: ELEMENT_STATUS_LABELS[value]
  }));
