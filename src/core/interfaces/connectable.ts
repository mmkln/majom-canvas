import { ConnectionPoint } from './shape.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { IPositioned, ICanvasElement } from './canvasElement.ts';

/**
 * Unified interface for connectable canvas elements (shapes, tasks, stories, etc.)
 */
export interface IConnectable extends IPositioned, ICanvasElement {
  /**
   * All potential anchor points for a connection on this element.
   */
  getConnectionPoints(): ConnectionPoint[];

  /**
   * Nearest anchor or attachment point to the given coordinates (e.g. mouse).
   */
  getNearestPoint(px: number, py: number): { x: number; y: number };

  /**
   * Hit test: whether the given coordinates lie within this element.
   */
  contains(px: number, py: number): boolean;

  /**
   * Draw visual anchor indicators (e.g. dots) when hovered/selected or in connect mode.
   */
  drawAnchors(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void;

  /**
   * Draw a connection line between this element and the target element.
   */
  drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    target: IConnectable
  ): void;
}
