// ui/ZoomIndicator.ts
import { CanvasManager } from '../managers/CanvasManager.ts';

export class ZoomIndicator {
  private readonly container: HTMLDivElement;
  private readonly valueEl: HTMLSpanElement;
  private readonly canvasManager: CanvasManager;

  constructor(canvasManager: CanvasManager) {
    this.canvasManager = canvasManager;
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = '20px';
    this.container.style.bottom = '20px';
    this.container.style.background = 'rgba(255,255,255,0.95)';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
    this.container.style.padding = '6px 16px';
    this.container.style.fontSize = '1.1rem';
    this.container.style.fontWeight = '500';
    this.container.style.color = '#222';
    this.valueEl = document.createElement('span');
    this.container.appendChild(this.valueEl);
    this.update();
    // Реактивне оновлення через підписку на zoom
    this.canvasManager.panZoom.onZoomChange(() => this.update());
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
  }

  public update() {
    const percent = Math.round(this.canvasManager.panZoom.scale * 100);
    this.valueEl.textContent = `${percent}%`;
  }

  public unmount() {
    this.container.remove();
  }
}
