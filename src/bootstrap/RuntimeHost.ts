import { Subscription } from 'rxjs';
import { GLOBAL_APP_SIDEBAR_WIDTH_PX } from './GlobalAppHeader.ts';
import {
  KANBAN_DEV_ENABLED,
  ROUTINES_ENABLED,
  TIME_CLUSTERING_DEV_ENABLED,
} from '../config/env/index.ts';
import { CanvasModule } from '../features/canvas/CanvasModule.ts';
import { WallpaperService } from '../features/shell/services/WallpaperService.ts';
import type { WorkspaceModule } from '../features/shell/WorkspaceModule.ts';
import { WorkspaceShell } from '../features/shell/WorkspaceShell.ts';
import {
  TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
  WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
  emitTimeClusteringLayoutModeChanged,
  isTimeClusteringToggleRequestDetail,
  emitTimeClusteringVisibilityChanged,
  emitWorkspaceViewChanged,
  isWorkspaceViewChangeRequestDetail,
} from '../features/shell/workspaceEvents.ts';
import {
  AI_ASSISTANT_INTENT_REQUEST_EVENT,
  AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
  AI_ASSISTANT_PROMPT_REQUEST_EVENT,
  emitAiAssistantVisibilityChanged,
  isAiAssistantIntentRequestDetail,
  isAiAssistantPromptRequestDetail,
  isAiAssistantToggleRequestDetail,
} from '../features/ai-assistant/aiAssistantEvents.ts';
import {
  loadPersistedAiAssistantOpen,
  loadPersistedTimeClusteringOpen,
  loadPersistedWorkspaceView,
  persistAiAssistantOpen,
  persistTimeClusteringOpen,
  persistWorkspaceView,
} from '../features/shell/workspaceUiState.ts';
import type { WorkspaceView } from '../features/shell/WorkspaceView.ts';
import { WorkspaceViewSwitcher } from '../features/shell/WorkspaceViewSwitcher.ts';
import { AiAssistantPanel } from '../features/ai-assistant/components/AiAssistantPanel.ts';
import type {
  AiAssistantActionExecutionHandler,
  AiAssistantActionExecutionRequest,
  AiAssistantActionExecutionResult,
} from '../features/ai-assistant/aiAssistantActions.ts';
import { resolveAiAssistantIntentSubmission } from '../features/ai-assistant/services/AiAssistantIntentResolver.ts';
import { createAiAssistantRuntime } from '../features/ai-assistant/services/AiAssistantRuntime.ts';
import { AiAssistantSessionController } from '../features/ai-assistant/services/AiAssistantSessionController.ts';
import { buildAiAssistantCapabilityContext } from '../features/ai-assistant/services/AiAssistantCapabilities.ts';
import type { TimeClusteringLayoutMode } from '../features/time-clustering/domain/types.ts';

const APP_ISLAND_GAP_PX = 0;
const APP_ISLAND_MARGIN_PX = 0;
const APP_ISLAND_RADIUS_PX = 0;
const TIME_CLUSTERING_ISLAND_WIDTH_PX = 380;

type KanbanModuleNamespace = {
  KanbanModule: new () => WorkspaceModule;
};

type TimeClusteringIslandModule = {
  mount(parent: HTMLElement): void;
  unmount(): void;
  setLayoutMode(mode: TimeClusteringLayoutMode): void;
};

type TimeClusteringModuleNamespace = {
  TimeClusteringModule: new (options?: {
    initialLayoutMode?: TimeClusteringLayoutMode;
    onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
  }) => TimeClusteringIslandModule;
};

const loadKanbanModule = (): Promise<KanbanModuleNamespace> =>
  import('../features/kanban/KanbanModule.ts');

const loadTimeClusteringModule = (): Promise<TimeClusteringModuleNamespace> =>
  import('../features/time-clustering/TimeClusteringModule.ts');

