// ui/CanvasControls.ts
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { Subscription } from 'rxjs';
import { createIcon } from './icons.ts';
import {
  AnchoredMenu,
  createDropdownItem,
  createIconButton,
  createSurface,
  createTextButton,
} from './primitives/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';

type MiniMapToggleOptions = {
  initialVisible?: boolean;
  onToggle?: (visible: boolean) => void;
};

type CanvasControlsOptions = {
  runtime?: AppRuntime;
  embedded?: boolean;
  orientation?: 'vertical' | 'horizontal';
  surface?: boolean;
  className?: string;
  showZoomIndicator?: boolean;
  zoomIndicatorClassName?: string;
  miniMapToggle?: MiniMapToggleOptions;
};

export class CanvasControls {
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly container: HTMLDivElement;
  private readonly zoomOutBtn: HTMLButtonElement;
  private readonly zoomInBtn: HTMLButtonElement;
  private readonly goToFocusBtn: HTMLButtonElement;
  private readonly miniMapToggleBtn: HTMLButtonElement | null;
  private readonly miniMapToggleHandler: ((visible: boolean) => void) | null;
  private readonly zoomValueEl: HTMLSpanElement | null;
  private readonly zoomIndicatorBtn: HTMLButtonElement | null;
  private readonly zoomMenuController: AnchoredMenu | null;
  private readonly zoomMenuPanel: HTMLDivElement | null;
  private focusSubscription: Subscription;
  private unsubscribeZoomChange: (() => void) | null = null;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private miniMapVisible = true;

  constructor(
    private canvasManager: CanvasManager,
    private scene: Scene,
    options: CanvasControlsOptions = {}
  ) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.i18n = this.runtime.i18n;
    const embedded = options.embedded ?? false;
    const useSurface = options.surface ?? true;
    const orientation = options.orientation ?? 'vertical';
    const isHorizontal = orientation === 'horizontal';
    const layoutClass = isHorizontal
      ? 'flex-row items-center gap-1 w-fit min-w-fit'
      : 'flex-col items-center';
    const baseClass = embedded ? '' : 'absolute right-4 bottom-4 z-20';
    const defaultClass = `flex ${layoutClass} gap-1 px-3 py-2`;
    const className =
      `${baseClass} ${defaultClass} ${options.className ?? ''}`.trim();
    this.container = useSurface
      ? createSurface({ className })
      : document.createElement('div');
    if (!useSurface) {
      this.container.className = className;
    }

    this.zoomOutBtn = createIconButton({
      icon: 'minus',
      title: this.i18n.t('canvasControls.zoomOut'),
      ariaLabel: this.i18n.t('canvasControls.zoomOut'),
      onClick: () => this.canvasManager.zoomOut(),
    });

    this.zoomInBtn = createIconButton({
      icon: 'plus',
      title: this.i18n.t('canvasControls.zoomIn'),
      ariaLabel: this.i18n.t('canvasControls.zoomIn'),
      onClick: () => this.canvasManager.zoomIn(),
    });

    const zoomCluster = document.createElement('div');
    zoomCluster.className = isHorizontal
      ? 'inline-flex items-center gap-0.5'
      : 'inline-flex flex-col items-center gap-0.5';

    let zoomWrap: HTMLDivElement | null = null;
    if (options.showZoomIndicator) {
      zoomWrap = document.createElement('div');
      zoomWrap.className = 'relative inline-flex';

      this.zoomIndicatorBtn = createTextButton({
        text: '',
        tone: 'text',
        size: 'md',
        className:
          options.zoomIndicatorClassName ??
          'min-w-[58px] justify-center px-2 text-[0.95rem] font-semibold leading-none tracking-[0.02em]',
        onClick: (event) => {
          event.stopPropagation();
          this.toggleZoomMenu();
        },
      });
      this.zoomIndicatorBtn.setAttribute('aria-haspopup', 'menu');
      this.zoomIndicatorBtn.setAttribute('aria-expanded', 'false');

      this.zoomValueEl = document.createElement('span');
      this.zoomIndicatorBtn.appendChild(this.zoomValueEl);

      this.zoomMenuPanel = createSurface({
        elevated: true,
        className:
          'absolute left-0 top-0 z-30 hidden min-w-[168px] overflow-hidden',
      });
      this.zoomMenuController = new AnchoredMenu({
        container: zoomWrap,
        panel: this.zoomMenuPanel,
        onOpenChange: (open) => this.handleZoomMenuOpenChange(open),
      });
      zoomWrap.append(this.zoomIndicatorBtn, this.zoomMenuPanel);

      this.unsubscribeZoomChange = this.canvasManager.panZoom.onZoomChange(() =>
        this.updateZoomIndicator()
      );
      this.updateZoomIndicator();
    } else {
      this.zoomValueEl = null;
      this.zoomIndicatorBtn = null;
      this.zoomMenuController = null;
      this.zoomMenuPanel = null;
    }

