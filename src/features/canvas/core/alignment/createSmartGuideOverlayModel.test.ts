import { describe, expect, it } from 'vitest';
import {
  createAlignmentRect,
  type SmartGuideLine,
} from '../services/SmartAlignmentService.ts';
import { createSmartGuideOverlayModel } from './createSmartGuideOverlayModel.ts';

describe('createSmartGuideOverlayModel', () => {
  it('maps edge and center guides to line visuals', () => {
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'edge-1',
        position: 120,
        start: 40,
        end: 220,
        offset: 2,
        movingAnchor: 'left',
        targetAnchor: 'left',
        primary: false,
      },
      {
        orientation: 'horizontal',
        targetId: 'center-1',
        position: 300,
        start: 25,
        end: 125,
        offset: -3,
        movingAnchor: 'middle',
        targetAnchor: 'middle',
        locked: true,
      },
    ];

    expect(createSmartGuideOverlayModel(guides)).toEqual({
      visuals: [
        {
          type: 'line',
          axis: 'x',
          kind: 'edge',
          emphasis: 'secondary',
          placement: 'span',
          primary: false,
          locked: false,
          position: 120,
          start: 40,
          end: 220,
        },
        {
          type: 'line',
          axis: 'y',
          kind: 'center',
          emphasis: 'primary',
          placement: 'span',
          primary: true,
          locked: true,
          position: 300,
          start: 25,
          end: 125,
        },
      ],
    });
  });

  it('groups spacing guides into dual measurement rails', () => {
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103',
        spacingDistance: 103,
        position: 525,
        start: 100,
        end: 212,
        offset: 5,
        movingAnchor: 'left',
        targetAnchor: 'left',
        locked: true,
      },
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103',
        spacingDistance: 103,
        position: 797,
        start: 100,
        end: 212,
        offset: 5,
        movingAnchor: 'right',
        targetAnchor: 'right',
      },
    ];

    expect(
      createSmartGuideOverlayModel(guides, {
        movingBounds: createAlignmentRect({
          x: 525,
          y: 100,
          width: 272,
          height: 112,
        }),
        viewportBounds: createAlignmentRect({
          x: 0,
          y: 0,
          width: 1200,
          height: 800,
        }),
        scale: 1,
      })
    ).toEqual({
      visuals: [
        {
          type: 'line',
          axis: 'y',
          kind: 'spacing',
          emphasis: 'measurement',
          placement: 'outside-top',
          primary: true,
          locked: true,
          position: 86,
          start: 422,
          end: 525,
        },
        {
          type: 'line',
          axis: 'y',
          kind: 'spacing',
          emphasis: 'measurement',
          placement: 'outside-top',
          primary: true,
          locked: true,
          position: 86,
          start: 797,
          end: 900,
        },
      ],
    });
  });
});
