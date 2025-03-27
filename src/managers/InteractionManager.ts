// managers/InteractionManager.ts
import { Scene } from '../core/scene/Scene';
import { IShape } from '../core/interfaces/shape';
import { PanZoomManager } from './PanZoomManager';
import Connection from '../core/shapes/Connection';

export class InteractionManager {
  private draggingShape: IShape | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;

  private creatingConnection: boolean = false;
  private connectionStartShape: IShape | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private scene: Scene,
    private panZoom: PanZoomManager // Додаємо PanZoomManager
  ) {}

  private getMouseCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // Перетворюємо координати екрану в координати сцени з урахуванням скролу і масштабу
    const sceneX = (screenX + this.panZoom.scrollX) / this.panZoom.scale;
    const sceneY = (screenY + this.panZoom.scrollY) / this.panZoom.scale;
    return { x: sceneX, y: sceneY };
  }

  handleMouseDown(e: MouseEvent): boolean {
    const { x, y } = this.getMouseCoords(e);
    const shapes = this.scene.getShapes();

    if (e.shiftKey) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.contains(x, y)) {
          if (!this.creatingConnection) {
            this.creatingConnection = true;
            this.connectionStartShape = shape;
            return true;
          } else if (shape !== this.connectionStartShape) {
            const connection = new Connection(this.connectionStartShape!.id, shape.id);
            this.scene.addElement(connection);
            this.creatingConnection = false;
            this.connectionStartShape = null;
            return true;
          }
        }
      }
      this.creatingConnection = false;
      this.connectionStartShape = null;
      return false;
    }

    if (e.button !== 0) return false;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(x, y)) {
        this.draggingShape = shape;
        this.dragOffsetX = x - shape.x;
        this.dragOffsetY = y - shape.y;
        if (shape.onDragStart) shape.onDragStart();
        return true;
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
      this.scene.changes.next();
    }
  }

  handleMouseUp(e: MouseEvent): void {
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
    this.scene.changes.next();
  }

  handleDoubleClick(e: MouseEvent): void {
    const { x, y } = this.getMouseCoords(e);
    const shapes = this.scene.getShapes();
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(x, y) && shape.onDoubleClick) {
        shape.onDoubleClick();
        break;
      }
    }
  }

  handleRightClick(e: MouseEvent): void {
    e.preventDefault();
    const { x, y } = this.getMouseCoords(e);
    const shapes = this.scene.getShapes();
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(x, y) && shape.onRightClick) {
        shape.onRightClick();
        break;
      }
    }
  }
}
