import type {
  AlignmentPreferences,
  AlignmentProposal,
  AlignmentSubject,
} from '../types.ts';
import type { SmartGuideLine } from '../../services/SmartAlignmentService.ts';

export type AlignmentRuleInput = {
  movingSubject: AlignmentSubject | null;
  subjects: AlignmentSubject[];
  threshold: number;
  maxSecondaryDistance?: number;
  minGuideLength?: number;
  maxGuideLength?: number;
  preferences: AlignmentPreferences;
  preferredVerticalGuide?: Extract<
    SmartGuideLine,
    { orientation: 'vertical' }
  > | null;
  preferredHorizontalGuide?: Extract<
    SmartGuideLine,
    { orientation: 'horizontal' }
  > | null;
};

export type AlignmentRuleResult = {
  proposals: AlignmentProposal[];
  snapOffsetX: number;
  snapOffsetY: number;
};

export interface AlignmentRule {
  compute(args: AlignmentRuleInput): AlignmentRuleResult;
}

export const EMPTY_ALIGNMENT_RULE_RESULT: AlignmentRuleResult = {
  proposals: [],
  snapOffsetX: 0,
  snapOffsetY: 0,
};
