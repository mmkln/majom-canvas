// managers/InteractionManager.ts
import { Scene } from '../scene/Scene.ts';
import { IShape, ConnectionPoint } from '../interfaces/shape.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { IConnection } from '../interfaces/connection.ts';
import { ICanvasElement, IPositioned } from '../interfaces/canvasElement.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import Connection from '../shapes/Connection.ts';
import { Task } from '../../elements/Task.ts';
import { Story } from '../../elements/Story.ts';
import { historyService } from '../services/HistoryService.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';

export class InteractionManager {
  private draggingElement: ICanvasElement & IPositioned | null = null;
  private draggingShape: IShape | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();
  private creatingConnection: boolean = false;
  private connectionStartShape: IConnectable | null = null;
  private connectionStartPoint: ConnectionPoint | null = null;
  private tempConnectionLine: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null = null;
  private hoveredConnectionPoint: ConnectionPoint | null = null;
  // Resize state
  private resizingElement: Story | null = null;
  private resizeDirection: 'nw'|'ne'|'se'|'sw'|null = null;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private initialWidth: number = 0;
  private initialHeight: number = 0;
  /** region-select state */
  private isRegionSelecting: boolean = false;
  private regionStartX: number = 0;
  private regionStartY: number = 0;
  private regionCurrentX: number = 0;
  private regionCurrentY: number = 0;

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

  /**
   * Return the active region-select rect (scene coords) or null
   */
  public getRegionRect(): { x: number; y: number; width: number; height: number } | null {
    if (!this.isRegionSelecting) return null;
    const x0 = Math.min(this.regionStartX, this.regionCurrentX);
    const y0 = Math.min(this.regionStartY, this.regionCurrentY);
    const width = Math.abs(this.regionCurrentX - this.regionStartX);
    const height = Math.abs(this.regionCurrentY - this.regionStartY);
    return { x: x0, y: y0, width, height };
  }

  private findConnectionPointAt(
    sceneX: number,
    sceneY: number,
    elements: IConnectable[]
  ): { shape: IConnectable; point: ConnectionPoint } | null {
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
    const connectables: IConnectable[] = [...rawShapes, ...planningEls];
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
        const curr = this.scene.getSelectedShapes();
        if (!(curr.length > 1 && curr.indexOf(clickedShape) !== -1)) {
          this.scene.setSelected([clickedShape]);
        }
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

    // Drag&drop for planning elements: tasks first, then stories, then others
    let clickedElement: ICanvasElement & IPositioned | null = null;
    // Task priority
    const taskEls = planningEls.filter((el): el is Task => el instanceof Task);
    for (let i = taskEls.length - 1; i >= 0; i--) {
      if (taskEls[i].contains(sceneX, sceneY)) { clickedElement = taskEls[i]; break; }
    }
    // Story next
    if (!clickedElement) {
      const storyEls = planningEls.filter((el): el is Story => el instanceof Story);
      for (let i = storyEls.length - 1; i >= 0; i--) {
        if (storyEls[i].contains(sceneX, sceneY)) { clickedElement = storyEls[i]; break; }
      }
    }
    // Other elements fallback
    if (!clickedElement) {
      for (let i = planningEls.length - 1; i >= 0; i--) {
        const el = planningEls[i] as any;
        if (!(el instanceof Task) && !(el instanceof Story) && el.contains(sceneX, sceneY)) {
          clickedElement = el;
          break;
        }
      }
    }
    if (clickedElement) {
      // start resize if clicking a Story handle
      if (clickedElement instanceof Story) {
        const dir = clickedElement.getResizeHandleDirectionAt(sceneX, sceneY, this.panZoom);
        if (dir) {
          this.resizingElement = clickedElement;
          this.resizeDirection = dir;
          this.resizeStartX = sceneX;
          this.resizeStartY = sceneY;
          this.initialX = clickedElement.x;
          this.initialY = clickedElement.y;
          this.initialWidth = clickedElement.width;
          this.initialHeight = clickedElement.height;
          this.scene.setSelected([clickedElement]);
          return true;
        }
      }
      const curr = this.scene.getSelectedElements();
      if (e.shiftKey) {
        if (curr.indexOf(clickedElement) === -1) {
          this.scene.setSelected([...curr, clickedElement]);
        }
      } else {
        if (!(curr.length > 1 && curr.indexOf(clickedElement) !== -1)) {
          this.scene.setSelected([clickedElement]);
        }
      }
      const sel = this.scene.getSelectedElements();
      this.initialPositions.clear();
      // Record initial positions for all selected items
      sel.forEach((elem) => {
        this.initialPositions.set(elem.id, { x: (elem as any).x, y: (elem as any).y });
      });
      // Record tasks of selected Stories to drag together
      sel.filter(el => el instanceof Story).forEach((story: Story) => {
        (story as any).tasks.forEach((task: any) => {
          this.initialPositions.set(task.id, { x: task.x, y: task.y });
        });
      });
      this.draggingElement = clickedElement;
      this.dragOffsetX = sceneX - (clickedElement as any).x;
      this.dragOffsetY = sceneY - (clickedElement as any).y;
      if ((clickedElement as any).onDragStart) (clickedElement as any).onDragStart();
      return true;
    }

    for (const element of connections) {
      if (element.isNearPoint(sceneX, sceneY, connectables)) {
        clickedConnection = element;
        if (e.shiftKey){
          const currentlySelected = this.scene.getSelectedElements();
          this.scene.setSelected([...currentlySelected, element]);
        } else {
        this.scene.setSelected([element]);}
        return true;
      }
    }

    // start region-select when clicking empty space
    if (!clickedShape && !clickedConnection && !planningEls.some(el => el.contains(sceneX, sceneY))) {
      this.isRegionSelecting = true;
      this.regionStartX = sceneX;
      this.regionStartY = sceneY;
      this.regionCurrentX = sceneX;
      this.regionCurrentY = sceneY;
      this.scene.setSelected([]);
      return true;
    }

    this.scene.setSelected([]);
    return false;
  }

