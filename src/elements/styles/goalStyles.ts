import { 
  GOAL_STATUS_DONE_FILL, 
  GOAL_STATUS_DONE_BORDER, 
  GOAL_STATUS_IN_PROGRESS_FILL, 
  GOAL_STATUS_IN_PROGRESS_BORDER, 
  GOAL_STATUS_PENDING_FILL, 
  GOAL_STATUS_PENDING_BORDER,
  GOAL_STATUS_DEFINED_FILL,
  GOAL_STATUS_DEFINED_BORDER
} from "../constants.ts";

export interface GoalStyle {
  fillColor: string;
  borderColor: string;
}

export const goalStyles: Record<'pending' | 'in-progress' | 'done' | 'defined', GoalStyle> = {
  done: {
    fillColor: GOAL_STATUS_DONE_FILL,
    borderColor: GOAL_STATUS_DONE_BORDER
  },
  'in-progress': {
    fillColor: GOAL_STATUS_IN_PROGRESS_FILL,
    borderColor: GOAL_STATUS_IN_PROGRESS_BORDER
  },
  pending: {
    fillColor: GOAL_STATUS_PENDING_FILL,
    borderColor: GOAL_STATUS_PENDING_BORDER
  },
  defined: {
    fillColor: GOAL_STATUS_DEFINED_FILL,
    borderColor: GOAL_STATUS_DEFINED_BORDER
  }
};
