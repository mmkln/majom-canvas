import { type SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { AlignmentEngine } from './AlignmentEngine.ts';
import {
  createAlignmentOverlayFromProposals,
  type AppliedAlignmentProposal,
} from './createAlignmentOverlayFromProposals.ts';
import {
  createAlignmentProposalFromSmartGuide,
  getSmartGuideLockKey,
} from './smartGuideProposalInterop.ts';
import type {
  AlignmentPreferences,
  AlignmentProposal,
  AlignmentOverlayModel,
  AlignmentRect,
  AlignmentSubject,
} from './types.ts';

type AlignmentSessionUpdateArgs = {
  movingSubject: AlignmentSubject | null;
  subjects: AlignmentSubject[];
  viewportBounds?: AlignmentRect | null;
  presentationScale?: number;
  threshold: number;
  releaseThreshold: number;
  maxSecondaryDistance: number;
  minGuideLength: number;
  maxGuideLength: number;
  allowSnap?: boolean;
  preferences?: Partial<AlignmentPreferences>;
  proposalFilter?: (proposal: AlignmentProposal) => boolean;
};

type AlignmentSessionUpdateResult = {
  guides: ReadonlyArray<SmartGuideLine>;
  overlay: AlignmentOverlayModel;
  appliedProposals: ReadonlyArray<AppliedAlignmentProposal>;
  snapOffsetX: number;
  snapOffsetY: number;
};

export class AlignmentSession {
  private guides: SmartGuideLine[] = [];
  private overlay: AlignmentOverlayModel = { visuals: [] };
  private appliedProposals: AppliedAlignmentProposal[] = [];
  private lockedVerticalGuide: Extract<
    SmartGuideLine,
    { orientation: 'vertical' }
  > | null = null;
  private lockedHorizontalGuide: Extract<
    SmartGuideLine,
    { orientation: 'horizontal' }
  > | null = null;

  constructor(
    private readonly engine: AlignmentEngine = new AlignmentEngine()
  ) {}

  public getGuides(): ReadonlyArray<SmartGuideLine> {
    return this.guides;
  }

  public getOverlay(): AlignmentOverlayModel {
    return this.overlay;
  }

  public clear(): void {
    this.guides = [];
    this.overlay = { visuals: [] };
    this.appliedProposals = [];
    this.lockedVerticalGuide = null;
    this.lockedHorizontalGuide = null;
  }

  public update(
    args: AlignmentSessionUpdateArgs
  ): AlignmentSessionUpdateResult {
    const {
      movingSubject,
      subjects,
      threshold,
      releaseThreshold,
      maxSecondaryDistance,
      minGuideLength,
      maxGuideLength,
    } = args;
    const allowSnap = args.allowSnap !== false;
    const proposalFilter = args.proposalFilter;
    const movingBounds = movingSubject?.bounds ?? null;

    if (!movingBounds || threshold <= 0 || subjects.length === 0) {
      this.clear();
      return {
        guides: this.guides,
        overlay: this.overlay,
        appliedProposals: this.appliedProposals,
        snapOffsetX: 0,
        snapOffsetY: 0,
      };
    }

    const result = this.engine.compute({
      movingSubject,
      subjects,
      threshold,
      maxSecondaryDistance,
      minGuideLength,
      maxGuideLength,
      preferences: args.preferences,
      preferredVerticalGuide: this.lockedVerticalGuide,
      preferredHorizontalGuide: this.lockedHorizontalGuide,
    });
    const proposals =
      typeof proposalFilter === 'function'
        ? result.proposals.filter((proposal) => proposalFilter(proposal))
        : result.proposals;

    if (!allowSnap) {
      const appliedProposals = proposals.map((proposal) => ({
        proposal,
        primary: true,
        locked: false,
      }));
      this.appliedProposals = appliedProposals;
      this.guides = this.materializeGuidesFromAppliedProposals(appliedProposals);
      this.overlay = createAlignmentOverlayFromProposals(appliedProposals, {
        movingBounds,
        viewportBounds: args.viewportBounds ?? null,
        scale: args.presentationScale ?? 1,
      });
      this.lockedVerticalGuide = null;
      this.lockedHorizontalGuide = null;
      return {
        guides: this.guides,
        overlay: this.overlay,
        appliedProposals: this.appliedProposals,
        snapOffsetX: 0,
        snapOffsetY: 0,
      };
    }

    const verticalCandidate = this.findSnapCandidateProposal({
      proposals,
      axis: 'x',
    });
    const horizontalCandidate = this.findSnapCandidateProposal({
      proposals,
      axis: 'y',
    });

    let snapOffsetX = 0;
    let snapOffsetY = 0;
    let primaryVerticalGuide: Extract<
      SmartGuideLine,
      { orientation: 'vertical' }
    > | null = null;
    let primaryHorizontalGuide: Extract<
      SmartGuideLine,
      { orientation: 'horizontal' }
    > | null = null;

    const lockedVertical = this.getLockedVerticalGuideOffset({
      movingBounds,
      releaseThreshold,
      maxSecondaryDistance,
      minGuideLength,
      maxGuideLength,
    });
    if (lockedVertical) {
      primaryVerticalGuide = {
        ...lockedVertical.guide,
        primary: true,
        locked: true,
      };
      this.lockedVerticalGuide = primaryVerticalGuide;
      snapOffsetX = lockedVertical.offset;
    } else if (verticalCandidate) {
      const guide = this.getPrimaryGuideFromProposal(verticalCandidate);
      if (guide?.orientation === 'vertical') {
        primaryVerticalGuide = {
          ...guide,
          primary: true,
          locked: false,
        };
        this.lockedVerticalGuide = primaryVerticalGuide;
        snapOffsetX = verticalCandidate.delta;
      } else {
        this.lockedVerticalGuide = null;
      }
    } else {
      this.lockedVerticalGuide = null;
    }

    const boundsWithXOffset =
      snapOffsetX === 0
        ? movingBounds
        : this.shiftRect(movingBounds, snapOffsetX, 0);
    const lockedHorizontal = this.getLockedHorizontalGuideOffset({
      movingBounds: boundsWithXOffset,
      releaseThreshold,
      maxSecondaryDistance,
      minGuideLength,
      maxGuideLength,
    });
    if (lockedHorizontal) {
      primaryHorizontalGuide = {
        ...lockedHorizontal.guide,
        primary: true,
        locked: true,
      };
      this.lockedHorizontalGuide = primaryHorizontalGuide;
      snapOffsetY = lockedHorizontal.offset;
    } else if (horizontalCandidate) {
      const guide = this.getPrimaryGuideFromProposal(horizontalCandidate);
      if (guide?.orientation === 'horizontal') {
        primaryHorizontalGuide = {
          ...guide,
          primary: true,
          locked: false,
        };
        this.lockedHorizontalGuide = primaryHorizontalGuide;
        snapOffsetY = horizontalCandidate.delta;
      } else {
        this.lockedHorizontalGuide = null;
      }
    } else {
      this.lockedHorizontalGuide = null;
    }

    const appliedProposals = [
      ...this.selectAxisProposals({
        proposals,
        axis: 'x',
        activeOffset: snapOffsetX,
        primaryGuide: primaryVerticalGuide,
      }),
      ...this.selectAxisProposals({
        proposals,
        axis: 'y',
        activeOffset: snapOffsetY,
        primaryGuide: primaryHorizontalGuide,
      }),
    ];

    this.appliedProposals = appliedProposals;
    this.guides = this.materializeGuidesFromAppliedProposals(appliedProposals);
    this.overlay = createAlignmentOverlayFromProposals(appliedProposals, {
      movingBounds: this.shiftRect(movingBounds, snapOffsetX, snapOffsetY),
      viewportBounds: args.viewportBounds ?? null,
      scale: args.presentationScale ?? 1,
    });
    return {
      guides: this.guides,
      overlay: this.overlay,
      appliedProposals: this.appliedProposals,
      snapOffsetX,
      snapOffsetY,
    };
  }

  private materializeGuidesFromAppliedProposals(
    appliedProposals: ReadonlyArray<AppliedAlignmentProposal>
  ): SmartGuideLine[] {
    const guides: SmartGuideLine[] = [];
    appliedProposals.forEach(({ proposal, primary, locked }) => {
      proposal.sourceGuides.forEach((guide, index) => {
        guides.push({
          ...guide,
          primary: primary && (proposal.kind === 'spacing' || index === 0),
          locked: locked && index === 0,
        });
      });
    });
    return guides;
  }

  private getPrimaryGuideFromProposal(
    proposal: AlignmentProposal
  ): SmartGuideLine | null {
    return proposal.sourceGuides[0] ?? null;
  }

  private findSnapCandidateProposal(args: {
    proposals: ReadonlyArray<AlignmentProposal>;
    axis: 'x' | 'y';
  }): AlignmentProposal | null {
    return (
      args.proposals.find((proposal) => proposal.axis === args.axis) ?? null
    );
  }

  private getLockedVerticalGuideOffset(args: {
    movingBounds: AlignmentRect;
    releaseThreshold: number;
    maxSecondaryDistance: number;
    minGuideLength: number;
    maxGuideLength: number;
  }): {
    guide: Extract<SmartGuideLine, { orientation: 'vertical' }>;
    offset: number;
  } | null {
    const guide = this.lockedVerticalGuide;
    if (!guide) return null;
    const movingValue =
      guide.movingAnchor === 'left'
        ? args.movingBounds.left
        : guide.movingAnchor === 'center'
          ? args.movingBounds.centerX
          : args.movingBounds.right;
    const offset = guide.position - movingValue;
    if (Math.abs(offset) > args.releaseThreshold) return null;
    const secondaryDistance = this.getRangeDistance(
      args.movingBounds.top,
      args.movingBounds.bottom,
      guide.start,
      guide.end
    );
    if (secondaryDistance > args.maxSecondaryDistance) return null;
    const span = this.clampSpan(
      Math.min(guide.start, args.movingBounds.top),
      Math.max(guide.end, args.movingBounds.bottom),
      args.minGuideLength,
      args.maxGuideLength
    );
    return {
      guide: {
        ...guide,
        offset,
        start: span.start,
        end: span.end,
      },
      offset,
    };
  }

  private getLockedHorizontalGuideOffset(args: {
    movingBounds: AlignmentRect;
    releaseThreshold: number;
    maxSecondaryDistance: number;
    minGuideLength: number;
    maxGuideLength: number;
  }): {
    guide: Extract<SmartGuideLine, { orientation: 'horizontal' }>;
    offset: number;
  } | null {
    const guide = this.lockedHorizontalGuide;
    if (!guide) return null;
    const movingValue =
      guide.movingAnchor === 'top'
        ? args.movingBounds.top
        : guide.movingAnchor === 'middle'
          ? args.movingBounds.centerY
          : args.movingBounds.bottom;
    const offset = guide.position - movingValue;
    if (Math.abs(offset) > args.releaseThreshold) return null;
    const secondaryDistance = this.getRangeDistance(
      args.movingBounds.left,
      args.movingBounds.right,
      guide.start,
      guide.end
    );
    if (secondaryDistance > args.maxSecondaryDistance) return null;
    const span = this.clampSpan(
      Math.min(guide.start, args.movingBounds.left),
      Math.max(guide.end, args.movingBounds.right),
      args.minGuideLength,
      args.maxGuideLength
    );
    return {
      guide: {
        ...guide,
        offset,
        start: span.start,
        end: span.end,
      },
      offset,
    };
  }

  private shiftRect(
    rect: AlignmentRect,
    offsetX: number,
    offsetY: number
  ): AlignmentRect {
    return {
      x: rect.x + offsetX,
      y: rect.y + offsetY,
      width: rect.width,
      height: rect.height,
      left: rect.left + offsetX,
      right: rect.right + offsetX,
      top: rect.top + offsetY,
      bottom: rect.bottom + offsetY,
      centerX: rect.centerX + offsetX,
      centerY: rect.centerY + offsetY,
    };
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

  private selectAxisProposals(args: {
    proposals: ReadonlyArray<AlignmentProposal>;
    axis: 'x' | 'y';
    activeOffset: number;
    primaryGuide:
      | Extract<SmartGuideLine, { orientation: 'vertical' }>
      | Extract<SmartGuideLine, { orientation: 'horizontal' }>
      | null;
  }): AppliedAlignmentProposal[] {
    if (!args.primaryGuide) return [];

    const primaryProposal = this.findPrimaryProposal({
      proposals: args.proposals,
      axis: args.axis,
      activeOffset: args.activeOffset,
      primaryGuide: args.primaryGuide,
    });
    const lockedLockKey =
      args.primaryGuide.locked === true
        ? primaryProposal?.lockKey ?? getSmartGuideLockKey(args.primaryGuide)
        : null;
    const supplementalProposals = args.proposals.filter(
      (proposal) =>
        proposal.axis === args.axis &&
        Math.abs(proposal.delta - args.activeOffset) <= Number.EPSILON &&
        proposal.id !== primaryProposal?.id
    );

    return [
      ...(primaryProposal
        ? [
            {
              proposal: primaryProposal,
              primary: true,
              locked:
                lockedLockKey !== null &&
                primaryProposal.lockKey === lockedLockKey,
            } satisfies AppliedAlignmentProposal,
          ]
        : []),
      ...supplementalProposals.map((proposal) => ({
        proposal,
        primary: proposal.kind === 'spacing',
        locked: lockedLockKey !== null && proposal.lockKey === lockedLockKey,
      })),
    ];
  }

  private findPrimaryProposal(args: {
    proposals: ReadonlyArray<AlignmentProposal>;
    axis: 'x' | 'y';
    activeOffset: number;
    primaryGuide:
      | Extract<SmartGuideLine, { orientation: 'vertical' }>
      | Extract<SmartGuideLine, { orientation: 'horizontal' }>;
  }): AlignmentProposal | null {
    const directMatch = args.proposals.find(
      (proposal) =>
        proposal.axis === args.axis &&
        Math.abs(proposal.delta - args.activeOffset) <= Number.EPSILON &&
        proposal.lockKey === getSmartGuideLockKey(args.primaryGuide)
    );
    if (directMatch) return directMatch;

    const offsetMatch =
      args.proposals.find(
        (proposal) =>
          proposal.axis === args.axis &&
          Math.abs(proposal.delta - args.activeOffset) <= Number.EPSILON
      ) ?? null;
    if (offsetMatch) return offsetMatch;

    return createAlignmentProposalFromSmartGuide(args.primaryGuide);
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
