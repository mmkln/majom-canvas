import type { SmartGuideLine } from '../../services/SmartAlignmentService.ts';
import type { AlignmentRect, AlignmentSubject } from '../types.ts';
import { createAlignmentProposalFromSmartGuides } from '../smartGuideProposalInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './AlignmentRule.ts';
import { EMPTY_ALIGNMENT_RULE_RESULT } from './AlignmentRule.ts';

type BestSpacingMatch = {
  absOffset: number;
  pairRank: number;
  guides: SmartGuideLine[];
  targetSubjectIds: [string, string];
  snapOffsetX: number;
  snapOffsetY: number;
};

const TIE_EPSILON = 1e-6;

export class SpacingRule implements AlignmentRule {
  public compute(args: AlignmentRuleInput): AlignmentRuleResult {
    if (!args.preferences.showSpacingGuides) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }
    const movingBounds = args.movingSubject?.bounds ?? null;
    if (!movingBounds || args.subjects.length < 2 || args.threshold <= 0) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

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

    const bestVertical = this.findBestVerticalSpacingMatch({
      movingBounds,
      subjects: args.subjects,
      threshold: args.threshold,
      maxSecondaryDistance,
      minGuideLength: effectiveMinGuideLength,
      maxGuideLength,
    });
    const bestHorizontal = this.findBestHorizontalSpacingMatch({
      movingBounds,
      subjects: args.subjects,
      threshold: args.threshold,
      maxSecondaryDistance,
      minGuideLength: effectiveMinGuideLength,
      maxGuideLength,
    });

