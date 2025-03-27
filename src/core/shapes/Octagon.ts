// core/shapes/Octagon.ts
import { IShape } from '../interfaces/shape';
import { PanZoomManager } from '../../managers/PanZoomManager';

export default class Octagon implements IShape {
  private static nextId = 0;
  public id: number;
  public x: number;
  public y: number;
  public radius: number;
  public fillColor: string;
  public strokeColor: string;
  public lineWidth: number;

  constructor(
    x: number,
    y: number,
    radius: number = 50,
    fillColor: string = '#0baef6',
    strokeColor: string = '#f3c92f',
    lineWidth: number = 1
  ) {
    this.id = Octagon.nextId++;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
    this.lineWidth = lineWidth;
  }

  draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
    const sides = 8;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      const px = this.x + this.radius * Math.cos(angle);
      const py = this.y + this.radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.lineWidth;
    ctx.stroke();
  }

  contains(px: number, py: number): boolean {
    const dx = px - this.x;
    const dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const sides = 8;
    const sectorAngle = (Math.PI * 2) / sides; // Кут одного сектора
    // Нормалізуємо кут до [0, 2π]
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Знаходимо сектор, у якому лежить кут
    const sector = Math.floor((angle + Math.PI / 2) / sectorAngle) % sides;
    const sectorStartAngle = (sector * sectorAngle) - Math.PI / 2;
    const sectorEndAngle = ((sector + 1) * sectorAngle) - Math.PI / 2;

    // Обчислюємо вершини сектора
    const startVertex = {
      x: this.x + this.radius * Math.cos(sectorStartAngle),
      y: this.y + this.radius * Math.sin(sectorStartAngle),
    };
    const endVertex = {
      x: this.x + this.radius * Math.cos(sectorEndAngle),
      y: this.y + this.radius * Math.sin(sectorEndAngle),
    };

    // Знаходимо точку перетину променя з цією стороною
    const farPoint = {
      x: this.x + this.radius * 2 * Math.cos(angle),
      y: this.y + this.radius * 2 * Math.sin(angle),
    };

    const intersection = this.lineIntersection(
      this.x,
      this.y,
      farPoint.x,
      farPoint.y,
      startVertex.x,
      startVertex.y,
      endVertex.x,
      endVertex.y
    );

    return intersection || { x: this.x, y: this.y };
  }

  private lineIntersection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): { x: number; y: number } | null {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }
    return null;
  }

  onDoubleClick?(): void {
    console.log(`Double clicked on octagon ${this.id}`);
  }
}
