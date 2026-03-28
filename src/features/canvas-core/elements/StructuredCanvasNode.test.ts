import { describe, expect, it } from 'vitest';

import type { ConnectionPoint } from '../core/interfaces/shape.ts';
import type { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import type { CanvasElementAppearance } from '../adapters/CanvasAppearanceAdapter.ts';
import {
  CANVAS_INTERACTION_STATES,
  type IStructuredCanvasNode,
} from './interfaces/structuredCanvasNode.ts';
import { StructuredCanvasNode } from './StructuredCanvasNode.ts';

class TestStructuredNode extends StructuredCanvasNode {
  constructor() {
    super({
      nodeKind: 'test',
      width: 120,
      height: 80,
    });
  }

  public draw(_ctx: CanvasRenderingContext2D, _panZoom: PanZoomManager): void {}

  public contains(px: number, py: number): boolean {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }

  public getBoundaryPoint(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public getConnectionPoints(): ConnectionPoint[] {
    return [];
  }

  public clone(): IStructuredCanvasNode {
    const cloned = new TestStructuredNode();
    cloned.replaceInteractionStates(this.getInteractionStates());
    return cloned;
  }

  public resolveAppearanceForTest<TAppearance extends CanvasElementAppearance>(
    fallback: TAppearance
  ): TAppearance {
    return this.resolveAppearance(fallback, { scale: 1 });
  }
}

describe('StructuredCanvasNode interaction states', () => {
  it('maps focused and highlighted to core-managed interaction states', () => {
    const node = new TestStructuredNode();

    node.focused = true;
    node.highlighted = true;

    expect(node.hasInteractionState(CANVAS_INTERACTION_STATES.focused)).toBe(true);
    expect(
      node.hasInteractionState(CANVAS_INTERACTION_STATES.highlighted)
    ).toBe(true);
  });

  it('preserves external states when core states are replaced', () => {
    const node = new TestStructuredNode();

    node.setInteractionState('dimmed', true);
    node.replaceInteractionStates([CANVAS_INTERACTION_STATES.focused], 'core');

    expect(node.focused).toBe(true);
    expect(node.hasInteractionState('dimmed')).toBe(true);

    node.replaceInteractionStates([], 'core');

    expect(node.focused).toBe(false);
    expect(node.hasInteractionState('dimmed')).toBe(true);
  });

  it('merges appearance overrides through the adapter seam', () => {
    const node = new TestStructuredNode();
    node.appearanceAdapter = {
      resolveElementAppearance() {
        return {
          fillColor: '#111111',
          borderColor: '#222222',
        };
      },
    };

    const appearance = node.resolveAppearanceForTest({
      fillColor: '#aaaaaa',
      borderColor: '#bbbbbb',
      chromeColor: '#cccccc',
    });

    expect(appearance.fillColor).toBe('#111111');
    expect(appearance.borderColor).toBe('#222222');
    expect(appearance.chromeColor).toBe('#cccccc');
  });
});