    if (isHorizontal) {
      zoomCluster.appendChild(this.zoomOutBtn);
      if (zoomWrap) {
        zoomCluster.appendChild(zoomWrap);
      }
      zoomCluster.appendChild(this.zoomInBtn);
    } else {
      zoomCluster.appendChild(this.zoomInBtn);
      if (zoomWrap) {
        zoomCluster.appendChild(zoomWrap);
      }
      zoomCluster.appendChild(this.zoomOutBtn);
    }

    this.goToFocusBtn = createIconButton({
      icon: 'map-pin',
      title: this.i18n.t('canvasControls.goToFocus'),
      ariaLabel: this.i18n.t('canvasControls.goToFocus'),
      onClick: () => this.canvasManager.goToFocusedElement(),
    });

    const miniMapToggle = options.miniMapToggle;
    this.miniMapVisible = miniMapToggle?.initialVisible ?? true;
    this.miniMapToggleHandler = miniMapToggle?.onToggle ?? null;
    this.miniMapToggleBtn = miniMapToggle
      ? createIconButton({
          icon: this.miniMapVisible
            ? 'arrows-pointing-in'
            : 'arrows-pointing-out',
          title: this.getMiniMapToggleLabel(),
          ariaLabel: this.getMiniMapToggleLabel(),
          onClick: () => this.handleMiniMapToggle(),
        })
      : null;
    this.updateMiniMapToggleButton();

    if (isHorizontal) {
      const actionsCluster = document.createElement('div');
      actionsCluster.className = 'inline-flex items-center gap-1';
      actionsCluster.append(this.goToFocusBtn);
      if (this.miniMapToggleBtn) {
        actionsCluster.append(this.miniMapToggleBtn);
      }

      const divider = document.createElement('span');
      divider.className = 'mx-1 h-6 w-px bg-slate-200/80';
      divider.setAttribute('aria-hidden', 'true');

      this.container.append(zoomCluster, divider, actionsCluster);
    } else {
      const actionsCluster = document.createElement('div');
      actionsCluster.className = 'inline-flex items-center gap-1';
      actionsCluster.append(this.goToFocusBtn);
      if (this.miniMapToggleBtn) {
        actionsCluster.append(this.miniMapToggleBtn);
      }

      const divider = document.createElement('span');
      divider.className = 'my-1 h-px w-8 bg-slate-200/80';
      divider.setAttribute('aria-hidden', 'true');

      this.container.append(zoomCluster, divider, actionsCluster);
    }

