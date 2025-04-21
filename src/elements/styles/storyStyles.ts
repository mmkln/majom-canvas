import {
  STORY_STATUS_DONE_FILL,
  STORY_STATUS_DONE_BORDER,
  STORY_STATUS_PENDING_FILL,
  STORY_STATUS_PENDING_BORDER,
  STORY_FILL_COLOR,
  STORY_BORDER_COLOR
} from '../../core/constants.ts';

export interface StoryStyle {
  fillColor: string;
  borderColor: string;
}

export const storyStyles: Record<'pending' | 'in-progress' | 'done', StoryStyle> = {
  done: {
    fillColor: STORY_STATUS_DONE_FILL,
    borderColor: STORY_STATUS_DONE_BORDER
  },
  'in-progress': {
    fillColor: STORY_FILL_COLOR,
    borderColor: STORY_BORDER_COLOR
  },
  pending: {
    fillColor: STORY_STATUS_PENDING_FILL,
    borderColor: STORY_STATUS_PENDING_BORDER
  }
};
