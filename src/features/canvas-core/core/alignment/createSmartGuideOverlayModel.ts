import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import type {
  AlignmentRect,
  AlignmentGuideKind,
  AlignmentLineVisual,
  AlignmentOverlayModel,
} from './types.ts';
import { resolveAlignmentVisualEmphasis } from './types.ts';

const DEFAULT_SPACING_OUTSIDE_OFFSET_PX = 14;

export type SmartGuideOverlayOptions = {
  movingBounds?: AlignmentRect | null;
  viewportBounds?: AlignmentRect | null;
  scale?: number;
};

type SpacingGuideGroup = {
  targetId: string;
  guides: SmartGuideLine[];
  label: string | null;
};

export function createSmartGuideOverlayModel(
  guides: ReadonlyArray<SmartGuideLine>,
  options: SmartGuideOverlayOptions = {}
): AlignmentOverlayModel {
  const edgeGuides = guides.filter((guide) => guide.guideKind !== 'spacing');
  const spacingGuides = guides.filter((guide) => guide.guideKind === 'spacing');

  return {
    visuals: [
      ...edgeGuides.map(toLineVisual),
      ...createSpacingVisuals(groupSpacingGuides(spacingGuides), options),
    ],
  };
}

function createSpacingVisuals(
  groups: ReadonlyArray<SpacingGuideGroup>,
  options: SmartGuideOverlayOptions
): AlignmentLineVisual[] {
  const visuals: AlignmentLineVisual[] = [];

  groups.forEach((group) => {
    visuals.push(
      ...toSpacingMeasurementLineVisuals(group.guides, group.label, options)
    );

  });

  return visuals;
}

function toLineVisual(guide: SmartGuideLine): AlignmentLineVisual {
  const kind = getGuideKind(guide);
  const primary = guide.primary !== false;
  return {
    type: 'line',
    axis: guide.orientation === 'vertical' ? 'x' : 'y',
    kind,
    emphasis: resolveAlignmentVisualEmphasis(kind, primary),
    placement: 'span',
    primary,
    locked: guide.locked === true,
    position: guide.position,
    start: guide.start,
    end: guide.end,
  };
}

function toSpacingMeasurementLineVisuals(
  guides: ReadonlyArray<SmartGuideLine>,
  label: string | null,
  options: SmartGuideOverlayOptions
): AlignmentLineVisual[] {
  const firstGuide = guides[0];
  const secondGuide = guides[1];
  if (!firstGuide || !secondGuide) return [];
  if (firstGuide.orientation !== secondGuide.orientation) return [];

  const distance = resolveSpacingDistance(guides, label);
  if (distance <= 0) return [];

  const sortedGuides = [...guides].sort((left, right) => left.position - right.position);
  const primary = sortedGuides.some((guide) => guide.primary !== false);
  const locked = sortedGuides.some((guide) => guide.locked === true);

  if (firstGuide.orientation === 'vertical') {
    const leftGuide = sortedGuides[0]!;
    const rightGuide = sortedGuides[sortedGuides.length - 1]!;
    const placement = resolveHorizontalSpacingPlacement({
      leftGuide,
      rightGuide,
      movingBounds: options.movingBounds ?? null,
      viewportBounds: options.viewportBounds ?? null,
      scale: options.scale ?? 1,
    });

    return [
      {
        type: 'line',
        axis: 'y',
        kind: 'spacing',
        emphasis: 'measurement',
        placement: placement.mode,
        primary,
        locked,
        position: placement.railY,
        start: leftGuide.position - distance,
        end: leftGuide.position,
      },
      {
        type: 'line',
        axis: 'y',
        kind: 'spacing',
        emphasis: 'measurement',
        placement: placement.mode,
        primary,
        locked,
        position: placement.railY,
        start: rightGuide.position,
        end: rightGuide.position + distance,
      },
    ];
  }

  const topGuide = sortedGuides[0]!;
  const bottomGuide = sortedGuides[sortedGuides.length - 1]!;
  const placement = resolveVerticalSpacingPlacement({
    topGuide,
    bottomGuide,
    movingBounds: options.movingBounds ?? null,
    viewportBounds: options.viewportBounds ?? null,
    scale: options.scale ?? 1,
  });

  return [
    {
      type: 'line',
      axis: 'x',
      kind: 'spacing',
      emphasis: 'measurement',
      placement: placement.mode,
      primary,
      locked,
      position: placement.railX,
      start: topGuide.position - distance,
      end: topGuide.position,
    },
    {
      type: 'line',
      axis: 'x',
      kind: 'spacing',
      emphasis: 'measurement',
      placement: placement.mode,
      primary,
      locked,
      position: placement.railX,
      start: bottomGuide.position,
      end: bottomGuide.position + distance,
    },
  ];
}

