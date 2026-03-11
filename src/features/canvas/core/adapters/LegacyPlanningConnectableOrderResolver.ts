import type {
  ConnectableOrderResolver,
  IConnectable as CoreConnectable,
} from 'majom-canvas-core';
import { TaskElement } from '../../elements/TaskElement.ts';

export const legacyPlanningConnectableOrderResolver: ConnectableOrderResolver<
  CoreConnectable
> = ({ connectables, isCreatingConnection }) => {
  if (!isCreatingConnection) return connectables;

  const tasks = connectables.filter(
    (candidate): candidate is TaskElement & CoreConnectable =>
      candidate instanceof TaskElement
  );
  const others = connectables.filter(
    (candidate) => !(candidate instanceof TaskElement)
  );

  // InteractionManager scans in reverse order; keeping tasks last gives them hover/hit priority.
  return [...others, ...tasks];
};

