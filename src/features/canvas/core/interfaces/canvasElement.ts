// core/interfaces/drawable.ts
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { IShape } from './shape.ts';

export interface IDrawable {
  draw(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    elements?: IShape[]
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
  /** Unique identifier */
  id: string;
  /** Layer index for draw ordering; lower draws first */
  zIndex: number;
}
