import type {
  CanvasBackgroundAdapter,
  CanvasBackgroundContext,
} from './CanvasBackgroundAdapter.ts';

type DotGridCanvasBackgroundAdapterOptions = {
  fillColor?: string;
  dotColor?: string;
  dotRadius?: number;
  spacing?: number;
};

type BackgroundSnapshot = {
  viewportWidth: number;
  viewportHeight: number;
};

export class DotGridCanvasBackgroundAdapter
  implements CanvasBackgroundAdapter
{
  private readonly fillColor: string;
  private readonly dotColor: string;
  private readonly dotRadius: number;
  private readonly spacing: number;
  private tile: HTMLCanvasElement | OffscreenCanvas | null = null;
  private lastSnapshot: BackgroundSnapshot | null = null;

  constructor(options: DotGridCanvasBackgroundAdapterOptions = {}) {
    this.fillColor = options.fillColor ?? '#ffffff';
    this.dotColor = options.dotColor ?? '#e5e7eb';
    this.dotRadius = options.dotRadius ?? 1.25;
    this.spacing = Math.max(8, options.spacing ?? 24);
  }

  public drawBackground({
    ctx,
    viewportWidth,
    viewportHeight,
  }: CanvasBackgroundContext): void {
    const snapshot = {
      viewportWidth: Math.round(viewportWidth),
      viewportHeight: Math.round(viewportHeight),
    };
    if (this.isSnapshotEqual(snapshot)) {
      return;
    }
    this.lastSnapshot = snapshot;

    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    const pattern = ctx.createPattern(this.getOrCreateTile(), 'repeat');
    if (!pattern) return;

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }

  public invalidateBackground(): void {
    this.lastSnapshot = null;
  }

  public clearBackgroundCache(): void {
    this.tile = null;
    this.lastSnapshot = null;
  }

  private getOrCreateTile(): HTMLCanvasElement | OffscreenCanvas {
    if (this.tile) {
      return this.tile;
    }

    const canvas = this.createTileCanvas(this.spacing, this.spacing);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.tile = canvas;
      return canvas;
    }

    ctx.clearRect(0, 0, this.spacing, this.spacing);
    ctx.fillStyle = this.dotColor;
    ctx.beginPath();
    ctx.arc(this.spacing / 2, this.spacing / 2, this.dotRadius, 0, Math.PI * 2);
    ctx.fill();

    this.tile = canvas;
    return canvas;
  }

  private createTileCanvas(
    width: number,
    height: number
  ): HTMLCanvasElement | OffscreenCanvas {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private isSnapshotEqual(next: BackgroundSnapshot): boolean {
    return (
      this.lastSnapshot?.viewportWidth === next.viewportWidth &&
      this.lastSnapshot?.viewportHeight === next.viewportHeight
    );
  }
}
