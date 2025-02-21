// CanvasManager.ts
import Circle from './Circle.js';
import Connection from './Connection.js';
import { getRandomColor, pointToLineDistance } from './utils.js';
import { Task, TaskDependency } from './interfaces.js';

export default class CanvasManager {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    circles: Circle[] = [];
    connections: Connection[] = [];
    draggingCircle: number | null = null;
    connectionStart: number | null = null;
    offsetX: number = 0;
    offsetY: number = 0;

    // Властивості для zoom і pan (як раніше)
    scale: number = 1;
    viewOffsetX: number = 0;
    viewOffsetY: number = 0;
    isPanning: boolean = false;
    panStartX: number = 0;
    panStartY: number = 0;

    private currentEditIndex: number | null = null;

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
        this.onWheel = this.onWheel.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    init(): void {
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('contextmenu', this.onContextMenu);
        this.canvas.addEventListener('mouseleave', this.onMouseLeave);
        this.canvas.addEventListener('dblclick', this.onDoubleClick);
        this.canvas.addEventListener('wheel', this.onWheel);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.draw();
    }

    // Метод для завантаження даних задач і залежностей
    loadData(tasks: Task[], dependencies: TaskDependency[]): void {
        // Очистка поточного стану
        this.circles = [];
        this.connections = [];
        // Створення кружечків із задач
        tasks.forEach(task => {
            // Можна, наприклад, вибирати колір залежно від статусу або пріоритету.
            const color = getRandomColor();
            const circle = new Circle(task.x, task.y, 20, color);
            // Примусово встановлюємо id, щоб він відповідав задачі
            circle.id = task.id;
            this.circles.push(circle);
        });
        // Створення зв’язків із залежностей
        dependencies.forEach(dep => {
            this.connections.push(new Connection(dep.fromTaskId, dep.toTaskId));
        });
        this.draw();
    }

    draw(): void {
        this.ctx.save();
        this.ctx.translate(this.viewOffsetX, this.viewOffsetY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.clearRect(-this.viewOffsetX / this.scale, -this.viewOffsetY / this.scale, this.canvas.width / this.scale, this.canvas.height / this.scale);

        this.connections.forEach(conn => {
            const c1 = this.circles.find(c => c.id === conn.fromId);
            const c2 = this.circles.find(c => c.id === conn.toId);
            if (c1 && c2) {
                conn.drawLine(this.ctx, c1, c2);
            }
        });

        this.circles.forEach(circle => {
            circle.draw(this.ctx);
        });

        this.connections.forEach(conn => {
            const c1 = this.circles.find(c => c.id === conn.fromId);
            const c2 = this.circles.find(c => c.id === conn.toId);
            if (c1 && c2) {
                conn.drawArrowHead(this.ctx, c1, c2);
            }
        });
        this.ctx.restore();
    }

    // Інші методи обробки подій (onMouseDown, onMouseMove, onMouseUp, onContextMenu, onMouseLeave, onDoubleClick, onWheel, onKeyDown, onKeyUp) зберігаються як раніше...

    onMouseDown(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (this.isPanning) {
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            return;
        }
        const hit = this.getCircleAt(mouseX, mouseY);
        if (e.shiftKey) {
            if (hit) {
                this.connectionStart = hit.circle.id;
            }
        } else {
            if (hit) {
                this.draggingCircle = hit.index;
                const invScale = 1 / this.scale;
                this.offsetX = (mouseX - this.viewOffsetX) * invScale - this.circles[this.draggingCircle].x;
                this.offsetY = (mouseY - this.viewOffsetY) * invScale - this.circles[this.draggingCircle].y;
            } else {
                const invScale = 1 / this.scale;
                this.createCircle((mouseX - this.viewOffsetX) * invScale, (mouseY - this.viewOffsetY) * invScale);
            }
        }
    }

    onMouseMove(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if (this.isPanning) {
            const dx = e.clientX - this.panStartX;
            const dy = e.clientY - this.panStartY;
            this.viewOffsetX += dx;
            this.viewOffsetY += dy;
            this.panStartX = e.clientX;
            this.panStartY = e.clientY;
            this.draw();
            return;
        }
        if (this.draggingCircle !== null) {
            const invScale = 1 / this.scale;
            this.circles[this.draggingCircle].x = (mouseX - this.viewOffsetX) * invScale - this.offsetX;
            this.circles[this.draggingCircle].y = (mouseY - this.viewOffsetY) * invScale - this.offsetY;
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
        // Додаткову логіку можна додати пізніше
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
            this.circles.splice(hit.index, 1);
            this.connections = this.connections.filter(
                conn => conn.fromId !== removedId && conn.toId !== removedId
            );
            this.draw();
        }
    }

    onWheel(e: WheelEvent): void {
        e.preventDefault();
        const zoomIntensity = 0.001;
        const delta = e.deltaY;
        const oldScale = this.scale;
        this.scale *= Math.exp(-delta * zoomIntensity);
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const wx = (mouseX - this.viewOffsetX) / oldScale;
        const wy = (mouseY - this.viewOffsetY) / oldScale;
        this.viewOffsetX = mouseX - wx * this.scale;
        this.viewOffsetY = mouseY - wy * this.scale;
        this.draw();
    }

    onKeyDown(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.isPanning = true;
            e.preventDefault();
        }
    }

    onKeyUp(e: KeyboardEvent): void {
        if (e.code === 'Space') {
            this.isPanning = false;
        }
    }

