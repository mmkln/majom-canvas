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

const PROPOSAL_SCORE_EPSILON = 1e-6;

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

    this.rules.forEach((rule) => {
      const result = rule.compute({
        ...args,
        preferences,
      });
      proposals.push(...result.proposals);
    });

    const rankedProposals = this.rankProposals(proposals);

    return {
      proposals: rankedProposals,
      snapOffsetX: this.getSnapOffsetForAxis(rankedProposals, 'x'),
      snapOffsetY: this.getSnapOffsetForAxis(rankedProposals, 'y'),
    };
  }

  private rankProposals(
    proposals: ReadonlyArray<AlignmentProposal>
  ): AlignmentProposal[] {
    return [...proposals].sort((left, right) =>
      this.compareProposals(left, right)
    );
  }

  private compareProposals(
    left: AlignmentProposal,
    right: AlignmentProposal
  ): number {
    const groupDelta =
      this.getProposalGroupPriority(left) - this.getProposalGroupPriority(right);
    if (groupDelta !== 0) {
      return groupDelta;
    }

    if (Math.abs(left.score - right.score) > PROPOSAL_SCORE_EPSILON) {
      return left.score - right.score;
    }

    const kindDelta =
      this.getProposalKindPriority(left) - this.getProposalKindPriority(right);
    if (kindDelta !== 0) {
      return kindDelta;
    }

    if (Math.abs(left.delta - right.delta) > PROPOSAL_SCORE_EPSILON) {
      return Math.abs(left.delta) - Math.abs(right.delta);
    }

    if (left.targetSubjectIds.length !== right.targetSubjectIds.length) {
      return left.targetSubjectIds.length - right.targetSubjectIds.length;
    }

    return left.id.localeCompare(right.id);
  }

  private getSnapOffsetForAxis(
    proposals: ReadonlyArray<AlignmentProposal>,
    axis: 'x' | 'y'
  ): number {
    return proposals.find((proposal) => proposal.axis === axis)?.delta ?? 0;
  }

  private getProposalGroupPriority(proposal: AlignmentProposal): number {
    switch (proposal.kind) {
      case 'container':
        return 1;
      case 'viewport-center':
        return 2;
      default:
        return 0;
    }
  }

  private getProposalKindPriority(proposal: AlignmentProposal): number {
    switch (proposal.kind) {
      case 'center':
        return 0;
      case 'edge':
        return 1;
      case 'spacing':
        return 2;
      case 'container':
        return 0;
      case 'viewport-center':
        return 0;
    }
  }
}
