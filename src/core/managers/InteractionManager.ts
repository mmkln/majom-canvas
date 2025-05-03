// managers/InteractionManager.ts
import { Scene } from '../scene/Scene.ts';
import { IShape, ConnectionPoint } from '../interfaces/shape.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import { IConnection } from '../interfaces/connection.ts';
import { ICanvasElement, IPositioned } from '../interfaces/canvasElement.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { isShape } from '../utils/typeGuards.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import Connection from '../shapes/Connection.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { historyService } from '../services/HistoryService.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import { ResizeCommand } from '../commands/ResizeCommand.ts';
import { SelectionService } from '../services/SelectionService.ts';
import { ConnectionInteractionService } from '../services/ConnectionInteractionService.ts';
import type { IDraggable } from '../interfaces/draggable.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';

export class InteractionManager {
  private draggingItem: (ICanvasElement & IDraggable) | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  private initialPositions: Map<string, { x: number; y: number }> = new Map();
  private connectionService: ConnectionInteractionService;
  private hoveredConnectionPoint: ConnectionPoint | null = null;
  // Resize state
  private resizingElement: StoryElement | null = null;
  private resizeDirection: 'nw' | 'ne' | 'se' | 'sw' | null = null;
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
  private draggingGroup: ICanvasElement[] | null = null;
  private groupDragStartX: number = 0;
  private groupDragStartY: number = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private scene: Scene,
    private panZoom: PanZoomManager
  ) {
    this.connectionService = new ConnectionInteractionService(
      this.scene,
      this.panZoom
    );
  }

  // Отримуємо тимчасову лінію для відображення
  public getTempConnectionLine(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null {
    return this.connectionService.getTemporaryLine();
  }

  // Очищаємо стан створення зв’язку (наприклад, для скасування через Esc)
  public cancelConnectionCreation(): void {
    this.connectionService.cancel();
    this.scene.changes.next();
  }

  /**
   * Return the active region-select rect (scene coords) or null
   */
  public getRegionRect(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
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

  /**
   * Update scene selection based on clicked target and shiftKey; abstracts click selection logic.
   */
  private updateSelectionOnClick(
    target: ICanvasElement | null,
    shiftKey: boolean
  ): void {
    const current = this.scene.getSelectedElements();
    if (target) {
      if (shiftKey) {
        if (current.indexOf(target) === -1) {
          this.scene.setSelected([...current, target]);
        }
      } else {
        if (!(current.length > 1 && current.indexOf(target) !== -1)) {
          this.scene.setSelected([target]);
        }
      }
    } else {
      this.scene.setSelected([]);
    }
  }

  handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    if (e.button !== 0) return false;
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene
      .getElements()
      .filter(isPlanningElement) as IPlanningElement[];
    let clickedItem: (ICanvasElement & IDraggable) | null = null;

    // Resize handle detection on Story (independent of bounding box)
    const storyEls = planningEls.filter(
      (el): el is StoryElement => el instanceof StoryElement
    );
    for (let i = storyEls.length - 1; i >= 0; i--) {
      const el = storyEls[i];
      const dir = el.getResizeHandleDirectionAt(sceneX, sceneY, this.panZoom);
      if (dir) {
        this.resizingElement = el;
        this.resizeDirection = dir;
        this.resizeStartX = sceneX;
        this.resizeStartY = sceneY;
        this.initialX = el.x;
        this.initialY = el.y;
        this.initialWidth = el.width;
        this.initialHeight = el.height;
        this.updateSelectionOnClick(el, e.shiftKey);
        return true;
      }
    }

    // Task → Story → Other planning → Shape click order
    // Task priority
    const taskEls = planningEls.filter(
      (el): el is TaskElement => el instanceof TaskElement
    );
    for (let i = taskEls.length - 1; i >= 0; i--) {
      if (taskEls[i].contains(sceneX, sceneY)) {
        clickedItem = taskEls[i];
        break;
      }
    }
    // Story next
    if (!clickedItem) {
      const storyEls = planningEls.filter(
        (el): el is StoryElement => el instanceof StoryElement
      );
      for (let i = storyEls.length - 1; i >= 0; i--) {
        if (storyEls[i].contains(sceneX, sceneY)) {
          clickedItem = storyEls[i];
          break;
        }
      }
    }
    // Other planning elements
    if (!clickedItem) {
      for (let i = planningEls.length - 1; i >= 0; i--) {
        const pl = planningEls[i] as any as ICanvasElement & IDraggable;
        if (
          !(pl instanceof TaskElement) &&
          !(pl instanceof StoryElement) &&
          pl.contains(sceneX, sceneY)
        ) {
          clickedItem = pl;
          break;
        }
      }
    }
    // Shape fallback
    if (!clickedItem) {
      for (let i = rawShapes.length - 1; i >= 0; i--) {
        const shape = rawShapes[i] as any as ICanvasElement & IDraggable;
        if (shape.contains(sceneX, sceneY)) {
          clickedItem = shape;
          break;
        }
      }
    }

    // service-based connection selection
    const existingConn = this.connectionService.hitTest(sceneX, sceneY);
    if (existingConn) {
      this.updateSelectionOnClick(existingConn, e.shiftKey);
      return true;
    }
    // service-based connection creation start
    if (this.connectionService.start(sceneX, sceneY)) {
      return true;
    }
    if (clickedItem) {
      this.updateSelectionOnClick(clickedItem, e.shiftKey);
      const selected = this.scene.getSelectedElements();
      const dragGroup = SelectionService.getDragGroup(selected);
      this.initialPositions.clear();
      dragGroup.forEach((elem) =>
        this.initialPositions.set(elem.id, {
          x: (elem as any).x,
          y: (elem as any).y,
        })
      );
      this.draggingItem = clickedItem;
      this.dragOffsetX = sceneX - (clickedItem as any).x;
      this.dragOffsetY = sceneY - (clickedItem as any).y;
      if (clickedItem.onDragStart) clickedItem.onDragStart();
      return true;
    }
    // start group drag when clicking inside bounding box of multi-selected elements
    const selected = this.scene.getSelectedElements();
    if (selected.length > 1) {
      const pts: { x: number; y: number }[] = [];
      selected.forEach((el) => {
        const e = el as any;
        if (e.width !== undefined && e.height !== undefined) {
          pts.push({ x: e.x, y: e.y }, { x: e.x + e.width, y: e.y + e.height });
        } else if (e.radius !== undefined) {
          pts.push(
            { x: e.x - e.radius, y: e.y - e.radius },
            { x: e.x + e.radius, y: e.y + e.radius }
          );
        } else {
          pts.push({ x: e.x, y: e.y });
        }
      });
      const { minX, minY, maxX, maxY } = getBoundingBox(pts);
      if (
        sceneX >= minX &&
        sceneX <= maxX &&
        sceneY >= minY &&
        sceneY <= maxY
      ) {
        this.draggingGroup = SelectionService.getDragGroup(selected);
        this.initialPositions.clear();
        this.draggingGroup.forEach((el) =>
          this.initialPositions.set(el.id, {
            x: (el as any).x,
            y: (el as any).y,
          })
        );
        this.groupDragStartX = sceneX;
        this.groupDragStartY = sceneY;
        return true;
      }
    }
    // start region-select when clicking empty space
    if (
      !rawShapes.some((el) => el.contains(sceneX, sceneY)) &&
      !planningEls.some((el) => el.contains(sceneX, sceneY))
    ) {
      this.isRegionSelecting = true;
      this.regionStartX = sceneX;
      this.regionStartY = sceneY;
      this.regionCurrentX = sceneX;
      this.regionCurrentY = sceneY;
      this.updateSelectionOnClick(null, false);
      return true;
    }
    this.updateSelectionOnClick(null, false);
    return false;
  }

  handleMouseMove(sceneX: number, sceneY: number): void {
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene
      .getElements()
      .filter(isPlanningElement) as IPlanningElement[];
    // reorder planning elements so tasks are prioritized during connection creation
    let connectables: IConnectable[];
    if (this.connectionService.isCreating()) {
      const tasks = planningEls.filter(
        (el) => el instanceof TaskElement
      ) as TaskElement[];
      const others = planningEls.filter((el) => !(el instanceof TaskElement));
      connectables = [...rawShapes, ...others, ...tasks];
    } else {
      connectables = [...rawShapes, ...planningEls];
    }

    // Unified hover state for all connectables (shapes + planning elements)
    let newHovered: IConnectable | null = null;
    connectables.forEach((el) => ((el as any).isHovered = false));
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

    // connection creation update via service
    if (this.connectionService.isCreating()) {
      this.connectionService.update(sceneX, sceneY);
      return;
    }

    // Resize-handle hover detection
    const stories = planningEls.filter(
      (el): el is StoryElement => el instanceof StoryElement
    );
    let handleFound = false;
    for (const story of stories) {
      if (story.selected) {
        const dir = story.getResizeHandleDirectionAt(
          sceneX,
          sceneY,
          this.panZoom
        );
        story.hoveredResizeHandle = dir;
        if (dir) {
          handleFound = true;
          break;
        }
      }
    }
    if (!this.resizingElement) {
      if (handleFound) {
        const hovered = stories.find((s) => s.hoveredResizeHandle);
        if (hovered)
          this.canvas.style.cursor = `${hovered.hoveredResizeHandle}-resize`;
      } else {
        this.canvas.style.cursor = 'default';
      }
    }

    // update group drag
    if (this.draggingGroup) {
      const dx = sceneX - this.groupDragStartX;
      const dy = sceneY - this.groupDragStartY;
      this.draggingGroup.forEach((el) => {
        const init = this.initialPositions.get(el.id);
        if (init) {
          const e = el as any;
          e.x = init.x + dx;
          e.y = init.y + dy;
        }
      });
      this.scene.changes.next();
      return;
    }

    // update region-select drag
    if (this.isRegionSelecting) {
      this.regionCurrentX = sceneX;
      this.regionCurrentY = sceneY;
      // compute current region rectangle
      const x0 = Math.min(this.regionStartX, this.regionCurrentX);
      const y0 = Math.min(this.regionStartY, this.regionCurrentY);
      const width = Math.abs(this.regionCurrentX - this.regionStartX);
      const height = Math.abs(this.regionCurrentY - this.regionStartY);
      // gather all elements
      const rawShapes = this.scene.getShapes();
      const planningEls = this.scene
        .getElements()
        .filter(isPlanningElement) as IPlanningElement[];
      const all = [...rawShapes, ...planningEls] as (
        | IShape
        | IPlanningElement
      )[];
      // select intersecting elements
      const inRect = all.filter((el) => {
        let minX: number, minY: number, maxX: number, maxY: number;
        if (isShape(el)) {
          minX = el.x - el.radius;
          minY = el.y - el.radius;
          maxX = el.x + el.radius;
          maxY = el.y + el.radius;
        } else {
          minX = el.x;
          minY = el.y;
          maxX = el.x + el.width;
          maxY = el.y + el.height;
        }
        return (
          maxX >= x0 && minX <= x0 + width && maxY >= y0 && minY <= y0 + height
        );
      });
      this.scene.setSelected(inRect);
      this.scene.changes.next();
      return;
    }

    // Handle drag of any draggable item
    if (this.draggingItem) {
      const init = this.initialPositions.get(this.draggingItem.id);
      if (init) {
        const dx = sceneX - (init.x + this.dragOffsetX);
        const dy = sceneY - (init.y + this.dragOffsetY);
        const selected = this.scene.getSelectedElements();
        const dragGroup = SelectionService.getDragGroup(selected);
        dragGroup.forEach((elem) => {
          const origin = this.initialPositions.get(elem.id);
          if (origin) {
            const newX = origin.x + dx;
            const newY = origin.y + dy;
            (elem as any).x = newX;
            (elem as any).y = newY;
            if ((elem as any).onDrag) (elem as any).onDrag(newX, newY);
          }
        });
        this.scene.changes.next();
      }
      return;
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
        case 'se':
          newW += dx;
          newH += dy;
          break;
        case 'ne':
          newW += dx;
          newH -= dy;
          newY += dy;
          break;
        case 'sw':
          newW -= dx;
          newH += dy;
          newX += dx;
          break;
        case 'nw':
          newW -= dx;
          newH -= dy;
          newX += dx;
          newY += dy;
          break;
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
    // finish connection via service
    if (this.connectionService.isCreating()) {
      this.connectionService.finish();
      return;
    }

    // complete region-select
    if (this.isRegionSelecting) {
      const x0 = Math.min(this.regionStartX, this.regionCurrentX);
      const y0 = Math.min(this.regionStartY, this.regionCurrentY);
      const width = Math.abs(this.regionCurrentX - this.regionStartX);
      const height = Math.abs(this.regionCurrentY - this.regionStartY);
      const rawShapes = this.scene.getShapes();
      const planningEls = this.scene
        .getElements()
        .filter(isPlanningElement) as IPlanningElement[];
      const all = [...rawShapes, ...planningEls] as (
        | IShape
        | IPlanningElement
      )[];
      const inRect = all.filter((el) => {
        let minX: number, minY: number, maxX: number, maxY: number;
        if (isShape(el)) {
          minX = el.x - el.radius;
          minY = el.y - el.radius;
          maxX = el.x + el.radius;
          maxY = el.y + el.radius;
        } else {
          minX = el.x;
          minY = el.y;
          maxX = el.x + el.width;
          maxY = el.y + el.height;
        }
        return (
          maxX >= x0 && minX <= x0 + width && maxY >= y0 && minY <= y0 + height
        );
      });
      this.scene.setSelected(inRect);
      this.isRegionSelecting = false;
      this.scene.changes.next();
      return;
    }

    // finalize group drag
    if (this.draggingGroup) {
      const initial = new Map(this.initialPositions);
      const finalPos = new Map<string, { x: number; y: number }>();
      this.draggingGroup.forEach((el) => {
        const e = el as any;
        finalPos.set(el.id, { x: e.x, y: e.y });
      });
      historyService.execute(new MoveCommand(this.scene, initial, finalPos));
      this.initialPositions.clear();
      this.draggingGroup = null;
      this.scene.changes.next();
      return;
    }

    // finalize drag and record history
    if (this.draggingItem) {
      // Handle Task drop into/out of Story containers
      if (this.draggingItem instanceof TaskElement) {
        const selectedEls = this.scene.getSelectedElements();
        const tasks = selectedEls.filter(
          (el) => el instanceof TaskElement
        ) as TaskElement[];
        const stories = this.scene
          .getElements()
          .filter(isPlanningElement)
          .filter((el): el is StoryElement => el instanceof StoryElement);
        stories.forEach((story) => {
          tasks.forEach((task) => {
            if (story.contains(task.x, task.y)) story.addTask(task);
            else story.removeTask(task.id);
          });
        });
      }
      if (this.draggingItem.onDragEnd) this.draggingItem.onDragEnd();
      const initial = new Map(this.initialPositions);
      if (initial.size > 0) {
        const finalPositions = new Map<string, { x: number; y: number }>();
        initial.forEach((_, id) => {
          const el = this.scene.getElements().find((el) => el.id === id) as any;
          if (el) finalPositions.set(id, { x: el.x, y: el.y });
        });
        historyService.execute(
          new MoveCommand(this.scene, initial, finalPositions)
        );
      }
      this.initialPositions.clear();
      this.draggingItem = null;
      this.scene.changes.next();
    }
    // finish resize
    if (this.resizingElement) {
      // record resize in history
      const el = this.resizingElement;
      const initial = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      initial.set(el.id, {
        x: this.initialX,
        y: this.initialY,
        width: this.initialWidth,
        height: this.initialHeight,
      });
      const finalMap = new Map<
        string,
        { x: number; y: number; width: number; height: number }
      >();
      finalMap.set(el.id, {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      });
      historyService.execute(new ResizeCommand(this.scene, initial, finalMap));
      // clear resizing state
      this.resizingElement = null;
      this.resizeDirection = null;
      this.canvas.style.cursor = 'default';
      this.scene
        .getElements()
        .filter(isPlanningElement)
        .filter((el): el is StoryElement => el instanceof StoryElement)
        .forEach((s) => (s.hoveredResizeHandle = null));
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
    const planningEls = [
      ...(this.scene.getElements().filter(isPlanningElement) as any[]),
    ];
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
    return this.connectionService.isCreating();
  }

  /**
   * Indicates if a Task is currently being dragged.
   */
  public get isDraggingTask(): boolean {
    return this.draggingItem instanceof TaskElement;
  }
}
