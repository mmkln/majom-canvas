type HorizontalAnchor = 'left' | 'center' | 'right';
type VerticalAnchor = 'top' | 'middle' | 'bottom';

export type SmartAlignmentRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

export type SmartAlignmentCandidate = {
  id: string;
  bounds: SmartAlignmentRect;
};

export type SmartGuideLine =
  | {
      orientation: 'vertical';
      targetId: string;
      position: number;
      start: number;
      end: number;
      offset: number;
      movingAnchor: HorizontalAnchor;
      targetAnchor: HorizontalAnchor;
    }
  | {
      orientation: 'horizontal';
      targetId: string;
      position: number;
      start: number;
      end: number;
      offset: number;
      movingAnchor: VerticalAnchor;
      targetAnchor: VerticalAnchor;
    };

export type SmartAlignmentResult = {
  guides: SmartGuideLine[];
  snapOffsetX: number;
  snapOffsetY: number;
};

type VerticalBestMatch = {
  absOffset: number;
  offset: number;
  guide: Extract<SmartGuideLine, { orientation: 'vertical' }>;
};

type HorizontalBestMatch = {
  absOffset: number;
  offset: number;
  guide: Extract<SmartGuideLine, { orientation: 'horizontal' }>;
};

const HORIZONTAL_ANCHORS: Array<{
  key: HorizontalAnchor;
  getValue: (rect: SmartAlignmentRect) => number;
}> = [
  { key: 'left', getValue: (rect) => rect.left },
  { key: 'center', getValue: (rect) => rect.centerX },
  { key: 'right', getValue: (rect) => rect.right },
];

const VERTICAL_ANCHORS: Array<{
  key: VerticalAnchor;
  getValue: (rect: SmartAlignmentRect) => number;
}> = [
  { key: 'top', getValue: (rect) => rect.top },
  { key: 'middle', getValue: (rect) => rect.centerY },
  { key: 'bottom', getValue: (rect) => rect.bottom },
];

