// core/shapes/Circle.ts
import { Shape } from './Shape';
import { IShape } from '../interfaces/shape';

export default class Circle extends Shape {
    protected getInnerRadius(): number {
        return this.radius;
    }

    protected drawShape(ctx: CanvasRenderingContext2D): void {
        const innerRadius = this.getInnerRadius();
        ctx.beginPath();
        ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }

    contains(px: number, py: number): boolean {
        const innerRadius = this.getInnerRadius();
        const dx = px - this.x;
        const dy = py - this.y;
        return dx * dx + dy * dy <= innerRadius * innerRadius;
    }

    getBoundaryPoint(angle: number): { x: number; y: number } {
        const innerRadius = this.getInnerRadius();
        return {
            x: this.x + innerRadius * Math.cos(angle),
            y: this.y + innerRadius * Math.sin(angle),
        };
    }

    clone(): IShape {
        const cloned = new Circle(
          this.x,
          this.y,
          this.radius,
          this.fillColor,
          this.lineWidth
        );
        cloned.selected = this.selected;
        return cloned;
    }

    onDoubleClick?(): void {
        console.log(`Double clicked on circle ${this.id}`);
    }
}
