import type {
  CanvasBackgroundAdapter,
  CanvasBackgroundContext,
} from './CanvasBackgroundAdapter.ts';

type SolidCanvasBackgroundAdapterOptions = {
  fillColor?: string;
};

export class SolidCanvasBackgroundAdapter
  implements CanvasBackgroundAdapter
{
  private readonly fillColor: string;

  constructor(options: SolidCanvasBackgroundAdapterOptions = {}) {
    this.fillColor = options.fillColor ?? '#ffffff';
  }

  public drawBackground({
    ctx,
    viewportWidth,
    viewportHeight,
  }: CanvasBackgroundContext): void {
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }
}
