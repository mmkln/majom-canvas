import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';
import { createIcon, type IconName } from '../canvas/ui/icons.ts';
import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { AppRuntime } from '../../app-runtime/index.ts';
import {
  createIconButton,
  setIconButtonContent,
} from '../../ui-lib/src/hud/index.ts';
import { GlobalMenu } from './components/GlobalMenu.ts';
import type { WallpaperService } from './services/WallpaperService.ts';
import type { PresentationMenuMode } from './PresentationMenuMachine.ts';

const PRESENTATION_MENU_PEEK_HANDLE_WIDTH_PX = 63;
const PRESENTATION_MENU_PEEK_HANDLE_HEIGHT_PX = 31;
const PRESENTATION_MENU_HIDDEN_HANDLE_WIDTH_PX = 56;
const PRESENTATION_MENU_HIDDEN_HANDLE_HEIGHT_PX = 28;
const PRESENTATION_MENU_INTENT_ZONE_PADDING_PX = 5;
const PRESENTATION_MENU_PEEK_BOTTOM_OFFSET_PX = -8;
const PRESENTATION_MENU_PEEK_HIDDEN_OFFSET_PX = -14;
const PRESENTATION_MENU_FALLBACK_HEIGHT_PX = 51;
const PRESENTATION_MENU_OPEN_TRANSFORM_MS = 320;
const PRESENTATION_MENU_OPEN_OPACITY_MS = 260;
const PRESENTATION_MENU_OPEN_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
const PRESENTATION_MENU_CLOSE_TRANSFORM_MS = 190;
const PRESENTATION_MENU_CLOSE_OPACITY_MS = 160;
const PRESENTATION_MENU_CLOSE_EASING = 'cubic-bezier(0.4, 0, 1, 1)';
const PRESENTATION_MENU_PANEL_PEEK_SCALE = 0.972;
const PRESENTATION_MENU_PANEL_PEEK_OPACITY = 0.76;
const PRESENTATION_MENU_HANDLE_HIDE_SCALE = 0.88;
const PRESENTATION_MENU_HANDLE_HIDE_TRANSLATE_Y_PX = 10;
const PRESENTATION_MENU_ACCESSORY_BUTTON_CLASS =
  'rounded-[9px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100';

type PresentationMenuViewCallbacks = {
  onIntentZoneEnter: () => void;
  onIntentZoneLeave: () => void;
  onControlsEnter: () => void;
  onControlsLeave: (event: MouseEvent) => void;
  onPeekEnter: () => void;
  onPeekLeave: (event: MouseEvent) => void;
  onHandleClick: () => void;
  onPinClick: () => void;
  onInteractionCapture: (event: Event) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onFocusIn: () => void;
  onFocusOut: () => void;
};

type PresentationMenuViewOptions = {
  runtime: AppRuntime;
  wallpaperService?: WallpaperService;
  initialView: WorkspaceView;
  autoCollapseEnabled: boolean;
  showBoards?: boolean;
  showKanban?: boolean;
  showFocusBoard?: boolean;
  showLearningStudio?: boolean;
  showTimeClustering?: boolean;
  showRoutines?: boolean;
  showNotes?: boolean;
  showChat?: boolean;
  initialTimeClusteringOpen?: boolean;
  initialTimeClusteringLayoutMode?: TimeClusteringLayoutMode;
  callbacks: PresentationMenuViewCallbacks;
};

export type PresentationMenuRenderState = {
  activeView: WorkspaceView;
  collapsedOffsetPx: number;
  mode: PresentationMenuMode;
};

export class PresentationMenuView {
  public readonly element: HTMLDivElement;
  public readonly shouldRender: boolean;

  private readonly runtime: AppRuntime;
  private readonly callbacks: PresentationMenuViewCallbacks;
  private readonly controls: WorkspaceControlsBar;
  private readonly controlsAccessory: HTMLDivElement;
  private readonly globalMenu: GlobalMenu;
  private readonly autoCollapseEnabled: boolean;
  private readonly intentZone: HTMLDivElement;
  private readonly handleDock: HTMLDivElement;
  private readonly handleButton: HTMLButtonElement;
  private readonly handleViewIcon: HTMLSpanElement;
  private readonly handleChevronIcon: HTMLSpanElement;
  private readonly pinButton: HTMLButtonElement;
  private readonly pinIndicator: HTMLSpanElement;

