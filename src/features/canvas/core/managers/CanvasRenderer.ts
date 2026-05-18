import type { PanZoomManager } from './PanZoomManager.ts';
import { BackgroundGridRenderer } from '../rendering/BackgroundGridRenderer.ts';
import type { CanvasBackgroundPalette } from '../../theme/canvasTheme.ts';

export class CanvasRenderer {
  private readonly backgroundRenderer = new BackgroundGridRenderer();

  constructor(private readonly panZoom: PanZoomManager) {}

  public drawBackground(
    ctx: CanvasRenderingContext2D,
    viewportWidth: number,
    viewportHeight: number,
    background: CanvasBackgroundPalette
  ): void {
    this.backgroundRenderer.draw({
      ctx,
      panZoom: this.panZoom,
      viewportWidth,
      viewportHeight,
      background,
    });
  }

  public invalidateBackground(): void {
    this.backgroundRenderer.invalidate();
  }

  public clearBackgroundCache(): void {
    this.backgroundRenderer.clearCache();
  }
}
