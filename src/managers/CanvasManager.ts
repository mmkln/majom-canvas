// managers/CanvasManager.ts
import { Scene } from '../core/scene/Scene';
import { PanZoomManager } from './PanZoomManager';
import { ScrollbarManager } from './ScrollbarManager';
import { CanvasRenderer } from './CanvasRenderer';

export class CanvasManager {
  canvas: HTMLCanvasElement;
  scene: Scene;
  ctx: CanvasRenderingContext2D;

  panZoom: PanZoomManager;
  scrollbarManager: ScrollbarManager;
  renderer: CanvasRenderer;

  draggingScrollbar: 'horizontal' | 'vertical' | null = null;
  dragStartX: number = 0;
  dragStartY: number = 0;
  dragStartScrollX: number = 0;
  dragStartScrollY: number = 0;

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    // Initialize the specialized managers
    this.panZoom = new PanZoomManager(canvas);
    this.renderer = new CanvasRenderer(this.ctx, this.panZoom);
    this.scrollbarManager = new ScrollbarManager(
      canvas,
      this.ctx,
      this.panZoom
    );

    // Підписуємося на зміни в сцені за допомогою RxJS
    this.scene.changes.subscribe(() => {
      this.draw();
    });

    // Bind event handlers
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onWheel = this.onWheel.bind(this);

    this.resizeCanvas();
  }

  init(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel);
    window.addEventListener('resize', this.onResize);
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

    // Save context state, apply pan/zoom
    this.ctx.save();
    this.ctx.translate(-this.panZoom.scrollX, -this.panZoom.scrollY);
    this.ctx.scale(this.panZoom.scale, this.panZoom.scale);

    // Draw static content (e.g. grid)
    this.renderer.drawContent();

    // Draw scene elements
    this.scene.getElements().forEach((element) => {
      if (typeof element.draw === 'function') {
        element.draw(this.ctx);
      }
    });

    this.ctx.restore();

    // Draw UI elements like scrollbars
    this.scrollbarManager.drawScrollbars();
  }

  onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const hit = this.scrollbarManager.hitTestScrollbars(mouseX, mouseY);
    if (hit === 'horizontal') {
      this.draggingScrollbar = 'horizontal';
      this.dragStartX = mouseX;
      this.dragStartScrollX = this.panZoom.scrollX;
    } else if (hit === 'vertical') {
      this.draggingScrollbar = 'vertical';
      this.dragStartY = mouseY;
      this.dragStartScrollY = this.panZoom.scrollY;
    }
  }

  onMouseMove(e: MouseEvent): void {
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
    }
  }

  onMouseUp(): void {
    this.draggingScrollbar = null;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey) {
      // Zooming
      const zoomFactor = Math.pow(1.001, -e.deltaY);
      const oldScale = this.panZoom.scale;
      let newScale = oldScale * zoomFactor;
      const viewportWidth = this.canvas.width - this.panZoom.scrollbarWidth;
      const viewportHeight = this.canvas.height - this.panZoom.scrollbarWidth;
      const minScale = Math.max(
        viewportWidth / this.panZoom.virtualWidth,
        viewportHeight / this.panZoom.virtualHeight
      );
      const maxScale = 3;
      newScale = Math.min(Math.max(newScale, minScale), maxScale);
      const contentX = (mouseX + this.panZoom.scrollX) / oldScale;
      const contentY = (mouseY + this.panZoom.scrollY) / oldScale;
      this.panZoom.scale = newScale;
      this.panZoom.scrollX = contentX * newScale - mouseX;
      this.panZoom.scrollY = contentY * newScale - mouseY;
    } else {
      // Panning with wheel
      this.panZoom.scrollX += e.deltaX;
      this.panZoom.scrollY += e.deltaY;
    }
    this.panZoom.clampScroll();
    this.draw();
  }
}
