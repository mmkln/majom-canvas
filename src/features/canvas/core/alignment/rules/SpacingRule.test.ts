import { describe, expect, it } from 'vitest';
import { createAlignmentRect } from '../../services/SmartAlignmentService.ts';
import { mergeAlignmentPreferences } from '../types.ts';
import { SpacingRule } from './SpacingRule.ts';
import type { AlignmentSubject } from '../types.ts';

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

describe('SpacingRule', () => {
  it('snaps horizontally to an equal gap between left and right subjects', () => {
    const rule = new SpacingRule();
    const result = rule.compute({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 520,
          y: 100,
          width: 272,
          height: 112,
        })
      ),
      subjects: [
        createSubject(
          'left',
          createAlignmentRect({
            x: 150,
            y: 100,
            width: 272,
            height: 112,
          })
        ),
        createSubject(
          'right',
          createAlignmentRect({
            x: 900,
            y: 100,
            width: 272,
            height: 112,
          })
        ),
      ],
      threshold: 6,
      maxSecondaryDistance: 280,
      minGuideLength: 84,
      maxGuideLength: 260,
      preferences: mergeAlignmentPreferences({
        showSpacingGuides: true,
      }),
    });

    expect(result.snapOffsetX).toBe(5);
    expect(result.snapOffsetY).toBe(0);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides).toHaveLength(2);
    expect(
      result.proposals[0]?.sourceGuides.map((guide) => guide.orientation)
    ).toEqual(['vertical', 'vertical']);
    expect(result.proposals[0]?.sourceGuides[0]?.position).toBe(525);
    expect(result.proposals[0]?.sourceGuides[1]?.position).toBe(797);
  });

  it('snaps vertically to an equal gap between top and bottom subjects', () => {
    const rule = new SpacingRule();
    const result = rule.compute({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 100,
          y: 520,
          width: 272,
          height: 112,
        })
      ),
      subjects: [
        createSubject(
          'top',
          createAlignmentRect({
            x: 100,
            y: 150,
            width: 272,
            height: 112,
          })
        ),
        createSubject(
          'bottom',
          createAlignmentRect({
            x: 100,
            y: 900,
            width: 272,
            height: 112,
          })
        ),
      ],
      threshold: 6,
      maxSecondaryDistance: 280,
      minGuideLength: 84,
      maxGuideLength: 260,
      preferences: mergeAlignmentPreferences({
        showSpacingGuides: true,
      }),
    });

    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(5);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides).toHaveLength(2);
    expect(
      result.proposals[0]?.sourceGuides.map((guide) => guide.orientation)
    ).toEqual(['horizontal', 'horizontal']);
    expect(result.proposals[0]?.sourceGuides[0]?.position).toBe(525);
    expect(result.proposals[0]?.sourceGuides[1]?.position).toBe(637);
  });

  it('does not generate spacing snap when the moving subject does not fit between references', () => {
    const rule = new SpacingRule();
    const result = rule.compute({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 200,
          y: 100,
          width: 400,
          height: 112,
        })
      ),
      subjects: [
        createSubject(
          'left',
          createAlignmentRect({
            x: 100,
            y: 100,
            width: 120,
            height: 112,
          })
        ),
        createSubject(
          'right',
          createAlignmentRect({
            x: 500,
            y: 100,
            width: 120,
            height: 112,
          })
        ),
      ],
      threshold: 12,
      maxSecondaryDistance: 280,
      minGuideLength: 84,
      maxGuideLength: 260,
      preferences: mergeAlignmentPreferences({
        showSpacingGuides: true,
      }),
    });

    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(0);
    expect(result.proposals).toHaveLength(0);
  });
});
