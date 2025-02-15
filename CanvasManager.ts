import Circle from './Circle.js';
import Connection from './Connection.js';
import { getRandomColor, pointToLineDistance } from './utils.js';

export default class CanvasManager {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    circles: Circle[] = [];
    connections: Connection[] = [];
    draggingCircle: number | null = null;
    connectionStart: number | null = null;
    offsetX: number = 0;
    offsetY: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D context не доступний');
        }
        this.ctx = ctx;

        // Прив'язка методів
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onDoubleClick = this.onDoubleClick.bind(this);
    }

    init(): void {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('mouseleave', this.onMouseLeave);
        this.canvas.addEventListener('dblclick', this.onDoubleClick);
        this.draw();
    }

    createCircle(x: number, y: number): void {
        const circle = new Circle(x, y, 20, getRandomColor());
        this.circles.push(circle);
        this.draw();
    }

    draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Малюємо зв'язки (стрілки)
        this.connections.forEach(conn => {
            const c1 = this.circles.find(c => c.id === conn.fromId);
            const c2 = this.circles.find(c => c.id === conn.toId);
            if (c1 && c2) {
                conn.draw(this.ctx, c1, c2);
            }
        });

        // Малюємо кружечки
        this.circles.forEach(circle => {
            circle.draw(this.ctx);
        });
    }

    getCircleAt(x: number, y: number): { circle: Circle, index: number } | null {
        for (let i = this.circles.length - 1; i >= 0; i--) {
            const circle = this.circles[i];
            if (circle.contains(x, y)) {
                return { circle, index: i };
            }
        }
        return null;
    }

    onMouseDown(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const hit = this.getCircleAt(mouseX, mouseY);
        if (e.shiftKey) {
            if (hit) {
                this.connectionStart = hit.circle.id;
            }
        } else {
            if (hit) {
                this.draggingCircle = hit.index;
                this.offsetX = mouseX - this.circles[this.draggingCircle].x;
                this.offsetY = mouseY - this.circles[this.draggingCircle].y;
            } else {
                this.createCircle(mouseX, mouseY);
            }
        }
    }

    onMouseMove(e: MouseEvent): void {
        if (this.draggingCircle !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.circles[this.draggingCircle].x = mouseX - this.offsetX;
            this.circles[this.draggingCircle].y = mouseY - this.offsetY;
            this.draw();
        }
    }

    onMouseUp(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (this.connectionStart !== null) {
            const hit = this.getCircleAt(mouseX, mouseY);
            if (hit && hit.circle.id !== this.connectionStart) {
                this.connections.push(new Connection(this.connectionStart, hit.circle.id));
                this.draw();
            }
            this.connectionStart = null;
        }
        this.draggingCircle = null;
    }

    onContextMenu(e: MouseEvent): void {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const threshold = 5;
        for (let i = 0; i < this.connections.length; i++) {
            const conn = this.connections[i];
            const c1 = this.circles.find(c => c.id === conn.fromId);
            const c2 = this.circles.find(c => c.id === conn.toId);
            if (c1 && c2) {
                const distance = pointToLineDistance(mouseX, mouseY, c1.x, c1.y, c2.x, c2.y);
                if (distance < threshold) {
                    this.connections.splice(i, 1);
                    this.draw();
                    break;
                }
            }
        }
    }

    onMouseLeave(): void {
        this.draggingCircle = null;
        this.connectionStart = null;
    }

    onDoubleClick(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const hit = this.getCircleAt(mouseX, mouseY);
        if (hit) {
            const removedId = hit.circle.id;
            // Видаляємо кружечок
            this.circles.splice(hit.index, 1);
            // Видаляємо всі зв'язки, де використовується цей id
            this.connections = this.connections.filter(
                conn => conn.fromId !== removedId && conn.toId !== removedId
            );
            this.draw();
        }
    }
}
