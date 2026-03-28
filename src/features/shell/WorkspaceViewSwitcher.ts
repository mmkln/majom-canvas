import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';
import { createIcon, type IconName } from '../canvas/ui/icons.ts';
import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { WorkspaceAppMenu } from './components/WorkspaceAppMenu.ts';
import type { WallpaperService } from './services/WallpaperService.ts';
import {
  loadPersistedWorkspaceViewSwitcherPinned,
  persistWorkspaceViewSwitcherPinned,
} from './workspaceUiState.ts';

const WORKSPACE_VIEW_SWITCHER_COLLAPSE_DELAY_MS = 520;
const WORKSPACE_VIEW_SWITCHER_COLLAPSED_EXTRA_OFFSET_PX = 22;
const WORKSPACE_VIEW_SWITCHER_HANDLE_EXPANDED_BOTTOM_OFFSET_PX = -14;
const WORKSPACE_VIEW_SWITCHER_HANDLE_PEEK_BOTTOM_OFFSET_PX = -6;
const WORKSPACE_VIEW_SWITCHER_FALLBACK_HEIGHT_PX = 44;
const WORKSPACE_VIEW_SWITCHER_TRANSITION_MS = 240;
const WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS = 220;
const WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING =
  'cubic-bezier(0.22, 1, 0.36, 1)';

type WorkspaceViewSwitcherOptions = {
  runtime?: AppRuntime;
  wallpaperService?: WallpaperService;
  showKanban?: boolean;
  showLearningStudio?: boolean;
  showTimeClustering?: boolean;
  showRoutines?: boolean;
  showChat?: boolean;
  initialTimeClusteringOpen?: boolean;
  initialTimeClusteringLayoutMode?: TimeClusteringLayoutMode;
};

export class WorkspaceViewSwitcher {
  private readonly container: HTMLDivElement;
  private readonly controls: WorkspaceControlsBar;
  private readonly appMenu: WorkspaceAppMenu;
  private readonly shouldRender: boolean;
  private readonly autoCollapseEnabled: boolean;
  private readonly runtime: AppRuntime;
  private readonly handleDock: HTMLDivElement;
  private readonly handleButton: HTMLButtonElement;
  private readonly handleViewIcon: HTMLSpanElement;
  private readonly handleChevronIcon: HTMLSpanElement;
  private readonly pinButton: HTMLButtonElement;
  private readonly pinIcon: HTMLSpanElement;
  private collapseTimerId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private collapsedOffsetPx = 0;
  private expanded = true;
  private pinned = false;
  private hoverWithin = false;
  private focusWithin = false;
  private suppressAutoExpand = false;
  private activeView: WorkspaceView;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private readonly windowResizeHandler: () => void;
  private readonly mouseEnterHandler: () => void;
  private readonly mouseLeaveHandler: (event: MouseEvent) => void;
  private readonly focusInHandler: () => void;
  private readonly focusOutHandler: () => void;
  private readonly handleClickHandler: () => void;
  private readonly pinClickHandler: () => void;

