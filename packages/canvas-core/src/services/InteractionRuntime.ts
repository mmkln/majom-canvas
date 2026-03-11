import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';
import {
  findConnectionPointAt,
  type ConnectionPointLike,
} from '../utils/connectionPointHitTest.ts';
import {
  identityConnectableOrderResolver,
  type ConnectableOrderResolver,
} from '../policies/connectableOrderPolicy.ts';
import {
  identityDragGroupResolver,
  type DragGroupResolver,
} from '../policies/dragGroupPolicy.ts';
import {
  resolveTopElementByZIndex,
  type HitTestableElement,
  type TopElementResolver,
} from '../policies/topElementPolicy.ts';
import { DragInteractionRuntime } from './DragInteractionRuntime.ts';
import { SelectionRuntime } from './SelectionRuntime.ts';
import type {
  ConnectionInteractionAdapter,
  InteractionCommandSink,
  InteractionEventSink,
} from '../contracts/interaction.ts';

type TopHitCandidate<TElement extends ICanvasElement> = TElement &
  HitTestableElement;

type RuntimePositioned = {
  x: number;
  y: number;
};

type RuntimeSized = RuntimePositioned & {
  width: number;
  height: number;
};

type RuntimeCircle = RuntimePositioned & {
  radius: number;
};

export type RuntimeDraggable = {
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: () => void;
};

type RuntimeContains = {
  contains(px: number, py: number): boolean;
};

type RuntimeDoubleClickable = {
  onDoubleClick?: () => void;
};

export type RuntimeCanvasElement = ICanvasElement &
  Partial<RuntimePositioned> &
  Partial<RuntimeSized> &
  Partial<RuntimeCircle> &
  Partial<RuntimeContains> &
  Partial<RuntimeDraggable> &
  Partial<RuntimeDoubleClickable>;

export type RuntimeResizableElement<TPanZoom> = RuntimeCanvasElement &
  RuntimeSized & {
    selected: boolean;
    hoveredResizeHandle?: 'nw' | 'ne' | 'se' | 'sw' | null;
    getResizeHandleDirectionAt(
      sceneX: number,
      sceneY: number,
      panZoom: TPanZoom
    ): 'nw' | 'ne' | 'se' | 'sw' | null;
  };

export type RuntimeScene<TElement extends RuntimeCanvasElement> = {
  getShapes(): TElement[];
  getElements(): TElement[];
  getSelectedElements(): TElement[];
  setSelected(elements: TElement[]): void;
  toggleSelected(elements: TElement[]): void;
  changes: { next(): void };
};

export type RuntimePanZoom = {
  scale: number;
};

export type TaskDropPreviewState<
  TPlaceholder = unknown,
  TDropPlan = unknown,
  TResizePreview = unknown,
  TReflowPreview = unknown,
> = {
  taskDropPlaceholders: TPlaceholder[];
  storyDropPlans: Map<string, TDropPlan>;
  storyResizePreviews: TResizePreview[];
  taskReflowPreviews: Map<string, TReflowPreview>;
};

export type TaskDropPreviewAdapter<
  TElement extends RuntimeCanvasElement,
  TPlaceholder = unknown,
  TDropPlan = unknown,
  TResizePreview = unknown,
  TReflowPreview = unknown,
> = {
  clear(): void;
  update(context: {
    sceneElements: TElement[];
    initialPositions: ReadonlyMap<string, { x: number; y: number }>;
    pointer: { x: number; y: number };
  }): void;
  getState(): TaskDropPreviewState<
    TPlaceholder,
    TDropPlan,
    TResizePreview,
    TReflowPreview
  >;
};

export type TaskStoryLayoutChanges = {
  movedInitial: Map<string, { x: number; y: number }>;
  movedFinal: Map<string, { x: number; y: number }>;
  resizedInitial: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  resizedFinal: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
};

export type TaskStoryLayoutAdapter<
  TElement extends RuntimeCanvasElement,
  TDropPlan = unknown,
> = {
  compute(context: {
    mode: 'group' | 'item';
    draggingItem: TElement | null;
    selectedElements: TElement[];
    sceneElements: TElement[];
    draggedElementIds: Set<string>;
    dropPlans: Map<string, TDropPlan>;
  }): TaskStoryLayoutChanges;
};

