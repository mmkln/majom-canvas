import Circle from './Circle.js';

export default class Connection {
    fromId: number;
    toId: number;

    constructor(fromId: number, toId: number) {
        this.fromId = fromId;
        this.toId = toId;
    }

    draw(ctx: CanvasRenderingContext2D, circleFrom: Circle, circleTo: Circle): void {
        // Малюємо лінію між центрами кружечків
        ctx.beginPath();
        ctx.moveTo(circleFrom.x, circleFrom.y);
        ctx.lineTo(circleTo.x, circleTo.y);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Обчислюємо кут лінії
        const angle = Math.atan2(circleTo.y - circleFrom.y, circleTo.x - circleFrom.x);
        const headLength = 15;

        // Малюємо наконечник стрілки
        ctx.beginPath();
        ctx.moveTo(circleTo.x, circleTo.y);
        ctx.lineTo(
            circleTo.x - headLength * Math.cos(angle - Math.PI / 6),
            circleTo.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            circleTo.x - headLength * Math.cos(angle + Math.PI / 6),
            circleTo.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
    }
}
