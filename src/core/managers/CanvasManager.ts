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
import { SELECT_COLOR, HOVER_OVERLAY_FILL, HOVER_OUTLINE_COLOR } from '../constants.ts';

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

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
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
      this.ctx.lineWidth = 2 / this.panZoom.scale;
      this.ctx.setLineDash([5 / this.panZoom.scale, 5 / this.panZoom.scale]); // Пунктирна лінія
      this.ctx.globalAlpha = 0.5; // Напівпрозора
      this.ctx.stroke();
      this.ctx.restore();
      // draw moving port marker at end
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(tempLine.endX, tempLine.endY, 8 / this.panZoom.scale, 0, 2 * Math.PI);
      this.ctx.fillStyle = SELECT_COLOR;
      this.ctx.fill();
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 1 / this.panZoom.scale;
      this.ctx.stroke();
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
    this.lastMouseCoords = { x: sceneX, y: sceneY }; // Оновлюємо координати
    return { sceneX, sceneY };
  }

  // Додаємо метод для отримання координат
  public getLastMouseCoords(): { x: number; y: number } | null {
    return this.lastMouseCoords;
  }

  onMouseDown(e: MouseEvent): void {
    const { sceneX, sceneY } = this.getSceneCoords(e);

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
    // Add the canvas item to the scene
    this.scene.addElement(item);
    
    // Trigger redraw
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
}
