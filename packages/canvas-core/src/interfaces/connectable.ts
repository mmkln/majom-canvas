import type { ICanvasElement, IPositioned } from './canvasElement.ts';
import type { ConnectionPoint } from './connection.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';

export interface IConnectable extends IPositioned, ICanvasElement {
  /**
   * Returns available connection anchor points.
   */
  getConnectionPoints(): ConnectionPoint[];
  /**
   * Returns nearest point on the element to provided scene coordinates.
   */
  getNearestPoint(px: number, py: number): { x: number; y: number };
  /**
   * Hit-tests whether point is inside element geometry.
   */
  contains(px: number, py: number): boolean;
  /**
   * Draws connection anchor UI.
   */
  drawAnchors(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  /**
   * Draws temporary connection line towards target element.
   */
  drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    target: IConnectable
  ): void;
}
