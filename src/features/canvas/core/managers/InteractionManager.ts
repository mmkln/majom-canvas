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
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import {
  StoryDragPreviewService,
  type StoryDropPlan,
  type StoryResizePreview,
  type TaskDropPlaceholder,
  type TaskReflowPreview,
} from '../services/StoryDragPreviewService.ts';
import {
  elementPlacementPolicy,
  type DragPlacementDiagnostics,
  type RectPlacementDiagnostics,
} from '../services/ElementPlacementPolicy.ts';
import type { IDraggable } from '../interfaces/draggable.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';
import { emitTaskStoryLinkSet } from '../canvasLinkLifecycle.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';

type PlacementPreviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DragPlacementPreview = {
  kind: 'drag';
  valid: boolean;
  elementIds: string[];
  currentPositions: Map<string, { x: number; y: number }>;
  suggestedPositions: Map<string, { x: number; y: number }>;
  blockerIds: string[];
};

export type ResizePlacementPreview = {
  kind: 'resize';
  valid: boolean;
  elementId: string;
  currentRect: PlacementPreviewRect;
  suggestedRect: PlacementPreviewRect;
  blockerIds: string[];
};

export type PlacementPreview =
  | DragPlacementPreview
  | ResizePlacementPreview;

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
  private pendingDragItem: (ICanvasElement & IDraggable) | null = null;
  private pendingDragGroup: ICanvasElement[] | null = null;
  private pendingDragStartX: number = 0;
  private pendingDragStartY: number = 0;
  private pendingDragOffsetX: number = 0;
  private pendingDragOffsetY: number = 0;
  private pendingDragClickTarget: ICanvasElement | null = null;
  private rightClickTarget: ICanvasElement | null = null;
  private rightClickSceneX: number = 0;
  private rightClickSceneY: number = 0;
  private readonly dragStartThresholdPx: number = 4;
  private resizeInitialTaskPositions: Map<string, { x: number; y: number }> =
    new Map();
  private readonly storyLayoutService = new StoryLayoutService();
  private readonly placementPolicy = elementPlacementPolicy;
  private readonly storyDragPreviewService = new StoryDragPreviewService(
    this.storyLayoutService
  );
  private taskDropPlaceholders: TaskDropPlaceholder[] = [];
  private storyDropPlans: Map<string, StoryDropPlan> = new Map();
  private storyResizePreviews: StoryResizePreview[] = [];
  private taskReflowPreviews: Map<string, TaskReflowPreview> = new Map();
  private placementPreview: PlacementPreview | null = null;

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

  private notifyInteractionStart(kind: 'drag' | 'resize' | 'select'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('canvasInteractionStart', { detail: { kind } })
    );
  }

  private notifyInteractionEnd(kind: 'drag' | 'resize' | 'select'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('canvasInteractionEnd', { detail: { kind } })
    );
  }

  private updateTaskStoryAssignments(tasks: TaskElement[]): void {
    if (tasks.length === 0) return;
    const stories = this.scene
      .getElements()
      .filter(isPlanningElement)
      .filter((el): el is StoryElement => el instanceof StoryElement);
    const prevStoryMap = this.getTaskStoryMap(stories);
    stories.forEach((story) => {
      tasks.forEach((task) => {
        const anchor = this.getTaskAnchor(task);
        if (story.contains(anchor.x, anchor.y)) story.addTask(task);
        else story.removeTask(task.id);
      });
    });
    const nextStoryMap = this.getTaskStoryMap(stories);
    if (typeof window === 'undefined') return;
    tasks.forEach((task) => {
      const prevStoryId = prevStoryMap.get(task.id) ?? null;
      const nextStoryId = nextStoryMap.get(task.id) ?? null;
      if (prevStoryId === nextStoryId) return;
      const nextStory = nextStoryId
        ? (stories.find((story) => story.id === nextStoryId) ?? null)
        : null;
      emitTaskStoryLinkSet(task, nextStory);
    });
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
    if (target) {
      if (shiftKey) {
        this.scene.toggleSelected([target]);
      } else {
        this.scene.setSelected([target]);
      }
    } else {
      this.scene.setSelected([]);
    }
  }

  private shouldStartDrag(sceneX: number, sceneY: number): boolean {
    const dx = sceneX - this.pendingDragStartX;
    const dy = sceneY - this.pendingDragStartY;
    const threshold = this.dragStartThresholdPx / this.panZoom.scale;
    return dx * dx + dy * dy >= threshold * threshold;
  }

  private clearPendingDrag(): void {
    this.pendingDragItem = null;
    this.pendingDragGroup = null;
    this.pendingDragClickTarget = null;
  }

  handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    this.clearTaskDropPreviewState();
    this.clearPlacementPreview();
    if (e.button === 2) {
      this.rightClickTarget = this.findTopElementAt(sceneX, sceneY);
      this.rightClickSceneX = sceneX;
      this.rightClickSceneY = sceneY;
      return false;
    }
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
        this.captureResizeTaskPositions(el);
        this.updateSelectionOnClick(el, e.shiftKey);
        this.notifyInteractionStart('resize');
        return true;
      }
    }

    clickedItem = this.findTopElementAt(sceneX, sceneY) as
      | (ICanvasElement & IDraggable)
      | null;

    // Check for connection point first to prioritize connection creation
    const connectables = [...this.scene.getShapes(), ...planningEls] as IConnectable[];
    const connectionPointHit = this.findConnectionPointAt(sceneX, sceneY, connectables);
    
    if (connectionPointHit) {
      // If clicking on a connection point, prioritize connection creation over existing connection selection
      if (this.connectionService.start(sceneX, sceneY)) {
        return true;
      }
    }

    // service-based connection selection (only if not on a connection point)
    const existingConn = this.connectionService.hitTest(sceneX, sceneY);
    if (existingConn) {
      this.updateSelectionOnClick(existingConn, e.shiftKey);
      return true;
    }
    
    // service-based connection creation start (fallback)
    if (this.connectionService.start(sceneX, sceneY)) {
      return true;
    }
    if (clickedItem) {
      const selectedBeforeClick = this.scene.getSelectedElements();
      const clickedAlreadySelected = selectedBeforeClick.some(
        (el) => el.id === clickedItem.id
      );
      const shouldDragSelectionGroup =
        clickedAlreadySelected &&
        selectedBeforeClick.length > 1 &&
        !e.shiftKey;

      if (shouldDragSelectionGroup) {
        this.pendingDragGroup = SelectionService.getDragGroup(
          selectedBeforeClick
        );
        this.pendingDragStartX = sceneX;
        this.pendingDragStartY = sceneY;
        this.pendingDragClickTarget = clickedItem;
        return true;
      }

      if (isPlanningElement(clickedItem)) {
        console.log('Canvas element clicked', { id: (clickedItem as any).id });
      }
      this.updateSelectionOnClick(clickedItem, e.shiftKey);
      this.pendingDragItem = clickedItem;
      this.pendingDragStartX = sceneX;
      this.pendingDragStartY = sceneY;
      this.pendingDragOffsetX = sceneX - (clickedItem as any).x;
      this.pendingDragOffsetY = sceneY - (clickedItem as any).y;
      this.pendingDragClickTarget = clickedItem;
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
        this.pendingDragGroup = SelectionService.getDragGroup(selected);
        this.pendingDragStartX = sceneX;
        this.pendingDragStartY = sceneY;
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
      this.notifyInteractionStart('select');
      return true;
    }
    this.updateSelectionOnClick(null, false);
    return false;
  }

  handleMouseMove(sceneX: number, sceneY: number): void {
    if (!this.draggingItem && !this.draggingGroup) {
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
    }
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
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
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

    // arm drag only after threshold (prevents micro-moves on click)
    if ((this.pendingDragItem || this.pendingDragGroup) && this.shouldStartDrag(sceneX, sceneY)) {
      if (this.pendingDragGroup) {
        this.draggingGroup = this.pendingDragGroup;
        this.initialPositions.clear();
        this.draggingGroup.forEach((el) =>
          this.initialPositions.set(el.id, {
            x: (el as any).x,
            y: (el as any).y,
          })
        );
        this.groupDragStartX = this.pendingDragStartX;
        this.groupDragStartY = this.pendingDragStartY;
        this.clearPendingDrag();
        this.notifyInteractionStart('drag');
      } else if (this.pendingDragItem) {
        this.draggingItem = this.pendingDragItem;
        this.dragOffsetX = this.pendingDragOffsetX;
        this.dragOffsetY = this.pendingDragOffsetY;
        const selected = this.scene.getSelectedElements();
        const dragGroup = SelectionService.getDragGroup(selected);
        this.initialPositions.clear();
        dragGroup.forEach((elem) =>
          this.initialPositions.set(elem.id, {
            x: (elem as any).x,
            y: (elem as any).y,
          })
        );
        if (this.draggingItem.onDragStart) this.draggingItem.onDragStart();
        this.clearPendingDrag();
        this.notifyInteractionStart('drag');
      }
    }

    // update group drag
    if (this.draggingGroup) {
      const dx = sceneX - this.groupDragStartX;
      const dy = sceneY - this.groupDragStartY;
      const diagnostics = this.evaluateDragPlacement(
        this.draggingGroup,
        dx,
        dy,
        'preview'
      );
      this.applyDragDelta(this.draggingGroup, dx, dy, false);
      this.updateDragPlacementPreview(
        this.draggingGroup,
        { dx, dy },
        diagnostics
      );
      this.updateTaskDropPlaceholders(sceneX, sceneY);
      this.scene.changes.next();
      return;
    }

    // update region-select drag
    if (this.isRegionSelecting) {
      this.clearTaskDropPreviewState();
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
        const diagnostics = this.evaluateDragPlacement(
          dragGroup,
          dx,
          dy,
          'preview'
        );
        this.applyDragDelta(dragGroup, dx, dy, true);
        this.updateDragPlacementPreview(dragGroup, { dx, dy }, diagnostics);
        this.updateTaskDropPlaceholders(sceneX, sceneY);
        this.scene.changes.next();
      }
      return;
    }

    // handle resizing
    if (this.resizingElement && this.resizeDirection) {
      this.clearTaskDropPreviewState();
      const dx = sceneX - this.resizeStartX;
      const dy = sceneY - this.resizeStartY;
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
          break;
        case 'sw':
          newW -= dx;
          newH += dy;
          break;
        case 'nw':
          newW -= dx;
          newH -= dy;
          break;
      }
      // avoid negative size
      newW = Math.max(newW, 1);
      newH = Math.max(newH, 1);
      const story = this.resizingElement;
      const tasks = this.scene
        .getElements()
        .filter((el) => el instanceof TaskElement) as TaskElement[];
      const plan = this.storyLayoutService.planResize(
        story,
        tasks,
        newW,
        newH
      );
      const targetRect = this.getResizeAnchoredRect(
        plan.nextWidth,
        plan.nextHeight
      );
      const movingIds = new Set<string>([
        story.id,
        ...story.tasks.map((task) => task.id),
      ]);
      const diagnostics = this.placementPolicy.evaluateRectPlacement({
        element: story,
        startRect: {
          x: this.initialX,
          y: this.initialY,
          width: this.initialWidth,
          height: this.initialHeight,
        },
        targetRect,
        sceneElements: this.scene.getElements(),
        movingIds,
      });
      const displayRect = diagnostics.valid
        ? targetRect
        : this.lerpRect(targetRect, diagnostics.suggestedRect, 0.28);
      const displayPlan = this.storyLayoutService.planResize(
        story,
        tasks,
        displayRect.width,
        displayRect.height
      );
      const currentRect = this.getResizeAnchoredRect(
        displayPlan.nextWidth,
        displayPlan.nextHeight
      );
      const shiftX = currentRect.x - story.x;
      const shiftY = currentRect.y - story.y;
      story.x = currentRect.x;
      story.y = currentRect.y;
      story.width = displayPlan.nextWidth;
      story.height = displayPlan.nextHeight;
      if (displayPlan.positions.size > 0) {
        const taskById = new Map(tasks.map((task) => [task.id, task]));
        displayPlan.positions.forEach((pos, id) => {
          const task = taskById.get(id);
          if (!task) return;
          task.x = pos.x + shiftX;
          task.y = pos.y + shiftY;
        });
        story.tasks = displayPlan.orderedTasks;
      }
      this.updateResizePlacementPreview(story.id, currentRect, diagnostics);
      this.scene.changes.next();
      return;
    }
  }

  handleMouseUp(): void {
    // finish connection via service
    if (this.connectionService.isCreating()) {
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
      this.connectionService.finish();
      return;
    }

    if (
      (this.pendingDragItem || this.pendingDragGroup) &&
      !this.draggingItem &&
      !this.draggingGroup
    ) {
      if (this.pendingDragGroup && this.pendingDragClickTarget) {
        this.scene.setSelected([this.pendingDragClickTarget]);
      }
      this.clearPendingDrag();
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
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
      this.notifyInteractionEnd('select');
      return;
    }

    // finalize group drag
    if (this.draggingGroup) {
      const initial = new Map(this.initialPositions);
      this.applyHardDropForDragGroup(this.draggingGroup, false);
      const selectedEls = this.scene.getSelectedElements();
      const tasks = selectedEls.filter(
        (el): el is TaskElement => el instanceof TaskElement
      );
      const stories = this.scene
        .getElements()
        .filter(isPlanningElement)
        .filter((el): el is StoryElement => el instanceof StoryElement);
      const prevStoryMap = this.getTaskStoryMap(stories);
      this.updateTaskStoryAssignments(tasks);
      const affectedStories = this.getAffectedStoriesForTasks(
        tasks,
        stories,
        prevStoryMap
      );
      const dragIds = new Set(initial.keys());
      const alignChanges = this.applyAutoLayoutToStories(
        affectedStories,
        dragIds,
        this.storyDropPlans
      );
      const finalPos = new Map<string, { x: number; y: number }>();
      this.draggingGroup.forEach((el) => {
        const e = el as any;
        finalPos.set(el.id, { x: e.x, y: e.y });
      });
      historyService.execute(new MoveCommand(this.scene, initial, finalPos));
      if (alignChanges.movedInitial.size > 0) {
        historyService.execute(
          new MoveCommand(
            this.scene,
            alignChanges.movedInitial,
            alignChanges.movedFinal
          )
        );
      }
      if (alignChanges.resizedInitial.size > 0) {
        historyService.execute(
          new ResizeCommand(
            this.scene,
            alignChanges.resizedInitial,
            alignChanges.resizedFinal
          )
        );
      }
      this.initialPositions.clear();
      this.draggingGroup = null;
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
      this.scene.changes.next();
      this.notifyInteractionEnd('drag');
      return;
    }

    // finalize drag and record history
    if (this.draggingItem) {
      const selected = this.scene.getSelectedElements();
      const dragGroup = SelectionService.getDragGroup(selected);
      this.applyHardDropForDragGroup(dragGroup, true);
      // Handle Task drop into/out of Story containers
      let alignChanges = {
        movedInitial: new Map<string, { x: number; y: number }>(),
        movedFinal: new Map<string, { x: number; y: number }>(),
        resizedInitial: new Map<
          string,
          { x: number; y: number; width: number; height: number }
        >(),
        resizedFinal: new Map<
          string,
          { x: number; y: number; width: number; height: number }
        >(),
      };
      if (this.draggingItem instanceof TaskElement) {
        const selectedEls = this.scene.getSelectedElements();
        const tasks = selectedEls.filter(
          (el) => el instanceof TaskElement
        ) as TaskElement[];
        const stories = this.scene
          .getElements()
          .filter(isPlanningElement)
          .filter((el): el is StoryElement => el instanceof StoryElement);
        const prevStoryMap = this.getTaskStoryMap(stories);
        this.updateTaskStoryAssignments(tasks);
        const affectedStories = this.getAffectedStoriesForTasks(
          tasks,
          stories,
          prevStoryMap
        );
        const dragIds = new Set(this.initialPositions.keys());
        alignChanges = this.applyAutoLayoutToStories(
          affectedStories,
          dragIds,
          this.storyDropPlans
        );
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
      if (alignChanges.movedInitial.size > 0) {
        historyService.execute(
          new MoveCommand(
            this.scene,
            alignChanges.movedInitial,
            alignChanges.movedFinal
          )
        );
      }
      if (alignChanges.resizedInitial.size > 0) {
        historyService.execute(
          new ResizeCommand(
            this.scene,
            alignChanges.resizedInitial,
            alignChanges.resizedFinal
          )
        );
      }
      this.initialPositions.clear();
      this.draggingItem = null;
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
      this.scene.changes.next();
      this.notifyInteractionEnd('drag');
    }
    // finish resize
    if (this.resizingElement) {
      // record resize in history
      const el = this.resizingElement;
      this.applyHardDropForResize(el);
      const movedTasks = this.getResizeMovedTasks();
      if (movedTasks.initial.size > 0) {
        historyService.execute(
          new MoveCommand(this.scene, movedTasks.initial, movedTasks.final)
        );
      }
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
      if (
        this.hasResizeChange({
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        })
      ) {
        historyService.execute(new ResizeCommand(this.scene, initial, finalMap));
      }
      // clear resizing state
      this.resizingElement = null;
      this.resizeDirection = null;
      this.resizeInitialTaskPositions.clear();
      this.canvas.style.cursor = 'default';
      this.scene
        .getElements()
        .filter(isPlanningElement)
        .filter((el): el is StoryElement => el instanceof StoryElement)
        .forEach((s) => (s.hoveredResizeHandle = null));
      this.clearTaskDropPreviewState();
      this.clearPlacementPreview();
      this.scene.changes.next();
      this.notifyInteractionEnd('resize');
      return;
    }
    this.clearTaskDropPreviewState();
    this.clearPlacementPreview();
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
    const target =
      this.rightClickTarget ?? this.findTopElementAt(sceneX, sceneY);
    window.dispatchEvent(
      new CustomEvent('contextMenuRequested', {
        detail: { element: target ?? null, sceneX, sceneY },
      })
    );
    this.rightClickTarget = null;
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

  public get isDraggingElements(): boolean {
    return this.draggingItem !== null || this.draggingGroup !== null;
  }

  public getDraggedElementIds(): ReadonlySet<string> {
    return new Set(this.initialPositions.keys());
  }

  public getTaskDropPlaceholders(): TaskDropPlaceholder[] {
    return this.taskDropPlaceholders;
  }

  public getStoryResizePreviews(): StoryResizePreview[] {
    return this.storyResizePreviews;
  }

  public getTaskReflowPreviews(): Map<string, TaskReflowPreview> {
    return this.taskReflowPreviews;
  }

  public getPlacementPreview(): PlacementPreview | null {
    return this.placementPreview;
  }

  public get isResizingStory(): boolean {
    return this.resizingElement !== null;
  }

  private clearTaskDropPreviewState(): void {
    this.taskDropPlaceholders = [];
    this.storyDropPlans.clear();
    this.storyResizePreviews = [];
    this.taskReflowPreviews.clear();
  }

  private clearPlacementPreview(): void {
    this.placementPreview = null;
  }

  private updateTaskDropPlaceholders(sceneX: number, sceneY: number): void {
    if (this.initialPositions.size === 0) {
      this.clearTaskDropPreviewState();
      return;
    }
    const sceneElements = this.scene.getElements();
    const draggedElementIds = Array.from(this.initialPositions.keys());
    const hasDraggedStory = draggedElementIds.some((id) => {
      const element = sceneElements.find((candidate) => candidate.id === id);
      return element instanceof StoryElement;
    });
    if (hasDraggedStory) {
      this.clearTaskDropPreviewState();
      return;
    }
    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const draggedTasks = tasks.filter((task) => this.initialPositions.has(task.id));
    if (draggedTasks.length === 0) {
      this.clearTaskDropPreviewState();
      return;
    }
    const stories = sceneElements
      .filter(isPlanningElement)
      .filter((element): element is StoryElement => element instanceof StoryElement);
    if (stories.length === 0) {
      this.clearTaskDropPreviewState();
      return;
    }
    const preview = this.storyDragPreviewService.compute({
      stories,
      tasks,
      draggedTaskIds: new Set(draggedTasks.map((task) => task.id)),
      initialPositions: this.initialPositions,
      pointer: { x: sceneX, y: sceneY },
    });
    this.taskDropPlaceholders = preview.taskDropPlaceholders;
    this.storyDropPlans = preview.storyDropPlans;
    this.storyResizePreviews = preview.storyResizePreviews;
    this.taskReflowPreviews = preview.taskReflowPreviews;
  }

  private findTopElementAt(
    sceneX: number,
    sceneY: number
  ): ICanvasElement | null {
    const rawShapes = this.scene.getShapes();
    const planningEls = this.scene
      .getElements()
      .filter(isPlanningElement) as IPlanningElement[];
    // Task → Story → Other planning → Shape
    const taskEls = planningEls.filter(
      (el): el is TaskElement => el instanceof TaskElement
    );
    for (let i = taskEls.length - 1; i >= 0; i--) {
      if (taskEls[i].contains(sceneX, sceneY)) return taskEls[i];
    }
    const storyEls = planningEls.filter(
      (el): el is StoryElement => el instanceof StoryElement
    );
    for (let i = storyEls.length - 1; i >= 0; i--) {
      if (storyEls[i].contains(sceneX, sceneY)) return storyEls[i];
    }
    for (let i = planningEls.length - 1; i >= 0; i--) {
      const pl = planningEls[i];
      if (
        !(pl instanceof TaskElement) &&
        !(pl instanceof StoryElement) &&
        pl.contains(sceneX, sceneY)
      ) {
        return pl;
      }
    }
    for (let i = rawShapes.length - 1; i >= 0; i--) {
      const shape = rawShapes[i];
      if (shape.contains(sceneX, sceneY)) return shape;
    }
    return null;
  }

  private getTaskStoryMap(stories: StoryElement[]): Map<string, string> {
    const map = new Map<string, string>();
    stories.forEach((story) => {
      story.tasks.forEach((task) => {
        if (!map.has(task.id)) {
          map.set(task.id, story.id);
        }
      });
    });
    return map;
  }

  private getAffectedStoriesForTasks(
    tasks: TaskElement[],
    stories: StoryElement[],
    prevStoryMap: Map<string, string>
  ): StoryElement[] {
    if (tasks.length === 0) return [];
    const nextStoryMap = this.getTaskStoryMap(stories);
    const storyIds = new Set<string>();
    tasks.forEach((task) => {
      const prevId = prevStoryMap.get(task.id);
      const nextId = nextStoryMap.get(task.id);
      if (prevId) storyIds.add(prevId);
      if (nextId) storyIds.add(nextId);
    });
    return stories.filter((story) => storyIds.has(story.id));
  }

  private applyAutoLayoutToStories(
    stories: StoryElement[],
    skipTaskIds: Set<string>,
    dropPlans: Map<string, StoryDropPlan> = new Map()
  ): {
    movedInitial: Map<string, { x: number; y: number }>;
    movedFinal: Map<string, { x: number; y: number }>;
    resizedInitial: Map<string, { x: number; y: number; width: number; height: number }>;
    resizedFinal: Map<string, { x: number; y: number; width: number; height: number }>;
  } {
    const movedInitial = new Map<string, { x: number; y: number }>();
    const movedFinal = new Map<string, { x: number; y: number }>();
    const resizedInitial = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    const resizedFinal = new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >();
    if (stories.length === 0) {
      return { movedInitial, movedFinal, resizedInitial, resizedFinal };
    }
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const epsilon = 0.01;
    stories.forEach((story) => {
      const layoutTasks = this.storyLayoutService.getLayoutTasks(story, tasks);
      if (layoutTasks.length === 0) return;
      const initialTaskPositions = new Map(
        layoutTasks.map((task) => [task.id, { x: task.x, y: task.y }])
      );
      const initialStory = {
        x: story.x,
        y: story.y,
        width: story.width,
        height: story.height,
      };
      const dropPlan = dropPlans.get(story.id);
      if (dropPlan) {
        story.width = dropPlan.nextWidth;
        story.height = dropPlan.nextHeight;
        dropPlan.positions.forEach((pos, id) => {
          const task = taskById.get(id);
          if (!task) return;
          task.x = pos.x;
          task.y = pos.y;
        });
        story.tasks = dropPlan.orderedTasks;
      } else {
        const plan = this.storyLayoutService.planResize(
          story,
          tasks,
          story.width,
          story.height
        );
        story.width = plan.nextWidth;
        story.height = plan.nextHeight;
        if (plan.positions.size > 0) {
          plan.positions.forEach((pos, id) => {
            const task = taskById.get(id);
            if (!task) return;
            task.x = pos.x;
            task.y = pos.y;
          });
          story.tasks = plan.orderedTasks;
        }
      }
      if (
        Math.abs(story.width - initialStory.width) > epsilon ||
        Math.abs(story.height - initialStory.height) > epsilon
      ) {
        resizedInitial.set(story.id, initialStory);
        resizedFinal.set(story.id, {
          x: story.x,
          y: story.y,
          width: story.width,
          height: story.height,
        });
      }
      initialTaskPositions.forEach((pos, id) => {
        const task = taskById.get(id);
        if (!task) return;
        const dx = Math.abs(task.x - pos.x);
        const dy = Math.abs(task.y - pos.y);
        if (dx <= epsilon && dy <= epsilon) return;
        if (skipTaskIds.has(id)) return;
        movedInitial.set(id, pos);
        movedFinal.set(id, { x: task.x, y: task.y });
      });
    });
    return { movedInitial, movedFinal, resizedInitial, resizedFinal };
  }

  private captureResizeTaskPositions(story: StoryElement): void {
    this.resizeInitialTaskPositions.clear();
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const layoutTasks = this.storyLayoutService.getLayoutTasks(story, tasks);
    layoutTasks.forEach((task) => {
      this.resizeInitialTaskPositions.set(task.id, { x: task.x, y: task.y });
    });
  }

  private getResizeAnchoredPosition(
    width: number,
    height: number
  ): { x: number; y: number } {
    switch (this.resizeDirection) {
      case 'ne':
        return { x: this.initialX, y: this.initialY + this.initialHeight - height };
      case 'sw':
        return { x: this.initialX + this.initialWidth - width, y: this.initialY };
      case 'nw':
        return {
          x: this.initialX + this.initialWidth - width,
          y: this.initialY + this.initialHeight - height,
        };
      case 'se':
      default:
        return { x: this.initialX, y: this.initialY };
    }
  }

  private getResizeAnchoredRect(
    width: number,
    height: number
  ): { x: number; y: number; width: number; height: number } {
    const anchored = this.getResizeAnchoredPosition(width, height);
    return {
      x: anchored.x,
      y: anchored.y,
      width,
      height,
    };
  }

  private evaluateDragPlacement(
    dragGroup: ICanvasElement[],
    proposedDx: number,
    proposedDy: number,
    resolveMode: 'preview' | 'commit' = 'commit'
  ): DragPlacementDiagnostics {
    const planningGroup = dragGroup.filter(
      (element): element is PlanningElement => element instanceof PlanningElement
    );
    if (planningGroup.length === 0) {
      return {
        valid: true,
        reasonCode: 'none',
        blockers: [],
        requiredGap: 0,
        suggestedTranslation: { dx: proposedDx, dy: proposedDy },
      };
    }
    return this.placementPolicy.evaluateDragPlacement({
      movingElements: planningGroup,
      initialPositions: this.initialPositions,
      proposedDx,
      proposedDy,
      sceneElements: this.scene.getElements(),
      resolveMode,
    });
  }

  private applyDragDelta(
    dragGroup: ICanvasElement[],
    dx: number,
    dy: number,
    callOnDrag: boolean
  ): void {
    dragGroup.forEach((element) => {
      const origin = this.initialPositions.get(element.id);
      if (!origin) return;
      const nextX = origin.x + dx;
      const nextY = origin.y + dy;
      const draggable = element as any;
      draggable.x = nextX;
      draggable.y = nextY;
      if (callOnDrag && draggable.onDrag) {
        draggable.onDrag(nextX, nextY);
      }
    });
  }

  private updateDragPlacementPreview(
    dragGroup: ICanvasElement[],
    currentDelta: { dx: number; dy: number },
    diagnostics: DragPlacementDiagnostics
  ): void {
    const planningGroup = dragGroup.filter(
      (element): element is PlanningElement => element instanceof PlanningElement
    );
    if (planningGroup.length === 0) {
      this.clearPlacementPreview();
      return;
    }
    const currentPositions = new Map<string, { x: number; y: number }>();
    const suggestedPositions = new Map<string, { x: number; y: number }>();
    planningGroup.forEach((element) => {
      const origin = this.initialPositions.get(element.id);
      if (!origin) return;
      currentPositions.set(element.id, {
        x: origin.x + currentDelta.dx,
        y: origin.y + currentDelta.dy,
      });
      suggestedPositions.set(element.id, {
        x: origin.x + diagnostics.suggestedTranslation.dx,
        y: origin.y + diagnostics.suggestedTranslation.dy,
      });
    });
    const blockerIds = Array.from(
      new Set(diagnostics.blockers.map((blocker) => blocker.blockingElementId))
    );
    this.placementPreview = {
      kind: 'drag',
      valid: diagnostics.valid,
      elementIds: planningGroup.map((element) => element.id),
      currentPositions,
      suggestedPositions,
      blockerIds,
    };
  }

  private updateResizePlacementPreview(
    elementId: string,
    currentRect: PlacementPreviewRect,
    diagnostics: RectPlacementDiagnostics
  ): void {
    const blockerIds = Array.from(
      new Set(diagnostics.blockers.map((blocker) => blocker.blockingElementId))
    );
    this.placementPreview = {
      kind: 'resize',
      valid: diagnostics.valid,
      elementId,
      currentRect,
      suggestedRect: diagnostics.suggestedRect,
      blockerIds,
    };
  }

  private applyHardDropForDragGroup(
    dragGroup: ICanvasElement[],
    callOnDrag: boolean
  ): void {
    const currentDelta = this.getCurrentDragDelta(dragGroup);
    const diagnostics = this.evaluateDragPlacement(
      dragGroup,
      currentDelta.dx,
      currentDelta.dy,
      'commit'
    );
    const resolved = diagnostics.suggestedTranslation;
    if (this.areDeltasEqual(currentDelta, resolved)) return;
    this.applyDragDelta(dragGroup, resolved.dx, resolved.dy, callOnDrag);
  }

  private applyHardDropForResize(story: StoryElement): void {
    const tasks = this.scene
      .getElements()
      .filter((element) => element instanceof TaskElement) as TaskElement[];
    const movingIds = new Set<string>([
      story.id,
      ...story.tasks.map((task) => task.id),
    ]);
    const targetRect = {
      x: story.x,
      y: story.y,
      width: story.width,
      height: story.height,
    };
    const diagnostics = this.placementPolicy.evaluateRectPlacement({
      element: story,
      startRect: {
        x: this.initialX,
        y: this.initialY,
        width: this.initialWidth,
        height: this.initialHeight,
      },
      targetRect,
      sceneElements: this.scene.getElements(),
      movingIds,
    });
    const resolvedRect = diagnostics.suggestedRect;
    if (this.areRectsEqual(targetRect, resolvedRect)) return;

    let plan = this.storyLayoutService.planResize(
      story,
      tasks,
      resolvedRect.width,
      resolvedRect.height
    );
    let finalRect = this.getResizeAnchoredRect(plan.nextWidth, plan.nextHeight);
    if (
      !this.placementPolicy.isPlacementValidForRect(
        story,
        finalRect,
        this.scene.getElements(),
        movingIds
      )
    ) {
      plan = this.storyLayoutService.planResize(
        story,
        tasks,
        this.initialWidth,
        this.initialHeight
      );
      finalRect = {
        x: this.initialX,
        y: this.initialY,
        width: plan.nextWidth,
        height: plan.nextHeight,
      };
    }

    const xShift = finalRect.x - story.x;
    const yShift = finalRect.y - story.y;
    story.x = finalRect.x;
    story.y = finalRect.y;
    story.width = finalRect.width;
    story.height = finalRect.height;
    if (plan.positions.size > 0) {
      const taskById = new Map(tasks.map((task) => [task.id, task]));
      plan.positions.forEach((pos, id) => {
        const task = taskById.get(id);
        if (!task) return;
        task.x = pos.x + xShift;
        task.y = pos.y + yShift;
      });
      story.tasks = plan.orderedTasks;
    }
  }

  private getCurrentDragDelta(dragGroup: ICanvasElement[]): {
    dx: number;
    dy: number;
  } {
    for (const element of dragGroup) {
      const origin = this.initialPositions.get(element.id);
      if (!origin) continue;
      const current = element as any;
      return {
        dx: current.x - origin.x,
        dy: current.y - origin.y,
      };
    }
    return { dx: 0, dy: 0 };
  }

  private areDeltasEqual(
    a: { dx: number; dy: number },
    b: { dx: number; dy: number },
    epsilon: number = 0.1
  ): boolean {
    return Math.abs(a.dx - b.dx) <= epsilon && Math.abs(a.dy - b.dy) <= epsilon;
  }

  private areRectsEqual(
    a: PlacementPreviewRect,
    b: PlacementPreviewRect,
    epsilon: number = 0.1
  ): boolean {
    return (
      Math.abs(a.x - b.x) <= epsilon &&
      Math.abs(a.y - b.y) <= epsilon &&
      Math.abs(a.width - b.width) <= epsilon &&
      Math.abs(a.height - b.height) <= epsilon
    );
  }

  private lerpRect(
    from: PlacementPreviewRect,
    to: PlacementPreviewRect,
    t: number
  ): PlacementPreviewRect {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      width: from.width + (to.width - from.width) * t,
      height: from.height + (to.height - from.height) * t,
    };
  }

  private getResizeMovedTasks(): {
    initial: Map<string, { x: number; y: number }>;
    final: Map<string, { x: number; y: number }>;
  } {
    const initial = new Map<string, { x: number; y: number }>();
    const final = new Map<string, { x: number; y: number }>();
    if (this.resizeInitialTaskPositions.size === 0) {
      return { initial, final };
    }
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const epsilon = 0.01;
    this.resizeInitialTaskPositions.forEach((pos, id) => {
      const task = taskById.get(id);
      if (!task) return;
      const dx = Math.abs(task.x - pos.x);
      const dy = Math.abs(task.y - pos.y);
      if (dx <= epsilon && dy <= epsilon) return;
      initial.set(id, pos);
      final.set(id, { x: task.x, y: task.y });
    });
    return { initial, final };
  }

  private hasResizeChange(next: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): boolean {
    const epsilon = 0.01;
    return (
      Math.abs(next.x - this.initialX) > epsilon ||
      Math.abs(next.y - this.initialY) > epsilon ||
      Math.abs(next.width - this.initialWidth) > epsilon ||
      Math.abs(next.height - this.initialHeight) > epsilon
    );
  }

  private getTaskAnchor(task: TaskElement): { x: number; y: number } {
    return {
      x: task.x + TaskElement.width / 2,
      y: task.y + TaskElement.height / 2,
    };
  }
}
