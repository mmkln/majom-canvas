import { describe, expect, it } from 'vitest';
import type { SmartGuideLine } from '../services/SmartAlignmentService.ts';
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
          primary: false,
          locked: true,
          position: 200,
          start: 100,
          end: 240,
        },
      ],
    });
  });

  it('preserves spacing visuals while applying proposal state', () => {
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
      ])
    ).toEqual({
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
          locked: false,
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
