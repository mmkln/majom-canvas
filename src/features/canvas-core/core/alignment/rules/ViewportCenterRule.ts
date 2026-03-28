import type { SmartGuideLine } from '../../services/SmartAlignmentService.ts';
import { createAlignmentProposalFromSmartGuides } from '../smartGuideProposalInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './AlignmentRule.ts';
import { EMPTY_ALIGNMENT_RULE_RESULT } from './AlignmentRule.ts';

export class ViewportCenterRule implements AlignmentRule {
  public compute(args: AlignmentRuleInput): AlignmentRuleResult {
    if (!args.preferences.showViewportCenterGuides) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }
    const movingSubject = args.movingSubject;
    if (!movingSubject) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    const viewportSubject = args.subjects.find(
      (subject) => subject.role === 'viewport'
    );
    if (!viewportSubject) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    const guides: SmartGuideLine[] = [];
    let snapOffsetX = 0;
    let snapOffsetY = 0;

    const offsetX = viewportSubject.bounds.centerX - movingSubject.bounds.centerX;
    if (Math.abs(offsetX) <= args.threshold) {
      guides.push({
        orientation: 'vertical',
        targetId: viewportSubject.id,
        guideKind: 'viewport-center',
        position: viewportSubject.bounds.centerX,
        start: Math.min(movingSubject.bounds.top, viewportSubject.bounds.top),
        end: Math.max(movingSubject.bounds.bottom, viewportSubject.bounds.bottom),
        offset: offsetX,
        movingAnchor: 'center',
        targetAnchor: 'center',
      });
      snapOffsetX = offsetX;
    }

    const offsetY = viewportSubject.bounds.centerY - movingSubject.bounds.centerY;
    if (Math.abs(offsetY) <= args.threshold) {
      guides.push({
        orientation: 'horizontal',
        targetId: viewportSubject.id,
        guideKind: 'viewport-center',
        position: viewportSubject.bounds.centerY,
        start: Math.min(movingSubject.bounds.left, viewportSubject.bounds.left),
        end: Math.max(movingSubject.bounds.right, viewportSubject.bounds.right),
        offset: offsetY,
        movingAnchor: 'middle',
        targetAnchor: 'middle',
      });
      snapOffsetY = offsetY;
    }

    if (guides.length === 0) {
      return EMPTY_ALIGNMENT_RULE_RESULT;
    }

    return {
      proposals: guides.map((guide) =>
        createAlignmentProposalFromSmartGuides({
          guides: [guide],
          id: `viewport:${guide.orientation}`,
          kind: 'viewport-center',
          lockKey: `viewport:${guide.orientation}`,
          score: Math.abs(guide.offset),
          targetSubjectIds: [viewportSubject.id],
        })
      ),
      snapOffsetX,
      snapOffsetY,
    };
  }
}
