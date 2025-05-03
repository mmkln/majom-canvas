// core/shapes/Shape.ts
import { ConnectionPoint, IShape } from '../interfaces/shape.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { v4 } from 'uuid';
import { SELECT_COLOR } from '../constants.ts';

export abstract class Shape implements IShape, IConnectable {
  public id: string;
  public x: number;
  public y: number;
  public radius: number;
  public fillColor: string;
  public lineWidth: number;
  public selected: boolean;
  public isHovered: boolean = false;
  public zIndex: number;

  constructor({
    x,
    y,
    id = v4(),
    radius = 50,
    fillColor = '#0baef6',
    lineWidth = 1,
  }: {
    x: number;
    y: number;
    id?: string;
    radius?: number;
    fillColor?: string;
    lineWidth?: number;
  }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.lineWidth = lineWidth;
    this.selected = false;
    this.zIndex = 1;
  }

  protected abstract getInnerRadius(): number;

  protected abstract drawShape(ctx: CanvasRenderingContext2D): void;

  public getConnectionPoints(): ConnectionPoint[] {
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // 0°, 90°, 180°, 270°
    const directions: ('right' | 'bottom' | 'left' | 'top')[] = [
      'right',
      'bottom',
      'left',
      'top',
    ];

    return angles.map((angle, index) => {
      const point = this.getBoundaryPoint(angle);
      return {
        x: point.x,
        y: point.y,
        angle,
        direction: directions[index],
        isHovered: false,
      };
    });
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    this.drawShape(ctx);

    if (this.selected) {
      ctx.save();
      ctx.strokeStyle = SELECT_COLOR;
      ctx.lineWidth = 1;
      const padding = 1;
      ctx.strokeRect(
        this.x - this.radius - padding,
        this.y - this.radius - padding,
        this.radius * 2 + padding * 2,
        this.radius * 2 + padding * 2
      );
      ctx.restore();
    }

    // Draw ports: when selected/hovered shape or individual port hovered
    const connectionPoints = this.getConnectionPoints();
    const hoveredPort: ConnectionPoint | undefined = (this as any).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      for (const point of connectionPoints) {
        const isPortHovered = hoveredPort
          ? point.x === hoveredPort.x && point.y === hoveredPort.y
          : false;
        // Only draw port if shape hovered/selected or this specific port hovered
        if (!(this.selected || this.isHovered) && !isPortHovered) continue;
        const radius = (isPortHovered ? 8 : 4) / panZoom.scale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isPortHovered ? SELECT_COLOR : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract clone(): IShape;

  onDoubleClick?(): void {
    console.log(`Double clicked on shape ${this.id}`);
  }

  /** IConnectable: nearest anchor point to coords */
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

  /** IConnectable: draw anchor dots */
  public drawAnchors(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void {
    // Draw anchors using hoveredPort info
    const pts = this.getConnectionPoints();
    const hoveredPort: ConnectionPoint | undefined = (this as any).hoveredPort;
    if (this.selected || this.isHovered || hoveredPort) {
      for (const pt of pts) {
        const isPortHovered = hoveredPort
          ? pt.x === hoveredPort.x && pt.y === hoveredPort.y
          : false;
        if (!(this.selected || this.isHovered) && !isPortHovered) continue;
        const radius = (isPortHovered ? 8 : 4) / panZoom.scale;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isPortHovered ? SELECT_COLOR : '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /** IConnectable: straight connection line */
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
