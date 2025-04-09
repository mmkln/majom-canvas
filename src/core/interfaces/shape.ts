// core/interfaces/shape.ts
import { ICanvasElement } from './canvasElement.ts';
import { PanZoomManager } from '../../managers/PanZoomManager.ts';

export interface IShape extends ICanvasElement {
  id: string;
  x: number;
  y: number;
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

export interface ConnectionPoint {
  x: number;
  y: number;
  angle: number;
  isHovered: boolean;
  direction: 'left' | 'right' | 'top' | 'bottom';
}
