import type { PanZoomManager } from './PanZoomManager.ts';
import type { CanvasBackgroundAdapter } from '../../adapters/CanvasBackgroundAdapter.ts';
import { HexGridCanvasBackgroundAdapter } from '../../adapters/HexGridCanvasBackgroundAdapter.ts';

export class CanvasRenderer {
  private readonly backgroundAdapter: CanvasBackgroundAdapter;

  constructor(
    private readonly panZoom: PanZoomManager,
    backgroundAdapter: CanvasBackgroundAdapter | null = null
  ) {
    this.backgroundAdapter =
      backgroundAdapter ?? new HexGridCanvasBackgroundAdapter();
  }

  public drawBackground(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    this.backgroundAdapter.drawBackground({
      ctx,
      panZoom: this.panZoom,
      viewportWidth,
      viewportHeight,
    });
  }

  public invalidateBackground(): void {
    this.backgroundAdapter.invalidateBackground?.();
  }

  public clearBackgroundCache(): void {
    this.backgroundAdapter.clearBackgroundCache?.();
  }
}
