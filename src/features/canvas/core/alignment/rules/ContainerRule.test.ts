import { describe, expect, it } from 'vitest';
import { createAlignmentRect } from '../../services/SmartAlignmentService.ts';
import { mergeAlignmentPreferences } from '../types.ts';
import { ContainerRule } from './ContainerRule.ts';
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

describe('ContainerRule', () => {
  it('snaps a scoped element to its container and tags the proposal as container alignment', () => {
    const rule = new ContainerRule();
    const result = rule.compute({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 324,
          y: 130,
          width: 272,
          height: 112,
        }),
        {
          scopeKind: 'container',
          scopeId: 'story-1',
        }
      ),
      subjects: [
        createSubject(
          'story-1',
          createAlignmentRect({
            x: 320,
            y: 80,
            width: 344,
            height: 240,
          }),
          {
            role: 'container',
            scopeKind: 'global',
            scopeId: null,
          }
        ),
      ],
      threshold: 6,
      maxSecondaryDistance: 320,
      minGuideLength: 84,
      maxGuideLength: 400,
      preferences: mergeAlignmentPreferences({
        showContainerGuides: true,
      }),
    });

    expect(result.snapOffsetX).toBe(-4);
    expect(result.snapOffsetY).toBe(0);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides[0]).toMatchObject({
      targetId: 'story-1',
      guideKind: 'container',
      orientation: 'vertical',
      position: 320,
    });
    expect(result.proposals[0]).toMatchObject({
      axis: 'x',
      kind: 'container',
      delta: -4,
      targetSubjectIds: ['story-1'],
    });
    expect(result.proposals[0]?.visuals[0]).toMatchObject({
      type: 'line',
      kind: 'container',
      position: 320,
    });
  });
});
