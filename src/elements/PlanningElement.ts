// core/shapes/PlanningElement.ts
import { IPlanningElement } from './interfaces/planningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';

export abstract class PlanningElement implements IPlanningElement {
  static width: number;
  static height: number;

  id: string;
  x: number;
  y: number;
  fillColor: string;
  lineWidth: number;
  isHovered: boolean = false;
  selected: boolean = false;

  constructor({
    id,
    x,
    y,
    width,
    height,
    fillColor = '#e6f7ff',
    lineWidth = 2
  }: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor?: string;
    lineWidth?: number;
  }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.fillColor = fillColor;
    this.lineWidth = lineWidth;
  }

  // Abstract methods that subclasses must implement
  abstract draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract getConnectionPoints(): ConnectionPoint[];
  abstract clone(): IPlanningElement;

  // Optional event handlers can be empty by default
  onDoubleClick?(): void {}
  onRightClick?(): void {}
  onDragStart?(): void {}
  onDrag?(x: number, y: number): void {}
  onDragEnd?(): void {}
}
