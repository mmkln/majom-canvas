import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import type {
  AlignmentPreferences,
  AlignmentProposal,
  AlignmentSubject,
} from './types.ts';
import { mergeAlignmentPreferences } from './types.ts';
import { ContainerRule } from './rules/ContainerRule.ts';
import { EdgeCenterRule } from './rules/EdgeCenterRule.ts';
import type {
  AlignmentRule,
  AlignmentRuleResult,
} from './rules/AlignmentRule.ts';
import { SpacingRule } from './rules/SpacingRule.ts';
import { ViewportCenterRule } from './rules/ViewportCenterRule.ts';

type AlignmentEngineComputeArgs = {
  movingSubject: AlignmentSubject | null;
  subjects: AlignmentSubject[];
  threshold: number;
  maxSecondaryDistance?: number;
  minGuideLength?: number;
  maxGuideLength?: number;
  preferences?: Partial<AlignmentPreferences>;
  preferredVerticalGuide?: Extract<
    SmartGuideLine,
    { orientation: 'vertical' }
  > | null;
  preferredHorizontalGuide?: Extract<
    SmartGuideLine,
    { orientation: 'horizontal' }
  > | null;
};

type AlignmentEngineResult = AlignmentRuleResult;

export class AlignmentEngine {
  constructor(
    private readonly rules: ReadonlyArray<AlignmentRule> = [
      new ContainerRule(),
      new EdgeCenterRule(),
      new SpacingRule(),
      new ViewportCenterRule(),
    ]
  ) {}

  public compute(args: AlignmentEngineComputeArgs): AlignmentEngineResult {
    const preferences = mergeAlignmentPreferences(args.preferences);
    const proposals: AlignmentProposal[] = [];
    let snapOffsetX = 0;
    let snapOffsetY = 0;

    this.rules.forEach((rule) => {
      const result = rule.compute({
        ...args,
        preferences,
      });
      proposals.push(...result.proposals);
      if (snapOffsetX === 0 && result.snapOffsetX !== 0) {
        snapOffsetX = result.snapOffsetX;
      }
      if (snapOffsetY === 0 && result.snapOffsetY !== 0) {
        snapOffsetY = result.snapOffsetY;
      }
    });

    return {
      proposals,
      snapOffsetX,
      snapOffsetY,
    };
  }
}
