import {
  SMART_GUIDE_COLOR,
  SMART_GUIDE_CONTAINER_COLOR,
  SMART_GUIDE_LABEL_COLOR,
  SMART_GUIDE_LINE_WIDTH,
  SMART_GUIDE_SPACING_COLOR,
  SMART_GUIDE_VIEWPORT_CENTER_COLOR,
} from '../../core/constants.ts';

export type AlignmentPresentationTheme = {
  color: string;
  spacingColor: string;
  containerColor: string;
  viewportCenterColor: string;
  labelColor: string;
  lineWidth: number;
};

export const DEFAULT_ALIGNMENT_PRESENTATION_THEME: AlignmentPresentationTheme = {
  color: SMART_GUIDE_COLOR,
  spacingColor: SMART_GUIDE_SPACING_COLOR,
  containerColor: SMART_GUIDE_CONTAINER_COLOR,
  viewportCenterColor: SMART_GUIDE_VIEWPORT_CENTER_COLOR,
  labelColor: SMART_GUIDE_LABEL_COLOR,
  lineWidth: SMART_GUIDE_LINE_WIDTH,
};