export type StoryResizeLayoutAdapter<
  TElement extends RuntimeCanvasElement,
  TPanZoom extends RuntimePanZoom,
> = {
  onResizeStart(context: {
    story: RuntimeResizableElement<TPanZoom>;
    sceneElements: TElement[];
  }): void;
  onResizeUpdate(context: {
    story: RuntimeResizableElement<TPanZoom>;
    sceneElements: TElement[];
    nextWidth: number;
    nextHeight: number;
  }): {
    nextWidth: number;
    nextHeight: number;
  };
  collectMovedTasks(sceneElements: TElement[]): {
    initial: Map<string, { x: number; y: number }>;
    final: Map<string, { x: number; y: number }>;
  };
  clear(): void;
};

type InteractionSemantics<
  TElement extends RuntimeCanvasElement,
  TPanZoom extends RuntimePanZoom,
> = {
  isTaskElement?: (element: TElement | null) => boolean;
  isResizableElement?: (element: TElement) => boolean;
};

const createEmptyTaskStoryLayoutChanges = (): TaskStoryLayoutChanges => ({
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
});

const createNoopTaskDropPreviewAdapter = <
  TElement extends RuntimeCanvasElement,
  TPlaceholder = unknown,
  TDropPlan = unknown,
  TResizePreview = unknown,
  TReflowPreview = unknown,
>(): TaskDropPreviewAdapter<
  TElement,
  TPlaceholder,
  TDropPlan,
  TResizePreview,
  TReflowPreview
> => ({
  clear: () => undefined,
  update: () => undefined,
  getState: () => ({
    taskDropPlaceholders: [],
    storyDropPlans: new Map<string, TDropPlan>(),
    storyResizePreviews: [],
    taskReflowPreviews: new Map<string, TReflowPreview>(),
  }),
});

const createNoopTaskStoryLayoutAdapter = <
  TElement extends RuntimeCanvasElement,
  TDropPlan = unknown,
>(): TaskStoryLayoutAdapter<TElement, TDropPlan> => ({
  compute: () => createEmptyTaskStoryLayoutChanges(),
});

const createNoopStoryResizeLayoutAdapter = <
  TElement extends RuntimeCanvasElement,
  TPanZoom extends RuntimePanZoom,
>(): StoryResizeLayoutAdapter<TElement, TPanZoom> => ({
  onResizeStart: () => undefined,
  onResizeUpdate: (context) => ({
    nextWidth: context.nextWidth,
    nextHeight: context.nextHeight,
  }),
  collectMovedTasks: () => ({
    initial: new Map<string, { x: number; y: number }>(),
    final: new Map<string, { x: number; y: number }>(),
  }),
  clear: () => undefined,
});

const isResizableCanvasElementCandidate = <TPanZoom extends RuntimePanZoom>(
  element: RuntimeCanvasElement
): element is RuntimeResizableElement<TPanZoom> => {
  const candidate = element as Partial<RuntimeResizableElement<TPanZoom>>;
  return (
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.getResizeHandleDirectionAt === 'function'
  );
};

const isRuntimeCircle = (
  element: RuntimeCanvasElement
): element is RuntimeCanvasElement & RuntimeCircle =>
  typeof (element as Partial<RuntimeCircle>).radius === 'number' &&
  typeof (element as Partial<RuntimeCircle>).x === 'number' &&
  typeof (element as Partial<RuntimeCircle>).y === 'number';

export type InteractionRuntimeOptions<
  TElement extends RuntimeCanvasElement,
  TConnectable extends IConnectable & TElement,
  TConnection extends IConnection & TElement,
  TPanZoom extends RuntimePanZoom,
  TPlaceholder = unknown,
  TDropPlan = unknown,
  TResizePreview = unknown,
  TReflowPreview = unknown,
