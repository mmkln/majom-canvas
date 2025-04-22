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
import type { IConnection } from '../interfaces/connection.ts';
import { SELECT_COLOR, HOVER_OVERLAY_FILL, HOVER_OUTLINE_COLOR, REGION_SELECT_BORDER_COLOR, REGION_SELECT_FILL } from '../constants.ts';
import { Task } from '../../elements/Task.ts';
import { Goal } from '../../elements/Goal.ts';
import { Story } from '../../elements/Story.ts';
import { getBoundingBox } from '../utils/geometryUtils.ts';

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
  private lastMouseCoords: { x: number; y: number } | null = null;

  // Multi-touch pinch-to-resize state
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private pinchInitialDist: number | null = null;
  private pinchInitialRect: { x: number; y: number; width: number; height: number } | null = null;
  private pinchCenter: { x: number; y: number } | null = null;
  private pinchElement: Story | null = null;

  // Pinch-to-zoom state
  private pinchZoomInitialDist: number | null = null;
  private pinchZoomInitialScale: number = 1;
  private pinchZoomCenterScene: { x: number; y: number } | null = null;

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

    this.scene.changes.subscribe(() => this.draw());

    this.canvas.addEventListener('wheel', this.onWheel.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));

    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    this.canvas.addEventListener('contextmenu', this.onRightClick.bind(this));

    // Pointer events for touch/mobile support
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));

    // Gesture events (Mac Safari pinch-to-zoom)
    (this.canvas as any).addEventListener('gesturestart', this.onGestureStart.bind(this));
    (this.canvas as any).addEventListener('gesturechange', this.onGestureChange.bind(this));
    (this.canvas as any).addEventListener('gestureend', this.onGestureEnd.bind(this));

    this.resizeCanvas();
  }

  init(): void {
    this.draw();
  }

  resizeCanvas(): void {
    this.canvas.width = window.innerWidth - 2;
    this.canvas.height = window.innerHeight - 2;
    this.draw();
  }

  onResize(): void {
    this.resizeCanvas();
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-this.panZoom.scrollX, -this.panZoom.scrollY);
    this.ctx.scale(this.panZoom.scale, this.panZoom.scale);

    this.renderer.drawContent();

    const elements = this.scene.getElements();
    const shapes = this.scene.getShapes();
    const planningEls = elements.filter(isPlanningElement) as IPlanningElement[];
    const connectables = [...shapes, ...planningEls];

    const connections = this.scene.getConnections();

    // Update goal links and progress
    planningEls.filter(el => el instanceof Goal).forEach((goal: Goal) => {
      const linkedIds = connections
        .filter(c => c.fromId === goal.id || c.toId === goal.id)
        .map(c => c.fromId === goal.id ? c.toId : c.fromId);
      goal.links = Array.from(new Set(linkedIds));
      const taskEls = planningEls.filter(el => el instanceof Task) as Task[];
      const linkedTasks = taskEls.filter(t => goal.links.indexOf(t.id) !== -1);
      goal.progress = linkedTasks.length
        ? linkedTasks.filter(t => t.status === 'done').length / linkedTasks.length
        : 0;
    });

    // draw shapes
    shapes.forEach(shape => shape.draw(this.ctx, this.panZoom));

    // draw planning elements in layer order
    planningEls
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(el => el.draw(this.ctx, this.panZoom));

    // highlight drop target when dragging connection
    if (this.interactionManager.isCreatingConnection) {
      const pad = 4 / this.panZoom.scale;
      connectables.forEach(el => {
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
      this.draw();
    }
  }

  onMouseMove(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.lastMouseCoords = { x: sceneX, y: sceneY };

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.draggingScrollbar === 'horizontal') {
      const viewportWidth = this.canvas.width - this.panZoom.scrollbarWidth;
      const contentWidth = this.panZoom.virtualWidth * this.panZoom.scale;
      const scrollRange = contentWidth - viewportWidth;
      const deltaX = mouseX - this.dragStartX;
      const scrollRatio = scrollRange / viewportWidth;
      this.panZoom.scrollX = Math.max(
        0,
        Math.min(this.dragStartScrollX + deltaX * scrollRatio, scrollRange)
      );
      this.draw();
    } else if (this.draggingScrollbar === 'vertical') {
      const viewportHeight = this.canvas.height - this.panZoom.scrollbarWidth;
      const contentHeight = this.panZoom.virtualHeight * this.panZoom.scale;
      const scrollRange = contentHeight - viewportHeight;
      const deltaY = mouseY - this.dragStartY;
      const scrollRatio = scrollRange / viewportHeight;
      this.panZoom.scrollY = Math.max(
        0,
        Math.min(this.dragStartScrollY + deltaY * scrollRatio, scrollRange)
      );
      this.draw();
    } else {
      this.interactionManager.handleMouseMove(sceneX, sceneY);
      this.draw();
    }
  }

  onMouseUp(e: MouseEvent): void {
    this.draggingScrollbar = null;
    this.interactionManager.handleMouseUp();
    this.draw();
  }

  onDoubleClick(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.interactionManager.handleDoubleClick(sceneX, sceneY);
    this.draw();
  }

  onRightClick(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.interactionManager.handleRightClick(e, sceneX, sceneY);
    this.draw();
  }

  onClick(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);
    this.interactionManager.handleDoubleClick(sceneX, sceneY);
    this.draw();
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    this.panZoom.handleWheelEvent(e, this.canvas, mouseX, mouseY);
    this.draw();
  }

  // --- CanvasControls integration methods ---
  public zoomIn(): void {
    this.panZoom.zoomIn(this.canvas);
    this.draw();
  }
  public zoomOut(): void {
    this.panZoom.zoomOut(this.canvas);
    this.draw();
  }
  public centerCanvas(): void {
    this.panZoom.center(this.canvas);
    this.draw();
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
        y: (this.canvas.height / 2 + this.panZoom.scrollY) / this.panZoom.scale
      };
      item.x = coords.x;
      item.y = coords.y;
    }
    this.scene.addElement(item);
    this.draw();
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

  // --- Touch / Pointer event handlers ---
  private onPointerDown(e: PointerEvent): void {
    // record pointer for pinch detection
    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.activePointers.size === 2) {
      // two-finger gesture: either resize a Story or zoom canvas
      const [p1, p2] = Array.from(this.activePointers.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      // Story pinch-resize
      const selectedStories = this.scene.getSelectedElements().filter(el => el instanceof Story) as Story[];
      if (selectedStories.length === 1) {
        this.pinchElement = selectedStories[0];
        this.pinchInitialDist = dist;
        this.pinchInitialRect = { x: this.pinchElement.x, y: this.pinchElement.y, width: this.pinchElement.width, height: this.pinchElement.height };
        const rect = this.canvas.getBoundingClientRect();
        const midX = ((p1.x + p2.x) / 2) - rect.left;
        const midY = ((p1.y + p2.y) / 2) - rect.top;
        this.pinchCenter = {
          x: (midX + this.panZoom.scrollX) / this.panZoom.scale,
          y: (midY + this.panZoom.scrollY) / this.panZoom.scale
        };
      } else {
        // pinch-to-zoom
        this.pinchZoomInitialDist = dist;
        this.pinchZoomInitialScale = this.panZoom.scale;
        const rect = this.canvas.getBoundingClientRect();
        const midX = ((p1.x + p2.x) / 2) - rect.left;
        const midY = ((p1.y + p2.y) / 2) - rect.top;
        this.pinchZoomCenterScene = {
          x: (midX + this.panZoom.scrollX) / this.panZoom.scale,
          y: (midY + this.panZoom.scrollY) / this.panZoom.scale
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
    if (this.pinchZoomInitialDist !== null && this.activePointers.size >= 2 && this.pinchZoomCenterScene) {
      // update pointer coords
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [p1, p2] = Array.from(this.activePointers.values());
      const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      let newScale = this.pinchZoomInitialScale * (currDist / this.pinchZoomInitialDist!);
      // clamp scale
      const minScale = Math.max((this.canvas.width - this.panZoom.scrollbarWidth) / this.panZoom.virtualWidth, (this.canvas.height - this.panZoom.scrollbarWidth) / this.panZoom.virtualHeight);
      newScale = Math.min(Math.max(newScale, minScale), 3);
      // compute screen center of pinch
      const rect = this.canvas.getBoundingClientRect();
      const midX = ((p1.x + p2.x) / 2) - rect.left;
      const midY = ((p1.y + p2.y) / 2) - rect.top;
      // update panZoom
      this.panZoom.scale = newScale;
      this.panZoom.scrollX = this.pinchZoomCenterScene.x * newScale - midX;
      this.panZoom.scrollY = this.pinchZoomCenterScene.y * newScale - midY;
      this.panZoom.clampScroll();
      this.draw();
      return;
    }
    // then handle story pinch-resize
    if (this.pinchInitialDist !== null && this.activePointers.size >= 2 && this.pinchElement && this.pinchInitialRect && this.pinchCenter) {
      // existing story resize logic...
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [p1, p2] = Array.from(this.activePointers.values());
      const currDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const scale = currDist / this.pinchInitialDist!;
      const newW = this.pinchInitialRect.width * scale;
      const newH = this.pinchInitialRect.height * scale;
      this.pinchElement.width = Math.max(newW, 1);
      this.pinchElement.height = Math.max(newH, 1);
      this.pinchElement.x = this.pinchCenter.x - newW / 2;
      this.pinchElement.y = this.pinchCenter.y - newH / 2;
      this.scene.changes.next();
      return;
    }
    this.onMouseMove(e as unknown as MouseEvent);
  }

  private onPointerUp(e: PointerEvent): void {
    // clear story-resize pinch
    this.pinchInitialDist = null;
    this.pinchInitialRect = null;
    this.pinchCenter = null;
    this.pinchElement = null;
    // clear pinch-to-zoom
    this.pinchZoomInitialDist = null;
    this.pinchZoomInitialScale = 1;
    this.pinchZoomCenterScene = null;
    this.onMouseUp(e as unknown as MouseEvent);
    this.canvas.releasePointerCapture(e.pointerId);
    // on mobile, treat tap as edit-modal open
    if (e.pointerType === 'touch') {
      this.onClick(e as unknown as MouseEvent);
    }
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
    const minScale = Math.max((this.canvas.width - this.panZoom.scrollbarWidth) / this.panZoom.virtualWidth, (this.canvas.height - this.panZoom.scrollbarWidth) / this.panZoom.virtualHeight);
    newScale = Math.min(Math.max(newScale, minScale), 3);
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const contentX = (centerX + this.panZoom.scrollX) / this.panZoom.scale;
    const contentY = (centerY + this.panZoom.scrollY) / this.panZoom.scale;
    this.panZoom.scale = newScale;
    this.panZoom.scrollX = contentX * newScale - centerX;
    this.panZoom.scrollY = contentY * newScale - centerY;
    this.draw();
  }
  private onGestureEnd(e: any): void {
    e.preventDefault();
  }
}
