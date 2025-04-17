// managers/InteractionManager.ts
import { Scene } from '../scene/Scene.ts';
import { IShape, ConnectionPoint } from '../interfaces/shape.ts';
import { IConnection } from '../interfaces/connection.ts';
import { ICanvasElement, IPositioned } from '../interfaces/canvasElement.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import Connection from '../shapes/Connection.ts';

export class InteractionManager {
  private draggingElement: ICanvasElement & IPositioned | null = null;
  private draggingShape: IShape | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();
  private creatingConnection: boolean = false;
  private connectionStartShape: IShape | IPlanningElement | null = null;
  private connectionStartPoint: ConnectionPoint | null = null;
  private tempConnectionLine: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null = null;
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
    elements: (IShape | IPlanningElement)[]
  ): { shape: IShape | IPlanningElement; point: ConnectionPoint } | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      const shape = elements[i];
      const points = shape.getConnectionPoints();
      for (const point of points) {
        const distance = Math.sqrt(
          (sceneX - point.x) ** 2 + (sceneY - point.y) ** 2
        );
        if (distance < 8 / this.panZoom.scale) {
          return { shape, point };
        }
      }
    }
    return null;
  }

  handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    if (e.button !== 0) return false;
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
    const connectables = [...rawShapes, ...planningEls];
    const connections = this.scene.getConnections();
    let clickedShape: IShape | null = null;
    let clickedConnection: IConnection | null = null;

    const connectionPointHit = this.findConnectionPointAt(
      sceneX,
      sceneY,
      connectables
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

    for (let i = rawShapes.length - 1; i >= 0; i--) {
      const shape = rawShapes[i];
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

    // Drag&drop for planning elements
    let clickedElement: ICanvasElement & IPositioned | null = null;
    for (let i = planningEls.length - 1; i >= 0; i--) {
      const el = planningEls[i] as any;
      if (el.contains(sceneX, sceneY)) {
        clickedElement = el;
        break;
      }
    }
    if (clickedElement) {
      if (e.shiftKey) {
        const curr = this.scene.getSelectedElements();
        if (curr.indexOf(clickedElement) === -1) {
          this.scene.setSelected([...curr, clickedElement]);
        }
      } else {
        this.scene.setSelected([clickedElement]);
      }
      const sel = this.scene.getSelectedElements();
      this.initialPositions.clear();
      sel.forEach((elem) => {
        this.initialPositions.set(elem.id, { x: (elem as any).x, y: (elem as any).y });
      });
      this.draggingElement = clickedElement;
      this.dragOffsetX = sceneX - (clickedElement as any).x;
      this.dragOffsetY = sceneY - (clickedElement as any).y;
      if ((clickedElement as any).onDragStart) (clickedElement as any).onDragStart();
      return true;
    }

    for (const element of connections) {
      if (element.isNearPoint(sceneX, sceneY, rawShapes)) {
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
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
    const connectables = [...rawShapes, ...planningEls];

    // Unified hover state for all connectables (shapes + planning elements)
    let newHovered: IShape | IPlanningElement | null = null;
    connectables.forEach((el) => (el as any).isHovered = false);
    for (let i = connectables.length - 1; i >= 0; i--) {
      const el = connectables[i];
      if ((el as any).contains(sceneX, sceneY)) {
        newHovered = el;
        break;
      }
    }
    if (newHovered) {
      (newHovered as any).isHovered = true;
    }

    // Оновлюємо стан наведення для точок з’єднання
    // Clear previous hoveredPort property
    connectables.forEach((shape) => delete (shape as any).hoveredPort);
    const connectionPointHit = this.findConnectionPointAt(
      sceneX,
      sceneY,
      connectables
    );
    if (connectionPointHit) {
      this.hoveredConnectionPoint = connectionPointHit.point;
      // Store hovered port on shape for drawing
      (connectionPointHit.shape as any).hoveredPort = connectionPointHit.point;
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

    // Handle drag of planning elements
    if (this.draggingElement) {
      const init = this.initialPositions.get(this.draggingElement.id);
      if (init) {
        const dx = sceneX - (init.x + this.dragOffsetX);
        const dy = sceneY - (init.y + this.dragOffsetY);
        this.scene.getSelectedElements().forEach((elem) => {
          if (this.initialPositions.has(elem.id)) {
            (elem as any).x = this.initialPositions.get(elem.id)!.x + dx;
            (elem as any).y = this.initialPositions.get(elem.id)!.y + dy;
            if ((elem as any).onDrag) (elem as any).onDrag((elem as any).x, (elem as any).y);
          }
        });
        this.scene.changes.next();
      }
      return;
    }

    // Handle shape dragging
    if (this.draggingShape) {
      const clickedInitialPos = this.initialPositions.get(
        this.draggingShape.id
      );
      if (!clickedInitialPos) return;

      // Apply proper scaling for drag offsets based on zoom level
      const dx = sceneX - (clickedInitialPos.x + this.dragOffsetX);
      const dy = sceneY - (clickedInitialPos.y + this.dragOffsetY);

      const selected = this.scene.getSelectedShapes();
      selected.forEach((shape) => {
        const initPos = this.initialPositions.get(shape.id);
        if (initPos) {
          // Apply scaled positions based on zoom level
          shape.x = initPos.x + dx;
          shape.y = initPos.y + dy;
          
          // Call onDrag handler if available
          if (shape.onDrag) shape.onDrag(shape.x, shape.y);
        }
      });
      this.scene.changes.next();
    }
  }

  handleMouseUp(): void {
    // Завершуємо створення зв’язку
    if (this.creatingConnection) {
      const rawShapes = this.scene.getShapes();
      const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
      const connectables = [...rawShapes, ...planningEls];
      const endX = this.tempConnectionLine?.endX || 0;
      const endY = this.tempConnectionLine?.endY || 0;
      let dropHit = this.findConnectionPointAt(endX, endY, connectables);
      let targetShape = dropHit?.shape || null;
      if (!targetShape) {
        for (let i = connectables.length - 1; i >= 0; i--) {
          const el = connectables[i];
          if (
            el !== this.connectionStartShape &&
            el.contains(endX, endY)
          ) {
            targetShape = el;
            break;
          }
        }
      }
      if (targetShape && this.connectionStartShape) {
        // Create connection between source and target
        const connection = new Connection(
          this.connectionStartShape.id,
          targetShape.id
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

    // End planning element drag
    if (this.draggingElement && (this.draggingElement as any).onDragEnd) {
      (this.draggingElement as any).onDragEnd();
    }
    this.draggingElement = null;

    // Звичайна логіка для завершення перетягування фігур
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
    this.initialPositions.clear();
    this.scene.changes.next();
  }

  handleDoubleClick(sceneX: number, sceneY: number): void {
    const rawShapes = this.scene.getShapes();
    for (let i = rawShapes.length - 1; i >= 0; i--) {
      const shape = rawShapes[i];
      if (shape.contains(sceneX, sceneY) && shape.onDoubleClick) {
        shape.onDoubleClick();
        break;
      }
    }
  }

  handleRightClick(e: MouseEvent, sceneX: number, sceneY: number): void {
    e.preventDefault();
    const rawShapes = this.scene.getShapes();
    for (let i = rawShapes.length - 1; i >= 0; i--) {
      const shape = rawShapes[i];
      if (shape.contains(sceneX, sceneY) && shape.onRightClick) {
        shape.onRightClick();
        break;
      }
    }
  }

  // Public getter for connection creation state
  public get isCreatingConnection(): boolean {
    return this.creatingConnection;
  }
}
