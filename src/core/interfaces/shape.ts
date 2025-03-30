// core/interfaces/shape.ts
import { IDrawable } from './drawable';
import { PanZoomManager } from '../../managers/PanZoomManager';

export interface IShape extends IDrawable {
  id: string;
  x: number;
  y: number;
  radius: number;
  fillColor: string;
  lineWidth: number;
  selected: boolean;
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
}
