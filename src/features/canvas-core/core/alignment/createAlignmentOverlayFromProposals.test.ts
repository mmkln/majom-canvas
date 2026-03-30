import { describe, expect, it } from 'vitest';
import {
  createAlignmentRect,
  type SmartGuideLine,
} from '../services/SmartAlignmentService.ts';
import { createAlignmentOverlayFromProposals } from './createAlignmentOverlayFromProposals.ts';
import {
  createAlignmentProposalFromSmartGuide,
  createAlignmentProposalFromSmartGuides,
} from './smartGuideProposalInterop.ts';

describe('createAlignmentOverlayFromProposals', () => {
  it('applies primary and locked state to line visuals', () => {
    const proposal = createAlignmentProposalFromSmartGuide({
      orientation: 'vertical',
      targetId: 'target',
      position: 200,
      start: 100,
      end: 240,
      offset: 2,
      movingAnchor: 'left',
      targetAnchor: 'left',
    });

    expect(
      createAlignmentOverlayFromProposals([
        {
          proposal,
          primary: false,
          locked: true,
        },
      ])
    ).toEqual({
      visuals: [
        {
          type: 'line',
          axis: 'x',
          kind: 'edge',
          emphasis: 'secondary',
          placement: 'span',
          primary: false,
          locked: true,
          position: 200,
          start: 100,
          end: 240,
        },
      ],
    });
  });

  it('preserves dual spacing rails while applying proposal state', () => {
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
    const proposal = createAlignmentProposalFromSmartGuides({
      guides,
      kind: 'spacing',
      lockKey: 'spacing-x:left:right',
      targetSubjectIds: ['left', 'right'],
    });

    expect(
      createAlignmentOverlayFromProposals([
        {
          proposal,
          primary: true,
          locked: false,
        },
      ], {
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
          locked: false,
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
          locked: false,
          position: 86,
          start: 797,
          end: 900,
        },
      ],
    });
  });
});
