export default class Connection {
    constructor(fromId, toId) {
        this.fromId = fromId;
        this.toId = toId;
    }
    // Обчислює кінцеві точки для лінії на краях вузлів
    getEndpoints(circleFrom, circleTo) {
        const angle = Math.atan2(circleTo.y - circleFrom.y, circleTo.x - circleFrom.x);
        const startX = circleFrom.x + circleFrom.radius * Math.cos(angle);
        const startY = circleFrom.y + circleFrom.radius * Math.sin(angle);
        const endX = circleTo.x - circleTo.radius * Math.cos(angle);
        const endY = circleTo.y - circleTo.radius * Math.sin(angle);
        return { startX, startY, endX, endY, angle };
    }
    // Малює лінію зв'язку (без наконечника)
    drawLine(ctx, circleFrom, circleTo) {
        const { startX, startY, endX, endY } = this.getEndpoints(circleFrom, circleTo);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // Малює наконечник стрілки (трикутник) поверх лінії
    drawArrowHead(ctx, circleFrom, circleTo) {
        const { endX, endY, angle } = this.getEndpoints(circleFrom, circleTo);
        const headLength = 15;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.fill();
    }
    draw(ctx, circleFrom, circleTo) {
        this.drawLine(ctx, circleFrom, circleTo);
        this.drawArrowHead(ctx, circleFrom, circleTo);
    }
}
