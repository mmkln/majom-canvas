import type { WorkspaceView } from './WorkspaceView.ts';
import type { TimeClusteringLayoutMode } from '../time-clustering/domain/types.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import type { WallpaperService } from './services/WallpaperService.ts';
import {
  loadPersistedPresentationMenuPinned,
  persistPresentationMenuPinned,
} from './workspaceUiState.ts';
import {
  createPresentationMenuMachineState,
  isPresentationMenuExpanded,
  isPresentationMenuPinned,
  transitionPresentationMenuMachineState,
  type PresentationMenuMachineState,
} from './PresentationMenuMachine.ts';
import { PresentationMenuView } from './PresentationMenuView.ts';

const PRESENTATION_MENU_COLLAPSE_DELAY_MS = 520;
const PRESENTATION_MENU_OPEN_INTENT_DELAY_MS = 140;
const PRESENTATION_MENU_INTERACTION_HOLD_MS = 1600;
const PRESENTATION_MENU_COLLAPSED_EXTRA_OFFSET_PX = 22;

type PresentationMenuOptions = {
  runtime?: AppRuntime;
  wallpaperService?: WallpaperService;
  showBoards?: boolean;
  showKanban?: boolean;
  showFlows?: boolean;
  showFocusBoard?: boolean;
  showLearningStudio?: boolean;
  showTimeClustering?: boolean;
  showRoutines?: boolean;
  showNotes?: boolean;
  showChat?: boolean;
  initialTimeClusteringOpen?: boolean;
  initialTimeClusteringLayoutMode?: TimeClusteringLayoutMode;
};

export class PresentationMenu {
  private readonly runtime: AppRuntime;
  private readonly view: PresentationMenuView;
  private readonly shouldRender: boolean;
  private readonly autoCollapseEnabled: boolean;
  private state: PresentationMenuMachineState;
  private collapseTimerId: number | null = null;
  private openIntentTimerId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private collapsedOffsetPx = 0;
  private handleHovered = false;
  private controlsHovered = false;
  private focusWithin = false;
  private holdOpenUntil = 0;
  private activeView: WorkspaceView;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private readonly windowResizeHandler: () => void;

  constructor(
    initialView: WorkspaceView,
    options: PresentationMenuOptions = {}
  ) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.activeView = initialView;
    this.autoCollapseEnabled = !this.isCoarsePointer();
    this.state = createPresentationMenuMachineState({
      autoCollapseEnabled: this.autoCollapseEnabled,
      initiallyPinned: this.autoCollapseEnabled
        ? loadPersistedPresentationMenuPinned()
        : false,
    });

