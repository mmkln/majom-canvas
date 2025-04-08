// core/shapes/Square.ts
import { Shape } from './Shape.ts';
import {
  drawPolygon,
  getPolygonVertices,
  isPointInPolygon,
} from '../utils/polygon.ts';
import { lineIntersection } from '../utils/geometry.ts';
import { IShape } from '../interfaces/shape.ts';

export default class Square extends Shape {
  private static readonly SIDES = 4;
  private static readonly ROTATION = -Math.PI / 4; // Орієнтуємо квадрат так, щоб сторони були горизонтальними/вертикальними

  protected getInnerRadius(): number {
    // Ширина квадрата = 2 * innerRadius * cos(π/4)
    // Ми хочемо, щоб ширина дорівнювала 2 * radius
    // Отже: 2 * radius = 2 * innerRadius * cos(π/4)
    // innerRadius = radius / cos(π/4)
    return this.radius / Math.cos(Math.PI / 4); // ≈ radius / 0.707 ≈ radius * 1.414
  }

  protected drawShape(ctx: CanvasRenderingContext2D): void {
    const innerRadius = this.getInnerRadius();
    drawPolygon(
      ctx,
      this.x,
      this.y,
      innerRadius,
      Square.SIDES,
      Square.ROTATION,
      this.fillColor,
      this.lineWidth
    );
  }

  contains(px: number, py: number): boolean {
    const innerRadius = this.getInnerRadius();
    const vertices = getPolygonVertices(
      this.x,
      this.y,
      innerRadius,
      Square.SIDES,
      Square.ROTATION
    );
    return isPointInPolygon(px, py, vertices);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const innerRadius = this.getInnerRadius();
    const sectorAngle = (Math.PI * 2) / Square.SIDES;
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const sector =
      Math.floor((angle + Math.PI / 2 - Math.PI / 4) / sectorAngle) %
      Square.SIDES;
    const sectorStartAngle = sector * sectorAngle - Math.PI / 2 + Math.PI / 4;
    const sectorEndAngle =
      (sector + 1) * sectorAngle - Math.PI / 2 + Math.PI / 4;

    const startVertex = {
      x: this.x + innerRadius * Math.cos(sectorStartAngle),
      y: this.y + innerRadius * Math.sin(sectorStartAngle),
    };
    const endVertex = {
      x: this.x + innerRadius * Math.cos(sectorEndAngle),
      y: this.y + innerRadius * Math.sin(sectorEndAngle),
    };

    const farPoint = {
      x: this.x + innerRadius * 2 * Math.cos(angle),
      y: this.y + innerRadius * 2 * Math.sin(angle),
    };

    const intersection = lineIntersection(
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

  clone(): IShape {
    const cloned = new Square({
      x: this.x,
      y: this.y,
      radius: this.radius,
      fillColor: this.fillColor,
      lineWidth: this.lineWidth,
    });
    cloned.selected = this.selected;
    return cloned;
  }

  onDoubleClick?(): void {
    console.log(`Double clicked on square ${this.id}`);
  }
}
