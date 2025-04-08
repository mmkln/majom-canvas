// core/shapes/Shape.ts
import { ConnectionPoint, IShape } from '../interfaces/shape.ts';
import { PanZoomManager } from '../../managers/PanZoomManager.ts';
import { v4 } from 'uuid';

export abstract class Shape implements IShape {
  public id: string;
  public x: number;
  public y: number;
  public radius: number;
  public fillColor: string;
  public lineWidth: number;
  public selected: boolean;
  public isHovered: boolean = false; // Додаємо для відстеження наведення

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
  }

  protected abstract getInnerRadius(): number;

  protected abstract drawShape(
    ctx: CanvasRenderingContext2D,
    panZoom: PanZoomManager
  ): void;

  // Отримуємо точки з’єднання (зверху, знизу, зліва, справа)
  public getConnectionPoints(): ConnectionPoint[] {
    const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]; // 0°, 90°, 180°, 270°
    return angles.map((angle) => {
      const point = this.getBoundaryPoint(angle);
      return {
        x: point.x,
        y: point.y,
        angle,
        isHovered: false,
      };
    });
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    this.drawShape(ctx, panZoom);

    if (this.selected) {
      ctx.save();
      ctx.strokeStyle = '#1a32cb';
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

    // Відображаємо точки з’єднання, якщо фігура вибрана або наведена
    if (this.selected || this.isHovered) {
      const connectionPoints = this.getConnectionPoints();
      connectionPoints.forEach((point) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4 / panZoom.scale, 0, 2 * Math.PI); // Радіус точки 4 пікселя
        ctx.fillStyle = point.isHovered ? '#00ff00' : '#ffffff'; // Зелений, якщо наведено, інакше білий
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 / panZoom.scale;
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  abstract contains(px: number, py: number): boolean;
  abstract getBoundaryPoint(angle: number): { x: number; y: number };
  abstract clone(): IShape;

  onDoubleClick?(): void {
    console.log(`Double clicked on shape ${this.id}`);
  }
}
