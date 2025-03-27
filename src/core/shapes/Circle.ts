// core/shapes/Circle.ts
import { Shape } from './Shape';

export default class Circle extends Shape {
    protected drawShape(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
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
        return {
            x: this.x + this.radius * Math.cos(angle),
            y: this.y + this.radius * Math.sin(angle),
        };
    }

    // onDoubleClick успадковується від Shape, але ми можемо перевизначити, якщо потрібно
    onDoubleClick?(): void {
        console.log(`Double clicked on circle ${this.id}`);
    }
}
