import { describe, expect, it } from 'vitest';
import { SelectionRuntime } from './SelectionRuntime.ts';

type TestElement = {
  id: string;
  selected: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

const createElement = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): TestElement => ({
  id,
  selected: false,
  x,
  y,
  width,
  height,
});

describe('canvas-core SelectionRuntime', () => {
  it('handles click select and shift-toggle', () => {
    const a = createElement('a', 0, 0, 10, 10);
    const selected = new Set<string>();
    const runtime = new SelectionRuntime<TestElement>({
      setSelected: (elements) => {
        selected.clear();
        elements.forEach((element) => selected.add(element.id));
      },
      toggleSelected: (elements) => {
        elements.forEach((element) => {
          if (selected.has(element.id)) selected.delete(element.id);
          else selected.add(element.id);
        });
      },
    });

    runtime.selectOnClick(a, false);
    expect(Array.from(selected)).toEqual(['a']);
    runtime.selectOnClick(a, true);
    expect(Array.from(selected)).toEqual([]);
  });

  it('tracks region select lifecycle', () => {
    const a = createElement('a', 10, 10, 20, 20);
    const b = createElement('b', 100, 100, 20, 20);
    const selected = new Set<string>();
    const runtime = new SelectionRuntime<TestElement>({
      setSelected: (elements) => {
        selected.clear();
        elements.forEach((element) => selected.add(element.id));
      },
      toggleSelected: () => undefined,
    });

    runtime.startRegion(0, 0);
    expect(runtime.isRegionSelecting()).toBe(true);
    runtime.updateRegion(50, 50, [a, b], (element) => ({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    }));
    expect(Array.from(selected)).toEqual(['a']);

    runtime.finishRegion([a, b], (element) => ({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    }));
    expect(runtime.isRegionSelecting()).toBe(false);
    expect(Array.from(selected)).toEqual(['a']);
  });
});