export class RuntimeHost {
  private shell: WorkspaceShell | null = null;
  private canvasModule: CanvasModule | null = null;
  private kanbanModule: WorkspaceModule | null = null;
  private timeClusteringModule: TimeClusteringIslandModule | null = null;
  private readonly workspaceRoot: HTMLDivElement;
  private readonly wallpaperService: WallpaperService;
  private readonly wallpaperSubscription: Subscription;
  private currentWallpaperUrl = '';
  private readonly viewSwitcher: WorkspaceViewSwitcher;
  private readonly timeClusteringIslandRoot: HTMLDivElement;
  private readonly chatPanel: AiAssistantPanel;
  private readonly chatController: AiAssistantSessionController;
  private activeView: WorkspaceView = 'canvas';
  private chatOpen = false;
  private timeClusteringOpen = false;
  private timeClusteringLayoutMode: TimeClusteringLayoutMode = 'docked-left';
  private hostVisible = false;
  private starting = false;
  private runtimeChromeMounted = false;
  private layoutSyncTimer: number | null = null;
  private workspaceResizeObserver: ResizeObserver | null = null;
  private readonly viewChangeHandler: (event: Event) => void;
  private readonly timeClusteringToggleHandler: (event: Event) => void;
  private readonly chatToggleHandler: (event: Event) => void;
  private readonly chatPromptHandler: (event: Event) => void;
  private readonly chatIntentHandler: (event: Event) => void;
  private readonly windowResizeHandler: () => void;

