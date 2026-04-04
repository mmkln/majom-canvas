import { Subscription } from 'rxjs';
import { GLOBAL_APP_SIDEBAR_WIDTH_PX } from './GlobalAppHeader.ts';
import {
  KANBAN_DEV_ENABLED,
  LEARNING_STUDIO_DEV_ENABLED,
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
  loadPersistedTimeClusteringLayoutMode,
  loadPersistedTimeClusteringOverlapWarningsVisible,
  loadPersistedTimeClusteringOpen,
  loadPersistedWorkspaceView,
  persistAiAssistantOpen,
  persistTimeClusteringLayoutMode,
  persistTimeClusteringOverlapWarningsVisible,
  persistTimeClusteringOpen,
  persistWorkspaceView,
} from '../features/shell/workspaceUiState.ts';
import type { WorkspaceView } from '../features/shell/WorkspaceView.ts';
import { WorkspaceViewSwitcher } from '../features/shell/WorkspaceViewSwitcher.ts';
import {
  FULL_BLEED_ISLAND_CHROME,
  MULTI_ISLAND_CHROME,
  applyIslandBackdrop,
  applyIslandFrame,
} from '../features/shell/islandChrome.ts';
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
import {
  AppRuntime,
  type AppRuntimeSnapshot,
  createAppRuntime,
} from '../app-runtime/index.ts';

const TIME_CLUSTERING_ISLAND_WIDTH_PX = 360;

type KanbanModuleNamespace = {
  KanbanModule: new () => WorkspaceModule;
};

type LearningStudioModuleNamespace = {
  LearningStudioModule: new (options?: {
    runtime?: AppRuntime;
  }) => WorkspaceModule;
};

type TimeClusteringIslandModule = {
  mount(parent: HTMLElement): void;
  unmount(): void;
  setLayoutMode(mode: TimeClusteringLayoutMode): void;
  setShowOverlapWarnings(show: boolean): void;
};

type TimeClusteringModuleNamespace = {
  TimeClusteringModule: new (options?: {
    runtime?: AppRuntime;
    initialLayoutMode?: TimeClusteringLayoutMode;
    initialShowOverlapWarnings?: boolean;
    onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
    onShowOverlapWarningsChange?: (show: boolean) => void;
  }) => TimeClusteringIslandModule;
};

const loadKanbanModule = (): Promise<KanbanModuleNamespace> =>
  import('../features/kanban/KanbanModule.ts');

const loadLearningStudioModule = (): Promise<LearningStudioModuleNamespace> =>
  import('../features/learning-studio/LearningStudioModule.ts');

const loadTimeClusteringModule = (): Promise<TimeClusteringModuleNamespace> =>
  import('../features/time-clustering/TimeClusteringModule.ts');

export class RuntimeHost {
  private shell: WorkspaceShell | null = null;
  private canvasModule: CanvasModule | null = null;
  private kanbanModule: WorkspaceModule | null = null;
  private learningStudioModule: WorkspaceModule | null = null;
  private timeClusteringModule: TimeClusteringIslandModule | null = null;
  private readonly workspaceRoot: HTMLDivElement;
  private readonly islandBackdropRoot: HTMLDivElement;
  private readonly wallpaperService: WallpaperService;
  private readonly wallpaperSubscription: Subscription;
  private runtimeSubscriptionDispose: (() => void) | null = null;
  private currentWallpaperUrl = '';
  private readonly viewSwitcher: WorkspaceViewSwitcher;
  private readonly timeClusteringIslandRoot: HTMLDivElement;
  private readonly chatPanel: AiAssistantPanel;
  private readonly chatController: AiAssistantSessionController;
  private activeView: WorkspaceView = 'canvas';
  private chatOpen = false;
  private timeClusteringOpen = false;
  private timeClusteringLayoutMode: TimeClusteringLayoutMode;
  private timeClusteringShowOverlapWarnings = true;
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

