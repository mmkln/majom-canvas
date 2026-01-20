import { ICanvasElement } from './canvasElement.ts';
import { IShape } from './shape.ts';
import type { IConnectable } from './connectable.ts';

export interface IConnection extends ICanvasElement {
  fromId: string;
  toId: string;
  lineType: ConnectionLineType;
  relationType: ConnectionRelationType;
  isNearPoint(
    px: number,
    py: number,
    elements: IConnectable[],
    tolerance?: number
  ): boolean;
  setLineType(type: ConnectionLineType): void;
}

export enum ConnectionLineType {
  Straight = 'straight',
  SShaped = 's-shaped',
}

export enum ConnectionRelationType {
  LeadsTo = 'leads_to',
  Blocks = 'blocks',
  ParentChild = 'parent_child',
  RelatesTo = 'relates_to',
}
