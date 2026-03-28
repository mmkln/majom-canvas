// core/interfaces/shape.ts
import { ICanvasElement, IPositioned } from './canvasElement.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import type { IConnectable } from './connectable.ts';

export interface IShape extends ICanvasElement, IPositioned, IConnectable {
  id: string;
  radius: number;
  fillColor: string;
  lineWidth: number;
  isHovered: boolean;
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  contains(px: number, py: number): boolean;
  getBoundaryPoint(angle: number): { x: number; y: number };
  getConnectionPoints(): ConnectionPoint[];
  clone(): IShape;
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(x: number, y: number): void;
  onDragEnd?(): void;
}

// TODO: update InteractionManager and connection points logic, to auto-connect to an element on hover
export interface ConnectionPoint {
  x: number;
  y: number;
  angle: number;
  isHovered: boolean;
  direction: 'left' | 'right' | 'top' | 'bottom';
}