  constructor(
    wallpaperService: WallpaperService,
    private readonly runtime: AppRuntime = createAppRuntime()
  ) {
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
    this.islandBackdropRoot = document.createElement('div');
    this.islandBackdropRoot.id = 'workspace-island-backdrop-root';
    this.islandBackdropRoot.style.position = 'fixed';
    this.islandBackdropRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX}px`;
    this.islandBackdropRoot.style.top = '0';
    this.islandBackdropRoot.style.right = '0';
    this.islandBackdropRoot.style.bottom = '0';
    this.islandBackdropRoot.style.zIndex = '34';
    this.islandBackdropRoot.style.display = 'none';
    this.islandBackdropRoot.style.pointerEvents = 'none';
    applyIslandBackdrop(this.islandBackdropRoot, MULTI_ISLAND_CHROME);
    document.body.appendChild(this.islandBackdropRoot);
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

    this.runtimeSubscriptionDispose = this.runtime.subscribe(
      (snapshot) => {
        this.applyRuntimeSnapshot(snapshot);
      },
      { emitCurrent: true }
    );

    this.timeClusteringOpen = loadPersistedTimeClusteringOpen(
      TIME_CLUSTERING_DEV_ENABLED
    );
    this.timeClusteringLayoutMode =
      loadPersistedTimeClusteringLayoutMode('docked-left');
    this.timeClusteringShowOverlapWarnings =
      loadPersistedTimeClusteringOverlapWarningsVisible(true);
    this.activeView = loadPersistedWorkspaceView({
      allowKanban: KANBAN_DEV_ENABLED,
      allowLearningStudio: LEARNING_STUDIO_DEV_ENABLED,
    });
    this.viewSwitcher = new WorkspaceViewSwitcher(this.activeView, {
      runtime: this.runtime,
      wallpaperService: this.wallpaperService,
      initialTimeClusteringOpen: this.timeClusteringOpen,
      initialTimeClusteringLayoutMode: this.timeClusteringLayoutMode,
      showKanban: KANBAN_DEV_ENABLED,
      showLearningStudio: LEARNING_STUDIO_DEV_ENABLED,
      showTimeClustering: TIME_CLUSTERING_DEV_ENABLED,
      showRoutines: ROUTINES_ENABLED,
    });
    const chatRuntime = createAiAssistantRuntime({
      resolveLiveHost: () => this.createAiAssistantToolHost(),
      runtime: this.runtime,
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
      runtime: this.runtime,
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
      this.handleTimeClusteringToggleRequest(customEvent.detail?.open);
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
        resolveAiAssistantIntentSubmission(
          customEvent.detail,
          snapshot,
          this.runtime.i18n
        )
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
    const isLearningStudioVisible =
      this.hostVisible && this.activeView === 'learning-studio';
    if (isCanvasVisible) {
      this.workspaceRoot.style.backgroundImage = '';
      this.workspaceRoot.style.backgroundColor = '#ffffff';
      return;
    }

    if (isLearningStudioVisible) {
      this.workspaceRoot.style.backgroundImage = '';
      this.workspaceRoot.style.backgroundColor = '#f8fafc';
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

  private applyRuntimeSnapshot(snapshot: AppRuntimeSnapshot): void {
    document.documentElement.dataset.theme = snapshot.theme;
  }

  public hideCanvas(): void {
    this.hostVisible = false;
    this.applyVisibility();
  }

  public dispose(): void {
    this.runtimeSubscriptionDispose?.();
    this.runtimeSubscriptionDispose = null;
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
    this.viewSwitcher.destroy();
    this.shell?.dispose();
    this.shell = null;
    this.canvasModule = null;
    this.kanbanModule = null;
    this.learningStudioModule = null;
    this.timeClusteringModule?.unmount();
    this.timeClusteringModule = null;
    this.islandBackdropRoot.remove();
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
        this.canvasModule = new CanvasModule({
          runtime: this.runtime,
        });
        this.shell.register(this.canvasModule);
      }
      if (KANBAN_DEV_ENABLED && !this.kanbanModule) {
        const { KanbanModule } = await loadKanbanModule();
        this.kanbanModule = new KanbanModule();
        this.shell.register(this.kanbanModule);
      }
      if (LEARNING_STUDIO_DEV_ENABLED && !this.learningStudioModule) {
        const { LearningStudioModule } = await loadLearningStudioModule();
        this.learningStudioModule = new LearningStudioModule({
          runtime: this.runtime,
        });
        this.shell.register(this.learningStudioModule);
      }
      if (TIME_CLUSTERING_DEV_ENABLED && !this.timeClusteringModule) {
        const { TimeClusteringModule } = await loadTimeClusteringModule();
        this.timeClusteringModule = new TimeClusteringModule({
          runtime: this.runtime,
          initialLayoutMode: this.timeClusteringLayoutMode,
          initialShowOverlapWarnings: this.timeClusteringShowOverlapWarnings,
          onLayoutModeChange: (mode) =>
            this.handleTimeClusteringLayoutModeChange(mode),
          onShowOverlapWarningsChange: (show) =>
            this.handleTimeClusteringOverlapWarningsChange(show),
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
    if (view === 'learning-studio' && !LEARNING_STUDIO_DEV_ENABLED) return;
    const shouldCloseTimeClustering =
      this.timeClusteringOpen && this.timeClusteringLayoutMode === 'fullscreen';
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

  private handleTimeClusteringToggleRequest(open?: boolean): void {
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

  private handleTimeClusteringOverlapWarningsChange(show: boolean): void {
    this.syncTimeClusteringOverlapWarnings(show);
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
    persistTimeClusteringLayoutMode(mode);
    this.viewSwitcher.setTimeClusteringLayoutMode(mode);
    emitTimeClusteringLayoutModeChanged(mode);
    return true;
  }

  private syncTimeClusteringOverlapWarnings(show: boolean): boolean {
    if (this.timeClusteringShowOverlapWarnings === show) return false;
    this.timeClusteringShowOverlapWarnings = show;
    persistTimeClusteringOverlapWarningsVisible(show);
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
      this.islandBackdropRoot.style.display = 'none';
      this.workspaceRoot.style.display = 'none';
      this.workspaceRoot.style.pointerEvents = 'none';
      applyIslandFrame(this.workspaceRoot, FULL_BLEED_ISLAND_CHROME, {
        left: GLOBAL_APP_SIDEBAR_WIDTH_PX,
        top: 0,
        right: 0,
        bottom: 0,
        width: `calc(100vw - ${GLOBAL_APP_SIDEBAR_WIDTH_PX}px)`,
        height: '100vh',
        overflow: 'visible',
        boxShadow: 'none',
        border: 'none',
      });
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
    this.syncIslandBackdropVisibility(
      showWorkspace,
      timeClusteringIslandWidth,
      chatWidth
    );
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
    const chrome =
      hasLeftIsland || hasRightIsland
        ? MULTI_ISLAND_CHROME
        : FULL_BLEED_ISLAND_CHROME;
    if (!hasLeftIsland && !hasRightIsland) {
      applyIslandFrame(this.workspaceRoot, FULL_BLEED_ISLAND_CHROME, {
        left: GLOBAL_APP_SIDEBAR_WIDTH_PX,
        top: 0,
        right: 0,
        bottom: 0,
        width: 'auto',
        height: 'auto',
        overflow: 'visible',
        boxShadow: 'none',
        border: 'none',
      });
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
      chrome.marginPx + (hasLeftIsland ? leftIslandWidth + chrome.gapPx : 0);
    const workspaceRightInset =
      chrome.marginPx + (hasRightIsland ? chatWidth + chrome.gapPx : 0);
    const workspaceWidth = Math.max(
      320,
      window.innerWidth -
        workspaceLeftInset -
        workspaceRightInset -
        GLOBAL_APP_SIDEBAR_WIDTH_PX
    );
    const workspaceHeight = Math.max(
      240,
      window.innerHeight - chrome.marginPx * 2
    );

    applyIslandFrame(this.workspaceRoot, chrome, {
      left: GLOBAL_APP_SIDEBAR_WIDTH_PX + workspaceLeftInset,
      top: chrome.marginPx,
      right: workspaceRightInset,
      bottom: chrome.marginPx,
      width: 'auto',
      height: 'auto',
      overflow: 'hidden',
      border: 'none',
      boxShadow: 'none',
    });

    if (canvasUiRoot) {
      canvasUiRoot.style.left = `${GLOBAL_APP_SIDEBAR_WIDTH_PX + workspaceLeftInset}px`;
      canvasUiRoot.style.top = `${chrome.marginPx}px`;
      canvasUiRoot.style.width = `${workspaceWidth}px`;
      canvasUiRoot.style.height = `${workspaceHeight}px`;
      canvasUiRoot.style.borderRadius = `${chrome.radiusPx}px`;
    }
  }

  private syncIslandBackdropVisibility(
    showWorkspace: boolean,
    leftIslandWidth: number,
    chatWidth: number
  ): void {
    const showBackdrop =
      showWorkspace && (leftIslandWidth > 0 || chatWidth > 0);
    this.islandBackdropRoot.style.display = showBackdrop ? 'block' : 'none';
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
      MULTI_ISLAND_CHROME.marginPx +
      (chatWidth > 0 ? chatWidth + MULTI_ISLAND_CHROME.gapPx : 0);
    const chrome =
      this.timeClusteringLayoutMode === 'docked-left'
        ? MULTI_ISLAND_CHROME
        : FULL_BLEED_ISLAND_CHROME;
    applyIslandFrame(this.timeClusteringIslandRoot, chrome, {
      left: GLOBAL_APP_SIDEBAR_WIDTH_PX + chrome.marginPx,
      top: chrome.marginPx,
      bottom: chrome.marginPx,
    });
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
