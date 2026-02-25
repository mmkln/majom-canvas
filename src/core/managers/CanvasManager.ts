// managers/CanvasManager.ts
import { Scene } from '../scene/Scene.ts';
import { PanZoomManager } from './PanZoomManager.ts';
import { ScrollbarManager } from './ScrollbarManager.ts';
import { CanvasRenderer } from './CanvasRenderer.ts';
import { InteractionManager } from './InteractionManager.ts';
import { KeyboardManager } from './KeyboardManager.ts';
import { isShape } from '../utils/typeGuards.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';
import type { IShape } from '../interfaces/shape.ts';
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
} from '../constants.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';
import { hasStatusAnimation } from '../../elements/utils/statusAnimations.ts';
import { CANVAS_PERF_LOG } from '../../config/env/index.ts';
import { isCircleVisible, isRectVisible } from '../utils/viewBounds.ts';
import { BehaviorSubject, Subject } from 'rxjs';
import type {
  CanvasLoadPhase,
  CanvasLoadingPlaceholder,
} from '../types/canvasLoading.ts';

type CanvasLoadingPlaceholderRenderState = CanvasLoadingPlaceholder & {
  isFocused: boolean;
};

export type CanvasLoadingElementPreview = CanvasLoadingPlaceholderRenderState;

export class CanvasManager {
  canvas: HTMLCanvasElement;
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
  private pinchInitialTaskPositions: Map<string, { x: number; y: number }> | null =
    null;
  private readonly storyLayoutService = new StoryLayoutService();

  // Pinch-to-zoom state
  private pinchZoomInitialDist: number | null = null;
  private pinchZoomInitialScale: number = 1;
  private pinchZoomCenterScene: { x: number; y: number } | null = null;
  private animationFrameId: number | null = null;
  private isAnimationRunning: boolean = false;
  private drawQueued: boolean = false;
  private animationTimeMs: number = 0;
  private lastAnimationFrameMs: number = 0;
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
  private loadingPlaceholders: CanvasLoadingPlaceholderRenderState[] = [];
  private readonly loadingPlaceholdersChangesSubject: Subject<void> =
    new Subject<void>();
  public readonly loadingPlaceholdersChanges$ =
    this.loadingPlaceholdersChangesSubject.asObservable();
  private readonly loadPhaseSubject = new BehaviorSubject<CanvasLoadPhase>('idle');
  public readonly loadPhase$ = this.loadPhaseSubject.asObservable();

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    // disable native touch gestures so pointer events work for drag/resize
    this.canvas.style.touchAction = 'none';
    this.canvas.style.userSelect = 'none';
    this.scene = scene;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.panZoom = new PanZoomManager(canvas);
    this.renderer = new CanvasRenderer(this.ctx, this.panZoom);
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
    this.keyboardManager = new KeyboardManager(scene, this);