  constructor(options: PresentationMenuViewOptions) {
    this.runtime = options.runtime;
    this.callbacks = options.callbacks;
    this.autoCollapseEnabled = options.autoCollapseEnabled;
    this.globalMenu = new GlobalMenu(this.runtime, {
      wallpaperService: options.wallpaperService,
      triggerButtonTone: 'text',
      triggerButtonSize: 'md',
      triggerButtonClassName: PRESENTATION_MENU_ACCESSORY_BUTTON_CLASS,
    });

    this.handleViewIcon = document.createElement('span');
    this.handleViewIcon.style.display = 'inline-flex';
    this.handleViewIcon.style.alignItems = 'center';
    this.handleViewIcon.style.justifyContent = 'center';
    this.handleViewIcon.style.width = '19px';
    this.handleViewIcon.style.height = '19px';
    this.handleViewIcon.style.borderRadius = '4px';
    this.handleViewIcon.style.background = 'rgba(255, 255, 255, 0.1)';

    this.handleChevronIcon = document.createElement('span');
    this.handleChevronIcon.style.display = 'inline-flex';
    this.handleChevronIcon.style.alignItems = 'center';
    this.handleChevronIcon.style.justifyContent = 'center';
    this.handleChevronIcon.style.width = '13px';
    this.handleChevronIcon.style.height = '13px';
    this.handleChevronIcon.style.opacity = '0.76';

    this.handleButton = document.createElement('button');
    this.handleButton.type = 'button';
    this.handleButton.dataset.role = 'presentation-menu-handle';
    this.handleButton.style.display = 'inline-flex';
    this.handleButton.style.alignItems = 'center';
    this.handleButton.style.justifyContent = 'center';
    this.handleButton.style.gap = '6px';
    this.handleButton.style.width = `${PRESENTATION_MENU_PEEK_HANDLE_WIDTH_PX}px`;
    this.handleButton.style.height = `${PRESENTATION_MENU_PEEK_HANDLE_HEIGHT_PX}px`;
    this.handleButton.style.padding = '0 11px';
    this.handleButton.style.border = 'none';
    this.handleButton.style.borderRadius = '999px';
    this.handleButton.style.background = 'rgba(15, 23, 42, 0.76)';
    this.handleButton.style.color = '#f8fafc';
    this.handleButton.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.14)';
    this.handleButton.style.cursor = 'pointer';
    this.handleButton.style.pointerEvents = 'auto';
    this.handleButton.append(this.handleViewIcon, this.handleChevronIcon);

    this.pinButton = createIconButton({
      icon: 'lock-open',
      tone: 'text',
      size: 'md',
      className: `hidden shrink-0 relative overflow-visible ${PRESENTATION_MENU_ACCESSORY_BUTTON_CLASS}`,
    });
    this.pinButton.dataset.role = 'presentation-menu-pin';
    this.pinButton.style.display = this.autoCollapseEnabled ? 'inline-flex' : 'none';
    this.pinIndicator = document.createElement('span');
    this.pinIndicator.setAttribute('aria-hidden', 'true');
    this.pinIndicator.style.position = 'absolute';
    this.pinIndicator.style.left = '50%';
    this.pinIndicator.style.bottom = '0';
    this.pinIndicator.style.display = 'block';
    this.pinIndicator.style.width = '13px';
    this.pinIndicator.style.height = '2px';
    this.pinIndicator.style.borderRadius = '999px';
    this.pinIndicator.style.background = '#6366f1';
    this.pinIndicator.style.opacity = '0';
    this.pinIndicator.style.transform = 'translateX(-50%) scaleX(0.45)';
    this.pinIndicator.style.transition =
      'opacity 180ms ease-out, transform 180ms ease-out';
    this.pinButton.append(this.pinIndicator);

    this.controlsAccessory = document.createElement('div');
    this.controlsAccessory.dataset.role =
      'presentation-menu-panel-accessory';
    this.controlsAccessory.style.display = 'inline-flex';
    this.controlsAccessory.style.alignItems = 'center';
    this.controlsAccessory.style.gap = '6px';
    this.controlsAccessory.style.flexShrink = '0';
    this.controlsAccessory.append(this.pinButton, this.globalMenu.element);

    this.controls = new WorkspaceControlsBar({
      runtime: this.runtime,
      initialView: options.initialView,
      initialTimeClusteringOpen: options.initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: options.initialTimeClusteringLayoutMode,
      showBoards: options.showBoards,
      showKanban: options.showKanban,
      showFocusBoard: options.showFocusBoard,
      showLearningStudio: options.showLearningStudio,
      showTimeClustering: options.showTimeClustering,
      showRoutines: options.showRoutines,
      showNotes: options.showNotes,
      showChat: options.showChat,
      trailingAccessory: this.controlsAccessory,
      variant: 'floating',
    });
    this.shouldRender = this.controls.shouldRender;

