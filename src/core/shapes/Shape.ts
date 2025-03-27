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
  public strokeColor: string;
  public lineWidth: number;
  public selected: boolean;

  constructor(
    x: number,
    y: number,
    radius: number = 50,
    fillColor: string = '#0baef6',
    strokeColor: string = '#f3c92f',
    lineWidth: number = 1
  ) {
    this.id = v4();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.lineWidth = lineWidth;
    this.selected = false;
  }

  // Абстрактний метод для малювання самої форми (без виділення)
  protected abstract drawShape(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void;

  // Загальний метод draw, який включає логіку виділення
  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    // Малюємо саму форму
    this.drawShape(ctx, panZoom);

    // Малюємо рамку виділення, якщо форма вибрана
    if (this.selected) {
      ctx.save();
      ctx.strokeStyle = '#008dff';
      ctx.lineWidth = 2;
      const padding = 2;
      ctx.strokeRect(
        this.x - this.radius - padding,
        this.y - this.radius - padding,
        this.radius * 2 + padding * 2,
        this.radius * 2 + padding * 2
      );
      ctx.restore();
    }
  }

  contains(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  // Default getBoundaryPoint for a circle-like shape.
  getBoundaryPoint(angle: number): { x: number; y: number } {
    return {
      x: this.x + this.radius * Math.cos(angle),
      y: this.y + this.radius * Math.sin(angle),
    };
  }

  onDoubleClick?(): void {
    console.log(`Double clicked on shape ${this.id}`);
  }
}
