import type { PanZoomManager } from '../core/managers/PanZoomManager.ts';

export type CanvasBackgroundContext = {
  ctx: CanvasRenderingContext2D;
  panZoom: PanZoomManager;
  viewportWidth: number;
  viewportHeight: number;
};

export interface CanvasBackgroundAdapter {
  drawBackground(context: CanvasBackgroundContext): void;
  invalidateBackground?(): void;
  clearBackgroundCache?(): void;
}
