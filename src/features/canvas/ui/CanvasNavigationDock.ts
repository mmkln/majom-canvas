import { Subscription } from 'rxjs';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import { CanvasClientStorage } from '../core/services/CanvasClientStorage.ts';
import { CanvasControls } from './CanvasControls.ts';
import { createIcon } from './icons.ts';
import { MiniMap } from './MiniMap.ts';
import { MobileBottomSheet } from './MobileBottomSheet.ts';
import { UndoRedoControls } from './UndoRedoControls.ts';
import {
  createDivider,
  createDropdownItem,
  createIconButton,
  createSurface,
} from './primitives/index.ts';

export type CanvasNavigationDockLayoutMode = 'desktop' | 'mobile';

type CanvasNavigationDockOptions = {
  layoutMode?: CanvasNavigationDockLayoutMode;
  containerClassName?: string;
  miniMapDefaultVisible?: boolean;
  showUndoRedo?: boolean;
};

/**
 * Groups minimap and navigation controls.
 * Mobile: one-row action dock + "More" bottom sheet for advanced controls.
 * Desktop: classic minimap + controls stack.
 */
export class CanvasNavigationDock {
  private readonly scene: Scene;
  private readonly canvasManager: CanvasManager;
  private readonly container: HTMLDivElement;
  private readonly miniMapSlot: HTMLDivElement;
  private readonly actionRow: HTMLDivElement;
  private readonly actionLeft: HTMLDivElement;
  private readonly actionCenter: HTMLDivElement;
  private readonly actionRight: HTMLDivElement;
  private readonly actionRightActions: HTMLDivElement;
  private readonly miniMap: MiniMap;
  private readonly canvasControls: CanvasControls;
  private readonly undoRedoControls: UndoRedoControls;
  private readonly quickAddButton: HTMLButtonElement;
  private readonly moreButton: HTMLButtonElement;
  private readonly advancedSheet: MobileBottomSheet;
  private readonly advancedSheetContent: HTMLDivElement;
  private readonly zoomOutActionButton: HTMLButtonElement;
  private readonly zoomInActionButton: HTMLButtonElement;
  private readonly focusActionButton: HTMLButtonElement;
  private readonly centerCanvasActionButton: HTMLButtonElement;
  private readonly miniMapActionButton: HTMLButtonElement;
  private readonly advancedMiniMapHost: HTMLDivElement;
  private focusSubscription: Subscription | null = null;
  private miniMapVisible: boolean;
  private miniMapMounted = false;
  private miniMapHost: HTMLDivElement | null = null;
  private layoutMode: CanvasNavigationDockLayoutMode;
  private containerClassName: string;
  private showUndoRedo: boolean;