  constructor(
    initialView: WorkspaceView,
    options: WorkspaceViewSwitcherOptions = {}
  ) {
    const runtime = options.runtime ?? createAppRuntime();
    this.runtime = runtime;
    this.activeView = initialView;
    this.appMenu = new WorkspaceAppMenu(runtime, {
      wallpaperService: options.wallpaperService,
    });
    this.controls = new WorkspaceControlsBar({
      runtime,
      initialView,
      initialTimeClusteringOpen: options.initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: options.initialTimeClusteringLayoutMode,
      showKanban: options.showKanban,
      showLearningStudio: options.showLearningStudio,
      showTimeClustering: options.showTimeClustering,
      showRoutines: options.showRoutines,
      showChat: options.showChat,
      trailingAccessory: this.appMenu.element,
      variant: 'floating',
    });
    this.shouldRender = this.controls.shouldRender;
    this.autoCollapseEnabled = !this.isCoarsePointer();
    this.pinned = this.autoCollapseEnabled
      ? loadPersistedWorkspaceViewSwitcherPinned()
      : false;
    this.handleViewIcon = document.createElement('span');
    this.handleViewIcon.style.display = 'inline-flex';
    this.handleViewIcon.style.alignItems = 'center';
    this.handleViewIcon.style.justifyContent = 'center';
    this.handleViewIcon.style.width = '18px';
    this.handleViewIcon.style.height = '18px';
    this.handleViewIcon.style.borderRadius = '999px';
    this.handleViewIcon.style.background = 'rgba(255, 255, 255, 0.1)';
    this.handleViewIcon.style.transition =
      `width ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `height ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `background-color ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `opacity ${WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;

    this.handleChevronIcon = document.createElement('span');
    this.handleChevronIcon.style.display = 'inline-flex';
    this.handleChevronIcon.style.alignItems = 'center';
    this.handleChevronIcon.style.justifyContent = 'center';
    this.handleChevronIcon.style.transition =
      `opacity ${WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;

    this.pinIcon = document.createElement('span');
    this.pinIcon.style.display = 'inline-flex';
    this.pinIcon.style.alignItems = 'center';
    this.pinIcon.style.justifyContent = 'center';

    this.handleButton = document.createElement('button');
    this.handleButton.type = 'button';
    this.handleButton.dataset.role = 'workspace-view-switcher-handle';
    this.handleButton.style.display = 'inline-flex';
    this.handleButton.style.alignItems = 'center';
    this.handleButton.style.justifyContent = 'center';
    this.handleButton.style.gap = '8px';
    this.handleButton.style.height = '28px';
    this.handleButton.style.padding = '0 10px';
    this.handleButton.style.border = 'none';
    this.handleButton.style.borderRadius = '999px';
    this.handleButton.style.background = 'rgba(15, 23, 42, 0.74)';
    this.handleButton.style.color = '#f8fafc';
    this.handleButton.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.14)';
    this.handleButton.style.cursor = 'pointer';
    this.handleButton.style.pointerEvents = 'auto';
    this.handleButton.style.transition =
      `transform ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `height ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `padding ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `gap ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `background-color ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `box-shadow ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `opacity ${WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;
    this.handleButton.append(this.handleViewIcon, this.handleChevronIcon);

    this.pinButton = document.createElement('button');
    this.pinButton.type = 'button';
    this.pinButton.dataset.role = 'workspace-view-switcher-pin';
    this.pinButton.style.display = this.autoCollapseEnabled
      ? 'inline-flex'
      : 'none';
    this.pinButton.style.alignItems = 'center';
    this.pinButton.style.justifyContent = 'center';
    this.pinButton.style.width = '28px';
    this.pinButton.style.height = '28px';
    this.pinButton.style.padding = '0';
    this.pinButton.style.border = 'none';
    this.pinButton.style.borderRadius = '999px';
    this.pinButton.style.background = 'rgba(15, 23, 42, 0.68)';
    this.pinButton.style.color = '#f8fafc';
    this.pinButton.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.14)';
    this.pinButton.style.cursor = 'pointer';
    this.pinButton.style.pointerEvents = 'auto';
    this.pinButton.style.transition =
      `transform ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `background-color ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `color ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `opacity ${WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;
    this.pinButton.append(this.pinIcon);

    this.handleDock = document.createElement('div');
    this.handleDock.dataset.role = 'workspace-view-switcher-handle-dock';
    this.handleDock.style.position = 'absolute';
    this.handleDock.style.left = '50%';
    this.handleDock.style.bottom = `${WORKSPACE_VIEW_SWITCHER_HANDLE_EXPANDED_BOTTOM_OFFSET_PX}px`;
    this.handleDock.style.transform = 'translateX(-50%)';
    this.handleDock.style.display = 'inline-flex';
    this.handleDock.style.alignItems = 'center';
    this.handleDock.style.gap = '8px';
    this.handleDock.style.pointerEvents = 'auto';
    this.handleDock.style.transition =
      `bottom ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `gap ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}, ` +
      `opacity ${WORKSPACE_VIEW_SWITCHER_OPACITY_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;
    this.handleDock.append(this.handleButton, this.pinButton);
    this.syncHandleVisuals();

    this.windowResizeHandler = () => {
      this.updateCollapsedOffset();
    };
    this.mouseEnterHandler = () => {
      this.hoverWithin = true;
      this.suppressAutoExpand = false;
      this.expand();
    };
    this.mouseLeaveHandler = (event: MouseEvent) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && this.container.contains(nextTarget)) {
        return;
      }
      this.hoverWithin = false;
      this.scheduleCollapse();
    };
    this.focusInHandler = () => {
      this.focusWithin = true;
      this.suppressAutoExpand = false;
      this.expand();
    };
    this.focusOutHandler = () => {
      window.setTimeout(() => {
        this.focusWithin = this.container.contains(document.activeElement);
        this.scheduleCollapse();
      }, 0);
    };
    this.handleClickHandler = () => {
      if (this.expanded) {
        this.collapseFromHandle();
        return;
      }
      this.suppressAutoExpand = false;
      this.expand();
    };
    this.pinClickHandler = () => {
      this.togglePinned();
    };

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '16px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';
    this.container.append(this.controls.element, this.handleDock);
    this.container.dataset.collapsed = 'false';
    this.container.dataset.pinned = this.pinned ? 'true' : 'false';
    this.controls.element.style.transition =
      `transform ${WORKSPACE_VIEW_SWITCHER_TRANSITION_MS}ms ${WORKSPACE_VIEW_SWITCHER_TRANSITION_EASING}`;
    this.controls.element.style.willChange = 'transform';

    this.controls.element.addEventListener('mouseenter', this.mouseEnterHandler);
    this.controls.element.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.handleButton.addEventListener('mouseenter', this.mouseEnterHandler);
    this.handleButton.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.handleButton.addEventListener('click', this.handleClickHandler);
    this.pinButton.addEventListener('mouseenter', this.mouseEnterHandler);
    this.pinButton.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.pinButton.addEventListener('click', this.pinClickHandler);
    this.container.addEventListener('focusin', this.focusInHandler);
    this.container.addEventListener('focusout', this.focusOutHandler);
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.container.parentElement) return;
    parent.appendChild(this.container);
    this.appMenu.mount();
    this.controls.prime();
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.syncHandleVisuals(),
      { emitCurrent: true }
    );
    this.updateCollapsedOffset();
    window.addEventListener('resize', this.windowResizeHandler);
    if (this.autoCollapseEnabled) {
      this.collapseImmediately();
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateCollapsedOffset();
      });
      this.resizeObserver.observe(this.controls.element);
    }
  }

  public unmount(): void {
    window.removeEventListener('resize', this.windowResizeHandler);
    this.clearCollapseTimer();
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.controls.element.removeEventListener(
      'mouseenter',
      this.mouseEnterHandler
    );
    this.controls.element.removeEventListener(
      'mouseleave',
      this.mouseLeaveHandler
    );
    this.handleButton.removeEventListener('mouseenter', this.mouseEnterHandler);
    this.handleButton.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.handleButton.removeEventListener('click', this.handleClickHandler);
    this.pinButton.removeEventListener('mouseenter', this.mouseEnterHandler);
    this.pinButton.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.pinButton.removeEventListener('click', this.pinClickHandler);
    this.container.removeEventListener('focusin', this.focusInHandler);
    this.container.removeEventListener('focusout', this.focusOutHandler);
    this.appMenu.unmount();
    this.controls.destroy();
    this.container.remove();
  }

  public setActiveView(view: WorkspaceView): void {
    this.activeView = view;
    this.controls.setActiveView(view);
    this.syncHandleVisuals();
  }

  public setVisible(visible: boolean): void {
    if (!this.shouldRender) return;
    if (!visible) {
      this.appMenu.close();
      this.clearCollapseTimer();
      this.suppressAutoExpand = false;
    }
    this.container.style.display = visible ? 'block' : 'none';
    if (visible) {
      this.updateCollapsedOffset();
      if (this.autoCollapseEnabled) {
        if (this.pinned) {
          this.expand();
        } else {
          this.collapseImmediately();
        }
      }
    }
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

  private isCoarsePointer(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }

  private updateCollapsedOffset(): void {
    const measuredHeight =
      this.controls.element.getBoundingClientRect().height ||
      WORKSPACE_VIEW_SWITCHER_FALLBACK_HEIGHT_PX;
    this.collapsedOffsetPx = Math.max(
      0,
      measuredHeight + WORKSPACE_VIEW_SWITCHER_COLLAPSED_EXTRA_OFFSET_PX
    );
    this.applyCollapsedState();
  }

  private expand(): void {
    this.clearCollapseTimer();
    if (!this.expanded) {
      this.expanded = true;
      this.applyCollapsedState();
    }
  }

  private collapseImmediately(): void {
    if (this.shouldStayExpanded()) {
      this.expand();
      return;
    }
    this.clearCollapseTimer();
    this.expanded = false;
    this.applyCollapsedState();
  }

  private collapseFromHandle(): void {
    this.appMenu.close();
    this.clearCollapseTimer();
    this.suppressAutoExpand = true;
    if (this.pinned) {
      this.pinned = false;
      persistWorkspaceViewSwitcherPinned(false);
    }
    this.expanded = false;
    this.applyCollapsedState();
  }

  private scheduleCollapse(): void {
    if (!this.autoCollapseEnabled) return;
    if (this.shouldStayExpanded()) {
      this.expand();
      return;
    }
    this.clearCollapseTimer();
    this.collapseTimerId = window.setTimeout(() => {
      if (this.shouldStayExpanded()) {
        this.expand();
        return;
      }
      this.expanded = false;
      this.applyCollapsedState();
    }, WORKSPACE_VIEW_SWITCHER_COLLAPSE_DELAY_MS);
  }

  private clearCollapseTimer(): void {
    if (this.collapseTimerId === null) return;
    window.clearTimeout(this.collapseTimerId);
    this.collapseTimerId = null;
  }

  private togglePinned(): void {
    this.pinned = !this.pinned;
    persistWorkspaceViewSwitcherPinned(this.pinned);
    this.suppressAutoExpand = false;
    if (this.pinned) {
      this.expanded = true;
      this.applyCollapsedState();
      return;
    }
    this.applyCollapsedState();
    this.scheduleCollapse();
  }

  private shouldStayExpanded(): boolean {
    if (this.pinned) return true;
    if (this.suppressAutoExpand) {
      return this.appMenu.isOpen();
    }
    return this.hoverWithin || this.focusWithin || this.appMenu.isOpen();
  }

  private applyCollapsedState(): void {
    const offset = this.expanded ? 0 : this.collapsedOffsetPx;
    this.controls.element.style.transform = `translateY(${offset}px)`;
    this.controls.element.style.pointerEvents = this.expanded ? 'auto' : 'none';
    this.container.dataset.collapsed = this.expanded ? 'false' : 'true';
    this.container.dataset.pinned = this.pinned ? 'true' : 'false';
    this.syncHandleVisuals();
  }

  private syncHandleVisuals(): void {
    const peek = !this.expanded;
    this.handleViewIcon.replaceChildren(
      createIcon(this.getHandleViewIconName(this.activeView), {
        size: 12,
        strokeWidth: 1.9,
      })
    );
    this.handleChevronIcon.replaceChildren(
      createIcon(this.expanded ? 'chevron-down' : 'chevron-up', {
        size: 12,
        strokeWidth: 1.9,
      })
    );
    this.handleButton.title = this.runtime.i18n.t(
      this.expanded
        ? 'workspaceControls.hideControls'
        : 'workspaceControls.showControls'
    );
    this.handleButton.setAttribute('aria-label', this.handleButton.title);
    this.handleButton.setAttribute('aria-expanded', this.expanded ? 'true' : 'false');
    this.handleButton.style.gap = peek ? '6px' : '8px';
    this.handleButton.style.height = peek ? '24px' : '28px';
    this.handleButton.style.padding = peek ? '0 8px' : '0 10px';
    this.handleButton.style.background = peek
      ? 'rgba(15, 23, 42, 0.68)'
      : 'rgba(15, 23, 42, 0.58)';
    this.handleButton.style.opacity = peek ? '0.94' : '0.82';
    this.handleButton.style.boxShadow = peek
      ? '0 6px 16px rgba(15, 23, 42, 0.12)'
      : '0 10px 24px rgba(15, 23, 42, 0.14)';
    this.handleButton.style.transform = this.expanded
      ? 'translateY(6px)'
      : 'translateY(0px)';
    this.handleViewIcon.style.width = peek ? '16px' : '18px';
    this.handleViewIcon.style.height = peek ? '16px' : '18px';
    this.handleViewIcon.style.background = peek
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.1)';
    this.handleViewIcon.style.opacity = peek ? '0.92' : '1';
    this.handleChevronIcon.style.opacity = peek ? '0.78' : '0.92';
    this.pinIcon.replaceChildren(
      createIcon(this.pinned ? 'lock-closed' : 'lock-open', {
        size: 12,
        strokeWidth: 1.9,
      })
    );
    this.pinButton.title = this.runtime.i18n.t(
      this.pinned
        ? 'workspaceControls.unpinControls'
        : 'workspaceControls.pinControls'
    );
    this.pinButton.style.display =
      this.autoCollapseEnabled && this.expanded ? 'inline-flex' : 'none';
    this.pinButton.setAttribute('aria-label', this.pinButton.title);
    this.pinButton.setAttribute('aria-pressed', this.pinned ? 'true' : 'false');
    this.pinButton.style.background = this.pinned
      ? 'rgba(51, 65, 85, 0.74)'
      : 'rgba(15, 23, 42, 0.62)';
    this.pinButton.style.color = this.pinned ? '#e2e8f0' : '#f8fafc';
    this.pinButton.style.opacity = this.pinned ? '0.94' : '0.84';
    this.pinButton.style.boxShadow = this.pinned
      ? '0 10px 24px rgba(15, 23, 42, 0.14), inset 0 0 0 1px rgba(148, 163, 184, 0.24)'
      : '0 10px 24px rgba(15, 23, 42, 0.14)';
    this.pinButton.style.transform = this.expanded
      ? 'translateY(6px)'
      : 'translateY(0px)';
    this.handleDock.style.bottom = `${
      peek
        ? WORKSPACE_VIEW_SWITCHER_HANDLE_PEEK_BOTTOM_OFFSET_PX
        : WORKSPACE_VIEW_SWITCHER_HANDLE_EXPANDED_BOTTOM_OFFSET_PX
    }px`;
    this.handleDock.style.gap = peek ? '0px' : '8px';
    this.handleDock.style.opacity = peek ? '0.96' : '1';
  }

  private getHandleViewIconName(view: WorkspaceView): IconName {
    if (view === 'kanban') return 'view-columns';
    if (view === 'learning-studio') return 'academic-cap';
    return 'map';
  }
}
