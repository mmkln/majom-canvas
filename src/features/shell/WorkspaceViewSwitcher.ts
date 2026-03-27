import { WorkspaceControlsBar } from './WorkspaceControlsBar.ts';
import { createIcon, type IconName } from '../canvas/ui/icons.ts';
import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { WorkspaceAppMenu } from './components/WorkspaceAppMenu.ts';
import type { WallpaperService } from './services/WallpaperService.ts';

const WORKSPACE_VIEW_SWITCHER_COLLAPSE_DELAY_MS = 220;
const WORKSPACE_VIEW_SWITCHER_COLLAPSED_EXTRA_OFFSET_PX = 22;
const WORKSPACE_VIEW_SWITCHER_HANDLE_BOTTOM_OFFSET_PX = -14;
const WORKSPACE_VIEW_SWITCHER_FALLBACK_HEIGHT_PX = 44;

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
  private readonly handleButton: HTMLButtonElement;
  private readonly handleViewIcon: HTMLSpanElement;
  private readonly handleChevronIcon: HTMLSpanElement;
  private collapseTimerId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private collapsedOffsetPx = 0;
  private expanded = true;
  private hoverWithin = false;
  private focusWithin = false;
  private suppressAutoExpand = false;
  private activeView: WorkspaceView;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private readonly windowResizeHandler: () => void;
  private readonly mouseEnterHandler: () => void;
  private readonly mouseLeaveHandler: () => void;
  private readonly focusInHandler: () => void;
  private readonly focusOutHandler: () => void;
  private readonly handleClickHandler: () => void;

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
    this.handleViewIcon = document.createElement('span');
    this.handleViewIcon.style.display = 'inline-flex';
    this.handleViewIcon.style.alignItems = 'center';
    this.handleViewIcon.style.justifyContent = 'center';
    this.handleViewIcon.style.width = '18px';
    this.handleViewIcon.style.height = '18px';
    this.handleViewIcon.style.borderRadius = '999px';
    this.handleViewIcon.style.background = 'rgba(255, 255, 255, 0.14)';

    this.handleChevronIcon = document.createElement('span');
    this.handleChevronIcon.style.display = 'inline-flex';
    this.handleChevronIcon.style.alignItems = 'center';
    this.handleChevronIcon.style.justifyContent = 'center';

    this.handleButton = document.createElement('button');
    this.handleButton.type = 'button';
    this.handleButton.dataset.role = 'workspace-view-switcher-handle';
    this.handleButton.style.position = 'absolute';
    this.handleButton.style.left = '50%';
    this.handleButton.style.bottom = `${WORKSPACE_VIEW_SWITCHER_HANDLE_BOTTOM_OFFSET_PX}px`;
    this.handleButton.style.transform = 'translateX(-50%)';
    this.handleButton.style.display = 'inline-flex';
    this.handleButton.style.alignItems = 'center';
    this.handleButton.style.justifyContent = 'center';
    this.handleButton.style.gap = '8px';
    this.handleButton.style.height = '28px';
    this.handleButton.style.padding = '0 10px';
    this.handleButton.style.border = 'none';
    this.handleButton.style.borderRadius = '999px';
    this.handleButton.style.background = 'rgba(15, 23, 42, 0.9)';
    this.handleButton.style.color = '#f8fafc';
    this.handleButton.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.22)';
    this.handleButton.style.cursor = 'pointer';
    this.handleButton.style.pointerEvents = 'auto';
    this.handleButton.style.transition =
      'transform 180ms ease, background-color 180ms ease, opacity 180ms ease';
    this.handleButton.append(this.handleViewIcon, this.handleChevronIcon);
    this.syncHandleVisuals();

    this.windowResizeHandler = () => {
      this.updateCollapsedOffset();
    };
    this.mouseEnterHandler = () => {
      this.hoverWithin = true;
      this.suppressAutoExpand = false;
      this.expand();
    };
    this.mouseLeaveHandler = () => {
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

    this.container = document.createElement('div');
    this.container.id = 'workspace-view-switcher';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '16px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.zIndex = '45';
    this.container.style.pointerEvents = 'none';
    this.container.append(this.controls.element, this.handleButton);
    this.container.dataset.collapsed = 'false';
    this.controls.element.style.transition = 'transform 180ms ease';
    this.controls.element.style.willChange = 'transform';

    this.controls.element.addEventListener('mouseenter', this.mouseEnterHandler);
    this.controls.element.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.handleButton.addEventListener('mouseenter', this.mouseEnterHandler);
    this.handleButton.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.handleButton.addEventListener('click', this.handleClickHandler);
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
        this.collapseImmediately();
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

  private shouldStayExpanded(): boolean {
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
    this.syncHandleVisuals();
  }

  private syncHandleVisuals(): void {
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
    this.handleButton.style.background = this.expanded
      ? 'rgba(15, 23, 42, 0.74)'
      : 'rgba(15, 23, 42, 0.92)';
    this.handleButton.style.opacity = this.expanded ? '0.86' : '1';
    this.handleButton.style.transform = this.expanded
      ? 'translateX(-50%) translateY(6px)'
      : 'translateX(-50%) translateY(0px)';
  }

  private getHandleViewIconName(view: WorkspaceView): IconName {
    if (view === 'kanban') return 'view-columns';
    if (view === 'learning-studio') return 'academic-cap';
    return 'map';
  }
}
