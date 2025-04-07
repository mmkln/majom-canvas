import { ICanvasElement } from './canvasElement';
import { IShape } from './shape';

export interface IConnection extends ICanvasElement {
  fromId: string;
  toId: string;
  isNearPoint(px: number, py: number, elements: IShape[], tolerance?: number): boolean;
}