    this.intentZone = document.createElement('div');
    this.intentZone.dataset.role = 'presentation-menu-intent-zone';
    this.intentZone.style.position = 'absolute';
    this.intentZone.style.left = '50%';
    this.intentZone.style.bottom = `${
      PRESENTATION_MENU_PEEK_BOTTOM_OFFSET_PX -
      PRESENTATION_MENU_INTENT_ZONE_PADDING_PX
    }px`;
    this.intentZone.style.width = `${
      PRESENTATION_MENU_PEEK_HANDLE_WIDTH_PX +
      PRESENTATION_MENU_INTENT_ZONE_PADDING_PX * 2
    }px`;
    this.intentZone.style.height = `${
      PRESENTATION_MENU_PEEK_HANDLE_HEIGHT_PX +
      PRESENTATION_MENU_INTENT_ZONE_PADDING_PX * 2
    }px`;
    this.intentZone.style.transform = 'translateX(-50%)';
    this.intentZone.style.pointerEvents = 'auto';
    this.intentZone.style.opacity = '0';
    this.intentZone.style.background = 'transparent';

    this.handleDock = document.createElement('div');
    this.handleDock.dataset.role = 'presentation-menu-handle-dock';
    this.handleDock.style.position = 'absolute';
    this.handleDock.style.left = '50%';
    this.handleDock.style.bottom = `${PRESENTATION_MENU_PEEK_BOTTOM_OFFSET_PX}px`;
    this.handleDock.style.transform = 'translateX(-50%) translateY(0px)';
    this.handleDock.style.display = 'inline-flex';
    this.handleDock.style.alignItems = 'center';
    this.handleDock.style.justifyContent = 'center';
    this.handleDock.style.pointerEvents = 'auto';
    this.handleDock.append(this.handleButton);

    this.element = document.createElement('div');
    this.element.id = 'presentation-menu';
    this.element.style.position = 'fixed';
    this.element.style.bottom = '16px';
    this.element.style.left = '50%';
    this.element.style.transform = 'translateX(-50%)';
    this.element.style.zIndex = '45';
    this.element.style.pointerEvents = 'none';
    this.element.append(this.controls.element, this.intentZone, this.handleDock);
    this.controls.element.style.willChange = 'transform, opacity';
    this.controls.element.style.transformOrigin = 'center bottom';

