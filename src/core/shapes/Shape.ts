// core/shapes/Shape.ts
import { IShape } from '../interfaces/shape';
import { PanZoomManager } from '../../managers/PanZoomManager';
import { v4 } from 'uuid';

export abstract class Shape implements IShape {
  public id: string;
  public x: number;
  public y: number;
  public radius: number;
  public fillColor: string;
  // public strokeColor: string;
  public lineWidth: number;
  public selected: boolean;

  constructor(
    x: number,
    y: number,
    radius: number = 50,
    fillColor: string = '#0baef6',
    // strokeColor: string = '#f3c92f',
    lineWidth: number = 1
  ) {
    this.id = v4();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    // this.strokeColor = strokeColor;
    this.lineWidth = lineWidth;
    this.selected = false;
  }

  protected abstract getInnerRadius(): number;

  protected abstract drawShape(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    this.drawShape(ctx, panZoom);

    if (this.selected) {
      ctx.save();
      ctx.strokeStyle = '#1a32cb';
      ctx.lineWidth = 1;
      const padding = 1;
      // Використовуємо radius як половину ширини/висоти
      ctx.strokeRect(
        this.x - this.radius - padding,
        this.y - this.radius - padding,
        this.radius * 2 + padding * 2,
        this.radius * 2 + padding * 2
      );
      ctx.restore();
    }
  }

  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract clone(): IShape;

  onDoubleClick?(): void {
    console.log(`Double clicked on shape ${this.id}`);
  }
}
