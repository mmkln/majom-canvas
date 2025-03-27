// core/shapes/Circle.ts
import { PanZoomManager } from '../../managers/PanZoomManager';
import { Shape } from './Shape';

export default class Circle extends Shape {
    protected getInnerRadius(): number {
        return this.radius;
    }

    protected drawShape(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
        const innerRadius = this.getInnerRadius();
        ctx.beginPath();
        ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
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

    onDoubleClick?(): void {
        console.log(`Double clicked on circle ${this.id}`);
    }
}
