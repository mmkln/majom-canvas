import {
  TASK_STATUS_DONE_FILL,
  TASK_STATUS_DONE_BORDER,
  TASK_STATUS_IN_PROGRESS_FILL,
  TASK_STATUS_IN_PROGRESS_BORDER,
  TASK_STATUS_PENDING_FILL,
  TASK_STATUS_PENDING_BORDER,
  TASK_STATUS_DEFINED_FILL,
  TASK_STATUS_DEFINED_BORDER
} from '../constants.ts';
import { ElementStatus } from '../ElementStatus.ts';

export interface TaskStyle {
  fillColor: string;
  borderColor: string;
}

export const taskStyles: Record<ElementStatus, TaskStyle> = {
  done: {
    fillColor: TASK_STATUS_DONE_FILL,
    borderColor: TASK_STATUS_DONE_BORDER
  },
  'in-progress': {
    fillColor: TASK_STATUS_IN_PROGRESS_FILL,
    borderColor: TASK_STATUS_IN_PROGRESS_BORDER
  },
  pending: {
    fillColor: TASK_STATUS_PENDING_FILL,
    borderColor: TASK_STATUS_PENDING_BORDER
  },
  defined: {
    fillColor: TASK_STATUS_DEFINED_FILL,
    borderColor: TASK_STATUS_DEFINED_BORDER
  }
};
