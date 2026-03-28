import { describe, expect, it, vi } from 'vitest';
import type { CanvasBackgroundAdapter } from '../../adapters/CanvasBackgroundAdapter.ts';
import { CanvasRenderer } from './CanvasRenderer.ts';

describe('CanvasRenderer background adapter integration', () => {
  it('delegates background draw lifecycle to the configured adapter', () => {
    const backgroundAdapter: CanvasBackgroundAdapter = {
      drawBackground: vi.fn(),
      invalidateBackground: vi.fn(),
      clearBackgroundCache: vi.fn(),
    };
    const panZoom = {
      scale: 1,
      scrollX: 0,
      scrollY: 0,
    } as never;
    const ctx = {} as CanvasRenderingContext2D;
    const renderer = new CanvasRenderer(panZoom, backgroundAdapter);

    renderer.drawBackground(ctx, 1280, 720);
    renderer.invalidateBackground();
    renderer.clearBackgroundCache();

    expect(backgroundAdapter.drawBackground).toHaveBeenCalledWith({
      ctx,
      panZoom,
      viewportWidth: 1280,
      viewportHeight: 720,
    });
    expect(backgroundAdapter.invalidateBackground).toHaveBeenCalledTimes(1);
    expect(backgroundAdapter.clearBackgroundCache).toHaveBeenCalledTimes(1);
  });
});