  constructor(
    scene: Scene,
    canvasManager: CanvasManager,
    options: CanvasNavigationDockOptions = {}
  ) {
    this.scene = scene;
    this.canvasManager = canvasManager;
    this.layoutMode = options.layoutMode ?? 'desktop';
    this.containerClassName = options.containerClassName ?? '';
    this.showUndoRedo = options.showUndoRedo ?? false;
    this.miniMapVisible = CanvasClientStorage.getMiniMapVisible(
      options.miniMapDefaultVisible ?? true
    );

    this.container = createSurface({
      className: this.resolveContainerClassName(),
    });

    this.miniMapSlot = document.createElement('div');
    this.miniMapSlot.className = 'w-full';

    this.actionRow = document.createElement('div');
    this.actionRow.className = 'flex w-full items-center gap-2';
    this.actionLeft = document.createElement('div');
    this.actionCenter = document.createElement('div');
    this.actionRight = document.createElement('div');
    this.actionLeft.className = 'flex min-w-0 items-center gap-1';
    this.actionCenter.className = 'flex flex-1 items-center justify-center';
    this.actionRight.className = 'ml-auto flex min-w-0 items-center justify-end';
    this.actionRightActions = document.createElement('div');
    this.actionRightActions.className = 'inline-flex items-center gap-1';

    this.undoRedoControls = new UndoRedoControls();

    this.quickAddButton = createIconButton({
      icon: 'squares-plus',
      size: 'md',
      title: 'Add item',
      ariaLabel: 'Add item',
      className:
        'self-center h-11 w-11 rounded-2xl border border-sky-400/90 bg-sky-500 text-white shadow-[0_12px_20px_rgba(14,165,233,0.34)] hover:bg-sky-600 hover:text-white active:bg-sky-700',
      onClick: () => this.requestQuickAdd(),
    });

    this.moreButton = this.createDockButton({
      icon: 'ellipsis-vertical',
      title: 'More controls',
      onClick: () => this.handleMoreToggle(),
    });
    this.actionRightActions.append(this.moreButton);
    this.actionRight.appendChild(this.actionRightActions);

    this.miniMap = new MiniMap(scene, canvasManager, {
      embedded: true,
      surface: false,
      className: 'border-none',
    });

    this.canvasControls = new CanvasControls(canvasManager, scene, {
      embedded: true,
      orientation: 'horizontal',
      surface: false,
      showZoomIndicator: true,
      miniMapToggle: {
        initialVisible: this.miniMapVisible,
        onToggle: (visible) => this.setMiniMapVisible(visible),
      },
    });

    this.advancedSheet = new MobileBottomSheet('info', 'CanvasNavigationDock');
    this.advancedSheetContent = document.createElement('div');
    this.advancedSheetContent.className =
      'hidden w-full overflow-y-auto px-0 pb-[max(1rem,env(safe-area-inset-bottom))]';

    const advancedTitle = document.createElement('div');
    advancedTitle.className =
      'px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500';
    advancedTitle.textContent = 'Canvas controls';

    const navigationSectionLabel = this.createSheetSectionLabel('Navigate');
    const zoomSectionLabel = this.createSheetSectionLabel('Zoom');
    const viewSectionLabel = this.createSheetSectionLabel('View');
    const previewSectionLabel = this.createSheetSectionLabel('Preview');

    this.zoomOutActionButton = createDropdownItem({
      label: 'Zoom out',
      leading: this.createMenuLeadingIcon('minus'),
      onClick: () => this.canvasManager.zoomOut(),
    });
    this.zoomInActionButton = createDropdownItem({
      label: 'Zoom in',
      leading: this.createMenuLeadingIcon('plus'),
      onClick: () => this.canvasManager.zoomIn(),
    });
    this.focusActionButton = createDropdownItem({
      label: 'Go to focused element',
      leading: this.createMenuLeadingIcon('map-pin'),
      onClick: () => {
        this.canvasManager.goToFocusedElement();
        this.closeAdvancedSheet();
      },
    });
    this.centerCanvasActionButton = createDropdownItem({
      label: 'Center canvas',
      leading: this.createMenuLeadingIcon('align'),
      onClick: () => {
        this.canvasManager.centerCanvas();
        this.closeAdvancedSheet();
      },
    });
    this.miniMapActionButton = createDropdownItem({
      label: this.miniMapVisible ? 'Hide mini map' : 'Show mini map',
      leading: this.createMenuLeadingIcon('arrows-pointing-out'),
      onClick: () => this.handleMiniMapActionToggle(),
    });

    this.advancedMiniMapHost = document.createElement('div');
    this.advancedMiniMapHost.className =
      'mx-3 mt-2 hidden overflow-hidden rounded-2xl border border-slate-200/85 bg-white/95 p-1';

    this.advancedSheetContent.append(
      advancedTitle,
      navigationSectionLabel,
      this.focusActionButton,
      this.centerCanvasActionButton,
      createDivider({ tone: 'soft' }),
      zoomSectionLabel,
      this.zoomOutActionButton,
      this.zoomInActionButton,
      createDivider({ tone: 'soft' }),
      viewSectionLabel,
      this.miniMapActionButton,
      createDivider({ tone: 'soft' }),
      previewSectionLabel,
      this.advancedMiniMapHost
    );
    this.updateMiniMapActionLabel();
    this.updateFocusActionAvailability();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.container.append(this.miniMapSlot, this.actionRow);
    this.actionRow.append(this.actionLeft, this.actionCenter, this.actionRight);
    this.undoRedoControls.mount(this.actionLeft);
    this.actionCenter.appendChild(this.quickAddButton);
    this.canvasControls.mount(this.container);
    this.container.appendChild(this.advancedSheetContent);

    this.focusSubscription = this.scene.focusChanges.subscribe(() =>
      this.updateFocusActionAvailability()
    );
    this.applyLayoutState();
    this.setMiniMapVisible(this.miniMapVisible);
  }

