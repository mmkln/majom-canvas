import { describe, expect, it } from 'vitest';
import { createAlignmentSubject } from '../../adapters/CanvasAlignmentAdapterUtils.ts';
import { createAlignmentRect } from '../services/SmartAlignmentService.ts';
import { AlignmentSession } from './AlignmentSession.ts';
import { createAlignmentProposalFromSmartGuide } from './smartGuideProposalInterop.ts';
import type { AlignmentProposal } from './types.ts';

describe('AlignmentSession', () => {
  it('shows guides but suppresses snap when allowSnap is false', () => {
    const session = new AlignmentSession();
    const movingSubject = createAlignmentSubject({
      id: '__moving__',
      bounds: createAlignmentRect({
        x: 100,
        y: 100,
        width: 40,
        height: 30,
      }),
    });
    const subjects = [
      createAlignmentSubject({
        id: 'candidate',
        bounds: createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        }),
      }),
    ];

    const result = session.update({
      movingSubject,
      subjects,
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
      allowSnap: false,
    });

    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(0);
    expect(result.guides).toHaveLength(1);
    expect(result.overlay.visuals).toHaveLength(1);
    expect(session.getGuides()).toHaveLength(1);
    expect(session.getOverlay().visuals).toHaveLength(1);
  });

  it('keeps a locked guide within release threshold and clears it after release', () => {
    const session = new AlignmentSession();
    const subjects = [
      createAlignmentSubject({
        id: 'candidate',
        bounds: createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        }),
      }),
    ];

    const first = session.update({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 100,
          y: 100,
          width: 40,
          height: 30,
        }),
      }),
      subjects,
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });
    expect(first.snapOffsetX).toBe(2);
    expect(first.overlay.visuals).toHaveLength(1);

    const locked = session.update({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 106,
          y: 100,
          width: 40,
          height: 30,
        }),
      }),
      subjects,
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });
    expect(locked.snapOffsetX).toBe(-4);
    expect(locked.guides).toHaveLength(1);
    expect(locked.overlay.visuals).toHaveLength(1);

    const released = session.update({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 112,
          y: 100,
          width: 40,
          height: 30,
        }),
      }),
      subjects,
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });
    expect(released.snapOffsetX).toBe(0);
    expect(released.guides).toHaveLength(0);
    expect(released.overlay.visuals).toHaveLength(0);
    expect(session.getOverlay().visuals).toHaveLength(0);
  });

  it('filters proposals before selecting guides and snap offsets', () => {
    const session = new AlignmentSession();
    const movingSubject = createAlignmentSubject({
      id: '__moving__',
      bounds: createAlignmentRect({
        x: 100,
        y: 100,
        width: 40,
        height: 30,
      }),
    });
    const subjects = [
      createAlignmentSubject({
        id: 'candidate',
        bounds: createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        }),
      }),
    ];

    const result = session.update({
      movingSubject,
      subjects,
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
      proposalFilter: () => false,
    });

    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(0);
    expect(result.guides).toHaveLength(0);
    expect(result.overlay.visuals).toHaveLength(0);
  });

  it('suppresses structural supplemental guides when a local snap is active', () => {
    const localProposal = createAlignmentProposalFromSmartGuide({
      orientation: 'vertical',
      targetId: 'local-edge',
      position: 142,
      start: 80,
      end: 160,
      offset: 2,
      movingAnchor: 'left',
      targetAnchor: 'left',
    });
    const containerProposal = createAlignmentProposalFromSmartGuide({
      orientation: 'vertical',
      targetId: 'story-1',
      guideKind: 'container',
      position: 142,
      start: 40,
      end: 220,
      offset: 2,
      movingAnchor: 'left',
      targetAnchor: 'left',
    });
    const fakeEngine = {
      compute: () => ({
        proposals: [localProposal, containerProposal] satisfies AlignmentProposal[],
        snapOffsetX: 2,
        snapOffsetY: 0,
      }),
    } as unknown as ConstructorParameters<typeof AlignmentSession>[0];
    const session = new AlignmentSession(fakeEngine);

    const result = session.update({
      movingSubject: createAlignmentSubject({
        id: '__moving__',
        bounds: createAlignmentRect({
          x: 100,
          y: 100,
          width: 40,
          height: 30,
        }),
      }),
      subjects: [
        createAlignmentSubject({
          id: 'candidate',
          bounds: createAlignmentRect({
            x: 142,
            y: 80,
            width: 50,
            height: 60,
          }),
        }),
      ],
      threshold: 3,
      releaseThreshold: 8,
      maxSecondaryDistance: 300,
      minGuideLength: 0,
      maxGuideLength: Number.POSITIVE_INFINITY,
    });

    expect(result.snapOffsetX).toBe(2);
    expect(result.guides).toHaveLength(1);
    expect(
      result.guides.every((guide) => guide.guideKind !== 'container')
    ).toBe(true);
  });
});
