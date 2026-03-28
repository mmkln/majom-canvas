// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const canvasAppInit = vi.fn(async () => {});
const canvasAppDestroy = vi.fn();

vi.mock('./CanvasApp.ts', () => {
  class CanvasApp {
    public init(): Promise<void> {
      return canvasAppInit();
    }

    public destroy(): void {
      canvasAppDestroy();
    }
  }

  return { CanvasApp };
});

import {
  CanvasModule,
  CANVAS_CORE_CANVAS_ELEMENT_ID,
} from './CanvasModule.ts';

describe('CanvasModule', () => {
  beforeEach(() => {
    canvasAppInit.mockClear();
    canvasAppDestroy.mockClear();
  });

  it('uses a namespaced canvas id so embedded canvas-core instances do not collide with workspace canvas', async () => {
    const module = new CanvasModule({
      adapters: {} as never,
    });
    const parent = document.createElement('div');

    await module.mount(parent);

    const canvas = parent.querySelector('canvas');

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas?.id).toBe(CANVAS_CORE_CANVAS_ELEMENT_ID);

    module.unmount();
  });
});