    this.focusSubscription = this.scene.focusChanges.subscribe(() =>
      this.updateFocusAvailability()
    );
    this.updateFocusAvailability();
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
    this.zoomMenuController?.mount();
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshTranslations(),
      { emitCurrent: true }
    );
  }

  public getElement(): HTMLDivElement {
    return this.container;
  }

  public unmount() {
    this.focusSubscription.unsubscribe();
    this.unsubscribeZoomChange?.();
    this.unsubscribeZoomChange = null;
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.zoomMenuController?.close();
    this.zoomMenuController?.unmount();
    this.container.remove();
  }

  public setMiniMapVisible(visible: boolean): void {
    this.miniMapVisible = visible;
    this.updateMiniMapToggleButton();
  }

  private updateFocusAvailability(): void {
    const hasFocus = this.scene.getFocusedElement() !== null;
    this.goToFocusBtn.disabled = !hasFocus;
    this.goToFocusBtn.style.display = hasFocus ? '' : 'none';
  }

  private handleMiniMapToggle(): void {
    this.setMiniMapVisible(!this.miniMapVisible);
    this.miniMapToggleHandler?.(this.miniMapVisible);
  }

  private updateMiniMapToggleButton(): void {
    if (!this.miniMapToggleBtn) return;
    const iconName = this.miniMapVisible
      ? 'arrows-pointing-in'
      : 'arrows-pointing-out';
    const label = this.getMiniMapToggleLabel();
    this.miniMapToggleBtn.title = label;
    this.miniMapToggleBtn.setAttribute('aria-label', label);
    this.miniMapToggleBtn.replaceChildren();
    const icon = createIcon(iconName, { size: 16, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    this.miniMapToggleBtn.appendChild(icon);
  }

  private updateZoomIndicator(): void {
    if (!this.zoomValueEl) return;
    const percent = Math.round(this.canvasManager.panZoom.scale * 100);
    this.zoomValueEl.textContent = `${percent}%`;
    if (this.zoomIndicatorBtn) {
      const label = this.i18n.t('canvasControls.zoomIndicator', { percent });
      this.zoomIndicatorBtn.title = label;
      this.zoomIndicatorBtn.setAttribute('aria-label', label);
    }
    if (this.zoomMenuController?.isOpen()) {
      this.renderZoomMenu();
    }
  }

  private toggleZoomMenu(): void {
    if (!this.zoomMenuController || !this.zoomIndicatorBtn) return;
    if (this.zoomMenuController.isOpen()) {
      this.zoomMenuController.close();
      return;
    }
    this.renderZoomMenu();
    this.zoomMenuController.openAt({
      anchor: this.zoomIndicatorBtn,
      placement: 'top-start',
      fallbackPlacements: ['top-end', 'bottom-start', 'bottom-end'],
      gap: 6,
      margin: 8,
      lockPlacementAfterOpen: true,
    });
  }

  private handleZoomMenuOpenChange(open: boolean): void {
    if (this.zoomIndicatorBtn) {
      this.zoomIndicatorBtn.setAttribute(
        'aria-expanded',
        open ? 'true' : 'false'
      );
      this.zoomIndicatorBtn.classList.toggle('bg-slate-100', open);
      this.zoomIndicatorBtn.classList.toggle('text-slate-800', open);
    }
    if (open) {
      this.renderZoomMenu();
    }
  }

  private renderZoomMenu(): void {
    if (!this.zoomMenuPanel) return;
    const panZoom = this.canvasManager.getPanZoomManager();
    const minScale = panZoom.getMinScale();
    const maxScale = panZoom.getMaxScale();
    const currentScale = panZoom.scale;
    const zoomList = document.createElement('div');
    const closeMenu = () => this.zoomMenuController?.close();

    [25, 50, 75, 100].forEach((percent) => {
      const targetScale = percent / 100;
      const disabled =
        targetScale < minScale - 0.001 || targetScale > maxScale + 0.001;
      const isActive = Math.abs(currentScale - targetScale) < 0.005;
      zoomList.appendChild(
        createDropdownItem({
          label: `${percent}%`,
          variant: isActive ? 'selected' : 'default',
          disabled,
          onClick: () => {
            this.canvasManager.setZoomScale(targetScale);
            closeMenu();
          },
        })
      );
    });

    this.zoomMenuPanel.replaceChildren(zoomList);
    if (this.zoomMenuController?.isOpen()) {
      this.zoomMenuController.reposition();
    }
  }

  private refreshTranslations(): void {
    const zoomOut = this.i18n.t('canvasControls.zoomOut');
    const zoomIn = this.i18n.t('canvasControls.zoomIn');
    const goToFocus = this.i18n.t('canvasControls.goToFocus');
    this.zoomOutBtn.title = zoomOut;
    this.zoomOutBtn.setAttribute('aria-label', zoomOut);
    this.zoomInBtn.title = zoomIn;
    this.zoomInBtn.setAttribute('aria-label', zoomIn);
    this.goToFocusBtn.title = goToFocus;
    this.goToFocusBtn.setAttribute('aria-label', goToFocus);
    this.updateMiniMapToggleButton();
    this.updateZoomIndicator();
  }

  private getMiniMapToggleLabel(): string {
    return this.miniMapVisible
      ? this.i18n.t('canvasControls.hideMiniMap')
      : this.i18n.t('canvasControls.showMiniMap');
  }
}