> = {
  canvas: HTMLCanvasElement;
  scene: RuntimeScene<TElement>;
  panZoom: TPanZoom;
  connectionInteraction: ConnectionInteractionAdapter<TConnection>;
  taskDropPreviewAdapter?: TaskDropPreviewAdapter<
    TElement,
    TPlaceholder,
    TDropPlan,
    TResizePreview,
    TReflowPreview
  >;
  taskStoryLayoutAdapter?: TaskStoryLayoutAdapter<TElement, TDropPlan>;
  storyResizeLayoutAdapter?: StoryResizeLayoutAdapter<TElement, TPanZoom>;
  dragGroupResolver?: DragGroupResolver<TElement>;
  topElementResolver?: TopElementResolver<TopHitCandidate<TElement>>;
  connectableOrderResolver?: ConnectableOrderResolver<TConnectable>;
  semantics?: InteractionSemantics<TElement, TPanZoom>;
  interactionEventSink?: InteractionEventSink<TElement>;
  interactionCommandSink?: InteractionCommandSink;
};

const noopInteractionEventSink: InteractionEventSink<RuntimeCanvasElement> = {};
const noopInteractionCommandSink: InteractionCommandSink = {};

/**
 * High-level pointer interaction runtime (selection, drag, resize, connection flows).
 */
export class InteractionRuntime<
  TElement extends RuntimeCanvasElement,
  TConnectable extends IConnectable & TElement,
  TConnection extends IConnection & TElement,
  TPanZoom extends RuntimePanZoom,
  TPlaceholder = unknown,
  TDropPlan = unknown,
  TResizePreview = unknown,
  TReflowPreview = unknown,
