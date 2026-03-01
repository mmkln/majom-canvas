import { Subscription } from 'rxjs';
import { KANBAN_DEV_ENABLED } from '../config/env/index.ts';
import { CanvasModule } from '../features/canvas/CanvasModule.ts';
import { WallpaperService } from '../features/shell/services/WallpaperService.ts';
import type { WorkspaceModule } from '../features/shell/WorkspaceModule.ts';
import { WorkspaceShell } from '../features/shell/WorkspaceShell.ts';
import {
  WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
  emitWorkspaceViewChanged,
  isWorkspaceViewChangeRequestDetail,
} from '../features/shell/workspaceEvents.ts';
import type { WorkspaceView } from '../features/shell/WorkspaceView.ts';
import {
  WorkspaceViewSwitcher,
  type WorkspaceViewSwitcherLayout,
} from '../features/shell/WorkspaceViewSwitcher.ts';

const ACTIVE_VIEW_STORAGE_KEY = 'workspace-active-view';
const KANBAN_MODULE_IMPORT_PATH = '../features/kanban/KanbanModule.ts';
const WORKSPACE_VIEW_SWITCHER_OFFSET_EVENT =
  'workspaceViewSwitcherOffsetChanged';
const WORKSPACE_VIEW_SWITCHER_OFFSET_VAR =
  '--workspace-view-switcher-bottom-offset';
const WORKSPACE_VIEW_SWITCHER_LAYOUT_MODE_VAR =
  '--workspace-view-switcher-layout-mode';

type KanbanModuleNamespace = {
  KanbanModule: new () => WorkspaceModule;
};

export class RuntimeHost {
  private shell: WorkspaceShell | null = null;
  private canvasModule: CanvasModule | null = null;
  private kanbanModule: WorkspaceModule | null = null;
  private readonly workspaceRoot: HTMLDivElement;
  private readonly wallpaperService: WallpaperService;
  private readonly wallpaperSubscription: Subscription;
  private currentWallpaperUrl = '';
  private readonly viewSwitcher: WorkspaceViewSwitcher;
  private activeView: WorkspaceView = 'canvas';
  private hostVisible = false;
  private starting = false;
  private readonly viewChangeHandler: (event: Event) => void;
  private readonly viewSwitcherOffsetHandler: (event: Event) => void;