export function createAlignmentRect(args: {
  x: number;
  y: number;
  width: number;
  height: number;
}): SmartAlignmentRect {
  const width = Math.max(0, args.width);
  const height = Math.max(0, args.height);
  const left = args.x;
  const top = args.y;
  const right = left + width;
  const bottom = top + height;
  return {
    x: left,
    y: top,
    width,
    height,
    left,
    right,
    top,
    bottom,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

export function getElementAlignmentRect(
  element: unknown
): SmartAlignmentRect | null {
  const source = element as {
    x?: unknown;
    y?: unknown;
    width?: unknown;
    height?: unknown;
    radius?: unknown;
  };
  if (typeof source?.x !== 'number' || typeof source?.y !== 'number') {
    return null;
  }
  if (typeof source.width === 'number' && typeof source.height === 'number') {
    return createAlignmentRect({
      x: source.x,
      y: source.y,
      width: source.width,
      height: source.height,
    });
  }
  if (typeof source.radius === 'number') {
    return createAlignmentRect({
      x: source.x - source.radius,
      y: source.y - source.radius,
      width: source.radius * 2,
      height: source.radius * 2,
    });
  }
  return null;
}

export class SmartAlignmentService {
  public compute(args: {
    movingBounds: SmartAlignmentRect | null;
    candidates: SmartAlignmentCandidate[];
    threshold: number;
    maxSecondaryDistance?: number;
    minGuideLength?: number;
    maxGuideLength?: number;
    preferredVerticalGuide?: Extract<SmartGuideLine, { orientation: 'vertical' }> | null;
    preferredHorizontalGuide?: Extract<
      SmartGuideLine,
      { orientation: 'horizontal' }
    > | null;
  }): SmartAlignmentResult {
    const { movingBounds, candidates } = args;
    const threshold = Math.max(0, args.threshold);
    const maxSecondaryDistance =
      typeof args.maxSecondaryDistance === 'number' &&
      Number.isFinite(args.maxSecondaryDistance)
        ? Math.max(0, args.maxSecondaryDistance)
        : Number.POSITIVE_INFINITY;
    const minGuideLength =
      typeof args.minGuideLength === 'number' &&
      Number.isFinite(args.minGuideLength)
        ? Math.max(0, args.minGuideLength)
        : 0;
    const maxGuideLength =
      typeof args.maxGuideLength === 'number' &&
      Number.isFinite(args.maxGuideLength)
        ? Math.max(0, args.maxGuideLength)
        : Number.POSITIVE_INFINITY;
    const effectiveMinGuideLength = Math.min(minGuideLength, maxGuideLength);
    const preferredVerticalGuide = args.preferredVerticalGuide ?? null;
    const preferredHorizontalGuide = args.preferredHorizontalGuide ?? null;
    const tieEpsilon = 1e-6;
    if (!movingBounds || threshold <= 0 || candidates.length === 0) {
      return { guides: [], snapOffsetX: 0, snapOffsetY: 0 };
    }

    let bestVertical: VerticalBestMatch | null = null;
    let bestHorizontal: HorizontalBestMatch | null = null;

    candidates.forEach((candidate) => {
      const target = candidate.bounds;
      const verticalDistance = this.getRangeDistance(
        movingBounds.top,
        movingBounds.bottom,
        target.top,
        target.bottom
      );
      const allowVertical = verticalDistance <= maxSecondaryDistance;
      HORIZONTAL_ANCHORS.forEach((movingAnchor) => {
        if (!allowVertical) return;
        const movingValue = movingAnchor.getValue(movingBounds);
        HORIZONTAL_ANCHORS.forEach((targetAnchor) => {
          const targetValue = targetAnchor.getValue(target);
          const offset = targetValue - movingValue;
          const absOffset = Math.abs(offset);
          if (absOffset > threshold) return;
          const verticalSpan = this.clampSpan(
            Math.min(movingBounds.top, target.top),
            Math.max(movingBounds.bottom, target.bottom),
            effectiveMinGuideLength,
            maxGuideLength
          );
          const nextGuide: Extract<SmartGuideLine, { orientation: 'vertical' }> = {
            orientation: 'vertical',
            targetId: candidate.id,
            position: targetValue,
            start: verticalSpan.start,
            end: verticalSpan.end,
            offset,
            movingAnchor: movingAnchor.key,
            targetAnchor: targetAnchor.key,
          };
          if (bestVertical) {
            if (absOffset > bestVertical.absOffset + tieEpsilon) return;
            const isTie =
              Math.abs(absOffset - bestVertical.absOffset) <= tieEpsilon;
            if (
              isTie &&
              !this.shouldPreferVerticalGuide(
                nextGuide,
                bestVertical.guide,
                preferredVerticalGuide
              )
            ) {
              return;
            }
          }
          bestVertical = {
            absOffset,
            offset,
            guide: nextGuide,
          };
        });
      });

      const horizontalDistance = this.getRangeDistance(
        movingBounds.left,
        movingBounds.right,
        target.left,
        target.right
      );
      const allowHorizontal = horizontalDistance <= maxSecondaryDistance;
      VERTICAL_ANCHORS.forEach((movingAnchor) => {
        if (!allowHorizontal) return;
        const movingValue = movingAnchor.getValue(movingBounds);
        VERTICAL_ANCHORS.forEach((targetAnchor) => {
          const targetValue = targetAnchor.getValue(target);
          const offset = targetValue - movingValue;
          const absOffset = Math.abs(offset);
          if (absOffset > threshold) return;
          const horizontalSpan = this.clampSpan(
            Math.min(movingBounds.left, target.left),
            Math.max(movingBounds.right, target.right),
            effectiveMinGuideLength,
            maxGuideLength
          );
          const nextGuide: Extract<SmartGuideLine, { orientation: 'horizontal' }> = {
            orientation: 'horizontal',
            targetId: candidate.id,
            position: targetValue,
            start: horizontalSpan.start,
            end: horizontalSpan.end,
            offset,
            movingAnchor: movingAnchor.key,
            targetAnchor: targetAnchor.key,
          };
          if (bestHorizontal) {
            if (absOffset > bestHorizontal.absOffset + tieEpsilon) return;
            const isTie =
              Math.abs(absOffset - bestHorizontal.absOffset) <= tieEpsilon;
            if (
              isTie &&
              !this.shouldPreferHorizontalGuide(
                nextGuide,
                bestHorizontal.guide,
                preferredHorizontalGuide
              )
            ) {
              return;
            }
          }
          bestHorizontal = {
            absOffset,
            offset,
            guide: nextGuide,
          };
        });
      });
    });

    const guides: SmartGuideLine[] = [];
    if (bestVertical) guides.push(bestVertical.guide);
    if (bestHorizontal) guides.push(bestHorizontal.guide);

    return {
      guides,
      snapOffsetX: bestVertical?.offset ?? 0,
      snapOffsetY: bestHorizontal?.offset ?? 0,
    };
  }

  private getRangeDistance(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): number {
    const left = Math.max(aStart, bStart);
    const right = Math.min(aEnd, bEnd);
    if (left <= right) return 0;
    return Math.min(Math.abs(bStart - aEnd), Math.abs(aStart - bEnd));
  }

  private clampSpan(
    start: number,
    end: number,
    minLength: number,
    maxLength: number
  ): { start: number; end: number } {
    let nextStart = start;
    let nextEnd = end;
    let length = nextEnd - nextStart;

    if (length < minLength) {
      const center = nextStart + length / 2;
      const half = minLength / 2;
      nextStart = center - half;
      nextEnd = center + half;
      length = minLength;
    }

    if (!Number.isFinite(maxLength) || maxLength <= 0 || length <= maxLength) {
      return { start: nextStart, end: nextEnd };
    }
    const center = nextStart + length / 2;
    const half = maxLength / 2;
    return {
      start: center - half,
      end: center + half,
    };
  }

  private shouldPreferVerticalGuide(
    nextGuide: Extract<SmartGuideLine, { orientation: 'vertical' }>,
    currentGuide: Extract<SmartGuideLine, { orientation: 'vertical' }>,
    preferredGuide: Extract<SmartGuideLine, { orientation: 'vertical' }> | null
  ): boolean {
    if (!preferredGuide) return false;
    const nextMatches = this.isSameVerticalGuide(nextGuide, preferredGuide);
    const currentMatches = this.isSameVerticalGuide(currentGuide, preferredGuide);
    return nextMatches && !currentMatches;
  }

  private shouldPreferHorizontalGuide(
    nextGuide: Extract<SmartGuideLine, { orientation: 'horizontal' }>,
    currentGuide: Extract<SmartGuideLine, { orientation: 'horizontal' }>,
    preferredGuide: Extract<SmartGuideLine, { orientation: 'horizontal' }> | null
  ): boolean {
    if (!preferredGuide) return false;
    const nextMatches = this.isSameHorizontalGuide(nextGuide, preferredGuide);
    const currentMatches = this.isSameHorizontalGuide(
      currentGuide,
      preferredGuide
    );
    return nextMatches && !currentMatches;
  }

  private isSameVerticalGuide(
    first: Extract<SmartGuideLine, { orientation: 'vertical' }>,
    second: Extract<SmartGuideLine, { orientation: 'vertical' }>
  ): boolean {
    return (
      first.targetId === second.targetId &&
      first.movingAnchor === second.movingAnchor &&
      first.targetAnchor === second.targetAnchor &&
      first.position === second.position
    );
  }

  private isSameHorizontalGuide(
    first: Extract<SmartGuideLine, { orientation: 'horizontal' }>,
    second: Extract<SmartGuideLine, { orientation: 'horizontal' }>
  ): boolean {
    return (
      first.targetId === second.targetId &&
      first.movingAnchor === second.movingAnchor &&
      first.targetAnchor === second.targetAnchor &&
      first.position === second.position
    );
  }
}
