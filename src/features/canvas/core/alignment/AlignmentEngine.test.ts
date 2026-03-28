import { describe, expect, it } from 'vitest';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { createAlignmentRect } from '../services/SmartAlignmentService.ts';
import { AlignmentEngine } from './AlignmentEngine.ts';
import { createAlignmentProposalFromSmartGuide } from './smartGuideProposalInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './rules/AlignmentRule.ts';
import type { AlignmentSubject } from './types.ts';

class StubRule implements AlignmentRule {
  constructor(private readonly result: AlignmentRuleResult) {}

  public compute(_args: AlignmentRuleInput): AlignmentRuleResult {
    return this.result;
  }
}

function createSubject(
  id: string,
  bounds: AlignmentSubject['bounds'],
  overrides: Partial<AlignmentSubject> = {}
): AlignmentSubject {
  return {
    id,
    role: 'element',
    scopeKind: 'local',
    scopeId: null,
    bounds,
    anchors: [],
    ...overrides,
  };
}

function createVerticalGuide(
  overrides: Partial<Extract<SmartGuideLine, { orientation: 'vertical' }>> = {}
): Extract<SmartGuideLine, { orientation: 'vertical' }> {
  return {
    orientation: 'vertical',
    targetId: 'target',
    position: 200,
    start: 100,
    end: 240,
    offset: 2,
    movingAnchor: 'left',
    targetAnchor: 'left',
    ...overrides,
  };
}

function createHorizontalGuide(
  overrides: Partial<
    Extract<SmartGuideLine, { orientation: 'horizontal' }>
  > = {}
): Extract<SmartGuideLine, { orientation: 'horizontal' }> {
  return {
    orientation: 'horizontal',
    targetId: 'target',
    position: 160,
    start: 100,
    end: 240,
    offset: 4,
    movingAnchor: 'top',
    targetAnchor: 'top',
    ...overrides,
  };
}

describe('AlignmentEngine', () => {
  it('keeps current edge-center behavior through the engine wrapper', () => {
    const engine = new AlignmentEngine();
    const movingSubject = createSubject(
      '__moving__',
      createAlignmentRect({
        x: 100,
        y: 100,
        width: 120,
        height: 80,
      })
    );
    const subjects = [
      createSubject(
        'candidate-1',
        createAlignmentRect({
          x: 223,
          y: 182,
          width: 100,
          height: 120,
        })
      ),
    ];

    const result = engine.compute({
      movingSubject,
      subjects,
      threshold: 6,
      maxSecondaryDistance: Number.POSITIVE_INFINITY,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });

    expect(result.snapOffsetX).toBe(3);
    expect(result.snapOffsetY).toBe(2);
    expect(result.proposals).toHaveLength(2);
    expect(result.proposals.map((proposal) => proposal.sourceGuides)).toHaveLength(2);
  });

  it('aggregates rule outputs and uses rule order for snap priority', () => {
    const engine = new AlignmentEngine([
      new StubRule({
        proposals: [createAlignmentProposalFromSmartGuide(createVerticalGuide())],
        snapOffsetX: 2,
        snapOffsetY: 0,
      }),
      new StubRule({
        proposals: [
          createAlignmentProposalFromSmartGuide(createHorizontalGuide()),
          createAlignmentProposalFromSmartGuide(
            createVerticalGuide({ targetId: 'secondary' })
          ),
        ],
        snapOffsetX: 5,
        snapOffsetY: 4,
      }),
    ]);

    const result = engine.compute({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        })
      ),
      subjects: [],
      threshold: 4,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });

    expect(result.proposals).toHaveLength(3);
    expect(
      result.proposals.reduce(
        (count, proposal) => count + proposal.sourceGuides.length,
        0
      )
    ).toBe(3);
    expect(result.snapOffsetX).toBe(2);
    expect(result.snapOffsetY).toBe(4);
  });
});
