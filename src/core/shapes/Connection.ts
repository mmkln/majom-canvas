// core/shapes/Connection.ts
import { IDrawable } from '../interfaces/drawable';
import { IShape } from '../interfaces/shape';
import { PanZoomManager } from '../../managers/PanZoomManager';

export default class Connection implements IDrawable {
    fromId: number;
    toId: number;

    constructor(fromId: number, toId: number) {
        this.fromId = fromId;
        this.toId = toId;
    }

    private getEndpoints(from: IShape, to: IShape, panZoom: PanZoomManager) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const start = from.getBoundaryPoint(angle);
        const end = to.getBoundaryPoint(angle + Math.PI);
        return { startX: start.x, startY: start.y, endX: end.x, endY: end.y, angle };
    }

    private drawLine(ctx: CanvasRenderingContext2D, from: IShape, to: IShape, panZoom: PanZoomManager): void {
        const { startX, startY, endX, endY } = this.getEndpoints(from, to, panZoom);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 / panZoom.scale;
        ctx.stroke();
    }

    private drawArrowHead(ctx: CanvasRenderingContext2D, from: IShape, to: IShape, panZoom: PanZoomManager): void {
        const { endX, endY, angle } = this.getEndpoints(from, to, panZoom);
        const headLength = 15 / panZoom.scale;
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

    draw(ctx: CanvasRenderingContext2D, panZoom: PanZoomManager, elements: IShape[] = []): void {
        const from = elements.find(el => el.id === this.fromId);
        const to = elements.find(el => el.id === this.toId);
        if (from && to) {
            this.drawLine(ctx, from, to, panZoom);
            this.drawArrowHead(ctx, from, to, panZoom);
        }
    }
}
