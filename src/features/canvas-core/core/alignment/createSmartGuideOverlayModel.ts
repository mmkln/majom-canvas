import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import type {
  AlignmentBadgeVisual,
  AlignmentBandVisual,
  AlignmentGuideKind,
  AlignmentLineVisual,
  AlignmentOverlayModel,
} from './types.ts';

type SpacingGuideGroup = {
  targetId: string;
  guides: SmartGuideLine[];
  label: string | null;
};

export function createSmartGuideOverlayModel(
  guides: ReadonlyArray<SmartGuideLine>
): AlignmentOverlayModel {
  const edgeGuides = guides.filter((guide) => guide.guideKind !== 'spacing');
  const spacingGuides = guides.filter((guide) => guide.guideKind === 'spacing');

  return {
    visuals: [
      ...edgeGuides.map(toLineVisual),
      ...createSpacingVisuals(groupSpacingGuides(spacingGuides)),
    ],
  };
}

function createSpacingVisuals(
  groups: ReadonlyArray<SpacingGuideGroup>
): Array<AlignmentLineVisual | AlignmentBandVisual | AlignmentBadgeVisual> {
  const visuals: Array<
    AlignmentLineVisual | AlignmentBandVisual | AlignmentBadgeVisual
  > = [];

  groups.forEach((group) => {
    const lineVisuals = group.guides.map(toLineVisual);
    visuals.push(...lineVisuals);

    const bandVisual = toSpacingBandVisual(group.guides);
    if (bandVisual) {
      visuals.splice(visuals.length - lineVisuals.length, 0, bandVisual);
    }

    const badgeVisual = toSpacingBadgeVisual(group.guides, group.label);
    if (badgeVisual) {
      visuals.push(badgeVisual);
    }
  });

  return visuals;
}

function toLineVisual(guide: SmartGuideLine): AlignmentLineVisual {
  return {
    type: 'line',
    axis: guide.orientation === 'vertical' ? 'x' : 'y',
    kind: getGuideKind(guide),
    primary: guide.primary !== false,
    locked: guide.locked === true,
    position: guide.position,
    start: guide.start,
    end: guide.end,
  };
}

function toSpacingBandVisual(
  guides: ReadonlyArray<SmartGuideLine>
): AlignmentBandVisual | null {
  const firstGuide = guides[0];
  const secondGuide = guides[1];
  if (!firstGuide || !secondGuide) return null;
  if (firstGuide.orientation !== secondGuide.orientation) return null;

  const sortedGuides = [...guides].sort((left, right) => left.position - right.position);
  const primary = sortedGuides.some((guide) => guide.primary !== false);

  if (firstGuide.orientation === 'vertical') {
    return {
      type: 'band',
      axis: 'x',
      kind: 'spacing',
      primary,
      start: sortedGuides[0]!.position,
      end: sortedGuides[sortedGuides.length - 1]!.position,
      depthStart: Math.min(...sortedGuides.map((guide) => guide.start)),
      depthEnd: Math.max(...sortedGuides.map((guide) => guide.end)),
    };
  }

  return {
    type: 'band',
    axis: 'y',
    kind: 'spacing',
    primary,
    start: sortedGuides[0]!.position,
    end: sortedGuides[sortedGuides.length - 1]!.position,
    depthStart: Math.min(...sortedGuides.map((guide) => guide.start)),
    depthEnd: Math.max(...sortedGuides.map((guide) => guide.end)),
  };
}

function toSpacingBadgeVisual(
  guides: ReadonlyArray<SmartGuideLine>,
  label: string | null
): AlignmentBadgeVisual | null {
  const firstGuide = guides[0];
  if (!firstGuide || !label) return null;
  const sortedGuides = [...guides].sort((left, right) => left.position - right.position);

  if (firstGuide.orientation === 'vertical') {
    const leftGuide = sortedGuides[0]!;
    const rightGuide = sortedGuides[sortedGuides.length - 1]!;
    return {
      type: 'badge',
      kind: 'spacing',
      text: label,
      x: (leftGuide.position + rightGuide.position) / 2,
      y: (Math.min(leftGuide.start, rightGuide.start) +
        Math.max(leftGuide.end, rightGuide.end)) /
        2,
    };
  }

  const topGuide = sortedGuides[0]!;
  const bottomGuide = sortedGuides[sortedGuides.length - 1]!;
  return {
    type: 'badge',
    kind: 'spacing',
    text: label,
    x:
      (Math.min(topGuide.start, bottomGuide.start) +
        Math.max(topGuide.end, bottomGuide.end)) /
      2,
    y: (topGuide.position + bottomGuide.position) / 2,
  };
}

function getGuideKind(guide: SmartGuideLine): AlignmentGuideKind {
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

function groupSpacingGuides(
  guides: ReadonlyArray<SmartGuideLine>
): SpacingGuideGroup[] {
  const groups = new Map<string, SpacingGuideGroup>();

  guides.forEach((guide) => {
    const current =
      groups.get(guide.targetId) ??
      ({
        targetId: guide.targetId,
        guides: [],
        label: guide.label ?? null,
      } satisfies SpacingGuideGroup);
    current.guides.push(guide);
    if (!current.label && guide.label) {
      current.label = guide.label;
    }
    groups.set(guide.targetId, current);
  });

  return Array.from(groups.values());
}
