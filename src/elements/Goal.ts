// src/elements/Goal.ts
import { IPlanningElement } from './interfaces/planningElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';

export class Goal implements IPlanningElement {
  id = '';
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  fillColor = '';
  lineWidth = 0;
  isHovered = false;
  selected = false;

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {}
  contains(px: number, py: number): boolean { return false; }
  getBoundaryPoint(angle: number): { x: number; y: number } { return { x: 0, y: 0 }; }
  getConnectionPoints(): ConnectionPoint[] { return []; }
  clone(): IPlanningElement { return this; }
}
