// core/shapes/Circle.ts
import { IShape } from '../interfaces/shape';
import { PanZoomManager } from '../../managers/PanZoomManager';

export default class Circle implements IShape {
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
        this.id = Circle.nextId++;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.lineWidth = lineWidth;
    }

    draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager): void {
        // Вже враховано трансформацію в CanvasManager, тому просто малюємо
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

    onDoubleClick?(): void {
        console.log(`Double clicked on circle ${this.id}`);
    }
}
