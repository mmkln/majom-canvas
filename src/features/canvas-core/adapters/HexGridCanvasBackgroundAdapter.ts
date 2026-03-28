import { BackgroundGridRenderer } from '../core/rendering/BackgroundGridRenderer.ts';
import type {
  CanvasBackgroundAdapter,
  CanvasBackgroundContext,
} from './CanvasBackgroundAdapter.ts';

export class HexGridCanvasBackgroundAdapter
  implements CanvasBackgroundAdapter
{
  private readonly renderer = new BackgroundGridRenderer();

  public drawBackground(context: CanvasBackgroundContext): void {
    this.renderer.draw(context);
  }

  public invalidateBackground(): void {
    this.renderer.invalidate();
  }

  public clearBackgroundCache(): void {
    this.renderer.clearCache();
  }
}
