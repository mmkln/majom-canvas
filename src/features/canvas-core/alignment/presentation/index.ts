export {
  type AppliedAlignmentProposal,
  createAlignmentOverlayFromProposals,
} from '../../core/alignment/createAlignmentOverlayFromProposals.ts';
export { createSmartGuideOverlayModel } from '../../core/alignment/createSmartGuideOverlayModel.ts';
export type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentLineVisual,
  AlignmentOverlayModel,
  AlignmentPointVisual,
  AlignmentVisual,
} from '../../core/alignment/types.ts';
export {
  drawAlignmentOverlay,
  drawSmartGuides,
} from '../../core/utils/smartGuideRenderer.ts';
export {
  DEFAULT_ALIGNMENT_PRESENTATION_THEME,
  type AlignmentPresentationTheme,
} from './theme.ts';