  constructor(wallpaperService: WallpaperService) {
    this.wallpaperService = wallpaperService;
    this.workspaceRoot = document.createElement('div');
    this.workspaceRoot.id = 'workspace-modules-root';
    this.workspaceRoot.style.position = 'fixed';
    this.workspaceRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
    this.workspaceRoot.style.top = '0';
    this.workspaceRoot.style.right = '0';
    this.workspaceRoot.style.bottom = '0';
    this.workspaceRoot.style.width = `calc(100vw - ${GLOBAL_APP_SIDEBAR_WIDTH_PX}px)`;
    this.workspaceRoot.style.height = '100vh';
    this.workspaceRoot.style.zIndex = '35';
    this.workspaceRoot.style.display = 'none';
    this.workspaceRoot.style.backgroundSize = 'cover';
    this.workspaceRoot.style.backgroundPosition = 'center';
    this.workspaceRoot.style.backgroundRepeat = 'no-repeat';
    this.workspaceRoot.style.transition =
      'left 180ms ease, top 180ms ease, right 180ms ease, bottom 180ms ease, border-radius 180ms ease, box-shadow 180ms ease';
    document.body.appendChild(this.workspaceRoot);
    this.timeClusteringIslandRoot = document.createElement('div');
    this.timeClusteringIslandRoot.id = 'time-clustering-island-root';
    this.timeClusteringIslandRoot.style.position = 'fixed';
    this.timeClusteringIslandRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
    this.timeClusteringIslandRoot.style.top = '0';
    this.timeClusteringIslandRoot.style.bottom = '0';
    this.timeClusteringIslandRoot.style.width = `${TIME_CLUSTERING_ISLAND_WIDTH_PX}px`;
    this.timeClusteringIslandRoot.style.zIndex = '36';
    this.timeClusteringIslandRoot.style.display = 'none';
    this.timeClusteringIslandRoot.style.pointerEvents = 'none';
    this.timeClusteringIslandRoot.style.overflow = 'hidden';
    this.timeClusteringIslandRoot.style.background = '#09090b';
    this.timeClusteringIslandRoot.style.transition =
      'left 180ms ease, top 180ms ease, right 180ms ease, bottom 180ms ease, width 180ms ease, border-radius 180ms ease';
    this.timeClusteringIslandRoot.style.borderRight =
      '1px solid rgb(234, 238, 245)';
    document.body.appendChild(this.timeClusteringIslandRoot);

    this.wallpaperSubscription = this.wallpaperService.wallpaper$.subscribe(
      (url) => {
        this.currentWallpaperUrl = url.trim();
        this.syncWorkspaceWallpaper();
      }
    );
    this.currentWallpaperUrl = this.wallpaperService.wallpaperUrl.trim();
    this.syncWorkspaceWallpaper();

    this.timeClusteringOpen = loadPersistedTimeClusteringOpen(
      TIME_CLUSTERING_DEV_ENABLED
    );
    this.activeView = loadPersistedWorkspaceView({
      allowKanban: KANBAN_DEV_ENABLED,
    });
    if (this.timeClusteringOpen) {
      this.activeView = 'canvas';
    }
    this.viewSwitcher = new WorkspaceViewSwitcher(this.activeView, {
      initialTimeClusteringOpen: this.timeClusteringOpen,
      initialTimeClusteringLayoutMode: this.timeClusteringLayoutMode,
      showKanban: KANBAN_DEV_ENABLED,
      showTimeClustering: TIME_CLUSTERING_DEV_ENABLED,
      showRoutines: ROUTINES_ENABLED,
    });
    const chatRuntime = createAiAssistantRuntime({
      resolveLiveHost: () => this.createAiAssistantToolHost(),
    });
    this.chatController = chatRuntime.controller;
    const executeChatAction: AiAssistantActionExecutionHandler = Object.assign(
      (request: AiAssistantActionExecutionRequest) =>
        this.executeChatAction(request),
      {
        executeBatch: (requests: AiAssistantActionExecutionRequest[]) =>
          this.executeChatActions(requests),
      }
    );
    this.chatPanel = new AiAssistantPanel({
      controller: this.chatController,
      executeAction: executeChatAction,
    });
    this.chatOpen = loadPersistedAiAssistantOpen();
    this.chatPanel.setVisible(false);
    this.viewSwitcher.setVisible(false);
    this.viewSwitcher.setChatOpen(this.chatOpen);
    this.viewSwitcher.setTimeClusteringOpen(this.timeClusteringOpen);
    this.viewSwitcher.setTimeClusteringLayoutMode(
      this.timeClusteringLayoutMode
    );
    this.viewChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isWorkspaceViewChangeRequestDetail(customEvent.detail)) return;
      void this.setActiveView(customEvent.detail.view);
    };
    this.timeClusteringToggleHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isTimeClusteringToggleRequestDetail(customEvent.detail)) return;
      void this.handleTimeClusteringToggleRequest(customEvent.detail?.open);
    };
    this.chatToggleHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isAiAssistantToggleRequestDetail(customEvent.detail)) return;
      if (typeof customEvent.detail?.open === 'boolean') {
        this.setChatOpen(customEvent.detail.open);
        return;
      }
      this.setChatOpen(!this.chatOpen);
    };
    this.chatPromptHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isAiAssistantPromptRequestDetail(customEvent.detail)) return;
      if (customEvent.detail.open !== false) {
        this.setChatOpen(true);
      }
      void this.chatPanel.submitExternalPrompt(customEvent.detail.prompt);
    };
    this.chatIntentHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isAiAssistantIntentRequestDetail(customEvent.detail)) return;
      if (customEvent.detail.open !== false) {
        this.setChatOpen(true);
      }
      const snapshot =
        this.shell?.getActiveModule()?.getAiAssistantSnapshot() ?? null;
      void this.chatPanel.submitPreparedSubmission(
        resolveAiAssistantIntentSubmission(customEvent.detail, snapshot)
      );
    };
    this.windowResizeHandler = () => {
      this.syncCanvasUiRootToWorkspace();
    };
    window.addEventListener(
      WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
      this.viewChangeHandler
    );
    window.addEventListener(
      TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
      this.timeClusteringToggleHandler
    );
    window.addEventListener(
      AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
      this.chatToggleHandler
    );
    window.addEventListener(
      AI_ASSISTANT_PROMPT_REQUEST_EVENT,
      this.chatPromptHandler
    );
    window.addEventListener(
      AI_ASSISTANT_INTENT_REQUEST_EVENT,
      this.chatIntentHandler
    );
    window.addEventListener('resize', this.windowResizeHandler);
    if (typeof ResizeObserver !== 'undefined') {
      this.workspaceResizeObserver = new ResizeObserver(() => {
        this.syncCanvasUiRootToWorkspace();
      });
      this.workspaceResizeObserver.observe(this.workspaceRoot);
    }
  }

  private syncWorkspaceWallpaper(): void {
    const isCanvasVisible = this.hostVisible && this.activeView === 'canvas';
    const isKanbanVisible = this.hostVisible && this.activeView === 'kanban';
    if (isCanvasVisible) {
      this.workspaceRoot.style.backgroundImage = '';
      this.workspaceRoot.style.backgroundColor = '#ffffff';
      return;
    }

    if (!isKanbanVisible) {
      this.workspaceRoot.style.backgroundImage = '';
      this.workspaceRoot.style.backgroundColor = '';
      return;
    }

    if (this.currentWallpaperUrl.length > 0) {
      this.workspaceRoot.style.backgroundImage = `url("${this.currentWallpaperUrl}")`;
    } else {
      this.workspaceRoot.style.backgroundImage = '';
    }
    this.workspaceRoot.style.backgroundColor = '#e2e8f0';
  }

  public hideCanvas(): void {
    this.hostVisible = false;
    this.applyVisibility();
  }

  public dispose(): void {
    this.wallpaperSubscription.unsubscribe();
    if (this.layoutSyncTimer !== null) {
      window.clearTimeout(this.layoutSyncTimer);
      this.layoutSyncTimer = null;
    }
    this.workspaceResizeObserver?.disconnect();
    this.workspaceResizeObserver = null;
    window.removeEventListener(
      WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
      this.viewChangeHandler
    );
    window.removeEventListener(
      TIME_CLUSTERING_TOGGLE_REQUEST_EVENT,
      this.timeClusteringToggleHandler
    );
    window.removeEventListener(
      AI_ASSISTANT_TOGGLE_REQUEST_EVENT,
      this.chatToggleHandler
    );
    window.removeEventListener(
      AI_ASSISTANT_PROMPT_REQUEST_EVENT,
      this.chatPromptHandler
    );
    window.removeEventListener(
      AI_ASSISTANT_INTENT_REQUEST_EVENT,
      this.chatIntentHandler
    );
    window.removeEventListener('resize', this.windowResizeHandler);
    this.unmountRuntimeChrome();
    this.shell?.dispose();
    this.shell = null;
    this.canvasModule = null;
    this.kanbanModule = null;
    this.timeClusteringModule?.unmount();
    this.timeClusteringModule = null;
    this.timeClusteringIslandRoot.remove();
    this.workspaceRoot.remove();
    this.chatPanel.unmount();
    this.chatController.dispose();
  }

  public showCanvas(): void {
    this.hostVisible = true;
    this.applyVisibility();
  }

  private createAiAssistantToolHost() {
    const activeModule = this.shell?.getActiveModule() ?? null;
    const moduleHost = activeModule?.getAiAssistantToolHost?.() ?? null;

    return {
      getAiAssistantSnapshot: () =>
        moduleHost?.getAiAssistantSnapshot?.() ??
        activeModule?.getAiAssistantSnapshot() ??
        null,
      getAiAssistantCapabilities: () =>
        moduleHost?.getAiAssistantCapabilities?.() ??
        buildAiAssistantCapabilityContext({
          currentView: this.activeView,
          snapshot: activeModule?.getAiAssistantSnapshot() ?? null,
        }),
    };
  }

  public async start(): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    try {
      if (!this.shell) {
        this.shell = new WorkspaceShell(this.workspaceRoot);
      }
      if (!this.canvasModule) {
        this.canvasModule = new CanvasModule();
        this.shell.register(this.canvasModule);
      }
      if (KANBAN_DEV_ENABLED && !this.kanbanModule) {
        const { KanbanModule } = await loadKanbanModule();
        this.kanbanModule = new KanbanModule();
        this.shell.register(this.kanbanModule);
      }
      if (TIME_CLUSTERING_DEV_ENABLED && !this.timeClusteringModule) {
        const { TimeClusteringModule } = await loadTimeClusteringModule();
        this.timeClusteringModule = new TimeClusteringModule({
          initialLayoutMode: this.timeClusteringLayoutMode,
          onLayoutModeChange: (mode) =>
            this.handleTimeClusteringLayoutModeChange(mode),
        });
      }
      await this.shell.show(this.activeView);
      this.syncTimeClusteringIslandVisibility();
      this.viewSwitcher.setActiveView(this.activeView);
      emitWorkspaceViewChanged(this.activeView);
      emitTimeClusteringVisibilityChanged(this.timeClusteringOpen);
      emitTimeClusteringLayoutModeChanged(this.timeClusteringLayoutMode);
      emitAiAssistantVisibilityChanged(this.chatOpen);
      this.applyVisibility();
    } finally {
      this.starting = false;
    }
  }

  public async setActiveView(view: WorkspaceView): Promise<void> {
    if (view === 'kanban' && !KANBAN_DEV_ENABLED) return;
    const shouldCloseTimeClustering = this.timeClusteringOpen;
    if (shouldCloseTimeClustering) {
      this.syncTimeClusteringOpenState(false);
      this.setTimeClusteringLayoutMode('docked-left');
    }
    if (this.activeView === view) {
      if (shouldCloseTimeClustering) {
        this.applyVisibility();
      }
      return;
    }
    await this.activateBaseView(view);
    this.applyVisibility();
  }

  private async handleTimeClusteringToggleRequest(
    open?: boolean
  ): Promise<void> {
    if (!TIME_CLUSTERING_DEV_ENABLED) return;
    const nextOpen =
      typeof open === 'boolean' ? open : !this.timeClusteringOpen;
    if (!nextOpen) {
      this.syncTimeClusteringOpenState(false);
      this.setTimeClusteringLayoutMode('docked-left');
      this.applyVisibility();
      return;
    }

    this.setTimeClusteringLayoutMode('docked-left');
    await this.activateBaseView('canvas');
    this.syncTimeClusteringOpenState(true);
    this.applyVisibility();
  }

  private handleTimeClusteringLayoutModeChange(
    mode: TimeClusteringLayoutMode
  ): void {
    if (!this.syncTimeClusteringLayoutMode(mode)) return;
    if (this.hostVisible && this.timeClusteringOpen) {
      this.applyVisibility();
    }
  }

  private setTimeClusteringLayoutMode(mode: TimeClusteringLayoutMode): void {
    if (!this.syncTimeClusteringLayoutMode(mode)) return;
    this.timeClusteringModule?.setLayoutMode(mode);
  }

  private syncTimeClusteringLayoutMode(
    mode: TimeClusteringLayoutMode
  ): boolean {
    if (this.timeClusteringLayoutMode === mode) return false;
    this.timeClusteringLayoutMode = mode;
    this.viewSwitcher.setTimeClusteringLayoutMode(mode);
    emitTimeClusteringLayoutModeChanged(mode);
    return true;
  }

  private syncTimeClusteringOpenState(open: boolean): void {
    if (this.timeClusteringOpen === open) return;
    this.timeClusteringOpen = open;
    persistTimeClusteringOpen(open);
    this.viewSwitcher.setTimeClusteringOpen(open);
    emitTimeClusteringVisibilityChanged(open);
  }

  private async activateBaseView(view: WorkspaceView): Promise<void> {
    if (this.activeView === view) return;
    this.activeView = view;
    persistWorkspaceView(view);
    if (this.shell) {
      await this.shell.show(view);
    }
    this.viewSwitcher.setActiveView(view);
    emitWorkspaceViewChanged(view);
  }

  private getTimeClusteringIslandWidthPx(): number {
    return this.timeClusteringOpen &&
      this.timeClusteringLayoutMode === 'docked-left'
      ? TIME_CLUSTERING_ISLAND_WIDTH_PX
      : 0;
  }

  private applyVisibility(): void {
    const canvasUiRoot = document.getElementById('canvas-ui-root');
    const canvas = document.getElementById('myCanvas');
    const chatWidth = this.chatOpen ? this.chatPanel.getWidthPx() : 0;
    const timeClusteringIslandWidth = this.getTimeClusteringIslandWidthPx();
    const timeClusteringFullscreen =
      this.timeClusteringOpen && this.timeClusteringLayoutMode === 'fullscreen';
    if (!this.hostVisible) {
      this.unmountRuntimeChrome();
      this.workspaceRoot.style.display = 'none';
      this.workspaceRoot.style.pointerEvents = 'none';
      this.workspaceRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
      this.workspaceRoot.style.top = '0';
      this.workspaceRoot.style.right = '0';
      this.workspaceRoot.style.bottom = '0';
      this.workspaceRoot.style.width = `calc(100vw - ${GLOBAL_APP_SIDEBAR_WIDTH_PX}px)`;
      this.workspaceRoot.style.height = '100vh';
      this.workspaceRoot.style.borderRadius = '0';
      this.workspaceRoot.style.overflow = 'visible';
      this.workspaceRoot.style.boxShadow = 'none';
      this.workspaceRoot.style.border = 'none';
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.display = 'none';
        canvas.style.pointerEvents = 'none';
      }
      if (canvasUiRoot instanceof HTMLElement) {
        canvasUiRoot.style.display = 'none';
        canvasUiRoot.style.pointerEvents = 'none';
        canvasUiRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
        canvasUiRoot.style.top = '0';
        canvasUiRoot.style.width = `calc(100vw - ${GLOBAL_APP_SIDEBAR_WIDTH_PX}px)`;
        canvasUiRoot.style.height = '100vh';
        canvasUiRoot.style.borderRadius = '0';
      }
      this.viewSwitcher.setVisible(false);
      this.chatPanel.setVisible(false);
      this.syncTimeClusteringIslandVisibility(chatWidth);
      this.syncWorkspaceWallpaper();
      return;
    }

    this.mountRuntimeChrome();
    const showWorkspace = !timeClusteringFullscreen;
    const showCanvas = showWorkspace && this.activeView === 'canvas';
    this.workspaceRoot.style.display = showWorkspace ? 'block' : 'none';
    this.workspaceRoot.style.pointerEvents = showWorkspace ? 'auto' : 'none';
    if (showWorkspace) {
      this.applyWorkspaceLayout(
        canvasUiRoot,
        timeClusteringIslandWidth,
        chatWidth
      );
    }
    if (canvas instanceof HTMLCanvasElement) {
      canvas.style.display = showCanvas ? 'block' : 'none';
      canvas.style.pointerEvents = showCanvas ? 'auto' : 'none';
    }
    if (canvasUiRoot instanceof HTMLElement) {
      canvasUiRoot.style.display = showCanvas ? 'block' : 'none';
      canvasUiRoot.style.pointerEvents = 'none';
    }
    if (showWorkspace) {
      this.syncCanvasUiRootToWorkspace(canvasUiRoot);
    }
    this.syncTimeClusteringIslandVisibility(chatWidth);
    this.chatPanel.setIslandMode(this.chatOpen);
    this.viewSwitcher.setVisible(true);
    this.chatPanel.setVisible(this.chatOpen);
    this.syncWorkspaceWallpaper();
    if (showWorkspace) {
      this.scheduleLayoutSync();
    }
  }

  private async executeChatAction(
    request: AiAssistantActionExecutionRequest
  ): Promise<AiAssistantActionExecutionResult> {
    if (
      this.activeView !== 'canvas' ||
      (this.timeClusteringOpen &&
        this.timeClusteringLayoutMode === 'fullscreen')
    ) {
      return {
        status: 'failed',
        errorMessage: 'Switch to canvas to create elements.',
      };
    }
    if (!this.canvasModule) {
      return {
        status: 'failed',
        errorMessage: 'Canvas is unavailable.',
      };
    }
    return this.canvasModule.executeChatAction(request);
  }

  private async executeChatActions(
    requests: AiAssistantActionExecutionRequest[]
  ): Promise<AiAssistantActionExecutionResult[]> {
    if (
      this.activeView !== 'canvas' ||
      (this.timeClusteringOpen &&
        this.timeClusteringLayoutMode === 'fullscreen')
    ) {
      return requests.map(() => ({
        status: 'failed' as const,
        errorMessage: 'Switch to canvas to create elements.',
      }));
    }
    if (!this.canvasModule) {
      return requests.map(() => ({
        status: 'failed' as const,
        errorMessage: 'Canvas is unavailable.',
      }));
    }
    return this.canvasModule.executeChatActions(requests);
  }

  private applyWorkspaceLayout(
    canvasUiRoot: HTMLElement | null,
    leftIslandWidth: number,
    chatWidth: number
  ): void {
    const hasLeftIsland = leftIslandWidth > 0;
    const hasRightIsland = chatWidth > 0;
    if (!hasLeftIsland && !hasRightIsland) {
      this.workspaceRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
      this.workspaceRoot.style.top = '0';
      this.workspaceRoot.style.right = '0';
      this.workspaceRoot.style.bottom = '0';
      this.workspaceRoot.style.width = 'auto';
      this.workspaceRoot.style.height = 'auto';
      this.workspaceRoot.style.borderRadius = '0';
      this.workspaceRoot.style.overflow = 'visible';
      this.workspaceRoot.style.boxShadow = 'none';
      this.workspaceRoot.style.border = 'none';
      if (canvasUiRoot) {
        canvasUiRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
        canvasUiRoot.style.top = '0';
        canvasUiRoot.style.width = `calc(100vw - ${GLOBAL_APP_SIDEBAR_WIDTH_PX}px)`;
        canvasUiRoot.style.height = '100vh';
        canvasUiRoot.style.borderRadius = '0';
      }
      return;
    }

    const workspaceLeftInset =
      APP_ISLAND_MARGIN_PX +
      (hasLeftIsland ? leftIslandWidth + APP_ISLAND_GAP_PX : 0);
    const workspaceRightInset =
      APP_ISLAND_MARGIN_PX +
      (hasRightIsland ? chatWidth + APP_ISLAND_GAP_PX : 0);
    const workspaceWidth = Math.max(
      320,
      window.innerWidth -
        workspaceLeftInset -
        workspaceRightInset -
        GLOBAL_APP_SIDEBAR_WIDTH_PX
    );
    const workspaceHeight = Math.max(
      240,
      window.innerHeight - APP_ISLAND_MARGIN_PX * 2
    );

    this.workspaceRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX + workspaceLeftInset}px`;
    this.workspaceRoot.style.top = `${APP_ISLAND_MARGIN_PX}px`;
    this.workspaceRoot.style.right = `${workspaceRightInset}px`;
    this.workspaceRoot.style.bottom = `${APP_ISLAND_MARGIN_PX}px`;
    this.workspaceRoot.style.width = 'auto';
    this.workspaceRoot.style.height = 'auto';
    this.workspaceRoot.style.borderRadius = `${APP_ISLAND_RADIUS_PX}px`;
    this.workspaceRoot.style.overflow = 'hidden';
    this.workspaceRoot.style.border = 'none';
    this.workspaceRoot.style.boxShadow = 'none';

    if (canvasUiRoot) {
      canvasUiRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX + workspaceLeftInset}px`;
      canvasUiRoot.style.top = `${APP_ISLAND_MARGIN_PX}px`;
      canvasUiRoot.style.width = `${workspaceWidth}px`;
      canvasUiRoot.style.height = `${workspaceHeight}px`;
      canvasUiRoot.style.borderRadius = `${APP_ISLAND_RADIUS_PX}px`;
    }
  }

  private syncCanvasUiRootToWorkspace(
    canvasUiRoot: HTMLElement | null = document.getElementById('canvas-ui-root')
  ): void {
    if (!this.hostVisible || !(canvasUiRoot instanceof HTMLElement)) {
      return;
    }

    const rect = this.workspaceRoot.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    canvasUiRoot.style.left = `${Math.round(rect.left)}px`;
    canvasUiRoot.style.top = `${Math.round(rect.top)}px`;
    canvasUiRoot.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    canvasUiRoot.style.height = `${Math.max(1, Math.round(rect.height))}px`;
    canvasUiRoot.style.borderRadius = this.workspaceRoot.style.borderRadius;
  }

  private scheduleLayoutSync(): void {
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    if (this.layoutSyncTimer !== null) {
      window.clearTimeout(this.layoutSyncTimer);
    }
    this.layoutSyncTimer = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.layoutSyncTimer = null;
    }, 220);
  }

  private syncTimeClusteringIslandVisibility(
    chatWidth = this.chatOpen ? this.chatPanel.getWidthPx() : 0
  ): void {
    if (!TIME_CLUSTERING_DEV_ENABLED) return;
    const shouldShowIsland = this.hostVisible && this.timeClusteringOpen;

    if (!shouldShowIsland) {
      this.timeClusteringIslandRoot.style.display = 'none';
      this.timeClusteringIslandRoot.style.pointerEvents = 'none';
      this.timeClusteringIslandRoot.style.right = 'auto';
      this.timeClusteringIslandRoot.style.width = `${TIME_CLUSTERING_ISLAND_WIDTH_PX}px`;
      this.timeClusteringIslandRoot.style.borderRight =
        '1px solid rgb(234, 238, 245)';
      return;
    }

    if (!this.timeClusteringModule) return;
    if (!this.timeClusteringIslandRoot.hasChildNodes()) {
      void this.timeClusteringModule.mount(this.timeClusteringIslandRoot);
    }

    const chatInset =
      APP_ISLAND_MARGIN_PX +
      (chatWidth > 0 ? chatWidth + APP_ISLAND_GAP_PX : 0);
    this.timeClusteringIslandRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX + APP_ISLAND_MARGIN_PX}px`;
    this.timeClusteringIslandRoot.style.top = `${APP_ISLAND_MARGIN_PX}px`;
    this.timeClusteringIslandRoot.style.bottom = `${APP_ISLAND_MARGIN_PX}px`;
    this.timeClusteringIslandRoot.style.borderRadius = `${APP_ISLAND_RADIUS_PX}px`;
    if (this.timeClusteringLayoutMode === 'fullscreen') {
      this.timeClusteringIslandRoot.style.right = `${chatInset}px`;
      this.timeClusteringIslandRoot.style.width = 'auto';
      this.timeClusteringIslandRoot.style.borderRight = 'none';
    } else {
      this.timeClusteringIslandRoot.style.right = 'auto';
      this.timeClusteringIslandRoot.style.width = `${TIME_CLUSTERING_ISLAND_WIDTH_PX}px`;
      this.timeClusteringIslandRoot.style.borderRight =
        '1px solid rgb(234, 238, 245)';
    }
    this.timeClusteringIslandRoot.style.display = 'block';
    this.timeClusteringIslandRoot.style.pointerEvents = 'auto';
  }

  private setChatOpen(open: boolean): void {
    this.chatOpen = open;
    persistAiAssistantOpen(open);
    this.viewSwitcher.setChatOpen(open);
    emitAiAssistantVisibilityChanged(open);
    this.applyVisibility();
  }

  private mountRuntimeChrome(): void {
    if (this.runtimeChromeMounted) return;
    this.chatPanel.mount(document.body);
    this.viewSwitcher.mount(document.body);
    this.runtimeChromeMounted = true;
  }

  private unmountRuntimeChrome(): void {
    if (!this.runtimeChromeMounted) return;
    this.viewSwitcher.unmount();
    this.chatPanel.unmount();
    this.runtimeChromeMounted = false;
  }
}
