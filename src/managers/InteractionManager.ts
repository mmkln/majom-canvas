// managers/InteractionManager.ts
import { Scene } from '../core/scene/Scene';
import { IShape } from '../core/interfaces/shape';
import { PanZoomManager } from './PanZoomManager';
import Connection from '../core/shapes/Connection';

export class InteractionManager {
  private draggingShape: IShape | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();
  private creatingConnection: boolean = false;
  private connectionStartShape: IShape | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private scene: Scene,
    private panZoom: PanZoomManager
  ) {}

  handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    if (e.button !== 0) return false;
    const shapes = this.scene.getShapes();
    let clickedShape: IShape | null = null;

    if (e.altKey) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.contains(sceneX, sceneY)) {
          if (!this.creatingConnection) {
            this.creatingConnection = true;
            this.connectionStartShape = shape;
            return true;
          } else if (shape !== this.connectionStartShape) {
            const connection = new Connection(
              this.connectionStartShape!.id,
              shape.id
            );
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

    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(sceneX, sceneY)) {
        clickedShape = shape;
        break;
      }
    }

    console.log('clickedShape', clickedShape);
    if (clickedShape) {
      if (e.shiftKey) {
        const currentlySelected = this.scene.getSelectedShapes();
        if (currentlySelected.indexOf(clickedShape) === -1) {
          this.scene.setSelected([...currentlySelected, clickedShape]);
        }
      } else {
        this.scene.setSelected([clickedShape]);
      }
      const selected = this.scene.getSelectedShapes();
      this.initialPositions.clear();
      selected.forEach((shape) => {
        this.initialPositions.set(shape.id, { x: shape.x, y: shape.y });
      });
      this.draggingShape = clickedShape;
      const offset = { x: sceneX - clickedShape.x, y: sceneY - clickedShape.y };
      this.dragOffsetX = offset.x;
      this.dragOffsetY = offset.y;
      if (clickedShape.onDragStart) clickedShape.onDragStart();
      return true;
    }

    this.scene.setSelected([]);
    return false;
  }

  handleMouseMove(sceneX: number, sceneY: number): void {
    if (this.draggingShape) {
      const clickedInitialPos = this.initialPositions.get(this.draggingShape.id);
      if (!clickedInitialPos) return;
      const dx = sceneX - (clickedInitialPos.x + this.dragOffsetX);
      const dy = sceneY - (clickedInitialPos.y + this.dragOffsetY);

      const selected = this.scene.getSelectedShapes();
      selected.forEach((shape) => {
        const initPos = this.initialPositions.get(shape.id);
        if (initPos) {
          shape.x = initPos.x + dx;
          shape.y = initPos.y + dy;
          if (shape.onDrag) shape.onDrag(shape.x, shape.y);
        }
      });
      this.scene.changes.next();
    }
  }

  handleMouseUp(): void {
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
    this.initialPositions.clear();
    this.scene.changes.next();
  }

  handleDoubleClick(sceneX: number, sceneY: number): void {
    const shapes = this.scene.getShapes();
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(sceneX, sceneY) && shape.onDoubleClick) {
        shape.onDoubleClick();
        break;
      }
    }
  }

  handleRightClick(e: MouseEvent, sceneX: number, sceneY: number): void {
    e.preventDefault();
    const shapes = this.scene.getShapes();
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(sceneX, sceneY) && shape.onRightClick) {
        shape.onRightClick();
        break;
      }
    }
  }
}
