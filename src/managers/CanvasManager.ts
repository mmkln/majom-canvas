import { Scene } from '../core/scene/Scene';

export class CanvasManager {
  canvas: HTMLCanvasElement;
  scene: Scene;
  ctx: CanvasRenderingContext2D;
  scrollX: number = 0; // Horizontal scroll position
  scrollY: number = 0; // Vertical scroll position
  scale: number = 1; // Zoom level (optional feature)
  virtualWidth: number = 3000; // Virtual content width
  virtualHeight: number = 2000; // Virtual content height
  scrollbarWidth: number = 6; // Width/height of scrollbar
  draggingScrollbar: 'horizontal' | 'vertical' | null = null; // Track scrollbar dragging
  dragStartX: number = 0; // Mouse X at start of drag
  dragStartY: number = 0; // Mouse Y at start of drag
  dragStartScrollX: number = 0; // Scroll X at start of drag
  dragStartScrollY: number = 0; // Scroll Y at start of drag

  constructor(canvas: HTMLCanvasElement, scene: Scene) {
    this.canvas = canvas;
    this.scene = scene;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

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
    this.canvas.width = window.innerWidth - 2; // Account for border
    this.canvas.height = window.innerHeight - 2;
    this.draw();
  }

  onResize(): void {
    this.resizeCanvas();
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply scroll and scale transformations
    this.ctx.translate(-this.scrollX, -this.scrollY);
    this.ctx.scale(this.scale, this.scale);

    // Draw your content (e.g., grid, shapes)
    this.drawContent();

    // Restore context to draw UI elements like scrollbars unscaled
    this.ctx.restore();

    // Draw scrollbars
    this.drawScrollbars();
  }

