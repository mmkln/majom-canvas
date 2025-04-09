// managers/InteractionManager.ts
import { Scene } from '../core/scene/Scene.ts';
import { IShape, ConnectionPoint } from '../core/interfaces/shape.ts';
import { IConnection } from '../core/interfaces/connection.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import Connection from '../core/shapes/Connection.ts';

export class InteractionManager {
  private draggingShape: IShape | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();
  private creatingConnection: boolean = false;
  private connectionStartShape: IShape | null = null;
  private connectionStartPoint: ConnectionPoint | null = null;
  private tempConnectionLine: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null = null;
  private hoveredShape: IShape | null = null;
  private hoveredConnectionPoint: ConnectionPoint | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private scene: Scene,
    private panZoom: PanZoomManager
  ) {}

  // Отримуємо тимчасову лінію для відображення
  public getTempConnectionLine(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null {
    return this.tempConnectionLine;
  }

  // Очищаємо стан створення зв’язку (наприклад, для скасування через Esc)
  public cancelConnectionCreation(): void {
    this.creatingConnection = false;
    this.connectionStartShape = null;
    this.connectionStartPoint = null;
    this.tempConnectionLine = null;
    this.hoveredConnectionPoint = null;
    this.scene.changes.next();
  }

  private findConnectionPointAt(
    sceneX: number,
    sceneY: number,
    shapes: IShape[]
  ): { shape: IShape; point: ConnectionPoint } | null {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const points = shape.getConnectionPoints();
      for (const point of points) {
        const distance = Math.sqrt(
          (sceneX - point.x) ** 2 + (sceneY - point.y) ** 2
        );
        if (distance < 5 / this.panZoom.scale) {
          // Радіус для наведення
          return { shape, point };
        }
      }
    }
    return null;
  }

  handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    if (e.button !== 0) return false;
    const shapes = this.scene.getShapes();
    const connections = this.scene.getConnections();
    let clickedShape: IShape | null = null;
    let clickedConnection: IConnection | null = null;

    const connectionPointHit = this.findConnectionPointAt(
      sceneX,
      sceneY,
      shapes
    );
    if (connectionPointHit) {
      this.creatingConnection = true;
      this.connectionStartShape = connectionPointHit.shape;
      this.connectionStartPoint = connectionPointHit.point;
      this.tempConnectionLine = {
        startX: connectionPointHit.point.x,
        startY: connectionPointHit.point.y,
        endX: sceneX,
        endY: sceneY,
      };
      return true;
    }

    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.contains(sceneX, sceneY)) {
        clickedShape = shape;
        break;
      }
    }

    if (clickedShape) {
      if (e.shiftKey) {
        const currentlySelected = this.scene.getSelectedElements();
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

    for (const element of connections) {
        if (element.isNearPoint(sceneX, sceneY, shapes)) {
          clickedConnection = element;
          if (e.shiftKey){
            const currentlySelected = this.scene.getSelectedElements();
            this.scene.setSelected([...currentlySelected, element]);
          } else {
          this.scene.setSelected([element]);}
          return true;
        }
    }

    this.scene.setSelected([]);
    return false;
  }

  handleMouseMove(sceneX: number, sceneY: number): void {
    const shapes = this.scene.getShapes();

    // Оновлюємо стан наведення для фігур
    let newHoveredShape: IShape | null = null;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      shape.isHovered = false; // Скидаємо наведення для всіх фігур
      if (shape.contains(sceneX, sceneY)) {
        newHoveredShape = shape;
        break;
      }
    }
    if (newHoveredShape) {
      newHoveredShape.isHovered = true;
    }
    this.hoveredShape = newHoveredShape;

    // Оновлюємо стан наведення для точок з’єднання
    shapes.forEach((shape) => {
      const points: ConnectionPoint[] = shape.getConnectionPoints();
      points.forEach((point) => (point.isHovered = false));
    });
    const connectionPointHit = this.findConnectionPointAt(
      sceneX,
      sceneY,
      shapes
    );
    if (connectionPointHit) {
      connectionPointHit.point.isHovered = true;
      this.hoveredConnectionPoint = connectionPointHit.point;
    } else {
      this.hoveredConnectionPoint = null;
    }

    // Якщо створюємо зв’язок, оновлюємо тимчасову лінію
    if (this.creatingConnection && this.tempConnectionLine) {
      if (this.hoveredConnectionPoint) {
        // Якщо наведено на точку з’єднання, прив’язуємо кінець лінії до неї
        this.tempConnectionLine.endX = this.hoveredConnectionPoint.x;
        this.tempConnectionLine.endY = this.hoveredConnectionPoint.y;
      } else {
        // Інакше кінець лінії слідує за курсором
        this.tempConnectionLine.endX = sceneX;
        this.tempConnectionLine.endY = sceneY;
      }
      this.scene.changes.next();
    }

    // Звичайна логіка для перетягування фігур
    if (this.draggingShape) {
      const clickedInitialPos = this.initialPositions.get(
        this.draggingShape.id
      );
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
    // Завершуємо створення зв’язку
    if (this.creatingConnection) {
      const shapes = this.scene.getShapes();
      const connectionPointHit = this.findConnectionPointAt(
        this.tempConnectionLine?.endX || 0,
        this.tempConnectionLine?.endY || 0,
        shapes
      );
      if (
        connectionPointHit &&
        connectionPointHit.shape !== this.connectionStartShape &&
        this.connectionStartShape
      ) {
        // Створюємо зв’язок, якщо відпустили мишу над точкою з’єднання іншої фігури
        const connection = new Connection(
          this.connectionStartShape.id,
          connectionPointHit.shape.id
        );
        this.scene.addElement(connection);
      }
      // Скидаємо стан створення зв’язку
      this.creatingConnection = false;
      this.connectionStartShape = null;
      this.connectionStartPoint = null;
      this.tempConnectionLine = null;
      this.hoveredConnectionPoint = null;
      this.scene.changes.next();
    }

    // Звичайна логіка для завершення перетягування фігур
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
