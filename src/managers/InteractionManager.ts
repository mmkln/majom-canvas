// managers/InteractionManager.ts
import { Scene } from '../core/scene/Scene';
import { IShape } from '../core/interfaces/shape';

export class InteractionManager {
  private draggingShape: IShape | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(private canvas: HTMLCanvasElement, private scene: Scene) {
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
  }

  private getMouseCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  handleMouseDown(e: MouseEvent): boolean {
    // Обробляємо тільки ліва кнопка
    if (e.button !== 0) return false;
    const { x, y } = this.getMouseCoords(e);
    const elements = this.scene.getElements();
    // Перебір з зверху вниз (остання фігура – найбільш "верхня")
    for (let i = elements.length - 1; i >= 0; i--) {
      const shape = elements[i];
      if (shape.contains(x, y)) {
        this.draggingShape = shape;
        this.dragOffsetX = x - shape.x;
        this.dragOffsetY = y - shape.y;
        if (shape.onDragStart) shape.onDragStart();
        return true; // Подія оброблена
      }
    }
    return false;
  }

  handleMouseMove(e: MouseEvent): void {
    if (this.draggingShape) {
      const { x, y } = this.getMouseCoords(e);
      this.draggingShape.x = x - this.dragOffsetX;
      this.draggingShape.y = y - this.dragOffsetY;
      if (this.draggingShape.onDrag) {
        this.draggingShape.onDrag(this.draggingShape.x, this.draggingShape.y);
      }
      // Тут можна викликати якийсь callback або сповіщення, щоб CanvasManager перерисовував канвас
    }
  }

  handleMouseUp(e: MouseEvent): void {
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
  }

  handleDoubleClick(e: MouseEvent): void {
    const { x, y } = this.getMouseCoords(e);
    const elements = this.scene.getElements();
    for (let i = elements.length - 1; i >= 0; i--) {
      const shape = elements[i];
      if (shape.contains(x, y) && shape.onDoubleClick) {
        shape.onDoubleClick();
        break;
      }
    }
  }

  handleRightClick(e: MouseEvent): void {
    e.preventDefault();
    const { x, y } = this.getMouseCoords(e);
    const elements = this.scene.getElements();
    for (let i = elements.length - 1; i >= 0; i--) {
      const shape = elements[i];
      if (shape.contains(x, y) && shape.onRightClick) {
        shape.onRightClick();
        break;
      }
    }
  }
}
