// core/interfaces/drawable.ts
import { IShape } from './shape';

export interface IDrawable {
  draw(ctx: CanvasRenderingContext2D, elements?: IShape[]): void;
}
