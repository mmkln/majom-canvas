import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { createSmartGuideOverlayModel } from './createSmartGuideOverlayModel.ts';
import type {
  AlignmentAxis,
  AlignmentGuideKind,
  AlignmentProposal,
} from './types.ts';

export function createAlignmentProposalFromSmartGuide(
  guide: SmartGuideLine
): AlignmentProposal {
  return createAlignmentProposalFromSmartGuides({
    guides: [guide],
    id: `guide:${getSmartGuideLockKey(guide)}`,
    lockKey: getSmartGuideLockKey(guide),
    kind: getSmartGuideKind(guide),
    score: Math.abs(guide.offset),
    targetSubjectIds: [guide.targetId],
  });
}

export function createAlignmentProposalFromSmartGuides(args: {
  guides: ReadonlyArray<SmartGuideLine>;
  id?: string;
  kind?: AlignmentGuideKind;
  lockKey?: string;
  score?: number;
  targetSubjectIds?: ReadonlyArray<string>;
}): AlignmentProposal {
  const firstGuide = args.guides[0];
  if (!firstGuide) {
    throw new Error('createAlignmentProposalFromSmartGuides requires at least one guide');
  }

  const axis = getSmartGuideAxis(firstGuide);
  const lockKey = args.lockKey ?? getSmartGuideGroupLockKey(args.guides);
  return {
    id: args.id ?? lockKey,
    axis,
    kind: args.kind ?? getSmartGuideKind(firstGuide),
    delta: firstGuide.offset,
    score: args.score ?? Math.abs(firstGuide.offset),
    lockKey,
    visuals: createSmartGuideOverlayModel(args.guides).visuals,
    targetSubjectIds: [
      ...(args.targetSubjectIds ?? collectTargetSubjectIds(args.guides)),
    ],
    sourceGuides: [...args.guides],
  };
}

export function getSmartGuideLockKey(guide: SmartGuideLine): string {
  return [
    getSmartGuideAxis(guide),
    getSmartGuideKind(guide),
    guide.targetId,
    guide.movingAnchor,
    guide.targetAnchor,
    guide.position,
  ].join(':');
}

export function getSmartGuideAxis(guide: SmartGuideLine): AlignmentAxis {
  return guide.orientation === 'vertical' ? 'x' : 'y';
}

export function getSmartGuideKind(guide: SmartGuideLine): AlignmentGuideKind {
  if (guide.guideKind) return guide.guideKind;
  if (
    (guide.orientation === 'vertical' &&
      guide.movingAnchor === 'center' &&
      guide.targetAnchor === 'center') ||
    (guide.orientation === 'horizontal' &&
      guide.movingAnchor === 'middle' &&
      guide.targetAnchor === 'middle')
  ) {
    return 'center';
  }
  return 'edge';
}

function getSmartGuideGroupLockKey(guides: ReadonlyArray<SmartGuideLine>): string {
  if (guides.length === 1) {
    return getSmartGuideLockKey(guides[0]!);
  }

  const firstGuide = guides[0]!;
  const sortedTargets = collectTargetSubjectIds(guides).sort();
  const positions = [...guides]
    .map((guide) => guide.position)
    .sort((left, right) => left - right);
  return [
    getSmartGuideAxis(firstGuide),
    getSmartGuideKind(firstGuide),
    sortedTargets.join('|'),
    positions.join('|'),
  ].join(':');
}

function collectTargetSubjectIds(
  guides: ReadonlyArray<SmartGuideLine>
): string[] {
  return Array.from(new Set(guides.map((guide) => guide.targetId)));
}
