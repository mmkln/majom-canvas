// core/shapes/Connection.ts
import { IDrawable } from '../interfaces/drawable';
import { IShape } from '../interfaces/shape';

export default class Connection implements IDrawable {
    fromId: number;
    toId: number;

    constructor(fromId: number, toId: number) {
        this.fromId = fromId;
        this.toId = toId;
    }

    private getEndpoints(from: IShape, to: IShape) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const startX = from.x + (from as any).radius * Math.cos(angle);
        const startY = from.y + (from as any).radius * Math.sin(angle);
        const endX = to.x - (to as any).radius * Math.cos(angle);
        const endY = to.y - (to as any).radius * Math.sin(angle);
        return { startX, startY, endX, endY, angle };
    }

    private drawLine(ctx: CanvasRenderingContext2D, from: IShape, to: IShape): void {
        const { startX, startY, endX, endY } = this.getEndpoints(from, to);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private drawArrowHead(ctx: CanvasRenderingContext2D, from: IShape, to: IShape): void {
        const { endX, endY, angle } = this.getEndpoints(from, to);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLength * Math.cos(angle - Math.PI / 6),
          endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headLength * Math.cos(angle + Math.PI / 6),
          endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.fill();
    }

    draw(ctx: CanvasRenderingContext2D, elements: IShape[] = []): void {
        const from = elements.find(el => el.id === this.fromId);
        const to = elements.find(el => el.id === this.toId);
        if (from && to) {
            this.drawLine(ctx, from, to);
            this.drawArrowHead(ctx, from, to);
        }
    }
}
