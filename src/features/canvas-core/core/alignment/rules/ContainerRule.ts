import { SmartAlignmentService } from '../../services/SmartAlignmentService.ts';
import {
  createAlignmentProposalFromSmartGuides,
  getSmartGuideLockKey,
} from '../smartGuideProposalInterop.ts';
import {
  toSmartAlignmentCandidate,
  toSmartAlignmentRect,
} from '../legacySmartGuideInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './AlignmentRule.ts';
import { EMPTY_ALIGNMENT_RULE_RESULT } from './AlignmentRule.ts';

export class ContainerRule implements AlignmentRule {
  constructor(
    private readonly smartAlignmentService: SmartAlignmentService = new SmartAlignmentService()
  ) {}

  public compute(args: AlignmentRuleInput): AlignmentRuleResult {
    if (!args.preferences.showContainerGuides) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }
    const movingSubject = args.movingSubject;
    if (
      !movingSubject ||
      movingSubject.role === 'container' ||
      !movingSubject.scopeId
    ) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    const containerSubject = args.subjects.find(
      (subject) => subject.role === 'container' && subject.id === movingSubject.scopeId
    );
    if (!containerSubject) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    const result = this.smartAlignmentService.compute({
      movingBounds: toSmartAlignmentRect(movingSubject.bounds),
      candidates: [toSmartAlignmentCandidate(containerSubject)],
      threshold: args.threshold,
      maxSecondaryDistance: args.maxSecondaryDistance,
      minGuideLength: args.minGuideLength,
      maxGuideLength: args.maxGuideLength,
      preferredVerticalGuide:
        args.preferredVerticalGuide?.targetId === containerSubject.id
          ? args.preferredVerticalGuide
          : null,
      preferredHorizontalGuide:
        args.preferredHorizontalGuide?.targetId === containerSubject.id
          ? args.preferredHorizontalGuide
          : null,
    });

    if (result.guides.length === 0) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    const guides = result.guides.map((guide) => ({
      ...guide,
      guideKind: 'container' as const,
    }));

    return {
      proposals: guides.map((guide) =>
        createAlignmentProposalFromSmartGuides({
          guides: [guide],
          id: `container:${getSmartGuideLockKey(guide)}`,
          kind: 'container',
          lockKey: `container:${getSmartGuideLockKey(guide)}`,
          score: Math.abs(guide.offset),
          targetSubjectIds: [containerSubject.id],
        })
      ),
      snapOffsetX: result.snapOffsetX,
      snapOffsetY: result.snapOffsetY,
    };
  }
}
