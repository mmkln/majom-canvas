import { describe, expect, it } from 'vitest';
import {
  SmartAlignmentService,
  createAlignmentRect,
  getElementAlignmentRect,
} from './SmartAlignmentService.ts';

describe('SmartAlignmentService', () => {
  it('returns vertical and horizontal guides for nearest anchors within threshold', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 120,
      height: 80,
    });
    const result = service.compute({
      movingBounds,
      threshold: 6,
      candidates: [
        {
          id: 'candidate-1',
          bounds: createAlignmentRect({
            x: 223,
            y: 182,
            width: 100,
            height: 120,
          }),
        },
      ],
    });

    expect(result.guides).toHaveLength(2);
    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    const horizontal = result.guides.find(
      (guide) => guide.orientation === 'horizontal'
    );
    expect(vertical?.position).toBe(223);
    expect(vertical?.offset).toBe(3);
    expect(horizontal?.position).toBe(182);
    expect(horizontal?.offset).toBe(2);
  });

  it('picks the closest candidate among multiple matches', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 300,
      y: 300,
      width: 100,
      height: 80,
    });
    const result = service.compute({
      movingBounds,
      threshold: 10,
      candidates: [
        {
          id: 'far',
          bounds: createAlignmentRect({
            x: 309,
            y: 800,
            width: 120,
            height: 80,
          }),
        },
        {
          id: 'near',
          bounds: createAlignmentRect({
            x: 302,
            y: 600,
            width: 120,
            height: 80,
          }),
        },
      ],
    });

    expect(result.snapOffsetX).toBe(2);
    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical?.offset).toBe(2);
  });

  it('returns no guides when threshold is not met', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 10,
      y: 10,
      width: 100,
      height: 100,
    });
    const result = service.compute({
      movingBounds,
      threshold: 2,
      candidates: [
        {
          id: 'candidate',
          bounds: createAlignmentRect({
            x: 20,
            y: 40,
            width: 120,
            height: 120,
          }),
        },
      ],
    });

    expect(result.guides).toHaveLength(0);
    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(0);
  });

  it('ignores candidates that are too far on secondary axis', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 120,
      height: 80,
    });
    const result = service.compute({
      movingBounds,
      threshold: 6,
      maxSecondaryDistance: 120,
      candidates: [
        {
          id: 'far-secondary',
          bounds: createAlignmentRect({
            x: 101,
            y: 420,
            width: 120,
            height: 80,
          }),
        },
      ],
    });

    expect(result.guides).toHaveLength(0);
    expect(result.snapOffsetX).toBe(0);
  });

  it('caps visual guide length when maxGuideLength is provided', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 120,
      height: 80,
    });
    const result = service.compute({
      movingBounds,
      threshold: 6,
      maxGuideLength: 90,
      candidates: [
        {
          id: 'distant',
          bounds: createAlignmentRect({
            x: 100,
            y: 600,
            width: 160,
            height: 100,
          }),
        },
      ],
    });

    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical).toBeDefined();
    expect((vertical?.end ?? 0) - (vertical?.start ?? 0)).toBeCloseTo(90, 5);
  });

  it('enforces a minimum vertical guide length for very short overlap cases', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 80,
      height: 6,
    });
    const result = service.compute({
      movingBounds,
      threshold: 5,
      minGuideLength: 24,
      candidates: [
        {
          id: 'short-span',
          bounds: createAlignmentRect({
            x: 102,
            y: 101,
            width: 60,
            height: 4,
          }),
        },
      ],
    });

    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical).toBeDefined();
    expect((vertical?.end ?? 0) - (vertical?.start ?? 0)).toBeCloseTo(24, 5);
  });

  it('enforces a minimum horizontal guide length for very short overlap cases', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 200,
      y: 200,
      width: 6,
      height: 90,
    });
    const result = service.compute({
      movingBounds,
      threshold: 5,
      minGuideLength: 30,
      candidates: [
        {
          id: 'short-horizontal',
          bounds: createAlignmentRect({
            x: 201,
            y: 203,
            width: 4,
            height: 70,
          }),
        },
      ],
    });

    const horizontal = result.guides.find(
      (guide) => guide.orientation === 'horizontal'
    );
    expect(horizontal).toBeDefined();
    expect((horizontal?.end ?? 0) - (horizontal?.start ?? 0)).toBeCloseTo(
      30,
      5
    );
  });

  it('respects maxGuideLength when minGuideLength is larger than max', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 50,
      y: 50,
      width: 10,
      height: 10,
    });
    const result = service.compute({
      movingBounds,
      threshold: 5,
      minGuideLength: 120,
      maxGuideLength: 40,
      candidates: [
        {
          id: 'clamped',
          bounds: createAlignmentRect({
            x: 52,
            y: 52,
            width: 8,
            height: 8,
          }),
        },
      ],
    });

    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical).toBeDefined();
    expect((vertical?.end ?? 0) - (vertical?.start ?? 0)).toBeCloseTo(40, 5);
  });

  it('prefers provided vertical guide on equal-distance candidates', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    });
    const result = service.compute({
      movingBounds,
      threshold: 6,
      candidates: [
        {
          id: 'first',
          bounds: createAlignmentRect({
            x: 104,
            y: 100,
            width: 100,
            height: 100,
          }),
        },
        {
          id: 'preferred',
          bounds: createAlignmentRect({
            x: 96,
            y: 100,
            width: 100,
            height: 100,
          }),
        },
      ],
      preferredVerticalGuide: {
        orientation: 'vertical',
        targetId: 'preferred',
        position: 96,
        start: 0,
        end: 0,
        offset: -4,
        movingAnchor: 'left',
        targetAnchor: 'left',
      },
    });

    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical?.targetId).toBe('preferred');
    expect(result.snapOffsetX).toBe(-4);
  });

  it('positions vertical guide on target left anchor with expected span', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 40,
      height: 30,
    });
    const result = service.compute({
      movingBounds,
      threshold: 3,
      candidates: [
        {
          id: 'candidate-vertical',
          bounds: createAlignmentRect({
            x: 142,
            y: 80,
            width: 50,
            height: 60,
          }),
        },
      ],
    });

    expect(result.guides).toHaveLength(1);
    const vertical = result.guides.find((guide) => guide.orientation === 'vertical');
    expect(vertical).toBeDefined();
    expect(vertical?.position).toBe(142);
    expect(vertical?.offset).toBe(2);
    expect(vertical?.movingAnchor).toBe('right');
    expect(vertical?.targetAnchor).toBe('left');
    expect(vertical?.start).toBe(80);
    expect(vertical?.end).toBe(140);
    expect(result.snapOffsetX).toBe(2);
    expect(result.snapOffsetY).toBe(0);
  });

  it('positions horizontal guide on target top anchor with expected span', () => {
    const service = new SmartAlignmentService();
    const movingBounds = createAlignmentRect({
      x: 100,
      y: 100,
      width: 40,
      height: 30,
    });
    const result = service.compute({
      movingBounds,
      threshold: 3,
      candidates: [
        {
          id: 'candidate-horizontal',
          bounds: createAlignmentRect({
            x: 260,
            y: 128,
            width: 20,
            height: 40,
          }),
        },
      ],
    });

    expect(result.guides).toHaveLength(1);
    const horizontal = result.guides.find(
      (guide) => guide.orientation === 'horizontal'
    );
    expect(horizontal).toBeDefined();
    expect(horizontal?.position).toBe(128);
    expect(horizontal?.offset).toBe(-2);
    expect(horizontal?.movingAnchor).toBe('bottom');
    expect(horizontal?.targetAnchor).toBe('top');
    expect(horizontal?.start).toBe(100);
    expect(horizontal?.end).toBe(280);
    expect(result.snapOffsetX).toBe(0);
    expect(result.snapOffsetY).toBe(-2);
  });
});

describe('getElementAlignmentRect', () => {
  it('builds bounds from width/height elements', () => {
    const bounds = getElementAlignmentRect({
      x: 12,
      y: 24,
      width: 80,
      height: 40,
    });
    expect(bounds).toEqual({
      x: 12,
      y: 24,
      width: 80,
      height: 40,
      left: 12,
      right: 92,
      top: 24,
      bottom: 64,
      centerX: 52,
      centerY: 44,
    });
  });

  it('builds bounds from circular elements', () => {
    const bounds = getElementAlignmentRect({ x: 50, y: 70, radius: 20 });
    expect(bounds).toEqual({
      x: 30,
      y: 50,
      width: 40,
      height: 40,
      left: 30,
      right: 70,
      top: 50,
      bottom: 90,
      centerX: 50,
      centerY: 70,
    });
  });

  it('returns null for non-positioned elements', () => {
    expect(getElementAlignmentRect({ id: 'conn', fromId: 'a', toId: 'b' })).toBe(
      null
    );
  });
});