    this.scene.changes.subscribe(() => this.requestDraw());
    this.scene.focusChanges.subscribe(() => this.requestDraw());
    this.scene.highlightChanges.subscribe(() => this.requestDraw());

    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));

    // Comment out mouse events if using pointer events, to avoid conflicts
    // this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onRightClick.bind(this));
    window.addEventListener(
      'contextmenu',
      this.onWindowContextMenu.bind(this),
      true
    );
    window.addEventListener('mouseup', this.onWindowMouseUp.bind(this));

    // Pointer events for touch/mobile support
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));

    // Gesture events (Mac Safari pinch-to-zoom)
    (this.canvas as any).addEventListener(
      'gesturestart',
      this.onGestureStart.bind(this)
    );
    (this.canvas as any).addEventListener(
      'gesturechange',
      this.onGestureChange.bind(this)
    );
    (this.canvas as any).addEventListener(
      'gestureend',
      this.onGestureEnd.bind(this)
    );

    this.resizeCanvas();
  }

  init(): void {
    this.requestDraw();
  }

  resizeCanvas(): void {
    this.canvas.width = window.innerWidth - 2;
    this.canvas.height = window.innerHeight - 2;
    this.requestDraw();
  }

  onResize(): void {
    this.resizeCanvas();
  }

  draw(): void {
    const frameStartMs = performance.now();
    this.panZoom.timeMs = this.getAnimationTimeMs(frameStartMs);
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
    this.panZoom.renderFlags = {
      showDetails: this.panZoom.scale >= SHOW_DETAILS_SCALE,
      showTaskText: this.panZoom.scale >= SHOW_TASK_TEXT_SCALE,
      showStoryText: this.panZoom.scale >= SHOW_STORY_TEXT_SCALE,
      showGoalText: this.panZoom.scale >= SHOW_GOAL_TEXT_SCALE,
      showAnim: this.panZoom.scale >= SHOW_ANIM_SCALE,
    };
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-this.panZoom.scrollX, -this.panZoom.scrollY);
    this.ctx.scale(this.panZoom.scale, this.panZoom.scale);

    this.renderer.drawContent();
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
      this.cachedElementsVersion = elementsVersion;
    }
    const shapes = this.cachedShapes;
    const planningEls = this.cachedPlanningElements;
    const planningElsSorted = this.cachedPlanningElementsSorted;
    const focusedId = this.scene.getFocusedElementId();
    const highlightedIds = new Set(this.scene.getHighlightedElementIds());
    planningEls.forEach((element) => {
      element.focused = element.id === focusedId;
      element.highlighted = highlightedIds.has(element.id);
    });
    const connectables = [...shapes, ...planningEls];

    const connections = this.scene.getConnections();
    const viewBounds = this.panZoom.viewBounds;
    const isVisible = (el: any): boolean => {
      if (!viewBounds) return true;
      if (typeof el.width === 'number' && typeof el.height === 'number') {
        return isRectVisible(viewBounds, el.x, el.y, el.width, el.height);
      }
      if (typeof el.radius === 'number') {
        return isCircleVisible(viewBounds, el.x, el.y, el.radius);
      }
      return true;
    };
    const animatedElements = planningEls.filter(
      (el) => 'status' in el && hasStatusAnimation((el as any).status)
    );
    const animatedVisible = animatedElements.filter((el) => isVisible(el));
    const hasAnimatedStatus = animatedVisible.length > 0;
    const hasAnimatedConnections = connections.some(
      (conn) =>
        conn.relationType === ConnectionRelationType.LeadsTo ||
        conn.relationType === ConnectionRelationType.ParentChild
    );
    const shouldAnimate =
      hasAnimatedConnections ||
      (this.panZoom.renderFlags.showAnim && hasAnimatedStatus);
    this.updateAnimationLoop(shouldAnimate);

    // Update goal links and progress (only track task relations)
    planningEls
      .filter((el) => el instanceof GoalElement)
      .forEach((goal: GoalElement) => {
        const linkedIds = connections
          .map((c) => ({
            from: c.fromId,
            to: c.toId,
          }))
          .filter((c) => c.from === goal.id || c.to === goal.id)
          .map((c) => (c.from === goal.id ? c.to : c.from));
        const taskEls = planningEls.filter(
          (el) => el instanceof TaskElement
        ) as TaskElement[];
        const taskIds = new Set(taskEls.map((t) => t.id));
        goal.links = Array.from(new Set(linkedIds)).filter((id) =>
          taskIds.has(id)
        );
        const linkedTasks = taskEls.filter(
          (t) => goal.links.indexOf(t.id) !== -1
        );
        goal.progress = linkedTasks.length
          ? linkedTasks.filter((t) => t.status === 'done').length /
            linkedTasks.length
          : 0;
      });

    // draw shapes
    shapes.forEach((shape) => shape.draw(this.ctx, this.panZoom));

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
          this.drawPlanningElementWithOverrides(el, {
            height: preview.previewHeight,
          });
          return;
        }
      }
      if (el instanceof TaskElement) {
        const preview = taskReflowPreviewByTaskId.get(el.id);
        if (preview) {
          this.drawPlanningElementWithOverrides(el, {
            x: preview.x,
            y: preview.y,
          });
          return;
        }
      }
      el.draw(this.ctx, this.panZoom);
    });

    const taskDropPlaceholders = this.interactionManager.getTaskDropPlaceholders();
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
    (this.scene.getConnections() as IConnection[]).forEach((conn) => {
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
      animatedElements.length,
      animatedVisible.length
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
        this.drawHexPath(centerX, centerY, radius);
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
        this.drawHexPath(centerX, centerY, radius);
      }
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  private drawHexPath(cx: number, cy: number, radius: number): void {
    const angleOffset = -Math.PI / 2;
    for (let i = 0; i < 6; i += 1) {
      const angle = angleOffset + (Math.PI / 3) * i;
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

  private getElementBounds(
    element: any
  ): { x: number; y: number; width: number; height: number } | null {
    if (
      typeof element?.x === 'number' &&
      typeof element?.y === 'number' &&
      typeof element?.width === 'number' &&
      typeof element?.height === 'number'
    ) {
      return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
    }
    if (
      typeof element?.x === 'number' &&
      typeof element?.y === 'number' &&
      typeof element?.radius === 'number'
    ) {
      return {
        x: element.x - element.radius,
        y: element.y - element.radius,
        width: element.radius * 2,
        height: element.radius * 2,
      };
    }
    return null;
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
    this.isAnimationRunning = true;
    const tick = (): void => {
      if (!this.isAnimationRunning) return;
      this.draw();
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
  }

  private updateAnimationLoop(shouldAnimate: boolean): void {
    if (shouldAnimate) {
      this.startAnimationLoop();
    } else {
      this.stopAnimationLoop();
    }
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
      this.interactionManager.handleMouseMove(sceneX, sceneY);
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
      isFocused:
        Boolean(focused) && focused === placeholder.elementUuid,
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
    return this.interactionManager.isResizingStory || this.pinchElement !== null;
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
    e.preventDefault();
    this.suppressNativeContextMenu = false;
    if (this.suppressNativeContextMenuTimer !== null) {
      window.clearTimeout(this.suppressNativeContextMenuTimer);
      this.suppressNativeContextMenuTimer = null;
    }
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
        this.pinchInitialTaskPositions =
          this.captureStoryTaskPositions(this.pinchElement);
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
