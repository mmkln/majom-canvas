import { ICanvasElement } from './canvasElement.ts';
import { IShape } from './shape.ts';

export interface IConnection extends ICanvasElement {
  fromId: string;
  toId: string;
  lineType: ConnectionLineType;
  isNearPoint(px: number, py: number, elements: IShape[], tolerance?: number): boolean;
  setLineType(type: ConnectionLineType): void;
}

export enum ConnectionLineType {
  Straight = 'straight',
  SShaped = 's-shaped',
}
