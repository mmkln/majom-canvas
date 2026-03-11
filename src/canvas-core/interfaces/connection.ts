import type { ICanvasElement } from './canvasElement.ts';
import type { IConnectable } from './connectable.ts';

export type ConnectionRelationType = string;

export enum DefaultConnectionRelationType {
  LeadsTo = 'leads_to',
  Blocks = 'blocks',
  ParentChild = 'parent_child',
  RelatesTo = 'relates_to',
}

export enum ConnectionLineType {
  Straight = 'straight',
  SShaped = 's-shaped',
}

export interface ConnectionPoint {
  x: number;
  y: number;
  angle: number;
  isHovered?: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export interface IConnection extends ICanvasElement {
  fromId: string;
  toId: string;
  lineType: ConnectionLineType;
  relationType: ConnectionRelationType;
  /**
   * Hit-tests connection geometry near given scene point.
   */
  isNearPoint(
    px: number,
    py: number,
    elements: IConnectable[],
    tolerance?: number,
    scale?: number
  ): boolean;
  /**
   * Sets visual line style for connection rendering.
   */
  setLineType(type: ConnectionLineType): void;
}
