import {
  STORY_STATUS_DONE_FILL,
  STORY_STATUS_DONE_BORDER,
  STORY_STATUS_IN_PROGRESS_FILL,
  STORY_STATUS_IN_PROGRESS_BORDER,
  STORY_STATUS_PENDING_FILL,
  STORY_STATUS_PENDING_BORDER,
  STORY_STATUS_DEFINED_FILL,
  STORY_STATUS_DEFINED_BORDER
} from '../constants.ts';

export interface StoryStyle {
  fillColor: string;
  borderColor: string;
}

export const storyStyles: Record<'pending' | 'in-progress' | 'done' | 'defined', StoryStyle> = {
  done: {
    fillColor: STORY_STATUS_DONE_FILL,
    borderColor: STORY_STATUS_DONE_BORDER
  },
  'in-progress': {
    fillColor: STORY_STATUS_IN_PROGRESS_FILL,
    borderColor: STORY_STATUS_IN_PROGRESS_BORDER
  },
  pending: {
    fillColor: STORY_STATUS_PENDING_FILL,
    borderColor: STORY_STATUS_PENDING_BORDER
  },
  defined: {
    fillColor: STORY_STATUS_DEFINED_FILL,
    borderColor: STORY_STATUS_DEFINED_BORDER
  }
};
