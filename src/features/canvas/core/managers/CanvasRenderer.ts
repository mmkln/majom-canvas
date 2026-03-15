import type { PanZoomManager } from './PanZoomManager.ts';
import { BackgroundGridRenderer } from '../rendering/BackgroundGridRenderer.ts';

export class CanvasRenderer {
  private readonly backgroundRenderer = new BackgroundGridRenderer();

  constructor(private readonly panZoom: PanZoomManager) {}

  public drawBackground(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    this.backgroundRenderer.draw({
      ctx,
      panZoom: this.panZoom,
      viewportWidth,
      viewportHeight,
    });
  }

  public invalidateBackground(): void {
    this.backgroundRenderer.invalidate();
  }

  public clearBackgroundCache(): void {
    this.backgroundRenderer.clearCache();
  }
}
