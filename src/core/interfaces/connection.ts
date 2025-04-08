import { ICanvasElement } from './canvasElement.ts';
import { IShape } from './shape.ts';

export interface IConnection extends ICanvasElement {
  fromId: string;
  toId: string;
  isNearPoint(px: number, py: number, elements: IShape[], tolerance?: number): boolean;
}
