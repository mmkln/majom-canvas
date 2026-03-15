// managers/CanvasManager.ts
import { Scene } from '../scene/Scene.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import { ScrollbarManager } from './ScrollbarManager.ts';
import { CanvasRenderer } from './CanvasRenderer.ts';
import { InteractionManager } from './InteractionManager.ts';
import { KeyboardManager } from './KeyboardManager.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import type { IShape } from '../interfaces/shape.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import {
  SELECT_COLOR,
  FOCUS_COLOR,
  HOVER_OVERLAY_FILL,
  HOVER_OUTLINE_COLOR,
  REGION_SELECT_BORDER_COLOR,
  REGION_SELECT_FILL,
  SHOW_DETAILS_SCALE,
  SHOW_GOAL_TEXT_SCALE,
  SHOW_STORY_TEXT_SCALE,
  SHOW_TASK_TEXT_SCALE,
  SHOW_ANIM_SCALE,
  TASK_DROP_PLACEHOLDER_FILL,
  SMART_GUIDE_COLOR,
  SMART_GUIDE_LINE_WIDTH,
} from '../constants.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';
import { hasStatusAnimation } from '../../elements/utils/statusAnimations.ts';
import { CANVAS_PERF_LOG } from '../../../../config/env/index.ts';
import { isCircleVisible, isRectVisible } from '../utils/viewBounds.ts';
import { drawSmartGuides } from '../utils/smartGuideRenderer.ts';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { CanvasClientStorage } from '../services/CanvasClientStorage.ts';
import type {
  CanvasLoadPhase,
  CanvasLoadingPlaceholder,
} from '../types/canvasLoading.ts';

type CanvasLoadingPlaceholderRenderState = CanvasLoadingPlaceholder & {
  isFocused: boolean;
};

type ViewBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CanvasLoadingElementPreview = CanvasLoadingPlaceholderRenderState;

export class CanvasManager {
  canvas: HTMLCanvasElement;
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private backgroundCtx: CanvasRenderingContext2D | null = null;
  scene: Scene;
  ctx: CanvasRenderingContext2D;

  panZoom: PanZoomManager;
  scrollbarManager: ScrollbarManager;
  renderer: CanvasRenderer;
  interactionManager: InteractionManager;
  keyboardManager: KeyboardManager;

  draggingScrollbar: 'horizontal' | 'vertical' | null = null;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragStartScrollX: number = 0;
  dragStartScrollY: number = 0;
  private isRightPanning = false;
  private rightPanActive = false;
  private rightPanStartX: number = 0;
  private rightPanStartY: number = 0;
  private rightPanStartScrollX: number = 0;
  private rightPanStartScrollY: number = 0;
  private rightPanStartSceneX: number = 0;
  private rightPanStartSceneY: number = 0;
  private suppressContextMenu = false;
  private suppressNativeContextMenu = false;
  private suppressNativeContextMenuTimer: number | null = null;
  private readonly suppressNativeContextMenuMs = 2000;
  private lastMouseCoords: { x: number; y: number } | null = null;

  // Multi-touch pinch-to-resize state
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private pinchInitialDist: number | null = null;
  private pinchInitialRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  private pinchCenter: { x: number; y: number } | null = null;
  private pinchElement: StoryElement | null = null;
  private pinchInitialTaskPositions: Map<
    string,
    { x: number; y: number }
  > | null = null;
  private readonly storyLayoutService = new StoryLayoutService();

  // Pinch-to-zoom state
  private pinchZoomInitialDist: number | null = null;
  private pinchZoomInitialScale: number = 1;
  private pinchZoomCenterScene: { x: number; y: number } | null = null;
  private animationFrameId: number | null = null;
  private isAnimationRunning: boolean = false;
  private readonly animationFpsCap = 45;
  private readonly animationFrameIntervalMs = 1000 / this.animationFpsCap;
  private nextAnimationFrameAtMs: number = 0;
  private readonly cullPaddingPx = 96;
  private drawQueued: boolean = false;
  private animationTimeMs: number = 0;
  private lastAnimationFrameMs: number = 0;
  private animationsEnabled: boolean = true;
  private smartGuidesEnabled: boolean = true;
  private readonly enablePerfLogging: boolean = CANVAS_PERF_LOG;
  private readonly perfLogIntervalMs: number = 1000;
  private perfStats = {
    lastLogMs: 0,
    frameCount: 0,
    totalDrawMs: 0,
    animatedTotal: 0,
    animatedVisible: 0,
  };
  private cachedElementsVersion = -1;
  private cachedShapes: IShape[] = [];
  private cachedPlanningElements: IPlanningElement[] = [];
  private cachedPlanningElementsSorted: IPlanningElement[] = [];
  private cachedTaskElements: TaskElement[] = [];
  private cachedGoalElements: GoalElement[] = [];
  private cachedConnectables: IConnectable[] = [];
  private cachedConnectableLookup: Map<string, IConnectable> = new Map();
  private readonly visibleConnectionsBuffer: IConnection[] = [];
  private readonly highlightedElementIds: Set<string> = new Set<string>();
  private goalProgressDirty = true;
  private loadingPlaceholders: CanvasLoadingPlaceholderRenderState[] = [];
  private readonly loadingPlaceholdersChangesSubject: Subject<void> =
    new Subject<void>();
  public readonly loadingPlaceholdersChanges$ =
    this.loadingPlaceholdersChangesSubject.asObservable();
  private readonly loadPhaseSubject = new BehaviorSubject<CanvasLoadPhase>(
    'idle'
  );
  public readonly loadPhase$ = this.loadPhaseSubject.asObservable();
  private sceneChangesSubscription: Subscription | null = null;
  private sceneFocusChangesSubscription: Subscription | null = null;
  private sceneHighlightChangesSubscription: Subscription | null = null;
  private readonly wheelHandler = (e: WheelEvent): void => this.onWheel(e);
  private readonly resizeHandler = (): void => this.onResize();
  private readonly mouseMoveHandler = (e: MouseEvent): void =>
    this.onMouseMove(e);
  private readonly mouseUpHandler = (e: MouseEvent): void => this.onMouseUp(e);
  private readonly doubleClickHandler = (e: MouseEvent): void =>
    this.onDoubleClick(e);
  private readonly contextMenuHandler = (e: MouseEvent): void =>
    this.onRightClick(e);
  private readonly windowContextMenuHandler = (e: MouseEvent): void =>
    this.onWindowContextMenu(e);
  private readonly windowMouseUpHandler = (e: MouseEvent): void =>
    this.onWindowMouseUp(e);
  private readonly pointerDownHandler = (e: PointerEvent): void =>
    this.onPointerDown(e);
  private readonly pointerMoveHandler = (e: PointerEvent): void =>
    this.onPointerMove(e);
  private readonly pointerUpHandler = (e: PointerEvent): void =>
    this.onPointerUp(e);
  private readonly gestureStartHandler = (e: Event): void =>
    this.onGestureStart(e as any);
  private readonly gestureChangeHandler = (e: Event): void =>
    this.onGestureChange(e as any);
  private readonly gestureEndHandler = (e: Event): void =>
    this.onGestureEnd(e as any);

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    // disable native touch gestures so pointer events work for drag/resize
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.scene = scene;
    this.scene.getHighlightedElementIds().forEach((id) =>
      this.highlightedElementIds.add(id)
    );
    this.animationsEnabled = CanvasClientStorage.getCanvasAnimationsEnabled(
      true
    );
    this.smartGuidesEnabled =
      CanvasClientStorage.getCanvasSmartGuidesEnabled(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.setupBackgroundLayer();
    this.panZoom = new PanZoomManager(canvas);
    this.renderer = new CanvasRenderer(this.panZoom);
    this.scrollbarManager = new ScrollbarManager(
      canvas,
      this.ctx,
      this.panZoom
    );
    this.interactionManager = new InteractionManager(
      canvas,
      scene,
      this.panZoom
    );
    this.interactionManager.setSmartGuidesEnabled(this.smartGuidesEnabled);
    this.keyboardManager = new KeyboardManager(scene, this);

    this.sceneChangesSubscription = this.scene.changes.subscribe(() => {
      this.goalProgressDirty = true;
      this.requestDraw();
    });
    this.sceneFocusChangesSubscription = this.scene.focusChanges.subscribe(() =>
      this.requestDraw()
    );
    this.sceneHighlightChangesSubscription =
      this.scene.highlightChanges.subscribe(({ addedIds, removedIds }) => {
        addedIds.forEach((id) => this.highlightedElementIds.add(id));
        removedIds.forEach((id) => this.highlightedElementIds.delete(id));
        this.requestDraw();
      });

    this.canvas.addEventListener('wheel', this.wheelHandler);
    window.addEventListener('resize', this.resizeHandler);

    // Comment out mouse events if using pointer events, to avoid conflicts
    // this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler);
    this.canvas.addEventListener('dblclick', this.doubleClickHandler);
    this.canvas.addEventListener('contextmenu', this.contextMenuHandler);
    window.addEventListener('contextmenu', this.windowContextMenuHandler, true);
    window.addEventListener('mouseup', this.windowMouseUpHandler);

    // Pointer events for touch/mobile support
    this.canvas.addEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.addEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.addEventListener('pointerup', this.pointerUpHandler);
    this.canvas.addEventListener('pointercancel', this.pointerUpHandler);

    // Gesture events (Mac Safari pinch-to-zoom)
    this.canvas.addEventListener(
      'gesturestart',
      this.gestureStartHandler as EventListener
    );
    this.canvas.addEventListener(
      'gesturechange',
      this.gestureChangeHandler as EventListener
    );
    this.canvas.addEventListener(
      'gestureend',
      this.gestureEndHandler as EventListener
    );

    this.resizeCanvas();
  }