  public unmount(): void {
    this.focusSubscription?.unsubscribe();
    this.focusSubscription = null;
    this.closeAdvancedSheet();
    this.undoRedoControls.unmount();
    this.canvasControls.unmount();
    this.unmountMiniMap();
    this.container.remove();
  }

  public setLayoutMode(mode: CanvasNavigationDockLayoutMode): void {
    if (this.layoutMode === mode) return;
    const previousMode = this.layoutMode;
    this.layoutMode = mode;
    this.container.className = this.resolveContainerClassName();
    if (previousMode === 'mobile') {
      this.closeAdvancedSheet();
    }
    this.applyLayoutState();
    this.setMiniMapVisible(this.miniMapVisible);
  }

  public setContainerClassName(className: string): void {
    this.containerClassName = className.trim();
    this.container.className = this.resolveContainerClassName();
  }

  public setShowUndoRedo(show: boolean): void {
    this.showUndoRedo = show;
    this.applyLayoutState();
  }

  public setMiniMapVisible(visible: boolean): void {
    this.miniMapVisible = visible;
    CanvasClientStorage.setMiniMapVisible(visible);
    this.canvasControls.setMiniMapVisible(visible);
    this.updateMiniMapActionLabel();
    this.applyLayoutState();
  }

  public isMiniMapVisible(): boolean {
    return this.miniMapVisible;
  }

  private handleMoreToggle(): void {
    if (this.layoutMode !== 'mobile') return;
    if (this.advancedSheet.isOpen()) {
      this.closeAdvancedSheet();
      return;
    }
    this.updateFocusActionAvailability();
    this.updateMiniMapActionLabel();
    this.advancedSheet.open({
      content: this.advancedSheetContent,
      ariaLabel: 'Canvas more controls',
      onRequestClose: () => this.closeAdvancedSheet(),
      zIndex: 241,
      containerClassName:
        'max-h-[min(82dvh,36rem)] px-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
    });
    this.moreButton.classList.add('bg-slate-200/80', 'text-slate-900');
  }

  private closeAdvancedSheet(): void {
    if (!this.advancedSheet.isOpen()) return;
    this.advancedSheet.close();
    this.moreButton.classList.remove('bg-slate-200/80', 'text-slate-900');
  }

  private handleMiniMapActionToggle(): void {
    this.setMiniMapVisible(!this.miniMapVisible);
  }

  private updateMiniMapActionLabel(): void {
    const label = this.miniMapVisible ? 'Hide mini map' : 'Show mini map';
    const labelElement = this.miniMapActionButton.querySelector('.truncate');
    if (labelElement) {
      labelElement.textContent = label;
    } else {
      this.miniMapActionButton.textContent = label;
    }
  }

  private updateFocusActionAvailability(): void {
    const hasFocus = this.scene.getFocusedElement() !== null;
    this.focusActionButton.disabled = !hasFocus;
    this.focusActionButton.style.opacity = hasFocus ? '1' : '0.48';
    this.focusActionButton.style.pointerEvents = hasFocus ? 'auto' : 'none';
  }

  private mountMiniMapIn(host: HTMLDivElement): void {
    if (this.miniMapMounted && this.miniMapHost === host) return;
    if (this.miniMapMounted) {
      this.unmountMiniMap();
    }
    this.miniMap.mount(host);
    this.miniMapMounted = true;
    this.miniMapHost = host;
  }

  private unmountMiniMap(): void {
    if (!this.miniMapMounted) return;
    this.miniMap.unmount();
    this.miniMapMounted = false;
    this.miniMapHost = null;
  }

  private resolveContainerClassName(): string {
    if (this.containerClassName.length > 0) {
      return this.containerClassName;
    }
    if (this.layoutMode === 'mobile') {
      return 'relative flex w-full flex-col gap-2 overflow-hidden p-0';
    }
    return 'absolute right-4 bottom-4 z-20 flex flex-col gap-2 overflow-hidden p-0';
  }

