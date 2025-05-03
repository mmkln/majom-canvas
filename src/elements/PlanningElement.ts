// core/shapes/PlanningElement.ts
import { CanvasElement } from '../core/elements/CanvasElement.ts';
import { PanZoomManager } from '../core/managers/PanZoomManager.ts';
import { ConnectionPoint } from '../core/interfaces/shape.ts';
import { IPlanningElement } from './interfaces/planningElement.ts';
import type { IConnectable } from '../core/interfaces/connectable.ts';
import { SELECT_COLOR } from '../core/constants.ts';

export abstract class PlanningElement
  extends CanvasElement
  implements IPlanningElement, IConnectable
{
  width: number;
  height: number;
  fillColor: string;
  lineWidth: number;
  title: string;
  description: string;
  dueDate?: Date;
  tags?: string[];

  constructor({
    id,
    x = 0,
    y = 0,
    width,
    height,
    fillColor = '#e6f7ff',
    lineWidth = 2,
    title = '',
    description = '',
    dueDate,
    tags,
  }: {
    id?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    fillColor?: string;
    lineWidth?: number;
    title?: string;
    description?: string;
    dueDate?: Date;
    tags?: string[];
  }) {
    super(x, y);
    if (id) this.id = id;
    this.width = width;
    this.height = height;
    this.fillColor = fillColor;
    this.lineWidth = lineWidth;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.tags = tags;
  }

  // Abstract methods that subclasses must implement
  abstract draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;
  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract getConnectionPoints(): ConnectionPoint[];
  abstract clone(): IPlanningElement;

  // IConnectable implementation
  public getNearestPoint(px: number, py: number): { x: number; y: number } {
    const points = this.getConnectionPoints();
    let nearest = points[0];
    let minDist = Infinity;
    for (const p of points) {
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    return { x: nearest.x, y: nearest.y };
  }

  public drawAnchors(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    if (this.selected || this.isHovered) {
      const points = this.getConnectionPoints();
      for (const pt of points) {
        ctx.save();
        // anchors always solid border
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4 / panZoom.scale, 0, 2 * Math.PI);
        ctx.fillStyle = pt.isHovered ? SELECT_COLOR : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  public drawConnectionLine(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager,
    target: IConnectable
  ): void {
    const start = this.getNearestPoint(target.x, target.y);
    const end = target.getNearestPoint(this.x, this.y);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1 / panZoom.scale;
    ctx.stroke();
    ctx.restore();
  }
}
