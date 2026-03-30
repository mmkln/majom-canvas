import { describe, expect, it } from 'vitest';
import { createAlignmentSubject } from '../../adapters/CanvasAlignmentAdapterUtils.ts';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
import { createAlignmentRect } from '../services/SmartAlignmentService.ts';
import { AlignmentEngine } from './AlignmentEngine.ts';
import { createAlignmentProposalFromSmartGuide } from './smartGuideProposalInterop.ts';
import type {
  AlignmentRule,
  AlignmentRuleInput,
  AlignmentRuleResult,
} from './rules/AlignmentRule.ts';

class StubRule implements AlignmentRule {
  constructor(private readonly result: AlignmentRuleResult) {}

  public compute(_args: AlignmentRuleInput): AlignmentRuleResult {
    return this.result;
  }
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
    const movingSubject = createAlignmentSubject({
      id: '__moving__',
      bounds: createAlignmentRect({
        x: 100,
        y: 100,
        width: 120,
        height: 80,
      }),
    });
    const subjects = [
      createAlignmentSubject({
        id: 'candidate-1',
        bounds: createAlignmentRect({
          x: 223,
          y: 182,
          width: 100,
          height: 120,
        }),
      }),
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

  it('ranks proposals globally instead of using rule order for snap priority', () => {
    const engine = new AlignmentEngine([
      new StubRule({
        proposals: [createAlignmentProposalFromSmartGuide(createVerticalGuide())],
        snapOffsetX: 2,
        snapOffsetY: 0,
      }),
      new StubRule({
        proposals: [
          createAlignmentProposalFromSmartGuide(
            createHorizontalGuide({ offset: 1 })
          ),
          createAlignmentProposalFromSmartGuide(
            createVerticalGuide({ targetId: 'secondary', offset: 1 })
          ),
        ],
        snapOffsetX: 1,
        snapOffsetY: 1,
      }),
    ]);

    const result = engine.compute({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        }),
      }),
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
    expect(result.snapOffsetX).toBe(1);
    expect(result.snapOffsetY).toBe(1);
  });

  it('treats structural guides as fallback behind local proposals', () => {
    const engine = new AlignmentEngine([
      new StubRule({
        proposals: [
          createAlignmentProposalFromSmartGuide(
            createVerticalGuide({
              targetId: 'container',
              guideKind: 'container',
              offset: 1,
            })
          ),
        ],
        snapOffsetX: 1,
        snapOffsetY: 0,
      }),
      new StubRule({
        proposals: [
          createAlignmentProposalFromSmartGuide(
            createVerticalGuide({
              targetId: 'local-edge',
              offset: 2,
            })
          ),
        ],
        snapOffsetX: 2,
        snapOffsetY: 0,
      }),
    ]);

    const result = engine.compute({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 100,
          y: 100,
          width: 50,
          height: 50,
        }),
      }),
      subjects: [],
      threshold: 4,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });

    expect(result.snapOffsetX).toBe(2);
    expect(result.proposals.map((proposal) => proposal.kind)).toEqual([
      'edge',
      'container',
    ]);
  });
});
