export const EXISTING_GOAL_EVENT_NAMES = {
  dragStateChanged: 'existingGoalDragStateChanged',
  dragMoved: 'existingGoalDragMoved',
  dropCompleted: 'existingGoalDropCompleted',
} as const;

export type ExistingGoalDragStateDetail = {
  active: boolean;
};

export type ExistingGoalDragMovedDetail = {
  clientX: number;
  clientY: number;
};

export type ExistingGoalDropCompletedDetail = {
  kind: 'existing-goal';
};

export const emitExistingGoalDragStateChanged = (active: boolean): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingGoalDragStateDetail>(
      EXISTING_GOAL_EVENT_NAMES.dragStateChanged,
      {
        detail: { active },
      }
    )
  );
};

export const emitExistingGoalDragMoved = (
  clientX: number,
  clientY: number
): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingGoalDragMovedDetail>(
      EXISTING_GOAL_EVENT_NAMES.dragMoved,
      {
        detail: { clientX, clientY },
      }
    )
  );
};

export const emitExistingGoalDropCompleted = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ExistingGoalDropCompletedDetail>(
      EXISTING_GOAL_EVENT_NAMES.dropCompleted,
      {
        detail: { kind: 'existing-goal' },
      }
    )
  );
};
