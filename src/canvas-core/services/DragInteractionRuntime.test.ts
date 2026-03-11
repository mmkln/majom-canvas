import { describe, expect, it } from 'vitest';
import { DragInteractionRuntime } from './DragInteractionRuntime.ts';

type TestElement = {
  id: string;
  x: number;
  y: number;
};

describe('DragInteractionRuntime', () => {
  it('activates item drag only after threshold and moves group with item offset', () => {
    const a: TestElement = { id: 'a', x: 10, y: 20 };
    const b: TestElement = { id: 'b', x: 30, y: 40 };
    const runtime = new DragInteractionRuntime<TestElement>((element) => ({
      x: element.x,
      y: element.y,
    }));

    runtime.armItem({
      item: a,
      group: [a, b],
      pointerStart: { x: 12, y: 24 },
      itemOffset: { x: 2, y: 4 },
    });

    expect(
      runtime.tryActivate({
        pointer: { x: 13, y: 24 },
        scale: 1,
        thresholdPx: 4,
      })
    ).toBe(false);
    expect(runtime.isDragging()).toBe(false);

    expect(
      runtime.tryActivate({
        pointer: { x: 18, y: 24 },
        scale: 1,
        thresholdPx: 4,
      })
    ).toBe(true);
    expect(runtime.getActiveKind()).toBe('item');
    expect(runtime.getDraggingItem()).toBe(a);

    runtime.updateActive({ x: 22, y: 34 }, (element, position) => {
      element.x = position.x;
      element.y = position.y;
    });

    expect(a).toEqual({ id: 'a', x: 20, y: 30 });
    expect(b).toEqual({ id: 'b', x: 40, y: 50 });
  });

  it('activates group drag and exposes pending click target', () => {
    const a: TestElement = { id: 'a', x: 100, y: 200 };
    const b: TestElement = { id: 'b', x: 300, y: 400 };
    const runtime = new DragInteractionRuntime<TestElement>((element) => ({
      x: element.x,
      y: element.y,
    }));

    runtime.armGroup({
      group: [a, b, a],
      pointerStart: { x: 100, y: 100 },
      clickTarget: a,
    });

    expect(runtime.getPendingGroupClickTarget()).toBe(a);
    expect(runtime.getDraggingGroup()).toBe(null);

    expect(
      runtime.tryActivate({
        pointer: { x: 105, y: 109 },
        scale: 1,
        thresholdPx: 4,
      })
    ).toBe(true);
    expect(runtime.getActiveKind()).toBe('group');

    runtime.updateActive({ x: 115, y: 130 }, (element, position) => {
      element.x = position.x;
      element.y = position.y;
    });

    expect(a).toEqual({ id: 'a', x: 115, y: 230 });
    expect(b).toEqual({ id: 'b', x: 315, y: 430 });

    const final = runtime.snapshotFinalPositions((element) => ({
      x: element.x,
      y: element.y,
    }));
    expect(final.get('a')).toEqual({ x: 115, y: 230 });
    expect(final.get('b')).toEqual({ x: 315, y: 430 });
  });

  it('can clear pending and reset active drag state', () => {
    const a: TestElement = { id: 'a', x: 0, y: 0 };
    const runtime = new DragInteractionRuntime<TestElement>((element) => ({
      x: element.x,
      y: element.y,
    }));

    runtime.armGroup({ group: [a], pointerStart: { x: 0, y: 0 } });
    expect(runtime.hasPending()).toBe(true);
    runtime.clearPending();
    expect(runtime.hasPending()).toBe(false);

    runtime.armGroup({ group: [a], pointerStart: { x: 0, y: 0 } });
    runtime.tryActivate({
      pointer: { x: 5, y: 5 },
      scale: 1,
      thresholdPx: 4,
    });
    expect(runtime.isDragging()).toBe(true);
    runtime.resetDragState();
    expect(runtime.isDragging()).toBe(false);
    expect(runtime.getInitialPositions().size).toBe(0);
  });
});
