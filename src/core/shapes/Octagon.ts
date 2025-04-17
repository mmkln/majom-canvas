// core/shapes/Octagon.ts
import { Shape } from './Shape.ts';
import {
  drawPolygon,
  getPolygonVertices,
  isPointInPolygon,
} from '../utils/polygon.ts';
import { lineIntersection } from '../utils/geometry.ts';
import { IShape } from '../interfaces/shape.ts';

export default class Octagon extends Shape {
  private static readonly SIDES = 8;
  private static readonly ROTATION = -Math.PI / 2 + Math.PI / 8;

  protected getInnerRadius(): number {
    // Ширина восьмикутника = 2 * innerRadius * cos(π/8)
    // Ми хочемо, щоб ширина дорівнювала 2 * radius
    // Отже: 2 * radius = 2 * innerRadius * cos(π/8)
    // innerRadius = radius / cos(π/8)
    return this.radius / Math.cos(Math.PI / 8); // ≈ radius / 0.923 ≈ radius * 1.082
  }

  protected drawShape(
    ctx: CanvasRenderingContext2D
  ): void {
    const innerRadius = this.getInnerRadius();
    drawPolygon(
      ctx,
      this.x,
      this.y,
      innerRadius,
      Octagon.SIDES,
      Octagon.ROTATION,
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
      Octagon.SIDES,
      Octagon.ROTATION
    );
    return isPointInPolygon(px, py, vertices);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const innerRadius = this.getInnerRadius();
    const sectorAngle = (Math.PI * 2) / Octagon.SIDES;
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const sector =
      Math.floor((angle + Math.PI / 2 - Math.PI / 8) / sectorAngle) %
      Octagon.SIDES;
    const sectorStartAngle = sector * sectorAngle - Math.PI / 2 + Math.PI / 8;
    const sectorEndAngle =
      (sector + 1) * sectorAngle - Math.PI / 2 + Math.PI / 8;

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
    const cloned = new Octagon({
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
    console.log(`Double clicked on octagon ${this.id}`);
  }
}