  init(): void {
    this.requestDraw();
  }

  public destroy(): void {
    this.keyboardManager.destroy();
    this.sceneChangesSubscription?.unsubscribe();
    this.sceneChangesSubscription = null;
    this.sceneFocusChangesSubscription?.unsubscribe();
    this.sceneFocusChangesSubscription = null;
    this.sceneHighlightChangesSubscription?.unsubscribe();
    this.sceneHighlightChangesSubscription = null;

    this.canvas.removeEventListener('wheel', this.wheelHandler);
    window.removeEventListener('resize', this.resizeHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('dblclick', this.doubleClickHandler);
    this.canvas.removeEventListener('contextmenu', this.contextMenuHandler);
    window.removeEventListener(
      'contextmenu',
      this.windowContextMenuHandler,
      true
    );
    window.removeEventListener('mouseup', this.windowMouseUpHandler);
    this.canvas.removeEventListener('pointerdown', this.pointerDownHandler);
    this.canvas.removeEventListener('pointermove', this.pointerMoveHandler);
    this.canvas.removeEventListener('pointerup', this.pointerUpHandler);
    this.canvas.removeEventListener('pointercancel', this.pointerUpHandler);
    this.canvas.removeEventListener(
      'gesturestart',
      this.gestureStartHandler as EventListener
    );
    this.canvas.removeEventListener(
      'gesturechange',
      this.gestureChangeHandler as EventListener
    );
    this.canvas.removeEventListener(
      'gestureend',
      this.gestureEndHandler as EventListener
    );

    this.clearNativeContextMenuBlocker();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.renderer.clearBackgroundCache();
    if (this.backgroundCanvas) {
      this.backgroundCanvas.remove();
      this.backgroundCanvas = null;
      this.backgroundCtx = null;
    }
    this.isAnimationRunning = false;
    this.drawQueued = false;
  }

  resizeCanvas(): void {
    const width = Math.max(1, window.innerWidth - 2);
    const height = Math.max(1, window.innerHeight - 2);
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    if (this.backgroundCanvas) {
      this.backgroundCanvas.width = width;
      this.backgroundCanvas.height = height;
      this.backgroundCanvas.style.width = `${width}px`;
      this.backgroundCanvas.style.height = `${height}px`;
    }
    this.renderer.invalidateBackground();
    this.requestDraw();
  }

  onResize(): void {
    this.resizeCanvas();
  }

  draw(): void {
    const frameStartMs = performance.now();
    if (this.animationsEnabled) {
      this.panZoom.timeMs = this.getAnimationTimeMs(frameStartMs);
    } else {
      this.panZoom.timeMs = 0;
      this.animationTimeMs = 0;
      this.lastAnimationFrameMs = 0;
    }
    const viewMinX = this.panZoom.scrollX / this.panZoom.scale;
    const viewMinY = this.panZoom.scrollY / this.panZoom.scale;
    const viewMaxX =
      (this.panZoom.scrollX + this.canvas.width) / this.panZoom.scale;
    const viewMaxY =
      (this.panZoom.scrollY + this.canvas.height) / this.panZoom.scale;
    this.panZoom.viewBounds = {
      minX: viewMinX,
      minY: viewMinY,
      maxX: viewMaxX,
      maxY: viewMaxY,
    };
    const cullBounds = this.expandViewBounds(this.panZoom.viewBounds);
    this.panZoom.renderFlags = {
      showDetails: this.panZoom.scale >= SHOW_DETAILS_SCALE,
      showTaskText: this.panZoom.scale >= SHOW_TASK_TEXT_SCALE,
      showStoryText: this.panZoom.scale >= SHOW_STORY_TEXT_SCALE,
      showGoalText: this.panZoom.scale >= SHOW_GOAL_TEXT_SCALE,
      showAnim: this.animationsEnabled && this.panZoom.scale >= SHOW_ANIM_SCALE,
    };
    if (this.backgroundCtx) {
      this.renderer.drawBackground(
        this.backgroundCtx,
        this.canvas.width,
        this.canvas.height
      );
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Fallback path if layered background cannot be created in the DOM.
      this.renderer.invalidateBackground();
      this.renderer.drawBackground(this.ctx, this.canvas.width, this.canvas.height);
    }
    this.ctx.save();
    this.ctx.translate(-this.panZoom.scrollX, -this.panZoom.scrollY);
    this.ctx.scale(this.panZoom.scale, this.panZoom.scale);
    this.drawLoadingPlaceholders();

    const elementsVersion = this.scene.getElementsVersion();
    if (elementsVersion !== this.cachedElementsVersion) {
      const elements = this.scene.getElements();
      this.cachedShapes = this.scene.getShapes();
      this.cachedPlanningElements = elements.filter(
        isPlanningElement
      ) as IPlanningElement[];
      this.cachedPlanningElementsSorted = [...this.cachedPlanningElements].sort(
        (a, b) => a.zIndex - b.zIndex
      );
      this.cachedTaskElements = [];
      this.cachedGoalElements = [];
      this.cachedPlanningElements.forEach((element) => {
        if (element instanceof TaskElement) {
          this.cachedTaskElements.push(element);
        } else if (element instanceof GoalElement) {
          this.cachedGoalElements.push(element);
        }
      });
      this.cachedConnectables = [...this.cachedShapes, ...this.cachedPlanningElements];
      this.cachedConnectableLookup = this.buildConnectableLookup(
        this.cachedConnectables
      );
      this.goalProgressDirty = true;
      this.cachedElementsVersion = elementsVersion;
    }
    const shapes = this.cachedShapes;
    const planningEls = this.cachedPlanningElements;
    const planningElsSorted = this.cachedPlanningElementsSorted;
    const focusedId = this.scene.getFocusedElementId();
    planningEls.forEach((element) => {
      element.focused = element.id === focusedId;
      element.highlighted = this.highlightedElementIds.has(element.id);
    });
    const connectables = this.cachedConnectables;

    const connections = this.scene.getConnections();
    const visibleConnections = this.collectVisibleConnections(
      connections,
      this.cachedConnectableLookup,
      cullBounds
    );
    let animatedTotal = 0;
    let animatedVisibleCount = 0;
    planningEls.forEach((element) => {
      if (!('status' in element) || !hasStatusAnimation((element as any).status))
        return;
      animatedTotal += 1;
      if (this.isElementVisible(element, cullBounds)) {
        animatedVisibleCount += 1;
      }
    });
    const hasAnimatedStatus = animatedVisibleCount > 0;
    const hasAnimatedConnections = visibleConnections.some(
      (conn) =>
        conn.relationType === ConnectionRelationType.LeadsTo ||
        conn.relationType === ConnectionRelationType.ParentChild
    );
    const shouldAnimate =
      this.animationsEnabled &&
      (hasAnimatedConnections ||
        (this.panZoom.renderFlags.showAnim && hasAnimatedStatus));
    this.updateAnimationLoop(shouldAnimate);

    this.updateGoalLinksAndProgressIfNeeded(connections);

    // draw shapes
    shapes.forEach((shape) => {
      if (!this.isElementVisible(shape, cullBounds)) return;
      shape.draw(this.ctx, this.panZoom);
    });

    const resizePreviewByStoryId = new Map(
      this.interactionManager
        .getStoryResizePreviews()
        .map((preview) => [preview.storyId, preview] as const)
    );
    const taskReflowPreviewByTaskId =
      this.interactionManager.getTaskReflowPreviews();

    // draw planning elements in layer order with live drag/drop previews
    planningElsSorted.forEach((el) => {
      if (el instanceof StoryElement) {
        const preview = resizePreviewByStoryId.get(el.id);
        if (preview && preview.previewHeight > el.height) {
          if (
            !this.isElementVisible(el, cullBounds, {
              height: preview.previewHeight,
            })
          ) {
            return;
          }
          this.drawPlanningElementWithOverrides(el, {
            height: preview.previewHeight,
          });
          return;
        }
      }
      if (el instanceof TaskElement) {
        const preview = taskReflowPreviewByTaskId.get(el.id);
        if (preview) {
          if (
            !this.isElementVisible(el, cullBounds, {
              x: preview.x,
              y: preview.y,
            })
          ) {
            return;
          }
          this.drawPlanningElementWithOverrides(el, {
            x: preview.x,
            y: preview.y,
          });
          return;
        }
      }
      if (!this.isElementVisible(el, cullBounds)) return;
      el.draw(this.ctx, this.panZoom);
    });

    const taskDropPlaceholders =
      this.interactionManager.getTaskDropPlaceholders();
    if (taskDropPlaceholders.length > 0) {
      this.ctx.save();
      this.ctx.fillStyle = TASK_DROP_PLACEHOLDER_FILL;
      const radius = 24;
      taskDropPlaceholders.forEach((placeholder) => {
        this.ctx.beginPath();
        this.ctx.roundRect(
          placeholder.x,
          placeholder.y,
          placeholder.width,
          placeholder.height,
          radius
        );
        this.ctx.fill();
      });
      this.ctx.restore();
    }

    // highlight drop target when dragging connection
    if (this.interactionManager.isCreatingConnection) {
      const pad = 4 / this.panZoom.scale;
      connectables.forEach((el) => {
        if ((el as any).isHovered) {
          this.ctx.save();
          this.ctx.fillStyle = HOVER_OVERLAY_FILL;
          this.ctx.strokeStyle = HOVER_OUTLINE_COLOR;
          this.ctx.lineWidth = 2 / this.panZoom.scale;
          if ('radius' in el) {
            this.ctx.beginPath();
            this.ctx.arc(el.x, el.y, (el as any).radius + pad, 0, 2 * Math.PI);
          } else {
            this.ctx.beginPath();
            this.ctx.roundRect(
              (el as any).x - pad,
              (el as any).y - pad,
              (el as any).width + pad * 2,
              (el as any).height + pad * 2,
              6 / this.panZoom.scale
            );
          }
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.restore();
        }
      });
    }

    // draw connections between all connectable elements
    visibleConnections.forEach((conn) => {
      (conn as any).draw(this.ctx, this.panZoom, connectables);
    });

    const tempLine = this.interactionManager.getTempConnectionLine();
    if (tempLine) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(tempLine.startX, tempLine.startY);
      this.ctx.lineTo(tempLine.endX, tempLine.endY);
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.globalAlpha = 0.5;
      this.ctx.stroke();
      this.ctx.restore();
      // draw moving port marker at end
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(tempLine.endX, tempLine.endY, 8, 0, 2 * Math.PI);
      this.ctx.fillStyle = SELECT_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.restore();
    }

    const smartGuideLines = this.interactionManager.getSmartGuideLines();
    drawSmartGuides({
      ctx: this.ctx,
      guides: smartGuideLines,
      scale: this.panZoom.scale,
      color: SMART_GUIDE_COLOR,
      lineWidth: SMART_GUIDE_LINE_WIDTH,
    });

    // draw bounding box for multiple selected elements using geometryUtils
    const selectedEls = this.scene.getSelectedElements() as any[];
    if (selectedEls.length > 1) {
      const points: { x: number; y: number }[] = [];
      selectedEls.forEach((e: any) => {
        if (e.width !== undefined && e.height !== undefined) {
          points.push(
            { x: e.x, y: e.y },
            { x: e.x + e.width, y: e.y },
            { x: e.x, y: e.y + e.height },
            { x: e.x + e.width, y: e.y + e.height }
          );
        } else if (e.radius !== undefined) {
          points.push(
            { x: e.x - e.radius, y: e.y - e.radius },
            { x: e.x + e.radius, y: e.y + e.radius }
          );
        } else {
          points.push({ x: e.x, y: e.y });
        }
      });
      const { minX, minY, maxX, maxY } = getBoundingBox(points);
      this.ctx.save();
      this.ctx.setLineDash([]);
      this.ctx.strokeStyle = REGION_SELECT_BORDER_COLOR;
      this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      this.ctx.restore();
    }

    // region-select overlay
    const region = this.interactionManager.getRegionRect();
    if (region) {
      this.ctx.save();
      this.ctx.fillStyle = REGION_SELECT_FILL;
      this.ctx.fillRect(region.x, region.y, region.width, region.height);
      this.ctx.strokeStyle = REGION_SELECT_BORDER_COLOR;
      this.ctx.setLineDash([]);
      this.ctx.strokeRect(region.x, region.y, region.width, region.height);
      this.ctx.restore();
    }

    this.ctx.restore();
    this.scrollbarManager.drawScrollbars();
    this.updatePerfStats(
      performance.now() - frameStartMs,
      animatedTotal,
      animatedVisibleCount
    );
  }

