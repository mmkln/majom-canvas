// ui/CanvasControls.ts
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { Subscription } from 'rxjs';
import {
  createHudIconButton,
  createHudSurface,
} from './primitives/index.ts';

type CanvasControlsOptions = {
  embedded?: boolean;
  orientation?: 'vertical' | 'horizontal';
  surface?: boolean;
  className?: string;
  showZoomIndicator?: boolean;
  zoomIndicatorClassName?: string;
};

export class CanvasControls {
  private readonly container: HTMLDivElement;
  private readonly goToFocusBtn: HTMLButtonElement;
  private readonly zoomValueEl: HTMLSpanElement | null;
  private focusSubscription: Subscription;
  private unsubscribeZoomChange: (() => void) | null = null;

  constructor(
    private canvasManager: CanvasManager,
    private scene: Scene,
    options: CanvasControlsOptions = {}
  ) {
    const embedded = options.embedded ?? false;
    const useSurface = options.surface ?? true;
    const orientation = options.orientation ?? 'vertical';
    const isHorizontal = orientation === 'horizontal';
    const layoutClass = isHorizontal
      ? 'flex-row items-center justify-between w-full'
      : 'flex-col items-center';
    const baseClass = embedded ? '' : 'absolute right-4 bottom-4 z-20';
    const defaultClass = `flex ${layoutClass} px-3 py-2`;
    const className = `${baseClass} ${defaultClass} ${options.className ?? ''}`.trim();
    this.container = useSurface
      ? createHudSurface({ className })
      : document.createElement('div');
    if (!useSurface) {
      this.container.className = className;
    }

    const zoomOutBtn = createHudIconButton({
      icon: 'minus',
      title: 'Zoom Out',
      ariaLabel: 'Zoom Out',
      onClick: () => this.canvasManager.zoomOut(),
    });

    const zoomInBtn = createHudIconButton({
      icon: 'plus',
      title: 'Zoom In',
      ariaLabel: 'Zoom In',
      onClick: () => this.canvasManager.zoomIn(),
    });

    const zoomCluster = document.createElement('div');
    zoomCluster.className =
      isHorizontal
        ? 'inline-flex items-center gap-1'
        : 'inline-flex flex-col items-center gap-1';

    let zoomWrap: HTMLDivElement | null = null;
    if (options.showZoomIndicator) {
      zoomWrap = document.createElement('div');
      zoomWrap.className =
        options.zoomIndicatorClassName ??
        'inline-flex min-w-[52px] items-center justify-center px-1 text-[0.95rem] font-semibold leading-none tracking-[0.02em] text-slate-900';
      this.zoomValueEl = document.createElement('span');
      zoomWrap.appendChild(this.zoomValueEl);
      this.unsubscribeZoomChange = this.canvasManager.panZoom.onZoomChange(() =>
        this.updateZoomIndicator()
      );
      this.updateZoomIndicator();
    } else {
      this.zoomValueEl = null;
    }

    if (isHorizontal) {
      zoomCluster.appendChild(zoomOutBtn);
      if (zoomWrap) {
        zoomCluster.appendChild(zoomWrap);
      }
      zoomCluster.appendChild(zoomInBtn);
    } else {
      zoomCluster.appendChild(zoomInBtn);
      if (zoomWrap) {
        zoomCluster.appendChild(zoomWrap);
      }
      zoomCluster.appendChild(zoomOutBtn);
    }

    this.goToFocusBtn = createHudIconButton({
      icon: 'map-pin',
      title: 'Go to Focus',
      ariaLabel: 'Go to Focus',
      onClick: () => this.canvasManager.goToFocusedElement(),
    });

    if (isHorizontal) {
      this.container.append(zoomCluster, this.goToFocusBtn);
    } else {
      this.container.appendChild(zoomCluster);
      this.container.append(this.goToFocusBtn);
    }

    this.focusSubscription = this.scene.focusChanges.subscribe(() =>
      this.updateFocusAvailability()
    );
    this.updateFocusAvailability();
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
  }

  public getElement(): HTMLDivElement {
    return this.container;
  }

  public unmount() {
    this.focusSubscription.unsubscribe();
    this.unsubscribeZoomChange?.();
    this.unsubscribeZoomChange = null;
    this.container.remove();
  }

  private updateFocusAvailability(): void {
    const hasFocus = this.scene.getFocusedElement() !== null;
    this.goToFocusBtn.disabled = !hasFocus;
    this.goToFocusBtn.style.display = hasFocus ? '' : 'none';
  }

  private updateZoomIndicator(): void {
    if (!this.zoomValueEl) return;
    const percent = Math.round(this.canvasManager.panZoom.scale * 100);
    this.zoomValueEl.textContent = `${percent}%`;
  }
}
