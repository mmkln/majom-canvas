import type { IConnectable } from './connectable.ts';
import type { PanZoomManager } from '../managers/PanZoomManager.ts';

export interface IDrawable {
  /**
   * Draws the element with current viewport transform.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements?: IConnectable[]
  ): void;
}

export interface ISelectable {
  selected: boolean;
}

export interface IPositioned {
  x: number;
  y: number;
}

export interface ICanvasElement extends IDrawable, ISelectable {
  id: string;
  zIndex: number;
}
