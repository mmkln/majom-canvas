import {
  GOAL_STATUS_DEFINED_FILL,
  GOAL_STATUS_IN_PROGRESS_FILL,
  STORY_STATUS_DEFINED_BORDER,
  STORY_STATUS_IN_PROGRESS_BORDER,
} from '../constants.ts';
import { ElementStatus } from '../ElementStatus.ts';

export interface RoutineStyle {
  fillColor: string;
  borderColor: string;
}

export const routineStyles: Record<ElementStatus, RoutineStyle> = {
  done: {
    fillColor: GOAL_STATUS_DEFINED_FILL,
    borderColor: STORY_STATUS_DEFINED_BORDER,
  },
  'in-progress': {
    fillColor: GOAL_STATUS_IN_PROGRESS_FILL,
    borderColor: STORY_STATUS_IN_PROGRESS_BORDER,
  },
  pending: {
    fillColor: GOAL_STATUS_DEFINED_FILL,
    borderColor: STORY_STATUS_DEFINED_BORDER,
  },
  defined: {
    fillColor: GOAL_STATUS_DEFINED_FILL,
    borderColor: STORY_STATUS_DEFINED_BORDER,
  },
};