  private drawPlanningElementWithOverrides(
    element: IPlanningElement,
    overrides: Partial<{ x: number; y: number; width: number; height: number }>
  ): void {
    const previewElement = Object.create(
      Object.getPrototypeOf(element)
    ) as IPlanningElement;
    Object.assign(previewElement, element, overrides);
    previewElement.draw(this.ctx, this.panZoom);
  }

  private drawLoadingPlaceholders(): void {
    if (this.loadingPlaceholders.length === 0) return;
    const scale = this.panZoom.scale || 1;
    this.loadingPlaceholders.forEach((placeholder) => {
      const x = placeholder.x;
      const y = placeholder.y;
      const width = Math.max(1, placeholder.width);
      const height = Math.max(1, placeholder.height);
      this.ctx.save();
      this.ctx.fillStyle = '#e5e7eb';
      this.ctx.setLineDash([]);
      if (placeholder.elementType === 'task') {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 24);
        this.ctx.fill();
      } else if (placeholder.elementType === 'story') {
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, 8);
        this.ctx.fill();
      } else {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        this.ctx.beginPath();
        this.drawGoalPath(centerX, centerY, radius);
        this.ctx.fill();
      }
      this.ctx.restore();

      if (!placeholder.isFocused) return;
      this.ctx.save();
      this.ctx.strokeStyle = FOCUS_COLOR;
      this.ctx.lineWidth = 2 / scale;
      this.ctx.setLineDash([]);
      this.ctx.beginPath();
      if (placeholder.elementType === 'task') {
        this.ctx.roundRect(x, y, width, height, 24);
      } else if (placeholder.elementType === 'story') {
        this.ctx.roundRect(x, y, width, height, 8);
      } else {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radius = Math.min(width, height) / 2;
        this.drawGoalPath(centerX, centerY, radius);
      }
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  private drawGoalPath(cx: number, cy: number, radius: number): void {
    const sides = 8;
    const angleStep = (Math.PI * 2) / sides;
    const angleOffset = -Math.PI / 2 - angleStep / 2;
    for (let i = 0; i < sides; i += 1) {
      const angle = angleOffset + angleStep * i;
      const pointX = cx + radius * Math.cos(angle);
      const pointY = cy + radius * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(pointX, pointY);
      } else {
        this.ctx.lineTo(pointX, pointY);
      }
    }
    this.ctx.closePath();
  }

