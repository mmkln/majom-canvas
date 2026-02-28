import { Subscription } from 'rxjs';
import type {
  CanvasLoadingElementPreview,
  CanvasManager,
} from '../core/managers/CanvasManager.ts';
import type { CanvasLoadPhase } from '../core/types/canvasLoading.ts';
import { Scene } from '../core/scene/Scene.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';
import { createSurface } from './primitives/index.ts';

type Rect = { x: number; y: number; width: number; height: number };

type MiniMapMetrics = {
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
  sceneToMap: number;
  virtualWidth: number;
  virtualHeight: number;
};

type MiniMapOptions = {
  embedded?: boolean;
  surface?: boolean;
  className?: string;
};

export class MiniMap {
  private readonly container: HTMLDivElement;
  private readonly canvasEl: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private subscriptions: Subscription[] = [];
  private viewportRect: Rect | null = null;
  private metrics: MiniMapMetrics | null = null;
  private progressiveLoadFrozen = false;
  private loadingSnapshot: CanvasLoadingElementPreview[] | null = null;
  private isDraggingViewport = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private renderRafId: number | null = null;
  private readonly width = 260;
  private readonly height = 170;
  private readonly compactWidth = 220;
  private readonly compactBreakpoint = 640;
  private readonly padding = 0;

  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager,
    options: MiniMapOptions = {}
  ) {
    const embedded = options.embedded ?? false;
    const useSurface = options.surface ?? true;
    const baseClass = embedded ? '' : 'absolute right-[72px] bottom-4 z-20';
    const defaultInnerClass = useSurface ? 'overflow-hidden p-1' : '';
    const className = `${baseClass} ${options.className ?? defaultInnerClass}`.trim();
    this.container = useSurface
      ? createSurface({ className })
      : document.createElement('div');
    if (!useSurface) {
      this.container.className = className;
    }
    this.applyResponsiveSize();

    this.canvasEl = document.createElement('canvas');
    this.canvasEl.width = this.width;
    this.canvasEl.height = this.height;
    this.canvasEl.style.width = '100%';
    this.canvasEl.style.height = '100%';
    this.canvasEl.style.display = 'block';
    this.canvasEl.style.borderRadius = useSurface ? '14px' : '0';
    this.canvasEl.style.cursor = 'pointer';
    this.canvasEl.style.border = 'none';

    const ctx = this.canvasEl.getContext('2d');
    if (!ctx) throw new Error('MiniMap canvas context is not available');
    this.ctx = ctx;

    this.container.appendChild(this.canvasEl);
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.subscriptions.push(
      this.scene.changes.subscribe(() => {
        if (this.progressiveLoadFrozen) return;
        this.requestRender();
      })
    );
    this.subscriptions.push(
      this.canvasManager.loadPhase$.subscribe((phase) =>
        this.onLoadPhaseChanged(phase)
      )
    );
    this.subscriptions.push(
      this.canvasManager
        .getPanZoomManager()
        .viewChanges.subscribe(() => this.requestRender())
    );
    this.subscriptions.push(
      this.scene.focusChanges.subscribe(() => this.requestRender())
    );
    this.subscriptions.push(
      this.canvasManager.loadingPlaceholdersChanges$.subscribe(() => {
        const placeholders = this.canvasManager.getLoadingPlaceholders();
        if (this.progressiveLoadFrozen) {
          if (!this.loadingSnapshot && placeholders.length > 0) {
            this.loadingSnapshot = placeholders.map((placeholder) => ({
              ...placeholder,
            }));
            this.requestRender();
          }
          return;
        }
        this.requestRender();
      })
    );
    this.canvasEl.addEventListener('pointerdown', this.onPointerDown);
    this.canvasEl.addEventListener('pointermove', this.onPointerMove);
    this.canvasEl.addEventListener('pointerup', this.onPointerUp);
    this.canvasEl.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('resize', this.onViewportResize);
    this.requestRender();
  }

  public unmount(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
    this.canvasEl.removeEventListener('pointerdown', this.onPointerDown);
    this.canvasEl.removeEventListener('pointermove', this.onPointerMove);
    this.canvasEl.removeEventListener('pointerup', this.onPointerUp);
    this.canvasEl.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onViewportResize);
    if (this.renderRafId !== null) {
      cancelAnimationFrame(this.renderRafId);
      this.renderRafId = null;
    }
    this.container.remove();
  }

  private readonly requestRender = (): void => {
    if (this.renderRafId !== null) return;
    this.renderRafId = requestAnimationFrame(() => {
      this.renderRafId = null;
      this.render();
    });
  };

  private readonly onViewportResize = (): void => {
    this.applyResponsiveSize();
    this.requestRender();
  };

  private applyResponsiveSize(): void {
    const maxByViewport = Math.max(120, window.innerWidth - 32);
    const preferredWidth =
      window.innerWidth <= this.compactBreakpoint ? this.compactWidth : this.width;
    const width = Math.min(preferredWidth, maxByViewport);
    const height = Math.round((width * this.height) / this.width);
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }

  private readonly render = (): void => {
    const metrics = this.computeMetrics();
    this.metrics = metrics;
    const ctx = this.ctx;
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(metrics.mapX, metrics.mapY, metrics.mapWidth, metrics.mapHeight);

    this.drawElements(metrics);
    this.viewportRect = this.drawViewport(metrics);
  };

  private computeMetrics(): MiniMapMetrics {
    const panZoom = this.canvasManager.getPanZoomManager();
    const virtualWidth = Math.max(1, panZoom.virtualWidth);
    const virtualHeight = Math.max(1, panZoom.virtualHeight);
    const width = this.canvasEl.width;
    const height = this.canvasEl.height;
    const innerWidth = Math.max(1, width - this.padding * 2);
    const innerHeight = Math.max(1, height - this.padding * 2);
    const sceneToMap = Math.min(
      innerWidth / virtualWidth,
      innerHeight / virtualHeight
    );
    const mapWidth = virtualWidth * sceneToMap;
    const mapHeight = virtualHeight * sceneToMap;
    const mapX = (width - mapWidth) / 2;
    const mapY = (height - mapHeight) / 2;
    return {
      mapX,
      mapY,
      mapWidth,
      mapHeight,
      sceneToMap,
      virtualWidth,
      virtualHeight,
    };
  }

  private drawElements(metrics: MiniMapMetrics): void {
    const loadingPlaceholders =
      this.progressiveLoadFrozen && this.loadingSnapshot
        ? this.loadingSnapshot
        : this.canvasManager.getLoadingPlaceholders();
    const sceneElements = this.scene.getElements();
    if (loadingPlaceholders.length > 0) {
      this.drawLoadingElements(metrics, loadingPlaceholders);
      return;
    }

    const focusedId = this.scene.getFocusedElementId();
    sceneElements.forEach((element: any) => {
      if (typeof element?.x !== 'number' || typeof element?.y !== 'number') return;
      const baseColor = this.getColorByType(
        element instanceof TaskElement
          ? 'task'
          : element instanceof StoryElement
            ? 'story'
            : element instanceof GoalElement
              ? 'goal'
              : 'other'
      );
      const x = metrics.mapX + element.x * metrics.sceneToMap;
      const y = metrics.mapY + element.y * metrics.sceneToMap;
      if (
        typeof element.width === 'number' &&
        typeof element.height === 'number'
      ) {
        const w = Math.max(2, element.width * metrics.sceneToMap);
        const h = Math.max(2, element.height * metrics.sceneToMap);
        this.ctx.fillStyle = focusedId === element.id ? '#8b5cf6' : baseColor;
        this.ctx.fillRect(x, y, w, h);
        return;
      }
      if (typeof element.radius === 'number') {
        const radius = Math.max(1, element.radius * metrics.sceneToMap);
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = focusedId === element.id ? '#8b5cf6' : baseColor;
        this.ctx.fill();
      }
    });
  }

  private drawLoadingElements(
    metrics: MiniMapMetrics,
    placeholders: ReadonlyArray<CanvasLoadingElementPreview>
  ): void {
    placeholders.forEach((placeholder) => {
      const x = metrics.mapX + placeholder.x * metrics.sceneToMap;
      const y = metrics.mapY + placeholder.y * metrics.sceneToMap;
      const width = Math.max(2, placeholder.width * metrics.sceneToMap);
      const height = Math.max(2, placeholder.height * metrics.sceneToMap);
      this.ctx.fillStyle = placeholder.isFocused
        ? '#8b5cf6'
        : this.getColorByType(placeholder.elementType);
      this.ctx.fillRect(x, y, width, height);
    });
  }

  private getColorByType(type: 'task' | 'story' | 'goal' | 'other'): string {
    if (type === 'task') return '#0ea5e9';
    if (type === 'story') return '#10b981';
    if (type === 'goal') return '#f59e0b';
    return '#94a3b8';
  }

  private drawViewport(metrics: MiniMapMetrics): Rect {
    const panZoom = this.canvasManager.getPanZoomManager();
    const canvas = this.canvasManager.getCanvas();
    const sceneX = panZoom.scrollX / panZoom.scale;
    const sceneY = panZoom.scrollY / panZoom.scale;
    const sceneWidth = canvas.width / panZoom.scale;
    const sceneHeight = canvas.height / panZoom.scale;
    const x = metrics.mapX + sceneX * metrics.sceneToMap;
    const y = metrics.mapY + sceneY * metrics.sceneToMap;
    const width = Math.max(6, sceneWidth * metrics.sceneToMap);
    const height = Math.max(6, sceneHeight * metrics.sceneToMap);
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    this.ctx.fillRect(x, y, width, height);
    return { x, y, width, height };
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.metrics) return;
    const point = this.getLocalPoint(event);
    const viewportRect = this.viewportRect;
    if (viewportRect && this.isPointInsideRect(point, viewportRect)) {
      this.isDraggingViewport = true;
      this.dragOffsetX = point.x - viewportRect.x;
      this.dragOffsetY = point.y - viewportRect.y;
      this.canvasEl.setPointerCapture(event.pointerId);
      return;
    }
    this.jumpToPoint(point.x, point.y);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.metrics || !this.isDraggingViewport || !this.viewportRect) return;
    const point = this.getLocalPoint(event);
    const mapLeft = point.x - this.dragOffsetX;
    const mapTop = point.y - this.dragOffsetY;
    const sceneLeft = this.mapToSceneX(mapLeft, this.metrics);
    const sceneTop = this.mapToSceneY(mapTop, this.metrics);
    const panZoom = this.canvasManager.getPanZoomManager();
    this.canvasManager.setScroll(sceneLeft * panZoom.scale, sceneTop * panZoom.scale);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.isDraggingViewport) return;
    this.isDraggingViewport = false;
    if (this.canvasEl.hasPointerCapture(event.pointerId)) {
      this.canvasEl.releasePointerCapture(event.pointerId);
    }
  };

  private jumpToPoint(mapX: number, mapY: number): void {
    if (!this.metrics) return;
    const sceneX = this.mapToSceneX(mapX, this.metrics);
    const sceneY = this.mapToSceneY(mapY, this.metrics);
    this.canvasManager.centerOnScenePoint(sceneX, sceneY);
  }

  private mapToSceneX(mapX: number, metrics: MiniMapMetrics): number {
    const clamped = Math.min(
      metrics.mapX + metrics.mapWidth,
      Math.max(metrics.mapX, mapX)
    );
    return (clamped - metrics.mapX) / metrics.sceneToMap;
  }

  private mapToSceneY(mapY: number, metrics: MiniMapMetrics): number {
    const clamped = Math.min(
      metrics.mapY + metrics.mapHeight,
      Math.max(metrics.mapY, mapY)
    );
    return (clamped - metrics.mapY) / metrics.sceneToMap;
  }

  private getLocalPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasEl.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private isPointInsideRect(point: { x: number; y: number }, rect: Rect): boolean {
    return (
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height
    );
  }

  private onLoadPhaseChanged(phase: CanvasLoadPhase): void {
    if (phase === 'loading') {
      this.progressiveLoadFrozen = true;
      this.loadingSnapshot = null;
      return;
    }
    if (phase === 'layout-ready') {
      this.progressiveLoadFrozen = true;
      if (!this.loadingSnapshot) {
        const placeholders = this.canvasManager.getLoadingPlaceholders();
        if (placeholders.length > 0) {
          this.loadingSnapshot = placeholders.map((placeholder) => ({
            ...placeholder,
          }));
          this.requestRender();
        }
      }
      return;
    }
    if (phase === 'elements-partial-ready') {
      this.progressiveLoadFrozen = true;
      return;
    }
    this.progressiveLoadFrozen = false;
    this.loadingSnapshot = null;
    this.requestRender();
  }
}