    this.controls.element.addEventListener(
      'mouseenter',
      this.callbacks.onControlsEnter
    );
    this.controls.element.addEventListener(
      'mouseleave',
      this.callbacks.onControlsLeave
    );
    this.intentZone.addEventListener(
      'mouseenter',
      this.callbacks.onIntentZoneEnter
    );
    this.intentZone.addEventListener(
      'mouseleave',
      this.callbacks.onIntentZoneLeave
    );
    this.handleButton.addEventListener('mouseenter', this.callbacks.onPeekEnter);
    this.handleButton.addEventListener('mouseleave', this.callbacks.onPeekLeave);
    this.handleButton.addEventListener('click', this.callbacks.onHandleClick);
    this.pinButton.addEventListener('click', this.callbacks.onPinClick);
    this.element.addEventListener(
      'click',
      this.callbacks.onInteractionCapture,
      true
    );
    this.element.addEventListener('keydown', this.callbacks.onKeyDown);
    this.element.addEventListener('focusin', this.callbacks.onFocusIn);
    this.element.addEventListener('focusout', this.callbacks.onFocusOut);
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.element.parentElement) return;
    parent.appendChild(this.element);
    this.globalMenu.mount();
  }

  public unmount(): void {
    this.globalMenu.unmount();
    this.element.remove();
  }

  public destroy(): void {
    this.unmount();
    this.controls.element.removeEventListener(
      'mouseenter',
      this.callbacks.onControlsEnter
    );
    this.controls.element.removeEventListener(
      'mouseleave',
      this.callbacks.onControlsLeave
    );
    this.intentZone.removeEventListener(
      'mouseenter',
      this.callbacks.onIntentZoneEnter
    );
    this.intentZone.removeEventListener(
      'mouseleave',
      this.callbacks.onIntentZoneLeave
    );
    this.handleButton.removeEventListener('mouseenter', this.callbacks.onPeekEnter);
    this.handleButton.removeEventListener('mouseleave', this.callbacks.onPeekLeave);
    this.handleButton.removeEventListener('click', this.callbacks.onHandleClick);
    this.pinButton.removeEventListener('click', this.callbacks.onPinClick);
    this.element.removeEventListener(
      'click',
      this.callbacks.onInteractionCapture,
      true
    );
    this.element.removeEventListener('keydown', this.callbacks.onKeyDown);
    this.element.removeEventListener('focusin', this.callbacks.onFocusIn);
    this.element.removeEventListener('focusout', this.callbacks.onFocusOut);
    this.controls.destroy();
  }

  public prime(): void {
    this.controls.prime();
  }

  public render(state: PresentationMenuRenderState): void {
    const peek = state.mode === 'peek';
    const expanded = state.mode !== 'peek';
    const pinned = state.mode === 'pinned';
    const publicMode = pinned ? 'pinned' : expanded ? 'open' : 'peek';
    const offset = expanded ? 0 : state.collapsedOffsetPx;
    const scale = expanded ? 1 : PRESENTATION_MENU_PANEL_PEEK_SCALE;

    this.applyMotionProfile(expanded);

    this.controls.element.style.transform = `translateY(${offset}px) scale(${scale})`;
    this.controls.element.style.opacity = expanded
      ? '1'
      : `${PRESENTATION_MENU_PANEL_PEEK_OPACITY}`;
    this.controls.element.style.pointerEvents = expanded ? 'auto' : 'none';

    this.element.dataset.mode = publicMode;
    this.element.dataset.collapsed = expanded ? 'false' : 'true';
    this.element.dataset.pinned = pinned ? 'true' : 'false';

    this.handleViewIcon.replaceChildren(
      createIcon(this.getHandleViewIconName(state.activeView), {
        size: 13,
        strokeWidth: 1.9,
      })
    );
    this.handleChevronIcon.replaceChildren(
      createIcon(expanded ? 'chevron-down' : 'chevron-up', {
        size: 13,
        strokeWidth: 1.9,
      })
    );

    this.handleButton.title = this.runtime.i18n.t('workspaceControls.showControls');
    this.handleButton.setAttribute('aria-label', this.handleButton.title);
    this.handleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    this.handleButton.style.width = peek
      ? `${PRESENTATION_MENU_PEEK_HANDLE_WIDTH_PX}px`
      : `${PRESENTATION_MENU_HIDDEN_HANDLE_WIDTH_PX}px`;
    this.handleButton.style.height = peek
      ? `${PRESENTATION_MENU_PEEK_HANDLE_HEIGHT_PX}px`
      : `${PRESENTATION_MENU_HIDDEN_HANDLE_HEIGHT_PX}px`;
    this.handleButton.style.background = peek
      ? 'rgba(15, 23, 42, 0.76)'
      : 'rgba(15, 23, 42, 0.7)';
    this.handleButton.style.boxShadow = peek
      ? '0 10px 24px rgba(15, 23, 42, 0.14)'
      : '0 8px 20px rgba(15, 23, 42, 0.12)';
    this.handleButton.style.pointerEvents = peek ? 'auto' : 'none';
    this.handleButton.tabIndex = peek ? 0 : -1;
    this.handleButton.setAttribute('aria-hidden', peek ? 'false' : 'true');

    this.handleViewIcon.style.width = peek ? '19px' : '17px';
    this.handleViewIcon.style.height = peek ? '19px' : '17px';
    this.handleViewIcon.style.opacity = peek ? '1' : '0.88';

    this.handleChevronIcon.style.opacity = peek ? '0.76' : '0.66';
    this.handleChevronIcon.style.transform = expanded
      ? 'translateY(1px)'
      : 'translateY(0px)';

    this.handleDock.style.bottom = `${
      peek
        ? PRESENTATION_MENU_PEEK_BOTTOM_OFFSET_PX
        : PRESENTATION_MENU_PEEK_HIDDEN_OFFSET_PX
    }px`;
    this.handleDock.style.opacity = peek ? '1' : '0';
    this.handleDock.style.pointerEvents = peek ? 'auto' : 'none';
    this.handleDock.style.transform = peek
      ? 'translateX(-50%) translateY(0px) scale(1)'
      : `translateX(-50%) translateY(${PRESENTATION_MENU_HANDLE_HIDE_TRANSLATE_Y_PX}px) scale(${PRESENTATION_MENU_HANDLE_HIDE_SCALE})`;

    this.intentZone.style.display = this.autoCollapseEnabled && peek ? 'block' : 'none';

    setIconButtonContent(
      this.pinButton,
      createIcon(pinned ? 'lock-closed' : 'lock-open', {
        size: 13,
        strokeWidth: 1.9,
      })
    );
    this.pinButton.title = this.runtime.i18n.t(
      pinned
        ? 'workspaceControls.unpinControls'
        : 'workspaceControls.pinControls'
    );
    this.pinButton.setAttribute('aria-label', this.pinButton.title);
    this.pinButton.setAttribute('aria-pressed', pinned ? 'true' : 'false');
    this.pinButton.style.display =
      this.autoCollapseEnabled && expanded ? 'inline-flex' : 'none';
    this.pinButton.classList.toggle('bg-indigo-50', pinned);
    this.pinButton.classList.toggle('text-indigo-700', pinned);
    this.pinButton.classList.toggle('hover:bg-indigo-50', pinned);
    this.pinButton.classList.toggle('hover:text-indigo-700', pinned);
    this.pinButton.classList.toggle('active:bg-indigo-100', pinned);
    this.pinIndicator.style.opacity = pinned ? '1' : '0';
    this.pinIndicator.style.transform = pinned
      ? 'translateX(-50%) scaleX(1)'
      : 'translateX(-50%) scaleX(0.45)';
  }

  public setActiveView(view: WorkspaceView): void {
    this.controls.setActiveView(view);
  }

  public setChatOpen(open: boolean): void {
    this.controls.setChatOpen(open);
  }

  public setTimeClusteringOpen(open: boolean): void {
    this.controls.setTimeClusteringOpen(open);
  }

  public setTimeClusteringLayoutMode(mode: TimeClusteringLayoutMode): void {
    this.controls.setTimeClusteringLayoutMode(mode);
  }

  public measureControlsHeight(): number {
    return (
      this.controls.element.getBoundingClientRect().height ||
      PRESENTATION_MENU_FALLBACK_HEIGHT_PX
    );
  }

  public getControlsElement(): HTMLDivElement {
    return this.controls.element;
  }

  public contains(node: Node | null): boolean {
    return node instanceof Node ? this.element.contains(node) : false;
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }

  public isMounted(): boolean {
    return this.element.parentElement !== null;
  }

  public isGlobalMenuOpen(): boolean {
    return this.globalMenu.isOpen();
  }

  public closeGlobalMenu(): void {
    this.globalMenu.close();
  }
  private applyMotionProfile(expanded: boolean): void {
    const transformMs = expanded
      ? PRESENTATION_MENU_OPEN_TRANSFORM_MS
      : PRESENTATION_MENU_CLOSE_TRANSFORM_MS;
    const opacityMs = expanded
      ? PRESENTATION_MENU_OPEN_OPACITY_MS
      : PRESENTATION_MENU_CLOSE_OPACITY_MS;
    const easing = expanded
      ? PRESENTATION_MENU_OPEN_EASING
      : PRESENTATION_MENU_CLOSE_EASING;
    const handleOpacityDelayMs = expanded ? 0 : 36;

    this.controls.element.style.transition =
      `transform ${transformMs}ms ${easing}, ` +
      `opacity ${opacityMs}ms ${easing}`;
    this.handleDock.style.transition =
      `bottom ${transformMs}ms ${easing}, ` +
      `transform ${transformMs}ms ${easing}, ` +
      `opacity ${opacityMs}ms ${easing} ${handleOpacityDelayMs}ms`;
    this.handleButton.style.transition =
      `transform ${transformMs}ms ${easing}, ` +
      `width ${transformMs}ms ${easing}, ` +
      `height ${transformMs}ms ${easing}, ` +
      `background-color ${transformMs}ms ${easing}, ` +
      `box-shadow ${transformMs}ms ${easing}, ` +
      `opacity ${opacityMs}ms ${easing}`;
    this.handleViewIcon.style.transition =
      `width ${transformMs}ms ${easing}, ` +
      `height ${transformMs}ms ${easing}, ` +
      `background-color ${transformMs}ms ${easing}, ` +
      `opacity ${opacityMs}ms ${easing}`;
    this.handleChevronIcon.style.transition =
      `opacity ${opacityMs}ms ${easing}, ` +
      `transform ${transformMs}ms ${easing}`;
    this.pinButton.style.transition =
      `background-color ${transformMs}ms ${easing}, ` +
      `color ${transformMs}ms ${easing}, ` +
      `opacity ${opacityMs}ms ${easing}`;
  }

  private getHandleViewIconName(view: WorkspaceView): IconName {
    if (view === 'boards') return 'kanban';
    if (view === 'kanban') return 'view-columns';
    if (view === 'focus-board') return 'view-columns';
    if (view === 'learning-studio') return 'academic-cap';
    return 'map';
  }
}