function resolveHorizontalSpacingPlacement(args: {
  leftGuide: SmartGuideLine;
  rightGuide: SmartGuideLine;
  movingBounds: AlignmentRect | null;
  viewportBounds: AlignmentRect | null;
  scale: number;
}): {
  mode: 'outside-top' | 'outside-bottom' | 'centerline';
  railY: number;
} {
  const fallback =
    (Math.min(args.leftGuide.start, args.rightGuide.start) +
      Math.max(args.leftGuide.end, args.rightGuide.end)) /
    2;
  const movingBounds = args.movingBounds;
  if (!movingBounds) {
    return {
      mode: 'centerline',
      railY: fallback,
    };
  }

  const scale = Math.max(args.scale, Number.EPSILON);
  const outsideOffset = DEFAULT_SPACING_OUTSIDE_OFFSET_PX / scale;
  const topRailY = movingBounds.top - outsideOffset;
  const bottomRailY = movingBounds.bottom + outsideOffset;
  const viewportTop = args.viewportBounds?.top ?? Number.NEGATIVE_INFINITY;
  const viewportBottom = args.viewportBounds?.bottom ?? Number.POSITIVE_INFINITY;
  const canPlaceTop = topRailY >= viewportTop;
  const canPlaceBottom = bottomRailY <= viewportBottom;

  if (!args.viewportBounds) {
    return {
      mode: 'outside-top',
      railY: topRailY,
    };
  }
  if (canPlaceTop) {
    return {
      mode: 'outside-top',
      railY: topRailY,
    };
  }
  if (canPlaceBottom) {
    return {
      mode: 'outside-bottom',
      railY: bottomRailY,
    };
  }
  return {
    mode: 'centerline',
    railY: movingBounds.centerY,
  };
}

function resolveVerticalSpacingPlacement(args: {
  topGuide: SmartGuideLine;
  bottomGuide: SmartGuideLine;
  movingBounds: AlignmentRect | null;
  viewportBounds: AlignmentRect | null;
  scale: number;
}): {
  mode: 'outside-left' | 'outside-right' | 'centerline';
  railX: number;
} {
  const fallback =
    (Math.min(args.topGuide.start, args.bottomGuide.start) +
      Math.max(args.topGuide.end, args.bottomGuide.end)) /
    2;
  const movingBounds = args.movingBounds;
  if (!movingBounds) {
    return {
      mode: 'centerline',
      railX: fallback,
    };
  }

  const scale = Math.max(args.scale, Number.EPSILON);
  const outsideOffset = DEFAULT_SPACING_OUTSIDE_OFFSET_PX / scale;
  const leftRailX = movingBounds.left - outsideOffset;
  const rightRailX = movingBounds.right + outsideOffset;
  const viewportLeft = args.viewportBounds?.left ?? Number.NEGATIVE_INFINITY;
  const viewportRight = args.viewportBounds?.right ?? Number.POSITIVE_INFINITY;
  const canPlaceLeft = leftRailX >= viewportLeft;
  const canPlaceRight = rightRailX <= viewportRight;

  if (!args.viewportBounds) {
    return {
      mode: 'outside-left',
      railX: leftRailX,
    };
  }
  if (canPlaceLeft) {
    return {
      mode: 'outside-left',
      railX: leftRailX,
    };
  }
  if (canPlaceRight) {
    return {
      mode: 'outside-right',
      railX: rightRailX,
    };
  }
  return {
    mode: 'centerline',
    railX: movingBounds.centerX,
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

function resolveSpacingDistance(
  guides: ReadonlyArray<SmartGuideLine>,
  label: string | null
): number {
  const explicitDistance = guides.find(
    (guide) =>
      typeof guide.spacingDistance === 'number' &&
      Number.isFinite(guide.spacingDistance)
  )?.spacingDistance;
  if (typeof explicitDistance === 'number') {
    return Math.max(0, explicitDistance);
  }

  if (!label) return 0;
  const parsed = Number.parseFloat(label);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}