    getCircleAt(x: number, y: number): { circle: Circle, index: number } | null {
        const invScale = 1 / this.scale;
        const transformedX = (x - this.viewOffsetX) * invScale;
        const transformedY = (y - this.viewOffsetY) * invScale;
        for (let i = this.circles.length - 1; i >= 0; i--) {
            const circle = this.circles[i];
            if (circle.contains(transformedX, transformedY)) {
                return { circle, index: i };
            }
        }
        return null;
    }

    createCircle(x: number, y: number): void {
        const circle = new Circle(x, y, 20, getRandomColor());
        this.circles.push(circle);
        this.draw();
    }

// Простий пошук по ID (можна розширити)
    search(query: string): void {
        // Виділяємо вузли, чиї ID містять query
        const lowerQuery = query.toLowerCase();
        this.circles.forEach(circle => {
            // Наприклад, змінюємо колір вузла, якщо він відповідає запиту
            if (circle.id.toString().includes(lowerQuery)) {
                circle.color = '#FF0000';
            } else {
                // Повертання до стандартного кольору, або збереження попереднього
                // Тут можна зберігати початкові кольори вузлів
            }
        });
        this.draw();
    }

    // Метод для серіалізації стану діаграми
    serialize(): object {
        return {
            circles: this.circles.map(circle => ({
                id: circle.id,
                x: circle.x,
                y: circle.y,
                radius: circle.radius,
                color: circle.color
            })),
            connections: this.connections.map(conn => ({
                fromId: conn.fromId,
                toId: conn.toId
            }))
        };
    }

// Метод для завантаження стану діаграми з об'єкта
    loadState(state: any): void {
        // Очищаємо поточний стан
        this.circles = [];
        this.connections = [];

        // Завантажуємо вузли
        state.circles.forEach((c: any) => {
            // Створюємо новий об'єкт Circle із заданими параметрами
            // При цьому треба встановити властивість id, тому можемо оновити nextId, якщо потрібно
            const circle = new Circle(c.x, c.y, c.radius, c.color);
            circle.id = c.id;
            this.circles.push(circle);
        });
        // Оновлюємо nextId, щоб уникнути повторень
        if (this.circles.length > 0) {
            Circle.nextId = Math.max(...this.circles.map(c => c.id)) + 1;
        } else {
            Circle.nextId = 0;
        }

        // Завантажуємо зв’язки
        state.connections.forEach((conn: any) => {
            this.connections.push(new Connection(conn.fromId, conn.toId));
        });
        this.draw();
    }

    showEditModal(index: number): void {
        this.currentEditIndex = index;
        const modal = document.getElementById('editModal') as HTMLDivElement;
        const form = document.getElementById('editForm') as HTMLFormElement;
        const circle = this.circles[index];

        // Заповнюємо форму значеннями; тут для прикладу ми працюємо лише з кольором і id,
        // але можна інтегрувати додаткові дані (назва, опис, статус тощо)
        // Припустимо, ми зберігаємо додаткові дані у властивості circle.data (яку можна додати)
        // Для простоти зараз використаємо circle.id як приклад.
        (document.getElementById('taskTitle') as HTMLInputElement).value = `Task ${circle.id}`;
        (document.getElementById('taskDescription') as HTMLTextAreaElement).value = '';
        (document.getElementById('taskStatus') as HTMLSelectElement).value = 'pending';
        (document.getElementById('taskPriority') as HTMLSelectElement).value = 'medium';
        const today = new Date().toISOString().split('T')[0];
        (document.getElementById('taskDueDate') as HTMLInputElement).value = today;

        modal.style.display = 'block';
    }

    hideEditModal(): void {
        const modal = document.getElementById('editModal') as HTMLDivElement;
        modal.style.display = 'none';
        this.currentEditIndex = null;
    }

    initEditModal(): void {
        // Обробник закриття модального вікна
        const modal = document.getElementById('editModal') as HTMLDivElement;
        const closeBtn = document.getElementById('modalClose') as HTMLSpanElement;
        closeBtn.onclick = () => this.hideEditModal();

        // Обробник сабміту форми редагування
        const form = document.getElementById('editForm') as HTMLFormElement;
        form.onsubmit = (e) => {
            e.preventDefault();
            if (this.currentEditIndex !== null) {
                // Отримуємо значення з форми та оновлюємо відповідний вузол.
                const title = (document.getElementById('taskTitle') as HTMLInputElement).value;
                const description = (document.getElementById('taskDescription') as HTMLTextAreaElement).value;
                const status = (document.getElementById('taskStatus') as HTMLSelectElement).value as 'pending' | 'in-progress' | 'done';
                const priority = (document.getElementById('taskPriority') as HTMLSelectElement).value as 'low' | 'medium' | 'high';
                const dueDateStr = (document.getElementById('taskDueDate') as HTMLInputElement).value;
                // Можна оновити дані вузла (Circle) – тут для прикладу оновимо лише колір через редагування
                // Або можна зберегти дані в додаткове поле circle.data
                // Для прикладу, змінимо колір в залежності від статусу
                const circle = this.circles[this.currentEditIndex];
                if (status === 'done') {
                    circle.color = '#00AA00';
                } else if (status === 'in-progress') {
                    circle.color = '#FFA500';
                } else {
                    circle.color = '#FF0000';
                }
                // Можна також зберегти title, description, priority, dueDate у додатковому об'єкті circle.data

                this.draw();
                this.hideEditModal();
            }
        };

        // При натисканні поза модальним вікном - приховуємо його
        window.onclick = (e) => {
            if (e.target === modal) {
                this.hideEditModal();
            }
        };
    }

// Перевизначимо метод editNode, щоб відкривати модальне вікно
    editNode(index: number): void {
        this.showEditModal(index);
    }
}
