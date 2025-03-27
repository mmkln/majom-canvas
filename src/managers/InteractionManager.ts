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

  private getMouseCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    // Convert screen coordinates to scene coordinates
    const sceneX = (screenX + this.panZoom.scrollX) / this.panZoom.scale;
    const sceneY = (screenY + this.panZoom.scrollY) / this.panZoom.scale;
    return { x: sceneX, y: sceneY };
  }

  handleMouseDown(e: MouseEvent): boolean {
    if (e.button !== 0) return false;
    const { x, y } = this.getMouseCoords(e);
    const shapes = this.scene.getShapes();
    let clickedShape: IShape | null = null;


    if (e.altKey) {
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

    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(x, y)) {
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
      // Begin bulk drag: store initial positions for all selected shapes
      const selected = this.scene.getSelectedShapes();
      this.initialPositions.clear();
      selected.forEach((shape) => {
        this.initialPositions.set(shape.id, { x: shape.x, y: shape.y });
      });
      // Set draggingShape as the one that was clicked
      this.draggingShape = clickedShape;
      const offset = { x: x - clickedShape.x, y: y - clickedShape.y };
      this.dragOffsetX = offset.x;
      this.dragOffsetY = offset.y;
      if (clickedShape.onDragStart) clickedShape.onDragStart();
      return true;
    }

    // If no shape is clicked, clear selection.
    this.scene.setSelected([]);
    return false;
  }

  handleMouseMove(e: MouseEvent): void {
    if (this.draggingShape) {
      const { x, y } = this.getMouseCoords(e);
      // Retrieve the initial position of the shape that was clicked
      const clickedInitialPos = this.initialPositions.get(this.draggingShape.id);
      if (!clickedInitialPos) return;
      // Compute displacement (dx, dy) from the initial mouse down position (using the clicked shape's stored position and drag offset)
      const dx = x - (clickedInitialPos.x + this.dragOffsetX);
      const dy = y - (clickedInitialPos.y + this.dragOffsetY);

      // For each selected shape, update its position relative to its stored initial position.
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

  handleMouseUp(e: MouseEvent): void {
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
    this.initialPositions.clear();
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