    this.view = new PresentationMenuView({
      runtime: this.runtime,
      wallpaperService: options.wallpaperService,
      initialView,
      autoCollapseEnabled: this.autoCollapseEnabled,
      initialTimeClusteringOpen: options.initialTimeClusteringOpen,
      initialTimeClusteringLayoutMode: options.initialTimeClusteringLayoutMode,
      showBoards: options.showBoards,
      showKanban: options.showKanban,
      showFlows: options.showFlows,
      showFocusBoard: options.showFocusBoard,
      showLearningStudio: options.showLearningStudio,
      showTimeClustering: options.showTimeClustering,
      showRoutines: options.showRoutines,
      showNotes: options.showNotes,
      showChat: options.showChat,
      callbacks: {
        onIntentZoneEnter: () => this.handleIntentZoneEnter(),
        onIntentZoneLeave: () => this.clearOpenIntentTimer(),
        onControlsEnter: () => this.handleControlsEnter(),
        onControlsLeave: (event) => this.handleControlsLeave(event),
        onPeekEnter: () => this.handlePeekEnter(),
        onPeekLeave: (event) => this.handleHandleLeave(event),
        onHandleClick: () => this.handleHandleClick(),
        onPinClick: () => this.handlePinClick(),
        onInteractionCapture: (event) => this.handleInteractionCapture(event),
        onKeyDown: (event) => this.handleKeyDown(event),
        onFocusIn: () => this.handleFocusIn(),
        onFocusOut: () => this.handleFocusOut(),
      },
    });
    this.shouldRender = this.view.shouldRender;
    this.windowResizeHandler = () => {
      this.updateCollapsedOffset();
    };
    this.render();
  }

  public mount(parent: HTMLElement = document.body): void {
    if (!this.shouldRender) return;
    if (this.view.isMounted()) return;
    this.view.mount(parent);
    this.view.prime();
    this.updateCollapsedOffset();
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.render(),
      { emitCurrent: true }
    );
    window.addEventListener('resize', this.windowResizeHandler);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateCollapsedOffset();
      });
      this.resizeObserver.observe(this.view.getControlsElement());
    }
  }

  public unmount(): void {
    window.removeEventListener('resize', this.windowResizeHandler);
    this.clearCollapseTimer();
    this.clearOpenIntentTimer();
    this.resetTransientInteractionState();
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.view.unmount();
  }

  public destroy(): void {
    this.unmount();
    this.view.destroy();
  }

  public setActiveView(view: WorkspaceView): void {
    this.activeView = view;
    this.view.setActiveView(view);
    this.render();
  }

  public setVisible(visible: boolean): void {
    if (!this.shouldRender) return;
    if (!visible) {
      this.view.closeGlobalMenu();
      this.clearCollapseTimer();
      this.clearOpenIntentTimer();
      this.resetTransientInteractionState();
    }
    this.view.setVisible(visible);
    if (!visible) return;
    this.updateCollapsedOffset();
    this.setState(
      transitionPresentationMenuMachineState(this.state, {
        type: 'reset-visible',
      })
    );
  }

  public setChatOpen(open: boolean): void {
    this.view.setChatOpen(open);
  }

  public setTimeClusteringOpen(open: boolean): void {
    this.view.setTimeClusteringOpen(open);
  }

  public setTimeClusteringLayoutMode(mode: TimeClusteringLayoutMode): void {
    this.view.setTimeClusteringLayoutMode(mode);
  }

  private get expanded(): boolean {
    return isPresentationMenuExpanded(this.state);
  }

  private get pinned(): boolean {
    return isPresentationMenuPinned(this.state);
  }

  private isCoarsePointer(): boolean {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }

  private updateCollapsedOffset(): void {
    this.collapsedOffsetPx = Math.max(
      0,
      this.view.measureControlsHeight() +
        PRESENTATION_MENU_COLLAPSED_EXTRA_OFFSET_PX
    );
    this.render();
  }

  private handleIntentZoneEnter(): void {
    if (!this.autoCollapseEnabled || this.state.mode !== 'peek') return;
    this.clearOpenIntentTimer();
    this.openIntentTimerId = window.setTimeout(() => {
      this.openIntentTimerId = null;
      if (this.state.mode !== 'peek') return;
      this.openFromPeekTrigger();
    }, PRESENTATION_MENU_OPEN_INTENT_DELAY_MS);
  }

  private handleControlsEnter(): void {
    this.clearOpenIntentTimer();
    this.controlsHovered = true;
    this.clearCollapseTimer();
    this.open();
  }

  private handlePeekEnter(): void {
    this.clearOpenIntentTimer();
    this.handleHovered = true;
    this.openFromPeekTrigger();
  }

  private handleControlsLeave(event: MouseEvent): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && this.view.contains(nextTarget)) {
      this.controlsHovered = true;
      return;
    }
    this.controlsHovered = false;
    this.schedulePeek();
  }

  private handleHandleLeave(event: MouseEvent): void {
    const nextTarget = event.relatedTarget;
    this.handleHovered = false;
    if (nextTarget instanceof Node && this.view.contains(nextTarget)) {
      this.controlsHovered = true;
      return;
    }
    this.schedulePeek();
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (this.view.isGlobalMenuOpen()) {
      this.view.closeGlobalMenu();
    }
    if (this.state.mode !== 'open') return;
    event.stopPropagation();
    this.clearCollapseTimer();
    this.setState(
      transitionPresentationMenuMachineState(this.state, { type: 'peek' })
    );
  }

  private handleInteractionCapture(event: Event): void {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!this.view.contains(target)) return;
    if (!this.expanded) return;
    this.bumpInteractionHold();
  }

  private handleFocusIn(): void {
    if (this.focusWithin) {
      this.clearCollapseTimer();
      return;
    }
    this.focusWithin = true;
    this.clearCollapseTimer();
    this.open();
  }

  private handleFocusOut(): void {
    window.setTimeout(() => {
      const focusStillWithin = this.view.contains(document.activeElement);
      this.focusWithin = focusStillWithin;
      if (focusStillWithin) return;
      this.schedulePeek();
    }, 0);
  }

  private handleHandleClick(): void {
    this.bumpInteractionHold();
    this.open();
  }

  private handlePinClick(): void {
    this.bumpInteractionHold();
    this.togglePinned();
  }

  private open(): void {
    this.clearCollapseTimer();
    this.clearOpenIntentTimer();
    if (this.pinned) {
      return;
    }
    if (this.state.mode === 'open') {
      return;
    }
    this.setState(
      transitionPresentationMenuMachineState(this.state, { type: 'open' })
    );
  }

  private openFromPeekTrigger(): void {
    this.clearCollapseTimer();
    this.clearOpenIntentTimer();
    if (this.pinned) {
      return;
    }
    if (this.state.mode === 'open') {
      return;
    }
    this.setState(
      transitionPresentationMenuMachineState(this.state, { type: 'open' })
    );
  }

  private schedulePeek(options: { includeCollapseDelay?: boolean } = {}): void {
    if (!this.autoCollapseEnabled) return;
    if (this.pinned) return;
    this.clearCollapseTimer();
    this.clearOpenIntentTimer();
    const delay = Math.max(
      options.includeCollapseDelay === false
        ? 0
        : PRESENTATION_MENU_COLLAPSE_DELAY_MS,
      this.getRemainingHoldMs()
    );
    this.collapseTimerId = window.setTimeout(() => {
      if (this.shouldStayOpen()) {
        return;
      }
      this.setState(
        transitionPresentationMenuMachineState(this.state, {
          type: 'peek',
        })
      );
    }, delay);
  }

  private clearCollapseTimer(): void {
    if (this.collapseTimerId === null) return;
    window.clearTimeout(this.collapseTimerId);
    this.collapseTimerId = null;
  }

  private clearOpenIntentTimer(): void {
    if (this.openIntentTimerId === null) return;
    window.clearTimeout(this.openIntentTimerId);
    this.openIntentTimerId = null;
  }

  private resetTransientInteractionState(): void {
    this.handleHovered = false;
    this.controlsHovered = false;
    this.focusWithin = false;
    this.holdOpenUntil = 0;
  }

  private setState(nextState: PresentationMenuMachineState): void {
    this.state = nextState;
    persistPresentationMenuPinned(this.pinned);
    this.render();
  }

  private togglePinned(): void {
    this.clearCollapseTimer();
    this.clearOpenIntentTimer();
    this.setState(
      transitionPresentationMenuMachineState(this.state, {
        type: 'toggle-pin',
      })
    );
    if (!this.pinned) {
      this.schedulePeek();
    }
  }

  private bumpInteractionHold(): void {
    this.holdOpenUntil = Date.now() + PRESENTATION_MENU_INTERACTION_HOLD_MS;
    this.clearCollapseTimer();
  }

  private getRemainingHoldMs(): number {
    return Math.max(0, this.holdOpenUntil - Date.now());
  }

  private shouldStayOpen(): boolean {
    if (this.pinned) {
      return true;
    }
    const shouldStay =
      this.handleHovered ||
      this.controlsHovered ||
      this.focusWithin ||
      this.view.isGlobalMenuOpen();
    return shouldStay;
  }

  private render(): void {
    this.view.render({
      activeView: this.activeView,
      collapsedOffsetPx: this.collapsedOffsetPx,
      mode: this.state.mode,
    });
  }
}
