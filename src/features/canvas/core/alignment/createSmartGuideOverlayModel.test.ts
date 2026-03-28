import { describe, expect, it } from 'vitest';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
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
          primary: true,
          locked: true,
          position: 300,
          start: 25,
          end: 125,
        },
      ],
    });
  });

  it('groups spacing guides into line, band, and badge visuals', () => {
    const guides: SmartGuideLine[] = [
      {
        orientation: 'vertical',
        targetId: 'spacing-x:left:right',
        guideKind: 'spacing',
        label: '103 px',
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
        label: '103 px',
        position: 797,
        start: 100,
        end: 212,
        offset: 5,
        movingAnchor: 'right',
        targetAnchor: 'right',
      },
    ];

    expect(createSmartGuideOverlayModel(guides)).toEqual({
      visuals: [
        {
          type: 'band',
          axis: 'x',
          kind: 'spacing',
          primary: true,
          start: 525,
          end: 797,
          depthStart: 100,
          depthEnd: 212,
        },
        {
          type: 'line',
          axis: 'x',
          kind: 'spacing',
          primary: true,
          locked: true,
          position: 525,
          start: 100,
          end: 212,
        },
        {
          type: 'line',
          axis: 'x',
          kind: 'spacing',
          primary: true,
          locked: false,
          position: 797,
          start: 100,
          end: 212,
        },
        {
          type: 'badge',
          kind: 'spacing',
          text: '103 px',
          x: 661,
          y: 156,
        },
      ],
    });
  });
});
