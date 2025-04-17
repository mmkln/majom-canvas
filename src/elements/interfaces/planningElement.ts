import { ICanvasElement, IPositioned } from '../../core/interfaces/canvasElement.ts';
import { PanZoomManager } from '../../core/managers/PanZoomManager.js';
import { ConnectionPoint } from '../../core/interfaces/shape.js';

export interface IPlanningElement extends ICanvasElement, IPositioned {
  id: string;
  width: number;
  height: number;
  fillColor: string;
  lineWidth: number;
  isHovered: boolean;
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  contains(px: number, py: number): boolean;
  getBoundaryPoint(angle: number): { x: number; y: number };
  getConnectionPoints(): ConnectionPoint[];
  clone(): IPlanningElement;
  onDoubleClick?(): void;
  onRightClick?(): void;
  onDragStart?(): void;
  onDrag?(x: number, y: number): void;
  onDragEnd?(): void;
}
