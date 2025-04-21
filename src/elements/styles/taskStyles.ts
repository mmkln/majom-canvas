// src/elements/styles/taskStyles.ts
import {
  TASK_STATUS_DONE_FILL,
  TASK_STATUS_DONE_BORDER,
  TASK_STATUS_IN_PROGRESS_FILL,
  TASK_STATUS_IN_PROGRESS_BORDER,
  TASK_STATUS_PENDING_FILL,
  TASK_STATUS_PENDING_BORDER
} from '../constants.ts';

export interface TaskStyle {
  fillColor: string;
  borderColor: string;
}

export const taskStyles: Record<'pending' | 'in-progress' | 'done', TaskStyle> = {
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
  }
};
