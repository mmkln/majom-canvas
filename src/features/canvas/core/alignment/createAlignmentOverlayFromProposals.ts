import type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentLineVisual,
  AlignmentOverlayModel,
  AlignmentPointVisual,
  AlignmentProposal,
} from './types.ts';

export type AppliedAlignmentProposal = {
  proposal: AlignmentProposal;
  primary: boolean;
  locked: boolean;
};

export function createAlignmentOverlayFromProposals(
  proposals: ReadonlyArray<AppliedAlignmentProposal>
): AlignmentOverlayModel {
  const visuals: AlignmentOverlayModel['visuals'] = [];
  proposals.forEach(({ proposal, primary, locked }) => {
    proposal.visuals.forEach((visual) => {
      visuals.push(applyVisualState(visual, primary, locked));
    });
  });
  return {
    visuals,
  };
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
      primary,
      locked,
    };
  }
  if (visual.type === 'band' || visual.type === 'point') {
    return {
      ...visual,
      primary,
    };
  }
  return visual;
}
