// core/shapes/Octagon.ts
import { PanZoomManager } from '../../managers/PanZoomManager';
import { Shape } from './Shape';
import { drawPolygon, getPolygonVertices, isPointInPolygon } from '../utils/polygon';
import { lineIntersection } from '../utils/geometry';

export default class Square extends Shape {
  private static readonly SIDES = 4;
  private static readonly ROTATION = -Math.PI / 4;

  protected drawShape(ctx: CanvasRenderingContext2D): void {
    drawPolygon(
      ctx,
      this.x,
      this.y,
      this.radius,
      Square.SIDES,
      Square.ROTATION,
      this.fillColor,
      this.strokeColor,
      this.lineWidth
    );
  }

  contains(px: number, py: number): boolean {
    const vertices = getPolygonVertices(
      this.x,
      this.y,
      this.radius,
      Square.SIDES,
      Square.ROTATION
    );
    return isPointInPolygon(px, py, vertices);
  }

  getBoundaryPoint(angle: number): { x: number; y: number } {
    const sectorAngle = (Math.PI * 2) / Square.SIDES;
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Враховуємо обертання при визначенні сектора
    const sector = Math.floor((angle - Square.ROTATION) / sectorAngle) % Square.SIDES;
    const sectorStartAngle = sector * sectorAngle + Square.ROTATION;
    const sectorEndAngle = (sector + 1) * sectorAngle + Square.ROTATION;

    const startVertex = {
      x: this.x + this.radius * Math.cos(sectorStartAngle),
      y: this.y + this.radius * Math.sin(sectorStartAngle),
    };
    const endVertex = {
      x: this.x + this.radius * Math.cos(sectorEndAngle),
      y: this.y + this.radius * Math.sin(sectorEndAngle),
    };

    const farPoint = {
      x: this.x + this.radius * 2 * Math.cos(angle),
      y: this.y + this.radius * 2 * Math.sin(angle),
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

  onDoubleClick?(): void {
    console.log(`Double clicked on square ${this.id}`);
  }
}