  private applyLayoutState(): void {
    const mobile = this.layoutMode === 'mobile';
    this.container.classList.toggle('gap-2', mobile);
    this.undoRedoControls.container.style.display = this.showUndoRedo
      ? 'flex'
      : 'none';

    if (mobile) {
      this.quickAddButton.style.display = 'inline-flex';
      this.actionRightActions.style.display = 'inline-flex';
      this.actionRow.className =
        'flex w-full items-center gap-2 rounded-[22px] border border-slate-200/80 bg-white/86 px-2 py-1.5 shadow-[0_14px_24px_rgba(15,23,42,0.12)] backdrop-blur-md';
      this.actionRow.style.display = 'flex';
      this.actionLeft.className = 'flex min-w-0 items-center gap-1';
      this.actionCenter.className = 'flex flex-1 items-center justify-center';
      this.actionRight.className = 'ml-auto flex min-w-0 items-center justify-end';
      this.actionLeft.style.display = this.showUndoRedo ? 'flex' : 'none';

      this.canvasControls.getElement().style.display = 'none';
      this.miniMapSlot.style.display = 'none';
      if (this.miniMapVisible) {
        this.advancedMiniMapHost.classList.remove('hidden');
        this.mountMiniMapIn(this.advancedMiniMapHost);
      } else {
        this.advancedMiniMapHost.classList.add('hidden');
        this.unmountMiniMap();
      }
      this.undoRedoControls.container.classList.add(
        'border-transparent',
        'bg-transparent',
        'shadow-none',
        'backdrop-blur-0',
        'p-0'
      );
      return;
    }

    this.quickAddButton.style.display = 'none';
    this.actionRightActions.style.display = 'none';
    this.actionRow.className =
      'grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2';
    this.actionRow.style.display = this.showUndoRedo ? 'grid' : 'none';
    this.actionLeft.className = 'flex items-center justify-self-start min-w-0';
    this.actionCenter.className =
      'flex items-center justify-center justify-self-center';
    this.actionRight.className = 'flex items-center justify-self-end min-w-0';
    this.actionLeft.style.display = 'flex';

    this.canvasControls.getElement().style.display = '';
    this.advancedMiniMapHost.classList.add('hidden');
    if (this.miniMapVisible) {
      this.miniMapSlot.style.display = 'block';
      this.mountMiniMapIn(this.miniMapSlot);
    } else {
      this.miniMapSlot.style.display = 'none';
      this.unmountMiniMap();
    }

    this.undoRedoControls.container.classList.remove(
      'border-transparent',
      'bg-transparent',
      'shadow-none',
      'backdrop-blur-0',
      'p-0'
    );
  }

  private requestQuickAdd(): void {
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height * 0.42;
    const panZoom = this.canvasManager.getPanZoomManager();
    const sceneX = (clientX - rect.left + panZoom.scrollX) / panZoom.scale;
    const sceneY = (clientY - rect.top + panZoom.scrollY) / panZoom.scale;
    window.dispatchEvent(
      new CustomEvent('contextMenuRequested', {
        detail: {
          element: null,
          sceneX,
          sceneY,
        },
      })
    );
  }

  private createDockButton(options: {
    icon: 'minus' | 'plus' | 'ellipsis-vertical';
    title: string;
    onClick: () => void;
  }): HTMLButtonElement {
    return createIconButton({
      icon: options.icon,
      size: 'md',
      title: options.title,
      ariaLabel: options.title,
      className:
        'h-9 w-9 rounded-xl border border-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900',
      onClick: () => options.onClick(),
    });
  }

  private createSheetSectionLabel(text: string): HTMLDivElement {
    const label = document.createElement('div');
    label.className =
      'px-4 py-1 text-[0.69rem] font-semibold uppercase tracking-[0.08em] text-slate-400';
    label.textContent = text;
    return label;
  }

  private createMenuLeadingIcon(
    iconName: 'map-pin' | 'align' | 'arrows-pointing-out' | 'minus' | 'plus'
  ): HTMLSpanElement {
    const wrap = document.createElement('span');
    wrap.className =
      'inline-flex h-5 w-5 items-center justify-center text-slate-500';
    const icon = createIcon(iconName, { size: 15, strokeWidth: 1.8 });
    icon.setAttribute('aria-hidden', 'true');
    wrap.appendChild(icon);
    return wrap;
  }
}