> {
  protected readonly canvas: HTMLCanvasElement;
  protected readonly scene: RuntimeScene<TElement>;
  protected readonly panZoom: TPanZoom;
  private readonly taskDropPreviewAdapter: TaskDropPreviewAdapter<
    TElement,
    TPlaceholder,
    TDropPlan,
    TResizePreview,
    TReflowPreview
  >;
  private readonly taskStoryLayoutAdapter: TaskStoryLayoutAdapter<
    TElement,
    TDropPlan
  >;
  private readonly storyResizeLayoutAdapter: StoryResizeLayoutAdapter<
    TElement,
    TPanZoom
  >;
  private readonly dragGroupResolver: DragGroupResolver<TElement>;
  private readonly topElementResolver: TopElementResolver<TopHitCandidate<TElement>>;
  private readonly connectableOrderResolver: ConnectableOrderResolver<TConnectable>;
  private readonly interactionEventSink: InteractionEventSink<TElement>;
  private readonly interactionCommandSink: InteractionCommandSink;
  private readonly isTaskElement: (element: TElement | null) => boolean;
  private readonly isResizableElement: (element: TElement) => boolean;

  private connectionInteraction: ConnectionInteractionAdapter<TConnection>;
  private hoveredConnectionPoint: ConnectionPointLike | null = null;
  // Resize state
  private resizingElement: RuntimeResizableElement<TPanZoom> | null = null;
  private resizeDirection: 'nw' | 'ne' | 'se' | 'sw' | null = null;
  private resizeStartX: number = 0;
  private resizeStartY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private initialWidth: number = 0;
  private initialHeight: number = 0;
  private readonly selectionRuntime: SelectionRuntime<TElement>;
  private readonly dragRuntime: DragInteractionRuntime<TElement>;
  private rightClickTarget: TElement | null = null;
  private readonly dragStartThresholdPx: number = 4;

  /**
   * Creates runtime with pluggable adapters for domain-specific behavior.
   */
  constructor(options: InteractionRuntimeOptions<
    TElement,
    TConnectable,
    TConnection,
    TPanZoom,
    TPlaceholder,
    TDropPlan,
    TResizePreview,
    TReflowPreview
  >) {
    this.canvas = options.canvas;
    this.scene = options.scene;
    this.panZoom = options.panZoom;
    this.connectionInteraction = options.connectionInteraction;
    this.taskDropPreviewAdapter =
      options.taskDropPreviewAdapter ??
      createNoopTaskDropPreviewAdapter<
        TElement,
        TPlaceholder,
        TDropPlan,
        TResizePreview,
        TReflowPreview
      >();
    this.taskStoryLayoutAdapter =
      options.taskStoryLayoutAdapter ??
      createNoopTaskStoryLayoutAdapter<TElement, TDropPlan>();
    this.storyResizeLayoutAdapter =
      options.storyResizeLayoutAdapter ??
      createNoopStoryResizeLayoutAdapter<TElement, TPanZoom>();
    this.dragGroupResolver = options.dragGroupResolver ?? identityDragGroupResolver;
    this.topElementResolver = options.topElementResolver ?? resolveTopElementByZIndex;
    this.connectableOrderResolver =
      options.connectableOrderResolver ?? identityConnectableOrderResolver;
    this.interactionEventSink =
      options.interactionEventSink ??
      (noopInteractionEventSink as InteractionEventSink<TElement>);
    this.interactionCommandSink =
      options.interactionCommandSink ?? noopInteractionCommandSink;
    const semantics = options.semantics ?? {};
    this.isTaskElement = semantics.isTaskElement ?? (() => false);
    this.isResizableElement =
      semantics.isResizableElement ??
      ((element: TElement): boolean =>
        isResizableCanvasElementCandidate<TPanZoom>(
          element as unknown as RuntimeCanvasElement
        ));

    this.selectionRuntime = new SelectionRuntime<TElement>({
      setSelected: (elements) => this.scene.setSelected(elements),
      toggleSelected: (elements) => this.scene.toggleSelected(elements),
    });
    this.dragRuntime = new DragInteractionRuntime<TElement>((element) => {
      const candidate = element as TElement & Partial<RuntimePositioned>;
      return {
        x: typeof candidate.x === 'number' ? candidate.x : 0,
        y: typeof candidate.y === 'number' ? candidate.y : 0,
      };
    });
  }

  // Отримуємо тимчасову лінію для відображення
  /**
   * Returns temporary connection line used for preview rendering.
   */
  public getTempConnectionLine(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null {
    return this.connectionInteraction.getTemporaryLine();
  }

  // Очищаємо стан створення зв’язку (наприклад, для скасування через Esc)
  /**
   * Cancels current connection-creation flow.
   */
  public cancelConnectionCreation(): void {
    this.connectionInteraction.cancel();
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
    return this.selectionRuntime.getRegionRect();
  }

  /**
   * Update scene selection based on clicked target and shiftKey; abstracts click selection logic.
   */
  private updateSelectionOnClick(
    target: TElement | null,
    shiftKey: boolean
  ): void {
    this.selectionRuntime.selectOnClick(target, shiftKey);
  }

  private getSceneElements(): TElement[] {
    return this.scene.getElements();
  }

  private getHitTestableSceneElements(): TopHitCandidate<TElement>[] {
    return this.getSceneElements().filter(
      (element): element is TopHitCandidate<TElement> =>
        typeof (element as Partial<RuntimeContains>).contains === 'function'
    );
  }

  private getRegionSelectableElements(): TElement[] {
    const rawShapes = this.scene.getShapes();
    return [...rawShapes, ...this.getSceneElements()] as TElement[];
  }

  private getSelectionBounds(element: TElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (isRuntimeCircle(element)) {
      return {
        x: element.x - element.radius,
        y: element.y - element.radius,
        width: element.radius * 2,
        height: element.radius * 2,
      };
    }
    const candidate = element as TElement & {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    };
    return {
      x: typeof candidate.x === 'number' ? candidate.x : 0,
      y: typeof candidate.y === 'number' ? candidate.y : 0,
      width: typeof candidate.width === 'number' ? candidate.width : 0,
      height: typeof candidate.height === 'number' ? candidate.height : 0,
    };
  }

  private containsPoint(element: RuntimeCanvasElement, x: number, y: number): boolean {
    const contains = (element as Partial<RuntimeContains>).contains;
    if (typeof contains !== 'function') return false;
    return contains.call(element, x, y);
  }

  /**
   * Handles pointer down in scene coordinates.
   * Returns `true` when runtime captures the interaction.
   */
  public handleMouseDown(e: MouseEvent, sceneX: number, sceneY: number): boolean {
    this.clearTaskDropPreviewState();
    if (e.button === 2) {
      this.rightClickTarget = this.findTopElementAt(sceneX, sceneY);
      return false;
    }
    if (e.button !== 0) return false;
    const rawShapes = this.scene.getShapes();
    const sceneEls = this.getHitTestableSceneElements();
    let clickedItem: (TElement & RuntimeDraggable) | null = null;

    // Resize handle detection on Story (independent of bounding box)
    const storyEls = sceneEls
      .filter((el) => this.isResizableElement(el as TElement))
      .map((el) => el as unknown as RuntimeResizableElement<TPanZoom>);
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
        this.storyResizeLayoutAdapter.onResizeStart({
          story: el,
          sceneElements: this.getSceneElements(),
        });
        this.updateSelectionOnClick(el as unknown as TElement, e.shiftKey);
        this.interactionEventSink.onInteractionStart?.('resize');
        return true;
      }
    }

    clickedItem = this.findTopElementAt(sceneX, sceneY) as
      | (TElement & RuntimeDraggable)
      | null;

    // Check for connection point first to prioritize connection creation
    const connectables = [
      ...this.scene.getShapes(),
      ...sceneEls,
    ] as unknown as TConnectable[];
    const connectionPointHit = findConnectionPointAt(
      sceneX,
      sceneY,
      connectables,
      this.panZoom.scale
    );

    if (connectionPointHit) {
      // If clicking on a connection point, prioritize connection creation over existing connection selection
      if (this.connectionInteraction.start(sceneX, sceneY)) {
        return true;
      }
    }

    // service-based connection selection (only if not on a connection point)
    const existingConn = this.connectionInteraction.hitTest(sceneX, sceneY);
    if (existingConn) {
      this.updateSelectionOnClick(existingConn, e.shiftKey);
      return true;
    }

    // service-based connection creation start (fallback)
    if (this.connectionInteraction.start(sceneX, sceneY)) {
      return true;
    }
    if (clickedItem) {
      const selectedBeforeClick = this.scene.getSelectedElements();
      const clickedAlreadySelected = selectedBeforeClick.some(
        (el) => el.id === clickedItem.id
      );
      const shouldDragSelectionGroup =
        clickedAlreadySelected && selectedBeforeClick.length > 1 && !e.shiftKey;

      if (shouldDragSelectionGroup) {
        this.dragRuntime.armGroup({
          group: this.dragGroupResolver(selectedBeforeClick),
          pointerStart: { x: sceneX, y: sceneY },
          clickTarget: clickedItem,
        });
        return true;
      }

      this.updateSelectionOnClick(clickedItem, e.shiftKey);
      const selectedAfterClick = this.scene.getSelectedElements();
      const candidate = clickedItem as TElement & {
        x?: number;
        y?: number;
      };
      this.dragRuntime.armItem({
        item: clickedItem,
        group: this.dragGroupResolver(selectedAfterClick),
        pointerStart: { x: sceneX, y: sceneY },
        itemOffset: {
          x: sceneX - (typeof candidate.x === 'number' ? candidate.x : 0),
          y: sceneY - (typeof candidate.y === 'number' ? candidate.y : 0),
        },
      });
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
        this.dragRuntime.armGroup({
          group: this.dragGroupResolver(selected),
          pointerStart: { x: sceneX, y: sceneY },
        });
        return true;
      }
    }
    // start region-select when clicking empty space
    if (
      !rawShapes.some((el) => this.containsPoint(el, sceneX, sceneY)) &&
      !sceneEls.some((el) => this.containsPoint(el, sceneX, sceneY))
    ) {
      this.selectionRuntime.startRegion(sceneX, sceneY);
      this.interactionEventSink.onInteractionStart?.('select');
      return true;
    }
    this.updateSelectionOnClick(null, false);
    return false;
  }

  /**
   * Handles pointer move in scene coordinates.
   */
  public handleMouseMove(sceneX: number, sceneY: number): void {
    if (!this.dragRuntime.isDragging()) {
      this.clearTaskDropPreviewState();
    }
    const rawShapes = this.scene.getShapes();
    const sceneEls = this.getHitTestableSceneElements();
    const connectables = this.connectableOrderResolver({
      connectables: [...rawShapes, ...sceneEls] as unknown as TConnectable[],
      isCreatingConnection: this.connectionInteraction.isCreating(),
    }) as TConnectable[];

    // Unified hover state for all connectables (shapes + planning elements)
    let newHovered: TConnectable | null = null;
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
    const connectionPointHit = findConnectionPointAt(
      sceneX,
      sceneY,
      connectables,
      this.panZoom.scale
    );
    if (connectionPointHit) {
      this.hoveredConnectionPoint = connectionPointHit.point;
      // Store hovered port on shape for drawing
      (connectionPointHit.shape as any).hoveredPort = connectionPointHit.point;
    } else {
      this.hoveredConnectionPoint = null;
    }

    // connection creation update via service
    if (this.connectionInteraction.isCreating()) {
      this.clearTaskDropPreviewState();
      this.connectionInteraction.update(sceneX, sceneY);
      return;
    }

    // Resize-handle hover detection
    const stories = sceneEls
      .filter((el) => this.isResizableElement(el as TElement))
      .map((el) => el as unknown as RuntimeResizableElement<TPanZoom>);
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
    if (
      this.dragRuntime.hasPending() &&
      this.dragRuntime.tryActivate({
        pointer: { x: sceneX, y: sceneY },
        scale: this.panZoom.scale,
        thresholdPx: this.dragStartThresholdPx,
      })
    ) {
      const draggingItem = this.dragRuntime.getDraggingItem() as
        | ((TElement & RuntimeDraggable) | null);
      if (draggingItem?.onDragStart) {
        draggingItem.onDragStart();
      }
      this.interactionEventSink.onInteractionStart?.('drag');
    }

    // update region-select drag
    if (this.selectionRuntime.isRegionSelecting()) {
      this.clearTaskDropPreviewState();
      this.selectionRuntime.updateRegion(
        sceneX,
        sceneY,
        this.getRegionSelectableElements(),
        (element) => this.getSelectionBounds(element)
      );
      this.scene.changes.next();
      return;
    }

    // Handle drag of selected element/group
    if (this.dragRuntime.isDragging()) {
      const activeKind = this.dragRuntime.getActiveKind();
      this.dragRuntime.updateActive(
        { x: sceneX, y: sceneY },
        (element, position) => {
          const candidate = element as TElement & {
            x?: number;
            y?: number;
            onDrag?: (x: number, y: number) => void;
          };
          candidate.x = position.x;
          candidate.y = position.y;
          if (activeKind === 'item' && candidate.onDrag) {
            candidate.onDrag(position.x, position.y);
          }
        }
      );
      this.updateTaskDropPlaceholders(sceneX, sceneY);
      this.scene.changes.next();
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
      const resizeResult = this.storyResizeLayoutAdapter.onResizeUpdate({
        story,
        sceneElements: this.getSceneElements(),
        nextWidth: newW,
        nextHeight: newH,
      });
      const anchored = this.getResizeAnchoredPosition(
        resizeResult.nextWidth,
        resizeResult.nextHeight
      );
      story.x = anchored.x;
      story.y = anchored.y;
      story.width = resizeResult.nextWidth;
      story.height = resizeResult.nextHeight;
      this.scene.changes.next();
      return;
    }
  }

  /**
   * Finalizes active pointer interaction.
   */
  public handleMouseUp(): void {
    // finish connection via service
    if (this.connectionInteraction.isCreating()) {
      this.clearTaskDropPreviewState();
      this.connectionInteraction.finish();
      return;
    }

    if (this.dragRuntime.hasPending() && !this.dragRuntime.isDragging()) {
      const clickTarget = this.dragRuntime.getPendingGroupClickTarget();
      if (clickTarget) {
        this.scene.setSelected([clickTarget]);
      }
      this.dragRuntime.clearPending();
    }

    // complete region-select
    if (this.selectionRuntime.isRegionSelecting()) {
      this.selectionRuntime.finishRegion(
        this.getRegionSelectableElements(),
        (element) => this.getSelectionBounds(element)
      );
      this.scene.changes.next();
      this.clearTaskDropPreviewState();
      this.interactionEventSink.onInteractionEnd?.('select');
      return;
    }

    const activeDragKind = this.dragRuntime.getActiveKind();
    const draggingItem = this.dragRuntime.getDraggingItem() as
      | ((TElement & RuntimeDraggable) | null);
    const draggingGroup = this.dragRuntime.getDraggingGroup();

    // finalize group drag
    if (activeDragKind === 'group' && draggingGroup) {
      const initial = new Map(this.dragRuntime.getInitialPositions());
      const selectedEls = this.scene.getSelectedElements();
      const sceneElements = this.getSceneElements();
      const dragIds = new Set(initial.keys());
      const alignChanges = this.taskStoryLayoutAdapter.compute({
        mode: 'group',
        draggingItem: null,
        selectedElements: selectedEls,
        sceneElements,
        draggedElementIds: dragIds,
        dropPlans: this.taskDropPreviewAdapter.getState().storyDropPlans,
      });
      const finalPos = this.dragRuntime.snapshotFinalPositions((element) => {
        const candidate = element as TElement & { x?: number; y?: number };
        return {
          x: typeof candidate.x === 'number' ? candidate.x : 0,
          y: typeof candidate.y === 'number' ? candidate.y : 0,
        };
      });
      this.interactionCommandSink.executeMove?.(initial, finalPos);
      if (alignChanges.movedInitial.size > 0) {
        this.interactionCommandSink.executeMove?.(
          alignChanges.movedInitial,
          alignChanges.movedFinal
        );
      }
      if (alignChanges.resizedInitial.size > 0) {
        this.interactionCommandSink.executeResize?.(
          alignChanges.resizedInitial,
          alignChanges.resizedFinal
        );
      }
      this.dragRuntime.resetDragState();
      this.clearTaskDropPreviewState();
      this.scene.changes.next();
      this.interactionEventSink.onInteractionEnd?.('drag');
      return;
    }

    // finalize drag and record history
    if (activeDragKind === 'item' && draggingItem) {
      const sceneElements = this.getSceneElements();
      const alignChanges = this.taskStoryLayoutAdapter.compute({
        mode: 'item',
        draggingItem,
        selectedElements: this.scene.getSelectedElements(),
        sceneElements,
        draggedElementIds: new Set(this.dragRuntime.getInitialPositions().keys()),
        dropPlans: this.taskDropPreviewAdapter.getState().storyDropPlans,
      });
      if (draggingItem.onDragEnd) draggingItem.onDragEnd();
      const initial = new Map(this.dragRuntime.getInitialPositions());
      if (initial.size > 0) {
        const finalPositions = this.dragRuntime.snapshotFinalPositions(
          (element) => {
            const candidate = element as TElement & {
              x?: number;
              y?: number;
            };
            return {
              x: typeof candidate.x === 'number' ? candidate.x : 0,
              y: typeof candidate.y === 'number' ? candidate.y : 0,
            };
          }
        );
        initial.forEach((_, id) => {
          if (!finalPositions.has(id)) {
            const el = this.scene
              .getElements()
              .find((candidate) => candidate.id === id) as
              | (TElement & { x?: number; y?: number })
              | undefined;
            if (!el) return;
            finalPositions.set(id, {
              x: typeof el.x === 'number' ? el.x : 0,
              y: typeof el.y === 'number' ? el.y : 0,
            });
          }
        });
        this.interactionCommandSink.executeMove?.(initial, finalPositions);
      }
      if (alignChanges.movedInitial.size > 0) {
        this.interactionCommandSink.executeMove?.(
          alignChanges.movedInitial,
          alignChanges.movedFinal
        );
      }
      if (alignChanges.resizedInitial.size > 0) {
        this.interactionCommandSink.executeResize?.(
          alignChanges.resizedInitial,
          alignChanges.resizedFinal
        );
      }
      this.dragRuntime.resetDragState();
      this.clearTaskDropPreviewState();
      this.scene.changes.next();
      this.interactionEventSink.onInteractionEnd?.('drag');
    }
    // finish resize
    if (this.resizingElement) {
      // record resize in history
      const el = this.resizingElement;
      const movedTasks = this.storyResizeLayoutAdapter.collectMovedTasks(
        this.getSceneElements()
      );
      if (movedTasks.initial.size > 0) {
        this.interactionCommandSink.executeMove?.(
          movedTasks.initial,
          movedTasks.final
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
        this.interactionCommandSink.executeResize?.(initial, finalMap);
      }
      // clear resizing state
      this.resizingElement = null;
      this.resizeDirection = null;
      this.storyResizeLayoutAdapter.clear();
      this.canvas.style.cursor = 'default';
      this.getSceneElements()
        .filter((el) => this.isResizableElement(el as TElement))
        .forEach((s) => {
          (s as unknown as RuntimeResizableElement<TPanZoom>).hoveredResizeHandle =
            null;
        });
      this.clearTaskDropPreviewState();
      this.scene.changes.next();
      this.interactionEventSink.onInteractionEnd?.('resize');
      return;
    }
    this.clearTaskDropPreviewState();
  }

  /**
   * Handles double click and forwards it to top-most element under pointer.
   */
  public handleDoubleClick(sceneX: number, sceneY: number): void {
    const rawShapes = this.scene.getShapes();
    for (let i = rawShapes.length - 1; i >= 0; i--) {
      const shape = rawShapes[i];
      if (this.containsPoint(shape, sceneX, sceneY) && shape.onDoubleClick) {
        shape.onDoubleClick();
        break;
      }
    }
    // Check scene elements in zIndex order (highest first)
    const sceneEls = [...this.getHitTestableSceneElements()];
    sceneEls.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
    for (const el of sceneEls) {
      if (this.containsPoint(el, sceneX, sceneY) && el.onDoubleClick) {
        el.onDoubleClick();
        break;
      }
    }
  }

  /**
   * Handles right click and emits context-menu request via event sink.
   */
  public handleRightClick(e: MouseEvent, sceneX: number, sceneY: number): void {
    e.preventDefault();
    const target =
      this.rightClickTarget ?? this.findTopElementAt(sceneX, sceneY);
    this.interactionEventSink.onContextMenuRequested?.({
      element: target ?? null,
      sceneX,
      sceneY,
    });
    this.rightClickTarget = null;
  }

  /**
   * Indicates whether connection creation mode is active.
   */
  public get isCreatingConnection(): boolean {
    return this.connectionInteraction.isCreating();
  }

  /**
   * Indicates if a Task is currently being dragged.
   */
  public get isDraggingTask(): boolean {
    return this.isTaskElement(this.dragRuntime.getDraggingItem());
  }

  /**
   * Indicates whether any elements are currently being dragged.
   */
  public get isDraggingElements(): boolean {
    return this.dragRuntime.isDragging();
  }

  /**
   * Returns task drop placeholders produced by preview adapter.
   */
  public getTaskDropPlaceholders(): TPlaceholder[] {
    return this.taskDropPreviewAdapter.getState().taskDropPlaceholders;
  }

  /**
   * Returns story resize previews produced by preview adapter.
   */
  public getStoryResizePreviews(): TResizePreview[] {
    return this.taskDropPreviewAdapter.getState().storyResizePreviews;
  }

  /**
   * Returns task reflow preview map produced by preview adapter.
   */
  public getTaskReflowPreviews(): Map<string, TReflowPreview> {
    return this.taskDropPreviewAdapter.getState().taskReflowPreviews;
  }

  /**
   * Indicates whether resize interaction is active.
   */
  public get isResizingStory(): boolean {
    return this.resizingElement !== null;
  }

  private clearTaskDropPreviewState(): void {
    this.taskDropPreviewAdapter.clear();
  }

  private updateTaskDropPlaceholders(sceneX: number, sceneY: number): void {
    this.taskDropPreviewAdapter.update({
      sceneElements: this.getSceneElements(),
      initialPositions: this.dragRuntime.getInitialPositions(),
      pointer: { x: sceneX, y: sceneY },
    });
  }

  private findTopElementAt(
    sceneX: number,
    sceneY: number
  ): TopHitCandidate<TElement> | null {
    const rawShapes = this.scene.getShapes();
    const sceneEls = this.getHitTestableSceneElements();
    return this.topElementResolver({
      sceneX,
      sceneY,
      candidates: [...sceneEls, ...rawShapes] as TopHitCandidate<TElement>[],
    });
  }

  private getResizeAnchoredPosition(
    width: number,
    height: number
  ): { x: number; y: number } {
    switch (this.resizeDirection) {
      case 'ne':
        return {
          x: this.initialX,
          y: this.initialY + this.initialHeight - height,
        };
      case 'sw':
        return {
          x: this.initialX + this.initialWidth - width,
          y: this.initialY,
        };
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
}