  handleMouseMove(sceneX: number, sceneY: number): void {
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
    const connectables: IConnectable[] = [...rawShapes, ...planningEls];

    // Unified hover state for all connectables (shapes + planning elements)
    let newHovered: IConnectable | null = null;
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

    // Resize-handle hover detection
    const stories = planningEls.filter((el): el is Story => el instanceof Story);
    let handleFound = false;
    for (const story of stories) {
      if (story.selected) {
        const dir = story.getResizeHandleDirectionAt(sceneX, sceneY, this.panZoom);
        story.hoveredResizeHandle = dir;
        if (dir) { handleFound = true; break; }
      }
    }
    if (!this.resizingElement) {
      if (handleFound) {
        const hovered = stories.find(s => s.hoveredResizeHandle);
        if (hovered) this.canvas.style.cursor = `${hovered.hoveredResizeHandle}-resize`;
      } else {
        this.canvas.style.cursor = 'default';
      }
    }

    // update region-select drag
    if (this.isRegionSelecting) {
      this.regionCurrentX = sceneX;
      this.regionCurrentY = sceneY;
      this.scene.changes.next();
      return;
    }

    // Handle drag of planning elements
    if (this.draggingElement) {
      // Highlight Story containers when dragging a Task
      if (this.draggingElement instanceof Task) {
        const stories = this.scene.getElements()
          .filter(isPlanningElement)
          .filter((el): el is Story => el instanceof Story);
        stories.forEach(story => (story as any).isHovered = story.contains(sceneX, sceneY));
      }
      const init = this.initialPositions.get(this.draggingElement.id);
      if (init) {
        const dx = sceneX - (init.x + this.dragOffsetX);
        const dy = sceneY - (init.y + this.dragOffsetY);
        const selected = this.scene.getSelectedElements();
        // Solo Story drag: only if single selected
        if (this.draggingElement instanceof Story && selected.length === 1) {
          (this.draggingElement as any).onDrag(init.x + dx, init.y + dy);
        } else {
          // Multi-element drag: include Story children tasks
          const dragGroup = new Set<any>(selected);
          selected.filter(el => el instanceof Story).forEach((story: Story) => {
            (story as any).tasks.forEach((task: any) => dragGroup.add(task));
          });
          dragGroup.forEach((elem: any) => {
            const origin = this.initialPositions.get(elem.id);
            if (origin) {
              elem.x = origin.x + dx;
              elem.y = origin.y + dy;
              if (elem.onDrag) elem.onDrag(elem.x, elem.y);
            }
          });
        }
      }
      this.scene.changes.next();
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

    // handle resizing
    if (this.resizingElement && this.resizeDirection) {
      const dx = sceneX - this.resizeStartX;
      const dy = sceneY - this.resizeStartY;
      let newX = this.initialX;
      let newY = this.initialY;
      let newW = this.initialWidth;
      let newH = this.initialHeight;
      switch (this.resizeDirection) {
        case 'se': newW += dx; newH += dy; break;
        case 'ne': newW += dx; newH -= dy; newY += dy; break;
        case 'sw': newW -= dx; newH += dy; newX += dx; break;
        case 'nw': newW -= dx; newH -= dy; newX += dx; newY += dy; break;
      }
      // avoid negative size
      newW = Math.max(newW, 1);
      newH = Math.max(newH, 1);
      this.resizingElement.x = newX;
      this.resizingElement.y = newY;
      this.resizingElement.width = newW;
      this.resizingElement.height = newH;
      this.scene.changes.next();
      return;
    }
  }

  handleMouseUp(): void {
    // Завершуємо створення зв’язку
    if (this.creatingConnection) {
      const rawShapes = this.scene.getShapes();
      const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
      const connectables: IConnectable[] = [...rawShapes, ...planningEls];
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
        // Skip invalid Story↔Task connections
        const src = this.connectionStartShape;
        const dst = targetShape;
        const invalid = (src instanceof Story && dst instanceof Task && src.tasks.some(t => t.id === dst.id))
          || (src instanceof Task && dst instanceof Story && dst.tasks.some(t => t.id === src.id));
        if (!invalid) {
          const connection = new Connection(src.id, dst.id);
          this.scene.addElement(connection);
        }
      }
      // Скидаємо стан створення зв’язку
      this.creatingConnection = false;
      this.connectionStartShape = null;
      this.connectionStartPoint = null;
      this.tempConnectionLine = null;
      this.hoveredConnectionPoint = null;
      this.scene.changes.next();
    }

    // complete region-select
    if (this.isRegionSelecting) {
      const x0 = Math.min(this.regionStartX, this.regionCurrentX);
      const y0 = Math.min(this.regionStartY, this.regionCurrentY);
      const width = Math.abs(this.regionCurrentX - this.regionStartX);
      const height = Math.abs(this.regionCurrentY - this.regionStartY);
      const rawShapes = this.scene.getShapes();
      const planningEls = this.scene.getElements().filter(isPlanningElement) as IPlanningElement[];
      const all = [...rawShapes, ...planningEls];
      const inRect = all.filter(el => {
        const minX = 'radius' in el ? el.x - el.radius : el.x;
        const minY = 'radius' in el ? el.y - el.radius : el.y;
        const maxX = 'radius' in el ? el.x + el.radius : el.x + el.width;
        const maxY = 'radius' in el ? el.y + el.radius : el.y + el.height;
        return minX >= x0 && minY >= y0 && maxX <= x0 + width && maxY <= y0 + height;
      });
      this.scene.setSelected(inRect);
      this.isRegionSelecting = false;
      this.scene.changes.next();
      return;
    }

    // End planning element drag
    if (this.draggingElement) {
      // Handle Task drop into/out of Story containers
      if (this.draggingElement instanceof Task) {
        const task = this.draggingElement;
        const stories = this.scene.getElements()
          .filter(isPlanningElement)
          .filter((el): el is Story => el instanceof Story);
        stories.forEach(story => {
          if (story.contains(task.x, task.y)) story.addTask(task);
          else story.removeTask(task.id);
        });
      }
      if ((this.draggingElement as any).onDragEnd) (this.draggingElement as any).onDragEnd();
    }
    this.draggingElement = null;

    // Звичайна логіка для завершення перетягування фігур
    if (this.draggingShape && this.draggingShape.onDragEnd) {
      this.draggingShape.onDragEnd();
    }
    this.draggingShape = null;
    // Capture move for undo/redo if any drag occurred
    const initial = new Map(this.initialPositions);
    if (initial.size > 0) {
      const final = new Map<string, { x: number; y: number }>();
      initial.forEach((_, id) => {
        const el = this.scene.getElements().find(el => el.id === id) as any;
        if (el) final.set(id, { x: el.x, y: el.y });
      });
      historyService.execute(new MoveCommand(this.scene, initial, final));
    }
    this.initialPositions.clear();
    this.scene.changes.next();

    // finish resize
    if (this.resizingElement) {
      this.resizingElement = null;
      this.resizeDirection = null;
      this.canvas.style.cursor = 'default';
      this.scene.getElements()
        .filter(isPlanningElement)
        .filter((el): el is Story => el instanceof Story)
        .forEach(s => s.hoveredResizeHandle = null);
      this.scene.changes.next();
      return;
    }
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
    // Check planning elements (Tasks/Stories/Goals) in zIndex order (highest first)
    const planningEls = [...this.scene.getElements().filter(isPlanningElement) as any[]];
    planningEls.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
    for (const el of planningEls) {
      if (el.contains(sceneX, sceneY) && el.onDoubleClick) {
        el.onDoubleClick();
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

  /**
   * Indicates if a Task is currently being dragged.
   */
  public get isDraggingTask(): boolean {
    return this.draggingElement instanceof Task;
  }
}
