import { describe, expect, it } from 'vitest';
import { createAlignmentRect } from '../services/SmartAlignmentService.ts';
import { AlignmentSession } from './AlignmentSession.ts';
import type { AlignmentSubject } from './types.ts';

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

describe('AlignmentSession', () => {
  it('shows guides but suppresses snap when allowSnap is false', () => {
    const session = new AlignmentSession();
    const movingSubject = createSubject(
      '__moving__',
      createAlignmentRect({
        x: 100,
        y: 100,
        width: 40,
        height: 30,
      })
    );
    const subjects = [
      createSubject(
        'candidate',
        createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        })
      ),
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
      createSubject(
        'candidate',
        createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        })
      ),
    ];

    const first = session.update({
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 100,
          y: 100,
          width: 40,
          height: 30,
        })
      ),
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
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 106,
          y: 100,
          width: 40,
          height: 30,
        })
      ),
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
      movingSubject: createSubject(
        '__moving__',
        createAlignmentRect({
          x: 112,
          y: 100,
          width: 40,
          height: 30,
        })
      ),
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
    const movingSubject = createSubject(
      '__moving__',
      createAlignmentRect({
        x: 100,
        y: 100,
        width: 40,
        height: 30,
      })
    );
    const subjects = [
      createSubject(
        'candidate',
        createAlignmentRect({
          x: 142,
          y: 80,
          width: 50,
          height: 60,
        })
      ),
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
});
