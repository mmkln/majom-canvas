import { SmartAlignmentService } from '../../services/SmartAlignmentService.ts';
import {
  toSmartAlignmentCandidate,
  toSmartAlignmentRect,
} from '../legacySmartGuideInterop.ts';
import { createAlignmentProposalFromSmartGuide } from '../smartGuideProposalInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './AlignmentRule.ts';

export class EdgeCenterRule implements AlignmentRule {
  constructor(
    private readonly smartAlignmentService: SmartAlignmentService = new SmartAlignmentService()
  ) {}

  public compute(args: AlignmentRuleInput): AlignmentRuleResult {
    const filteredSubjects = args.subjects.filter((subject) => {
      if (subject.role === 'viewport') {
        return false;
      }
      if (
        subject.role === 'container' &&
        args.movingSubject?.role !== 'container' &&
        args.movingSubject?.scopeId === subject.id
      ) {
        return false;
      }
      return true;
    });
    const result = this.smartAlignmentService.compute({
      movingBounds: args.movingSubject
        ? toSmartAlignmentRect(args.movingSubject.bounds)
        : null,
      candidates: filteredSubjects.map(toSmartAlignmentCandidate),
      threshold: args.threshold,
      maxSecondaryDistance: args.maxSecondaryDistance,
      minGuideLength: args.minGuideLength,
      maxGuideLength: args.maxGuideLength,
      preferredVerticalGuide: args.preferredVerticalGuide,
      preferredHorizontalGuide: args.preferredHorizontalGuide,
    });
    return {
      proposals: result.guides.map(createAlignmentProposalFromSmartGuide),
      snapOffsetX: result.snapOffsetX,
      snapOffsetY: result.snapOffsetY,
    };
  }
}
