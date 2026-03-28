import { describe, expect, it } from 'vitest';
import { createAlignmentSubject } from '../../../adapters/CanvasAlignmentAdapterUtils.ts';
import { mergeAlignmentPreferences } from '../types.ts';
import { createAlignmentRect } from '../../services/SmartAlignmentService.ts';
import { ViewportCenterRule } from './ViewportCenterRule.ts';

describe('ViewportCenterRule', () => {
  it('snaps a moving subject to the viewport center on matching axes', () => {
    const rule = new ViewportCenterRule();
    const result = rule.compute({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 460,
          y: 100,
          width: 272,
          height: 112,
        }),
      }),
      subjects: [
        createAlignmentSubject({
          id: '__viewport__',
          bounds: createAlignmentRect({
            x: 0,
            y: 0,
            width: 1200,
            height: 800,
          }),
          role: 'viewport',
          scopeKind: 'viewport',
          scopeId: null,
        }),
      ],
      threshold: 6,
      maxSecondaryDistance: Number.POSITIVE_INFINITY,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
      preferences: mergeAlignmentPreferences({
        showViewportCenterGuides: true,
      }),
    });

    expect(result.snapOffsetX).toBe(4);
    expect(result.snapOffsetY).toBe(0);
    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides).toHaveLength(1);
    expect(result.proposals[0]?.sourceGuides[0]).toMatchObject({
      orientation: 'vertical',
      guideKind: 'viewport-center',
      movingAnchor: 'center',
      targetAnchor: 'center',
      position: 600,
    });
    expect(result.proposals[0]).toMatchObject({
      axis: 'x',
      kind: 'viewport-center',
      delta: 4,
    });
    expect(result.proposals[0]?.visuals[0]).toMatchObject({
      type: 'line',
      kind: 'viewport-center',
      position: 600,
    });
  });
});
