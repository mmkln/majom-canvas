// core/interfaces/drawable.ts
import { PanZoomManager } from '../../managers/PanZoomManager';
import { IShape } from './shape';

export interface IDrawable {
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager, elements?: IShape[]): void;
}
