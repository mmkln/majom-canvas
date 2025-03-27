// Circle.ts
class Circle {
    constructor(x, y, radius, color) {
        this.id = Circle.nextId++;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.stroke();
    }
    contains(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }
}
Circle.nextId = 0;
export default Circle;