    if (!bestVertical && !bestHorizontal) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    return {
      proposals: [
        ...(bestVertical
          ? [
              createAlignmentProposalFromSmartGuides({
                guides: bestVertical.guides,
                id: `spacing:${bestVertical.guides[0]!.targetId}`,
                kind: 'spacing',
                lockKey: bestVertical.guides[0]!.targetId,
                score: bestVertical.absOffset,
                targetSubjectIds: bestVertical.targetSubjectIds,
              }),
            ]
          : []),
        ...(bestHorizontal
          ? [
              createAlignmentProposalFromSmartGuides({
                guides: bestHorizontal.guides,
                id: `spacing:${bestHorizontal.guides[0]!.targetId}`,
                kind: 'spacing',
                lockKey: bestHorizontal.guides[0]!.targetId,
                score: bestHorizontal.absOffset,
                targetSubjectIds: bestHorizontal.targetSubjectIds,
              }),
            ]
          : []),
      ],
      snapOffsetX: bestVertical?.snapOffsetX ?? 0,
      snapOffsetY: bestHorizontal?.snapOffsetY ?? 0,
    };
  }

  private findBestVerticalSpacingMatch(args: {
    movingBounds: AlignmentRect;
    subjects: AlignmentSubject[];
    threshold: number;
    maxSecondaryDistance: number;
    minGuideLength: number;
    maxGuideLength: number;
  }): BestSpacingMatch | null {
    let bestMatch: BestSpacingMatch | null = null;

    args.subjects.forEach((leftSubject, leftIndex) => {
      args.subjects
        .slice(leftIndex + 1)
        .forEach((rightSubject, rightOffset) => {
          const rightIndex = leftIndex + rightOffset + 1;
          if (leftSubject.bounds.right > rightSubject.bounds.left) return;

          const secondaryDistance = Math.max(
            this.getRangeDistance(
              args.movingBounds.top,
              args.movingBounds.bottom,
              leftSubject.bounds.top,
              leftSubject.bounds.bottom
            ),
            this.getRangeDistance(
              args.movingBounds.top,
              args.movingBounds.bottom,
              rightSubject.bounds.top,
              rightSubject.bounds.bottom
            ),
            this.getRangeDistance(
              leftSubject.bounds.top,
              leftSubject.bounds.bottom,
              rightSubject.bounds.top,
              rightSubject.bounds.bottom
            )
          );
          if (secondaryDistance > args.maxSecondaryDistance) return;

          const desiredLeft =
            (leftSubject.bounds.right +
              rightSubject.bounds.left -
              args.movingBounds.width) /
            2;
          const desiredRight = desiredLeft + args.movingBounds.width;
          const gap = desiredLeft - leftSubject.bounds.right;
          if (gap < 0) return;
          const label = `${Math.round(gap)} px`;

          const offset = desiredLeft - args.movingBounds.left;
          const absOffset = Math.abs(offset);
          if (absOffset > args.threshold) return;

          const span = this.clampSpan(
            Math.min(
              args.movingBounds.top,
              leftSubject.bounds.top,
              rightSubject.bounds.top
            ),
            Math.max(
              args.movingBounds.bottom,
              leftSubject.bounds.bottom,
              rightSubject.bounds.bottom
            ),
            args.minGuideLength,
            args.maxGuideLength
          );
          const targetId = `spacing-x:${leftSubject.id}:${rightSubject.id}`;
          const nextMatch: BestSpacingMatch = {
            absOffset,
            pairRank: leftIndex + rightIndex,
            guides: [
              {
                orientation: 'vertical',
                targetId,
                guideKind: 'spacing',
                label,
                spacingDistance: gap,
                position: desiredLeft,
                start: span.start,
                end: span.end,
                offset,
                movingAnchor: 'left',
                targetAnchor: 'left',
              },
              {
                orientation: 'vertical',
                targetId,
                guideKind: 'spacing',
                label,
                spacingDistance: gap,
                position: desiredRight,
                start: span.start,
                end: span.end,
                offset,
                movingAnchor: 'right',
                targetAnchor: 'right',
              },
            ],
            targetSubjectIds: [leftSubject.id, rightSubject.id],
            snapOffsetX: offset,
            snapOffsetY: 0,
          };

          if (
            !bestMatch ||
            absOffset < bestMatch.absOffset - TIE_EPSILON ||
            (Math.abs(absOffset - bestMatch.absOffset) <= TIE_EPSILON &&
              nextMatch.pairRank < bestMatch.pairRank)
          ) {
            bestMatch = nextMatch;
          }
        });
    });

    return bestMatch;
  }

  private findBestHorizontalSpacingMatch(args: {
    movingBounds: AlignmentRect;
    subjects: AlignmentSubject[];
    threshold: number;
    maxSecondaryDistance: number;
    minGuideLength: number;
    maxGuideLength: number;
  }): BestSpacingMatch | null {
    let bestMatch: BestSpacingMatch | null = null;

    args.subjects.forEach((topSubject, topIndex) => {
      args.subjects
        .slice(topIndex + 1)
        .forEach((bottomSubject, bottomOffset) => {
          const bottomIndex = topIndex + bottomOffset + 1;
          if (topSubject.bounds.bottom > bottomSubject.bounds.top) return;

          const secondaryDistance = Math.max(
            this.getRangeDistance(
              args.movingBounds.left,
              args.movingBounds.right,
              topSubject.bounds.left,
              topSubject.bounds.right
            ),
            this.getRangeDistance(
              args.movingBounds.left,
              args.movingBounds.right,
              bottomSubject.bounds.left,
              bottomSubject.bounds.right
            ),
            this.getRangeDistance(
              topSubject.bounds.left,
              topSubject.bounds.right,
              bottomSubject.bounds.left,
              bottomSubject.bounds.right
            )
          );
          if (secondaryDistance > args.maxSecondaryDistance) return;

          const desiredTop =
            (topSubject.bounds.bottom +
              bottomSubject.bounds.top -
              args.movingBounds.height) /
            2;
          const desiredBottom = desiredTop + args.movingBounds.height;
          const gap = desiredTop - topSubject.bounds.bottom;
          if (gap < 0) return;
          const label = `${Math.round(gap)} px`;

          const offset = desiredTop - args.movingBounds.top;
          const absOffset = Math.abs(offset);
          if (absOffset > args.threshold) return;

          const span = this.clampSpan(
            Math.min(
              args.movingBounds.left,
              topSubject.bounds.left,
              bottomSubject.bounds.left
            ),
            Math.max(
              args.movingBounds.right,
              topSubject.bounds.right,
              bottomSubject.bounds.right
            ),
            args.minGuideLength,
            args.maxGuideLength
          );
          const targetId = `spacing-y:${topSubject.id}:${bottomSubject.id}`;
          const nextMatch: BestSpacingMatch = {
            absOffset,
            pairRank: topIndex + bottomIndex,
            guides: [
              {
                orientation: 'horizontal',
                targetId,
                guideKind: 'spacing',
                label,
                spacingDistance: gap,
                position: desiredTop,
                start: span.start,
                end: span.end,
                offset,
                movingAnchor: 'top',
                targetAnchor: 'top',
              },
              {
                orientation: 'horizontal',
                targetId,
                guideKind: 'spacing',
                label,
                spacingDistance: gap,
                position: desiredBottom,
                start: span.start,
                end: span.end,
                offset,
                movingAnchor: 'bottom',
                targetAnchor: 'bottom',
              },
            ],
            targetSubjectIds: [topSubject.id, bottomSubject.id],
            snapOffsetX: 0,
            snapOffsetY: offset,
          };

          if (
            !bestMatch ||
            absOffset < bestMatch.absOffset - TIE_EPSILON ||
            (Math.abs(absOffset - bestMatch.absOffset) <= TIE_EPSILON &&
              nextMatch.pairRank < bestMatch.pairRank)
          ) {
            bestMatch = nextMatch;
          }
        });
    });

    return bestMatch;
  }

  private getRangeDistance(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): number {
    const overlapStart = Math.max(aStart, bStart);
    const overlapEnd = Math.min(aEnd, bEnd);
    if (overlapStart <= overlapEnd) return 0;
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
}