  constructor(wallpaperService: WallpaperService) {
    this.wallpaperService = wallpaperService;
    this.workspaceRoot = document.createElement('div');
    this.workspaceRoot.id = 'workspace-modules-root';
    this.workspaceRoot.style.position = 'fixed';
    this.workspaceRoot.style.inset = '0';
    this.workspaceRoot.style.width = '100vw';
    this.workspaceRoot.style.height = '100vh';
    this.workspaceRoot.style.zIndex = '35';
    this.workspaceRoot.style.display = 'none';
    this.workspaceRoot.style.backgroundSize = 'cover';
    this.workspaceRoot.style.backgroundPosition = 'center';
    this.workspaceRoot.style.backgroundRepeat = 'no-repeat';
    document.body.appendChild(this.workspaceRoot);

    this.wallpaperSubscription = this.wallpaperService.wallpaper$.subscribe(
      (url) => {
        this.currentWallpaperUrl = url.trim();
        this.syncWorkspaceWallpaper();
      }
    );
    this.currentWallpaperUrl = this.wallpaperService.wallpaperUrl.trim();
    this.syncWorkspaceWallpaper();

    this.activeView = this.loadActiveView();
    this.viewSwitcher = new WorkspaceViewSwitcher(this.activeView, {
      showKanban: KANBAN_DEV_ENABLED,
    });
    this.syncViewSwitcherLayoutMode();
    this.syncViewSwitcherBottomOffset();
    this.viewSwitcher.mount(document.body);
    this.viewSwitcher.setVisible(false);
    this.viewChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      if (!isWorkspaceViewChangeRequestDetail(customEvent.detail)) return;
      void this.setActiveView(customEvent.detail.view);
    };
    this.viewSwitcherOffsetHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        bottomOffsetPx?: unknown;
        layoutMode?: unknown;
      }>;
      const value = customEvent.detail?.bottomOffsetPx;
      if (typeof value === 'number' && Number.isFinite(value)) {
        this.viewSwitcher.setBottomOffset(value);
      }
      const mode = customEvent.detail?.layoutMode;
      if (this.isWorkspaceViewSwitcherLayoutMode(mode)) {
        this.viewSwitcher.setLayoutMode(mode);
      }
    };
    window.addEventListener(
      WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
      this.viewChangeHandler
    );
    window.addEventListener(
      WORKSPACE_VIEW_SWITCHER_OFFSET_EVENT,
      this.viewSwitcherOffsetHandler
    );
  }

  private syncWorkspaceWallpaper(): void {
    const isKanbanVisible = this.hostVisible && this.activeView === 'kanban';
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
    window.removeEventListener(
      WORKSPACE_VIEW_CHANGE_REQUEST_EVENT,
      this.viewChangeHandler
    );
    window.removeEventListener(
      WORKSPACE_VIEW_SWITCHER_OFFSET_EVENT,
      this.viewSwitcherOffsetHandler
    );
  }

  public showCanvas(): void {
    this.hostVisible = true;
    this.applyVisibility();
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
        const modulePath = KANBAN_MODULE_IMPORT_PATH;
        const { KanbanModule } = (await import(
          /* @vite-ignore */ modulePath
        )) as KanbanModuleNamespace;
        this.kanbanModule = new KanbanModule();
        this.shell.register(this.kanbanModule);
      }
      await this.shell.show(this.activeView);
      this.viewSwitcher.setActiveView(this.activeView);
      emitWorkspaceViewChanged(this.activeView);
      this.applyVisibility();
    } finally {
      this.starting = false;
    }
  }

  public async setActiveView(view: WorkspaceView): Promise<void> {
    if (view === 'kanban' && !KANBAN_DEV_ENABLED) return;
    this.activeView = view;
    this.persistActiveView(view);
    if (!this.shell) return;
    await this.shell.show(view);
    this.viewSwitcher.setActiveView(view);
    emitWorkspaceViewChanged(view);
    this.applyVisibility();
  }

  private applyVisibility(): void {
    this.syncViewSwitcherLayoutMode();
    this.syncViewSwitcherBottomOffset();
    const canvasUiRoot = document.getElementById('canvas-ui-root');
    const canvas = document.getElementById('myCanvas');
    if (!this.hostVisible) {
      this.workspaceRoot.style.display = 'none';
      this.workspaceRoot.style.pointerEvents = 'none';
      if (canvas instanceof HTMLCanvasElement) {
        canvas.style.display = 'none';
        canvas.style.pointerEvents = 'none';
      }
      if (canvasUiRoot instanceof HTMLElement) {
        canvasUiRoot.style.display = 'none';
        canvasUiRoot.style.pointerEvents = 'none';
      }
      this.viewSwitcher.setVisible(false);
      this.syncWorkspaceWallpaper();
      return;
    }

    const showCanvas = this.activeView === 'canvas';
    this.workspaceRoot.style.display = 'block';
    this.workspaceRoot.style.pointerEvents = 'auto';
    if (canvas instanceof HTMLCanvasElement) {
      canvas.style.display = showCanvas ? 'block' : 'none';
      canvas.style.pointerEvents = showCanvas ? 'auto' : 'none';
    }
    if (canvasUiRoot instanceof HTMLElement) {
      canvasUiRoot.style.display = showCanvas ? 'block' : 'none';
      canvasUiRoot.style.pointerEvents = 'none';
    }
    this.viewSwitcher.setVisible(true);
    this.syncWorkspaceWallpaper();
  }

  private syncViewSwitcherBottomOffset(): void {
    if (typeof window === 'undefined') return;
    const styles = window.getComputedStyle(document.documentElement);
    const value = styles.getPropertyValue(WORKSPACE_VIEW_SWITCHER_OFFSET_VAR).trim();
    const parsed = Number.parseInt(value, 10);
    this.viewSwitcher.setBottomOffset(Number.isFinite(parsed) ? parsed : 16);
  }

  private syncViewSwitcherLayoutMode(): void {
    if (typeof window === 'undefined') return;
    const styles = window.getComputedStyle(document.documentElement);
    const value = styles
      .getPropertyValue(WORKSPACE_VIEW_SWITCHER_LAYOUT_MODE_VAR)
      .trim();
    const mode = this.isWorkspaceViewSwitcherLayoutMode(value)
      ? value
      : 'desktop';
    this.viewSwitcher.setLayoutMode(mode);
  }

  private isWorkspaceViewSwitcherLayoutMode(
    value: unknown
  ): value is WorkspaceViewSwitcherLayout {
    return value === 'desktop' || value === 'mobile';
  }

  private loadActiveView(): WorkspaceView {
    try {
      const value = localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);
      if (value === 'kanban' && KANBAN_DEV_ENABLED) return 'kanban';
      return 'canvas';
    } catch {
      return 'canvas';
    }
  }

  private persistActiveView(view: WorkspaceView): void {
    try {
      localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, view);
    } catch {
      // no-op
    }
  }
}
