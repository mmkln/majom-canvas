import type { PanZoomManager } from '../managers/PanZoomManager.ts';
import {
  DEFAULT_CANVAS_THEME,
  type CanvasBackgroundPalette,
} from '../../theme/canvasTheme.ts';

type GridConfig = {
  radius: number;
  lineColor: string;
  alpha: number;
};

type GridTile = {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width: number;
  height: number;
};

type BackgroundSnapshot = {
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
  scaleBucket: number;
  backgroundSurface: string;
  gridLineColor: string;
};

type DrawInput = {
  ctx: CanvasRenderingContext2D;
  panZoom: PanZoomManager;
  viewportWidth: number;
  viewportHeight: number;
  background: CanvasBackgroundPalette;
};

const roundToPrecision = (value: number, precision: number): number =>
  Math.round(value / precision) * precision;

export class BackgroundGridRenderer {
  private readonly tileCache = new Map<string, GridTile>();
  private readonly maxTileCacheSize = 24;
  private readonly zoomBucketStep = 0.1;
  private lastSnapshot: BackgroundSnapshot | null = null;

  public draw({
    ctx,
    panZoom,
    viewportWidth,
    viewportHeight,
    background,
  }: DrawInput): void {
    const scale = panZoom.scale || 1;
    const scaleBucket = this.toScaleBucket(scale);
    const config = this.resolveGridConfig(scaleBucket, background);
    const snapshot = this.buildSnapshot({
      viewportWidth,
      viewportHeight,
      scrollX: panZoom.scrollX,
      scrollY: panZoom.scrollY,
      scaleBucket,
      backgroundSurface: background.surface,
      gridLineColor: background.gridLine,
    });
    if (this.isSnapshotEqual(this.lastSnapshot, snapshot)) {
      return;
    }
    this.lastSnapshot = snapshot;

    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
    ctx.fillStyle = background.surface;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    const tileKey = this.buildTileKey(config, scaleBucket);
    const tile = this.getOrCreateTile(tileKey, config, scaleBucket);
    const pattern = ctx.createPattern(tile.canvas, 'repeat');
    if (!pattern) return;

    const viewBounds = panZoom.viewBounds;
    const minX = viewBounds ? viewBounds.minX : 0;
    const minY = viewBounds ? viewBounds.minY : 0;
    const worldWidth = viewBounds
      ? viewBounds.maxX - viewBounds.minX
      : Math.max(1, viewportWidth / scale);
    const worldHeight = viewBounds
      ? viewBounds.maxY - viewBounds.minY
      : Math.max(1, viewportHeight / scale);

    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, -panZoom.scrollX, -panZoom.scrollY);
    ctx.fillStyle = pattern;
    ctx.fillRect(
      minX - tile.width,
      minY - tile.height,
      worldWidth + tile.width * 2,
      worldHeight + tile.height * 2
    );
    ctx.restore();
  }

  public invalidate(): void {
    this.lastSnapshot = null;
  }

  public clearCache(): void {
    this.tileCache.clear();
    this.lastSnapshot = null;
  }

  private resolveGridConfig(
    scale: number,
    background: CanvasBackgroundPalette = DEFAULT_CANVAS_THEME.background
  ): GridConfig {
    // Keep the hex grid visible at every zoom level.
    // At low scales we use larger cells and lower alpha to keep fill cost stable.
    if (scale < 0.28) {
      return {
        radius: 150,
        lineColor: background.gridLine,
        alpha: 0.1,
      };
    }
    if (scale < 0.55) {
      return {
        radius: 120,
        lineColor: background.gridLine,
        alpha: 0.12,
      };
    }
    if (scale < 0.78) {
      return {
        radius: 96,
        lineColor: background.gridLine,
        alpha: 0.14,
      };
    }
    return {
      radius: 60,
      lineColor: background.gridLine,
      alpha: 0.15,
    };
  }

  private toScaleBucket(scale: number): number {
    return Math.max(
      this.zoomBucketStep,
      Math.round(scale / this.zoomBucketStep) * this.zoomBucketStep
    );
  }

  private buildTileKey(config: GridConfig, scaleBucket: number): string {
    return `hex:${config.radius}:${config.lineColor}:${config.alpha}:${scaleBucket.toFixed(2)}`;
  }

  private getOrCreateTile(
    key: string,
    config: GridConfig,
    scaleBucket: number
  ): GridTile {
    const existing = this.tileCache.get(key);
    if (existing) return existing;

    const tile = this.createHexTile(config, scaleBucket);
    this.tileCache.set(key, tile);
    this.evictCacheIfNeeded();
    return tile;
  }

  private createHexTile(config: GridConfig, scaleBucket: number): GridTile {
    const radius = Math.max(8, config.radius);
    const horiz = 1.5 * radius;
    const vert = Math.sqrt(3) * radius;
    const tileWidth = Math.max(16, Math.round(3 * radius));
    const tileHeight = Math.max(16, Math.round(vert));
    const canvas = this.createTileCanvas(tileWidth, tileHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { canvas, width: tileWidth, height: tileHeight };
    }

    ctx.clearRect(0, 0, tileWidth, tileHeight);
    ctx.strokeStyle = this.toRgba(config.lineColor, config.alpha);
    ctx.lineWidth = Math.max(0.35, 1 / scaleBucket);

    for (let x = -horiz; x <= tileWidth + horiz; x += horiz) {
      const columnIndex = Math.round(x / horiz);
      const offsetY = columnIndex % 2 === 0 ? 0 : vert / 2;
      for (let y = -vert; y <= tileHeight + vert; y += vert) {
        this.strokeHexagon(ctx, x, y + offsetY, radius);
      }
    }

    return { canvas, width: tileWidth, height: tileHeight };
  }

  private strokeHexagon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number
  ): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
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

  private evictCacheIfNeeded(): void {
    if (this.tileCache.size <= this.maxTileCacheSize) return;
    const firstKey = this.tileCache.keys().next().value;
    if (firstKey) {
      this.tileCache.delete(firstKey);
    }
  }

  private toRgba(color: string, alpha: number): string {
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  private buildSnapshot(input: BackgroundSnapshot): BackgroundSnapshot {
    return {
      viewportWidth: Math.round(input.viewportWidth),
      viewportHeight: Math.round(input.viewportHeight),
      scrollX: roundToPrecision(input.scrollX, 0.5),
      scrollY: roundToPrecision(input.scrollY, 0.5),
      scaleBucket: input.scaleBucket,
      backgroundSurface: input.backgroundSurface,
      gridLineColor: input.gridLineColor,
    };
  }

  private isSnapshotEqual(
    previous: BackgroundSnapshot | null,
    next: BackgroundSnapshot
  ): boolean {
    if (!previous) return false;
    return (
      previous.viewportWidth === next.viewportWidth &&
      previous.viewportHeight === next.viewportHeight &&
      previous.scrollX === next.scrollX &&
      previous.scrollY === next.scrollY &&
      previous.scaleBucket === next.scaleBucket &&
      previous.backgroundSurface === next.backgroundSurface &&
      previous.gridLineColor === next.gridLineColor
    );
  }
}
