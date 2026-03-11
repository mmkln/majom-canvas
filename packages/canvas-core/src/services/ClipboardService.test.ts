import { describe, expect, it } from 'vitest';
import { ClipboardService } from './ClipboardService.ts';

type TestElement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clone(): TestElement;
};

const createElement = (
  id: string,
  x: number,
  y: number,
  width = 10,
  height = 10
): TestElement => ({
  id,
  x,
  y,
  width,
  height,
  clone() {
    return createElement(this.id, this.x, this.y, this.width, this.height);
  },
});

describe('canvas-core ClipboardService', () => {
  it('copies with new ids and pastes around target center', () => {
    let seq = 0;
    const clipboard = new ClipboardService<TestElement>(() => `id-${++seq}`);
    const a = createElement('a', 100, 100, 100, 50);
    const b = createElement('b', 260, 120, 80, 40);
    clipboard.copy([a, b]);

    const added: TestElement[] = [];
    const pasted = clipboard.paste(
      {
        addElement: (element) => {
          added.push(element);
        },
      },
      { x: 1000, y: 700 }
    );

    expect(pasted).toHaveLength(2);
    expect(added).toHaveLength(2);
    expect(pasted.map((element) => element.id)).toEqual(['id-3', 'id-4']);

    // Original bounds center: x:[100..340], y:[100..160] => center (220,130)
    // Offset to (1000,700): (+780,+570)
    expect(pasted[0].x).toBe(880);
    expect(pasted[0].y).toBe(670);
    expect(pasted[1].x).toBe(1040);
    expect(pasted[1].y).toBe(690);
  });

  it('supports post-paste hooks', () => {
    let seq = 0;
    const clipboard = new ClipboardService<TestElement>(() => `id-${++seq}`);
    clipboard.copy([createElement('a', 0, 0)]);

    let hookCount = 0;
    const pasted = clipboard.paste(
      {
        addElement: () => undefined,
      },
      { x: 300, y: 200 },
      {
        afterPaste: (elements) => {
          hookCount = elements.length;
        },
      }
    );

    expect(pasted).toHaveLength(1);
    expect(hookCount).toBe(1);
  });
});