  drawContent(): void {
    // Example: Draw a simple grid across the virtual area
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.virtualWidth; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.virtualHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.virtualHeight; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.virtualWidth, y);
      this.ctx.stroke();
    }
  }

  drawScrollbars(): void {
    const viewportWidth = this.canvas.width - this.scrollbarWidth;
    const viewportHeight = this.canvas.height - this.scrollbarWidth;
    const contentWidth = this.virtualWidth * this.scale;
    const contentHeight = this.virtualHeight * this.scale;

    // Helper function to draw a rounded rectangle
    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Draw horizontal scrollbar thumb if needed
    if (contentWidth > viewportWidth) {
      const scrollRatioX = viewportWidth / contentWidth;
      const thumbWidth = viewportWidth * scrollRatioX;
      const thumbX = (this.scrollX / contentWidth) * viewportWidth;
      const trackY = this.canvas.height - this.scrollbarWidth;

      // Draw only the thumb: light gray fill with a subtle gray outline
      this.ctx.fillStyle = '#5D5D5D80';
      this.ctx.strokeStyle = '#5D5D5D80';
      this.ctx.lineWidth = 1;
      drawRoundedRect(
        this.ctx,
        thumbX,
        trackY,
        thumbWidth,
        this.scrollbarWidth,
        this.scrollbarWidth / 2
      );
    }

    // Draw vertical scrollbar thumb if needed
    if (contentHeight > viewportHeight) {
      const scrollRatioY = viewportHeight / contentHeight;
      const thumbHeight = viewportHeight * scrollRatioY;
      const thumbY = (this.scrollY / contentHeight) * viewportHeight;
      const trackX = this.canvas.width - this.scrollbarWidth;

      // Draw only the thumb: light gray fill with a subtle gray outline
      this.ctx.fillStyle = '#5D5D5D80';
      this.ctx.strokeStyle = '#5D5D5D80';
      this.ctx.lineWidth = 1;
      drawRoundedRect(
        this.ctx,
        trackX,
        thumbY,
        this.scrollbarWidth,
        thumbHeight,
        this.scrollbarWidth / 2
      );
    }
  }

  onMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scrollbarHit = this.hitTestScrollbars(mouseX, mouseY);
    if (scrollbarHit === 'horizontal') {
      this.draggingScrollbar = 'horizontal';
      this.dragStartX = mouseX;
      this.dragStartScrollX = this.scrollX;
    } else if (scrollbarHit === 'vertical') {
      this.draggingScrollbar = 'vertical';
      this.dragStartY = mouseY;
      this.dragStartScrollY = this.scrollY;
    }
  }

  onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (this.draggingScrollbar === 'horizontal') {
      const viewportWidth = this.canvas.width - this.scrollbarWidth;
      const contentWidth = this.virtualWidth * this.scale;
      const scrollRange = contentWidth - viewportWidth;
      const deltaX = mouseX - this.dragStartX;
      const scrollRatio = scrollRange / viewportWidth;
      this.scrollX = Math.max(
        0,
        Math.min(this.dragStartScrollX + deltaX * scrollRatio, scrollRange)
      );
      this.draw();
    } else if (this.draggingScrollbar === 'vertical') {
      const viewportHeight = this.canvas.height - this.scrollbarWidth;
      const contentHeight = this.virtualHeight * this.scale;
      const scrollRange = contentHeight - viewportHeight;
      const deltaY = mouseY - this.dragStartY;
      const scrollRatio = scrollRange / viewportHeight;
      this.scrollY = Math.max(
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
    // Prevent default browser scrolling
    e.preventDefault();

    // Get mouse position relative to the canvas
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey) {
      // Zooming with Ctrl + wheel or touchpad pinch
      const zoomFactor = Math.pow(1.001, -e.deltaY); // Smooth scaling
      const oldScale = this.scale;
      let newScale = oldScale * zoomFactor;

      // Compute viewport dimensions (accounting for scrollbar)
      const viewportWidth = this.canvas.width - this.scrollbarWidth;
      const viewportHeight = this.canvas.height - this.scrollbarWidth;

      // Define minimum scale so the virtual content at least fills the viewport
      const minScale = Math.max(
        viewportWidth / this.virtualWidth,
        viewportHeight / this.virtualHeight
      );
      // Define a maximum scale (arbitrary value—you can adjust as needed)
      const maxScale = 3;

      // Clamp the new scale
      newScale = Math.min(Math.max(newScale, minScale), maxScale);

      // Adjust scroll to keep the point under the mouse steady
      const contentX = (mouseX + this.scrollX) / oldScale;
      const contentY = (mouseY + this.scrollY) / oldScale;
      this.scale = newScale;
      this.scrollX = contentX * newScale - mouseX;
      this.scrollY = contentY * newScale - mouseY;
    } else {
      // Scrolling with wheel or touchpad two-finger gesture
      this.scrollX += e.deltaX;
      this.scrollY += e.deltaY;
    }

    // Clamp scroll positions to stay within bounds
    this.clampScroll();

    // Redraw the canvas
    this.draw();
  }

  clampScroll(): void {
    const viewportWidth = this.canvas.width - this.scrollbarWidth;
    const viewportHeight = this.canvas.height - this.scrollbarWidth;
    const maxScrollX = Math.max(
      0,
      this.virtualWidth * this.scale - viewportWidth
    );
    const maxScrollY = Math.max(
      0,
      this.virtualHeight * this.scale - viewportHeight
    );
    this.scrollX = Math.min(Math.max(0, this.scrollX), maxScrollX);
    this.scrollY = Math.min(Math.max(0, this.scrollY), maxScrollY);
  }

  hitTestScrollbars(x: number, y: number): 'horizontal' | 'vertical' | null {
    const viewportWidth = this.canvas.width - this.scrollbarWidth;
    const viewportHeight = this.canvas.height - this.scrollbarWidth;
    const contentWidth = this.virtualWidth * this.scale;
    const contentHeight = this.virtualHeight * this.scale;

    // Horizontal scrollbar hit test
    if (contentWidth > viewportWidth && y > viewportHeight) {
      const scrollRatioX = viewportWidth / contentWidth;
      const thumbWidth = viewportWidth * scrollRatioX;
      const thumbX = (this.scrollX / contentWidth) * viewportWidth;
      if (x >= thumbX && x <= thumbX + thumbWidth) {
        return 'horizontal';
      }
    }

    // Vertical scrollbar hit test
    if (contentHeight > viewportHeight && x > viewportWidth) {
      const scrollRatioY = viewportHeight / contentHeight;
      const thumbHeight = viewportHeight * scrollRatioY;
      const thumbY = (this.scrollY / contentHeight) * viewportHeight;
      if (y >= thumbY && y <= thumbY + thumbHeight) {
        return 'vertical';
      }
    }

    return null;
  }
}