  private setupBackgroundLayer(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const backgroundCanvas = document.createElement('canvas');
    const backgroundCtx = backgroundCanvas.getContext('2d');
    if (!backgroundCtx) return;

    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.position === 'static') {
      parent.style.position = 'relative';
    }

    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.zIndex = '1';

    backgroundCanvas.style.position = 'absolute';
    backgroundCanvas.style.left = '0';
    backgroundCanvas.style.top = '0';
    backgroundCanvas.style.zIndex = '0';
    backgroundCanvas.style.pointerEvents = 'none';
    backgroundCanvas.style.border = 'none';
    backgroundCanvas.style.display = 'block';

    parent.insertBefore(backgroundCanvas, this.canvas);
    this.backgroundCanvas = backgroundCanvas;
    this.backgroundCtx = backgroundCtx;
  }

  private getElementBounds(
    element: any,
    overrides: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
    }> = {}
  ): { x: number; y: number; width: number; height: number } | null {
    const x = overrides.x ?? element?.x;
    const y = overrides.y ?? element?.y;
    const width = overrides.width ?? element?.width;
    const height = overrides.height ?? element?.height;
    const radius = overrides.radius ?? element?.radius;

    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof width === 'number' &&
      typeof height === 'number'
    ) {
      return {
        x,
        y,
        width,
        height,
      };
    }
    if (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof radius === 'number'
    ) {
      return {
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
      };
    }
    return null;
  }

  private isElementVisible(
    element: any,
    viewBounds: ViewBounds | null,
    overrides: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
    }> = {}
  ): boolean {
    if (!viewBounds) return true;
    const bounds = this.getElementBounds(element, overrides);
    if (!bounds) return true;
    return isRectVisible(
      viewBounds,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
  }

  private expandViewBounds(viewBounds: ViewBounds | null): ViewBounds | null {
    if (!viewBounds) return null;
    const scale = this.panZoom.scale || 1;
    const padding = this.cullPaddingPx / scale;
    return {
      minX: viewBounds.minX - padding,
      minY: viewBounds.minY - padding,
      maxX: viewBounds.maxX + padding,
      maxY: viewBounds.maxY + padding,
    };
  }

  private buildConnectableLookup(
    connectables: IConnectable[]
  ): Map<string, IConnectable> {
    const lookup = new Map<string, IConnectable>();
    connectables.forEach((connectable) => {
      lookup.set(connectable.id, connectable);
      const uuid = (connectable as { uuid?: string }).uuid;
      if (uuid) {
        lookup.set(uuid, connectable);
      }
    });
    return lookup;
  }

  private collectVisibleConnections(
    connections: IConnection[],
    connectableLookup: Map<string, IConnectable>,
    viewBounds: ViewBounds | null
  ): IConnection[] {
    this.visibleConnectionsBuffer.length = 0;
    connections.forEach((connection) => {
      if (!this.isConnectionVisible(connection, connectableLookup, viewBounds))
        return;
      this.visibleConnectionsBuffer.push(connection);
    });
    return this.visibleConnectionsBuffer;
  }

  private getConnectionCurveBounds(
    connection: IConnection,
    from: IConnectable,
    to: IConnectable
  ): { x: number; y: number; width: number; height: number } | null {
    const curveConnection = connection as IConnection & {
      getCurvePoints?: (
        source: IConnectable,
        target: IConnectable
      ) => {
        start: { x: number; y: number };
        end: { x: number; y: number };
        cp1: { x: number; y: number };
        cp2: { x: number; y: number };
        isBezier: boolean;
      };
    };

    if (typeof curveConnection.getCurvePoints !== 'function') {
      const fromBounds = this.getElementBounds(from);
      const toBounds = this.getElementBounds(to);
      if (!fromBounds || !toBounds) return null;
      const minX = Math.min(fromBounds.x, toBounds.x);
      const minY = Math.min(fromBounds.y, toBounds.y);
      const maxX = Math.max(
        fromBounds.x + fromBounds.width,
        toBounds.x + toBounds.width
      );
      const maxY = Math.max(
        fromBounds.y + fromBounds.height,
        toBounds.y + toBounds.height
      );
      return {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
    }

    const curve = curveConnection.getCurvePoints(from, to);
    const controlPoints =
      connection.relationType === ConnectionRelationType.LeadsTo ||
      connection.relationType === ConnectionRelationType.ParentChild
        ? [curve.start, curve.end]
        : [curve.start, curve.end, curve.cp1, curve.cp2];
    const xs = controlPoints.map((point) => point.x);
    const ys = controlPoints.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  private isConnectionVisible(
    connection: IConnection,
    connectableLookup: Map<string, IConnectable>,
    viewBounds: ViewBounds | null
  ): boolean {
    if (!viewBounds) return true;
    const from = connectableLookup.get(connection.fromId);
    const to = connectableLookup.get(connection.toId);
    if (!from || !to) return false;

    // Keep the connection visible when one side is on screen and the other is off screen.
    if (
      this.isElementVisible(from, viewBounds) ||
      this.isElementVisible(to, viewBounds)
    ) {
      return true;
    }

    const curveBounds = this.getConnectionCurveBounds(connection, from, to);
    if (!curveBounds) return true;
    return isRectVisible(
      viewBounds,
      curveBounds.x,
      curveBounds.y,
      curveBounds.width,
      curveBounds.height
    );
  }

  private updateGoalLinksAndProgressIfNeeded(connections: IConnection[]): void {
    if (!this.goalProgressDirty) return;
    this.goalProgressDirty = false;
    if (this.cachedGoalElements.length === 0) return;

    const taskIds = new Set<string>();
    const taskDoneIds = new Set<string>();
    this.cachedTaskElements.forEach((task) => {
      taskIds.add(task.id);
      if (task.status === 'done') {
        taskDoneIds.add(task.id);
      }
    });

    const goalTaskLinks = new Map<string, Set<string>>();
    connections.forEach((connection) => {
      const from = this.cachedConnectableLookup.get(connection.fromId);
      const to = this.cachedConnectableLookup.get(connection.toId);
      if (!from || !to) return;
      const goal = from instanceof GoalElement ? from : to instanceof GoalElement ? to : null;
      const task = from instanceof TaskElement ? from : to instanceof TaskElement ? to : null;
      if (!goal || !task) return;
      if (!taskIds.has(task.id)) return;
      if (!goalTaskLinks.has(goal.id)) {
        goalTaskLinks.set(goal.id, new Set<string>());
      }
      goalTaskLinks.get(goal.id)!.add(task.id);
    });

    this.cachedGoalElements.forEach((goal) => {
      const linkedTaskIds = goalTaskLinks.get(goal.id);
      if (!linkedTaskIds || linkedTaskIds.size === 0) {
        goal.links = [];
        goal.progress = 0;
        return;
      }
      const links = Array.from(linkedTaskIds);
      goal.links = links;
      let doneCount = 0;
      links.forEach((taskId) => {
        if (taskDoneIds.has(taskId)) {
          doneCount += 1;
        }
      });
      goal.progress = doneCount / links.length;
    });
  }

  private requestDraw(): void {
    if (this.isAnimationRunning) return;
    if (this.drawQueued) return;
    this.drawQueued = true;
    requestAnimationFrame(() => {
      this.drawQueued = false;
      this.draw();
    });
  }

  private updatePerfStats(
    frameMs: number,
    animatedTotal: number,
    animatedVisible: number
  ): void {
    if (!this.enablePerfLogging) return;
    const now = performance.now();
    if (this.perfStats.lastLogMs === 0) {
      this.perfStats.lastLogMs = now;
    }
    this.perfStats.frameCount += 1;
    this.perfStats.totalDrawMs += frameMs;
    this.perfStats.animatedTotal = animatedTotal;
    this.perfStats.animatedVisible = animatedVisible;

    const elapsed = now - this.perfStats.lastLogMs;
    if (elapsed < this.perfLogIntervalMs) return;
    const avgDrawMs = this.perfStats.totalDrawMs / this.perfStats.frameCount;
    const fps = (this.perfStats.frameCount / elapsed) * 1000;
    const visibleRatio = animatedTotal
      ? (animatedVisible / animatedTotal) * 100
      : 0;
    console.log(
      `[canvas] avg draw ${avgDrawMs.toFixed(
        2
      )}ms | fps ${fps.toFixed(1)} | animated ${animatedVisible}/${animatedTotal} (${visibleRatio.toFixed(0)}%)`
    );

    this.perfStats.lastLogMs = now;
    this.perfStats.frameCount = 0;
    this.perfStats.totalDrawMs = 0;
  }

  private getAnimationTimeMs(now: number): number {
    if (this.lastAnimationFrameMs === 0) {
      this.lastAnimationFrameMs = now;
      this.animationTimeMs = now;
      return this.animationTimeMs;
    }
    const speed = Math.min(1.5, Math.max(0.5, this.panZoom.scale * 1.2));
    const delta = now - this.lastAnimationFrameMs;
    this.animationTimeMs += delta * speed;
    this.lastAnimationFrameMs = now;
    return this.animationTimeMs;
  }

  private startAnimationLoop(): void {
    if (this.isAnimationRunning) return;
    if (!this.animationsEnabled) return;
    this.isAnimationRunning = true;
    const tick = (now: number): void => {
      if (!this.isAnimationRunning) return;
      if (this.nextAnimationFrameAtMs === 0) {
        this.nextAnimationFrameAtMs = now;
      }
      if (now >= this.nextAnimationFrameAtMs) {
        this.draw();
        const behindBy = now - this.nextAnimationFrameAtMs;
        const stepsToAdvance =
          Math.floor(behindBy / this.animationFrameIntervalMs) + 1;
        this.nextAnimationFrameAtMs +=
          stepsToAdvance * this.animationFrameIntervalMs;
      }
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimationLoop(): void {
    if (!this.isAnimationRunning) return;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = null;
    this.isAnimationRunning = false;
    this.nextAnimationFrameAtMs = 0;
  }

  private updateAnimationLoop(shouldAnimate: boolean): void {
    if (shouldAnimate) {
      this.startAnimationLoop();
    } else {
      this.stopAnimationLoop();
    }
  }

  public getAnimationsEnabled(): boolean {
    return this.animationsEnabled;
  }

  public getSmartGuidesEnabled(): boolean {
    return this.smartGuidesEnabled;
  }

  public setAnimationsEnabled(enabled: boolean): void {
    if (this.animationsEnabled === enabled) return;
    this.animationsEnabled = enabled;
    CanvasClientStorage.setCanvasAnimationsEnabled(enabled);
    if (!enabled) {
      this.animationTimeMs = 0;
      this.lastAnimationFrameMs = 0;
      this.stopAnimationLoop();
    }
    this.requestDraw();
  }

  public setSmartGuidesEnabled(enabled: boolean): void {
    if (this.smartGuidesEnabled === enabled) return;
    this.smartGuidesEnabled = enabled;
    CanvasClientStorage.setCanvasSmartGuidesEnabled(enabled);
    this.interactionManager.setSmartGuidesEnabled(enabled);
    this.requestDraw();
  }

  private getSceneCoords(e: MouseEvent): { sceneX: number; sceneY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const sceneX = (mouseX + this.panZoom.scrollX) / this.panZoom.scale;
    const sceneY = (mouseY + this.panZoom.scrollY) / this.panZoom.scale;
    return { sceneX, sceneY };
  }

  // Додаємо метод для отримання координат
  public getLastMouseCoords(): { x: number; y: number } | null {
    return this.lastMouseCoords;
  }

  onMouseDown(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    // Update last mouse position for copy/paste placement
    this.lastMouseCoords = { x: sceneX, y: sceneY };

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.button === 2) {
      this.armNativeContextMenuBlocker();
      e.preventDefault();
      this.interactionManager.handleMouseDown(e, sceneX, sceneY);
      this.startRightPan(mouseX, mouseY);
      this.rightPanStartSceneX = sceneX;
      this.rightPanStartSceneY = sceneY;
      return;
    }

    const hit = this.scrollbarManager.hitTestScrollbars(mouseX, mouseY);
    if (hit === 'horizontal') {
      this.draggingScrollbar = 'horizontal';
      this.dragStartX = mouseX;
      this.dragStartScrollX = this.panZoom.scrollX;
      return;
    } else if (hit === 'vertical') {
      this.draggingScrollbar = 'vertical';
      this.dragStartY = mouseY;
      this.dragStartScrollY = this.panZoom.scrollY;
      return;
    }

    if (this.interactionManager.handleMouseDown(e, sceneX, sceneY)) {
      this.requestDraw();
    }
  }

  onMouseMove(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.lastMouseCoords = { x: sceneX, y: sceneY };

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.isRightPanning) {
      const deltaX = mouseX - this.rightPanStartX;
      const deltaY = mouseY - this.rightPanStartY;
      if (!this.rightPanActive) {
        const distance = Math.hypot(deltaX, deltaY);
        if (distance >= 4) {
          this.rightPanActive = true;
          this.canvas.style.cursor = 'grabbing';
        } else {
          return;
        }
      }
      this.panZoom.setScroll(
        this.rightPanStartScrollX - deltaX,
        this.rightPanStartScrollY - deltaY
      );
      this.requestDraw();
      return;
    }

    if (this.draggingScrollbar === 'horizontal') {
      const viewportWidth = this.canvas.width - this.panZoom.scrollbarWidth;
      const contentWidth = this.panZoom.virtualWidth * this.panZoom.scale;
      const scrollRange = contentWidth - viewportWidth;
      const deltaX = mouseX - this.dragStartX;
      const scrollRatio = scrollRange / viewportWidth;
      const nextScrollX = Math.max(
        0,
        Math.min(this.dragStartScrollX + deltaX * scrollRatio, scrollRange)
      );
      this.panZoom.setScroll(nextScrollX, this.panZoom.scrollY);
      this.requestDraw();
    } else if (this.draggingScrollbar === 'vertical') {
      const viewportHeight = this.canvas.height - this.panZoom.scrollbarWidth;
      const contentHeight = this.panZoom.virtualHeight * this.panZoom.scale;
      const scrollRange = contentHeight - viewportHeight;
      const deltaY = mouseY - this.dragStartY;
      const scrollRatio = scrollRange / viewportHeight;
      const nextScrollY = Math.max(
        0,
        Math.min(this.dragStartScrollY + deltaY * scrollRatio, scrollRange)
      );
      this.panZoom.setScroll(this.panZoom.scrollX, nextScrollY);
      this.requestDraw();
    } else {
      this.interactionManager.handleMouseMove(sceneX, sceneY, {
        disableSmartSnap: e.altKey,
      });
      this.requestDraw();
    }
  }

  onMouseUp(e: MouseEvent): void {
    if (this.isRightPanning) {
      e.preventDefault();
      if (!this.rightPanActive) {
        this.interactionManager.handleRightClick(
          e,
          this.rightPanStartSceneX,
          this.rightPanStartSceneY
        );
        this.suppressContextMenu = true;
      } else {
        this.suppressContextMenu = true;
      }
      this.endRightPan();
      this.requestDraw();
      return;
    }
    this.draggingScrollbar = null;
    this.interactionManager.handleMouseUp();
    this.requestDraw();
  }

  onDoubleClick(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.interactionManager.handleDoubleClick(sceneX, sceneY);
    this.requestDraw();
  }

  onRightClick(e: MouseEvent): void {
    e.preventDefault();
    if (this.suppressContextMenu) {
      this.suppressContextMenu = false;
      return;
    }
    if (!this.isRightPanning) {
      const { sceneX, sceneY } = this.getSceneCoords(e);
      this.interactionManager.handleRightClick(e, sceneX, sceneY);
      this.requestDraw();
    }
  }

  onClick(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.interactionManager.handleDoubleClick(sceneX, sceneY);
    this.requestDraw();
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.panZoom.handleWheelEvent(e, this.canvas, mouseX, mouseY);
    this.requestDraw();
  }

  // --- CanvasControls integration methods ---
  public zoomIn(): void {
    this.panZoom.zoomIn(this.canvas);
    this.requestDraw();
  }
  public zoomOut(): void {
    this.panZoom.zoomOut(this.canvas);
    this.requestDraw();
  }
  public setZoomScale(scale: number): void {
    this.panZoom.setScale(this.canvas, scale);
    this.requestDraw();
  }
  public centerCanvas(): void {
    this.panZoom.center(this.canvas);
    this.requestDraw();
  }

  public setScroll(scrollX: number, scrollY: number): void {
    this.panZoom.setScroll(scrollX, scrollY);
    this.requestDraw();
  }

  public centerOnScenePoint(sceneX: number, sceneY: number): void {
    const targetScrollX = sceneX * this.panZoom.scale - this.canvas.width / 2;
    const targetScrollY = sceneY * this.panZoom.scale - this.canvas.height / 2;
    this.setScroll(targetScrollX, targetScrollY);
  }

  public goToFocusedElement(): void {
    const focused = this.scene.getFocusedElement() as any;
    if (!focused) return;
    const bounds = this.getElementBounds(focused);
    if (!bounds) return;
    this.panZoom.scale = 1;
    const targetX = bounds.x + bounds.width / 2;
    const targetY = bounds.y;
    this.centerOnScenePoint(targetX, targetY);
  }

  public setLoadingPlaceholders(
    placeholders: CanvasLoadingPlaceholder[],
    focusedElementUuid: string | null = null
  ): void {
    const focused = focusedElementUuid ?? null;
    this.loadingPlaceholders = placeholders.map((placeholder) => ({
      ...placeholder,
      isFocused: Boolean(focused) && focused === placeholder.elementUuid,
    }));
    this.loadingPlaceholdersChangesSubject.next();
    this.requestDraw();
  }

  public clearLoadingPlaceholders(): void {
    if (this.loadingPlaceholders.length === 0) return;
    this.loadingPlaceholders = [];
    this.loadingPlaceholdersChangesSubject.next();
    this.requestDraw();
  }

  public getLoadingPlaceholders(): ReadonlyArray<CanvasLoadingElementPreview> {
    return this.loadingPlaceholders;
  }

  public getLoadPhase(): CanvasLoadPhase {
    return this.loadPhaseSubject.value;
  }

  public setLoadPhase(phase: CanvasLoadPhase): void {
    if (this.loadPhaseSubject.value === phase) return;
    this.loadPhaseSubject.next(phase);
  }

  /**
   * Add a canvas item to the scene
   * This works with the new adapter pattern (TaskCanvasAdapter, StoryCanvasAdapter, GoalCanvasAdapter)
   */
  public addElement(item: any): void {
    // Position new element at last mouse coords or center of viewport
    if ('x' in item && 'y' in item) {
      const coords = this.lastMouseCoords ?? {
        x: (this.canvas.width / 2 + this.panZoom.scrollX) / this.panZoom.scale,
        y: (this.canvas.height / 2 + this.panZoom.scrollY) / this.panZoom.scale,
      };
      item.x = coords.x;
      item.y = coords.y;
    }
    this.scene.addElement(item);
    this.requestDraw();
    console.log('Added item to canvas:', item);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getPanZoomManager(): PanZoomManager {
    return this.panZoom;
  }

  public getInteractionManager(): InteractionManager {
    return this.interactionManager;
  }

  public get isDraggingElements(): boolean {
    return this.interactionManager.isDraggingElements;
  }

  public get isResizingStory(): boolean {
    return (
      this.interactionManager.isResizingStory || this.pinchElement !== null
    );
  }

  private notifyInteractionStart(kind: 'drag' | 'resize'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('canvasInteractionStart', { detail: { kind } })
    );
  }

  private notifyInteractionEnd(kind: 'drag' | 'resize'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('canvasInteractionEnd', { detail: { kind } })
    );
  }

  private startRightPan(mouseX: number, mouseY: number): void {
    this.isRightPanning = true;
    this.rightPanActive = false;
    this.rightPanStartX = mouseX;
    this.rightPanStartY = mouseY;
    this.rightPanStartScrollX = this.panZoom.scrollX;
    this.rightPanStartScrollY = this.panZoom.scrollY;
    this.canvas.style.cursor = 'grab';
  }

  private endRightPan(): void {
    this.isRightPanning = false;
    this.rightPanActive = false;
    this.canvas.style.cursor = 'default';
  }

  private clearNativeContextMenuBlocker(): void {
    this.suppressNativeContextMenu = false;
    if (this.suppressNativeContextMenuTimer !== null) {
      window.clearTimeout(this.suppressNativeContextMenuTimer);
      this.suppressNativeContextMenuTimer = null;
    }
  }

  private isCanvasInteractiveForContextMenuSuppression(): boolean {
    if (!this.canvas.isConnected) return false;
    if (this.canvas.style.display === 'none') return false;
    if (this.canvas.style.pointerEvents === 'none') return false;
    return true;
  }

  private armNativeContextMenuBlocker(): void {
    this.suppressNativeContextMenu = true;
    if (this.suppressNativeContextMenuTimer !== null) {
      window.clearTimeout(this.suppressNativeContextMenuTimer);
    }
    this.suppressNativeContextMenuTimer = window.setTimeout(() => {
      this.suppressNativeContextMenu = false;
      this.suppressNativeContextMenuTimer = null;
    }, this.suppressNativeContextMenuMs);
  }

  private onWindowContextMenu(e: MouseEvent): void {
    if (!this.suppressNativeContextMenu) return;
    if (!this.isCanvasInteractiveForContextMenuSuppression()) {
      this.clearNativeContextMenuBlocker();
      return;
    }
    e.preventDefault();
    this.clearNativeContextMenuBlocker();
  }

  private onWindowMouseUp(e: MouseEvent): void {
    if (!this.isRightPanning) return;
    if (e.button !== 2) return;
    if (!this.rightPanActive) {
      this.interactionManager.handleRightClick(
        e,
        this.rightPanStartSceneX,
        this.rightPanStartSceneY
      );
    }
    this.suppressContextMenu = true;
    this.endRightPan();
    this.requestDraw();
  }

  // --- Touch / Pointer event handlers ---
  private onPointerDown(e: PointerEvent): void {
    // record pointer for pinch detection
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.activePointers.size === 2) {
      // two-finger gesture: either resize a Story or zoom canvas
      const [p1, p2] = Array.from(this.activePointers.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      // Story pinch-resize
      const selectedStories = this.scene
        .getSelectedElements()
        .filter((el) => el instanceof StoryElement) as StoryElement[];
      if (selectedStories.length === 1) {
        this.pinchElement = selectedStories[0];
        this.pinchInitialDist = dist;
        this.pinchInitialRect = {
          x: this.pinchElement.x,
          y: this.pinchElement.y,
          width: this.pinchElement.width,
          height: this.pinchElement.height,
        };
        this.pinchInitialTaskPositions = this.captureStoryTaskPositions(
          this.pinchElement
        );
        const rect = this.canvas.getBoundingClientRect();
        const midX = (p1.x + p2.x) / 2 - rect.left;
        const midY = (p1.y + p2.y) / 2 - rect.top;
        this.pinchCenter = {
          x: (midX + this.panZoom.scrollX) / this.panZoom.scale,
          y: (midY + this.panZoom.scrollY) / this.panZoom.scale,
        };
        this.notifyInteractionStart('resize');
      } else {
        // pinch-to-zoom
        this.pinchZoomInitialDist = dist;
        this.pinchZoomInitialScale = this.panZoom.scale;
        const rect = this.canvas.getBoundingClientRect();
        const midX = (p1.x + p2.x) / 2 - rect.left;
        const midY = (p1.y + p2.y) / 2 - rect.top;
        this.pinchZoomCenterScene = {
          x: (midX + this.panZoom.scrollX) / this.panZoom.scale,
          y: (midY + this.panZoom.scrollY) / this.panZoom.scale,
        };
      }
      // do not start normal drag
      return;
    }
    this.canvas.setPointerCapture(e.pointerId);
    this.onMouseDown(e as unknown as MouseEvent);
  }

  private onPointerMove(e: PointerEvent): void {
    // pinch-to-zoom handling
    if (
      this.pinchZoomInitialDist !== null &&
      this.activePointers.size >= 2 &&
      this.pinchZoomCenterScene
    ) {
      // update pointer coords
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [p1, p2] = Array.from(this.activePointers.values());
      const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      let newScale =
        this.pinchZoomInitialScale * (currDist / this.pinchZoomInitialDist!);
      // clamp scale
      const minScale = Math.max(
        (this.canvas.width - this.panZoom.scrollbarWidth) /
          this.panZoom.virtualWidth,
        (this.canvas.height - this.panZoom.scrollbarWidth) /
          this.panZoom.virtualHeight
      );
      newScale = Math.min(Math.max(newScale, minScale), 3);
      // compute screen center of pinch
      const rect = this.canvas.getBoundingClientRect();
      const midX = (p1.x + p2.x) / 2 - rect.left;
      const midY = (p1.y + p2.y) / 2 - rect.top;
      // update panZoom
      this.panZoom.scale = newScale;
      this.panZoom.scrollX = this.pinchZoomCenterScene.x * newScale - midX;
      this.panZoom.scrollY = this.pinchZoomCenterScene.y * newScale - midY;
      this.panZoom.clampScroll();
      this.requestDraw();
      return;
    }
    // then handle story pinch-resize
    if (
      this.pinchInitialDist !== null &&
      this.activePointers.size >= 2 &&
      this.pinchElement &&
      this.pinchInitialRect &&
      this.pinchCenter
    ) {
      // existing story resize logic...
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [p1, p2] = Array.from(this.activePointers.values());
      const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const scale = currDist / this.pinchInitialDist!;
      const newW = this.pinchInitialRect.width * scale;
      const newH = this.pinchInitialRect.height * scale;
      const story = this.pinchElement;
      const tasks = this.scene
        .getElements()
        .filter((el) => el instanceof TaskElement) as TaskElement[];
      const plan = this.storyLayoutService.planResize(
        story,
        tasks,
        Math.max(newW, 1),
        Math.max(newH, 1)
      );
      story.width = plan.nextWidth;
      story.height = plan.nextHeight;
      story.x = this.pinchCenter.x - plan.nextWidth / 2;
      story.y = this.pinchCenter.y - plan.nextHeight / 2;
      if (plan.positions.size > 0) {
        const taskById = new Map(tasks.map((task) => [task.id, task]));
        plan.positions.forEach((pos, id) => {
          const task = taskById.get(id);
          if (!task) return;
          task.x = pos.x;
          task.y = pos.y;
        });
        story.tasks = plan.orderedTasks;
      }
      this.scene.changes.next();
      return;
    }
    this.onMouseMove(e as unknown as MouseEvent);
  }

  private onPointerUp(e: PointerEvent): void {
    const pinchElement = this.pinchElement;
    const pinchInitialRect = this.pinchInitialRect;
    const hadPinchResize = this.pinchElement !== null;
    if (pinchElement && pinchInitialRect) {
      const movedTasks = this.getPinchMovedTasks();
      if (
        this.hasPinchChange(pinchElement, pinchInitialRect) ||
        movedTasks.length > 0
      ) {
        this.notifyPositionsDirty([pinchElement, ...movedTasks]);
      }
    }
    // clear story-resize pinch
    this.pinchInitialDist = null;
    this.pinchInitialRect = null;
    this.pinchCenter = null;
    this.pinchElement = null;
    this.pinchInitialTaskPositions = null;
    // clear pinch-to-zoom
    this.pinchZoomInitialDist = null;
    this.pinchZoomInitialScale = 1;
    this.pinchZoomCenterScene = null;
    this.onMouseUp(e as unknown as MouseEvent);
    if (hadPinchResize) {
      this.notifyInteractionEnd('resize');
    }
    this.canvas.releasePointerCapture(e.pointerId);
    // on mobile, treat tap as edit-modal open
    if (e.pointerType === 'touch') {
      this.onClick(e as unknown as MouseEvent);
    }
  }

  private notifyPositionsDirty(
    elements: Array<StoryElement | TaskElement>
  ): void {
    if (typeof window === 'undefined') return;
    if (elements.length === 0) return;
    window.dispatchEvent(
      new CustomEvent('canvasPositionsDirty', {
        detail: { elements },
      })
    );
  }

  private hasPinchChange(
    element: StoryElement,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    const epsilon = 0.01;
    return (
      Math.abs(element.x - rect.x) > epsilon ||
      Math.abs(element.y - rect.y) > epsilon ||
      Math.abs(element.width - rect.width) > epsilon ||
      Math.abs(element.height - rect.height) > epsilon
    );
  }

  private captureStoryTaskPositions(
    story: StoryElement
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const layoutTasks = this.storyLayoutService.getLayoutTasks(story, tasks);
    layoutTasks.forEach((task) => {
      positions.set(task.id, { x: task.x, y: task.y });
    });
    return positions;
  }

  private getPinchMovedTasks(): TaskElement[] {
    if (!this.pinchInitialTaskPositions) return [];
    if (this.pinchInitialTaskPositions.size === 0) return [];
    const tasks = this.scene
      .getElements()
      .filter((el) => el instanceof TaskElement) as TaskElement[];
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const moved: TaskElement[] = [];
    const epsilon = 0.01;
    this.pinchInitialTaskPositions.forEach((pos, id) => {
      const task = taskById.get(id);
      if (!task) return;
      const dx = Math.abs(task.x - pos.x);
      const dy = Math.abs(task.y - pos.y);
      if (dx <= epsilon && dy <= epsilon) return;
      moved.push(task);
    });
    return moved;
  }

  // --- Gesture event handlers for Safari pinch ---
  private gestureInitialScale: number = 1;
  private onGestureStart(e: any): void {
    e.preventDefault();
    this.gestureInitialScale = this.panZoom.scale;
  }
  private onGestureChange(e: any): void {
    e.preventDefault();
    let newScale = this.gestureInitialScale * e.scale;
    const minScale = Math.max(
      (this.canvas.width - this.panZoom.scrollbarWidth) /
        this.panZoom.virtualWidth,
      (this.canvas.height - this.panZoom.scrollbarWidth) /
        this.panZoom.virtualHeight
    );
    newScale = Math.min(Math.max(newScale, minScale), 3);
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const contentX = (centerX + this.panZoom.scrollX) / this.panZoom.scale;
    const contentY = (centerY + this.panZoom.scrollY) / this.panZoom.scale;
    this.panZoom.scale = newScale;
    this.panZoom.scrollX = contentX * newScale - centerX;
    this.panZoom.scrollY = contentY * newScale - centerY;
    this.requestDraw();
  }
  private onGestureEnd(e: any): void {
    e.preventDefault();
  }
}
