import {
  createSmartGuideOverlayModel,
  type SmartGuideOverlayOptions,
} from './createSmartGuideOverlayModel.ts';
import type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentLineVisual,
  AlignmentOverlayModel,
  AlignmentPointVisual,
  AlignmentProposal,
} from './types.ts';
import { resolveAlignmentVisualEmphasis } from './types.ts';

export type AppliedAlignmentProposal = {
  proposal: AlignmentProposal;
  primary: boolean;
  locked: boolean;
};

export function createAlignmentOverlayFromProposals(
  proposals: ReadonlyArray<AppliedAlignmentProposal>,
  options: SmartGuideOverlayOptions = {}
): AlignmentOverlayModel {
  const visuals: AlignmentOverlayModel['visuals'] = [];
  proposals.forEach(({ proposal, primary, locked }) => {
    getProposalVisuals(proposal, options).forEach((visual) => {
      visuals.push(applyVisualState(visual, primary, locked));
    });
  });
  return {
    visuals,
  };
}

function getProposalVisuals(
  proposal: AlignmentProposal,
  options: SmartGuideOverlayOptions
): AlignmentProposal['visuals'] {
  if (proposal.kind === 'spacing' && proposal.sourceGuides.length > 0) {
    return createSmartGuideOverlayModel(proposal.sourceGuides, options).visuals;
  }
  return proposal.visuals;
}

function applyVisualState(
  visual: AlignmentProposal['visuals'][number],
  primary: boolean,
  locked: boolean
):
  | AlignmentLineVisual
  | AlignmentBandVisual
  | AlignmentPointVisual
  | AlignmentBadgeVisual {
  if (visual.type === 'line') {
    return {
      ...visual,
      emphasis: resolveAlignmentVisualEmphasis(visual.kind, primary),
      primary,
      locked,
    };
  }
  if (visual.type === 'band' || visual.type === 'point') {
    return {
      ...visual,
      emphasis: resolveAlignmentVisualEmphasis(visual.kind, primary),
      primary,
    };
  }
  return {
    ...visual,
    emphasis: resolveAlignmentVisualEmphasis(visual.kind, primary),
  };
}
