// @vitest-environment jsdom
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkspaceView } from '../features/shell/WorkspaceView.ts';
import type { WallpaperService } from '../features/shell/services/WallpaperService.ts';

vi.mock('./GlobalAppHeader.ts', () => ({
  GLOBAL_APP_SIDEBAR_WIDTH_PX: 0,
}));

vi.mock('../config/env/index.ts', () => ({
  API_URL: 'https://example.test',
  BOARDS_DEV_ENABLED: false,
  CANVAS_PERF_LOG: false,
  FOCUS_BOARD_DEV_ENABLED: true,
  GROK_API_KEY: '',
  IS_DEVELOPMENT_MODE: true,
  KANBAN_DEV_ENABLED: true,
  LEARNING_STUDIO_DEV_ENABLED: true,
  ROUTINES_ENABLED: false,
  TIME_CLUSTERING_DEV_ENABLED: true,
}));

vi.mock('../features/shell/PresentationMenu.ts', () => ({
  PresentationMenu: class {
    public mount(): void {}
    public unmount(): void {}
    public destroy(): void {}
    public setActiveView(): void {}
    public setVisible(): void {}
    public setChatOpen(): void {}
    public setTimeClusteringOpen(): void {}
    public setTimeClusteringLayoutMode(): void {}
  },
}));

vi.mock('../features/ai-assistant/components/AiAssistantPanel.ts', () => ({
  AiAssistantPanel: class {
    public mount(): void {}
    public unmount(): void {}
    public setVisible(): void {}
    public setIslandMode(): void {}
    public getWidthPx(): number {
      return 390;
    }
    public async submitExternalPrompt(): Promise<void> {}
    public async submitPreparedSubmission(): Promise<void> {}
  },
}));

vi.mock('../features/ai-assistant/services/AiAssistantRuntime.ts', () => ({
  createAiAssistantRuntime: () => ({
    apiClient: null,
    orchestrator: null,
    service: null,
    controller: {
      dispose(): void {},
      subscribe(): () => void {
        return () => {};
      },
      setView(): void {},
      setContext(): void {},
    },
  }),
}));

vi.mock('../features/ai-assistant/services/AiAssistantCapabilities.ts', () => ({
  buildAiAssistantCapabilityContext: () => null,
}));

import { RuntimeHost } from './RuntimeHost.ts';
import { createAppRuntime } from '../app-runtime/index.ts';
import {
  getTimeClusteringLayoutMode,
  getTimeClusteringOverlapWarningsVisible,
  getWorkspaceDefaultView,
  primeUserPreferencesForTests,
  resetUserPreferencesForTests,
} from '../features/shell/services/UserPreferencesService.ts';
import { WORKSPACE_SESSION_ACTIVE_VIEW_STORAGE_KEY } from '../features/shell/workspaceUiState.ts';

type RuntimeHostInternalAccess = {
  workspaceRoot: HTMLDivElement;
  islandBackdropRoot: HTMLDivElement;
  timeClusteringIslandRoot: HTMLDivElement;
  hostVisible: boolean;
  activeView: WorkspaceView;
  chatOpen: boolean;
  timeClusteringOpen: boolean;
  timeClusteringLayoutMode: 'docked-left' | 'fullscreen';
  timeClusteringShowOverlapWarnings: boolean;
  currentWallpaperUrl: string;
  timeClusteringModule: {
    mount: (parent: HTMLElement) => void;
    unmount: () => void;
    setLayoutMode: (mode: 'docked-left' | 'fullscreen') => void;
    setShowOverlapWarnings: (show: boolean) => void;
    getAiAssistantSnapshot: () => null;
  } | null;
  shell: {
    show: (view: string) => Promise<void>;
    getActiveModule: () => null;
    dispose: () => void;
  } | null;
  applyVisibility: () => void;
  handleTimeClusteringToggleRequest: (open?: boolean) => void;
  handleTimeClusteringLayoutModeChange: (
    mode: 'docked-left' | 'fullscreen'
  ) => void;
  handleTimeClusteringOverlapWarningsChange: (show: boolean) => void;
  syncPersistedWorkspacePreferences: () => void;
  setActiveView: (view: WorkspaceView) => Promise<void>;
  dispose: () => void;
};

type MockResizeObserverClass = {
  new (callback: ResizeObserverCallback): ResizeObserver;
};

function createRuntimeHost(runtime = createAppRuntime()): RuntimeHost {
  const wallpaper$ = new BehaviorSubject('');
  const wallpaperService = {
    wallpaper$: wallpaper$.asObservable(),
    wallpaperUrl: '',
  } as unknown as WallpaperService;
  return new RuntimeHost(wallpaperService, runtime);
}

function getRuntimeHostInternals(host: RuntimeHost): RuntimeHostInternalAccess {
  return host as unknown as RuntimeHostInternalAccess;
}

function attachCanvasSurface(host: RuntimeHostInternalAccess): {
  canvas: HTMLCanvasElement;
  canvasUiRoot: HTMLDivElement;
} {
  const canvas = document.createElement('canvas');
  canvas.id = 'myCanvas';
  host.workspaceRoot.appendChild(canvas);

  const canvasUiRoot = document.createElement('div');
  canvasUiRoot.id = 'canvas-ui-root';
  document.body.appendChild(canvasUiRoot);

  return { canvas, canvasUiRoot };
}

function createTimeClusteringModuleStub(): NonNullable<
  RuntimeHostInternalAccess['timeClusteringModule']
> {
  return {
    mount(parent: HTMLElement): void {
      parent.appendChild(document.createElement('div'));
    },
    unmount(): void {},
    setLayoutMode(mode: 'docked-left' | 'fullscreen'): void {
      void mode;
    },
    setShowOverlapWarnings(show: boolean): void {
      void show;
    },
    getAiAssistantSnapshot(): null {
      return null;
    },
  };
}

describe('RuntimeHost time clustering island layout', () => {
  const testGlobal = globalThis as typeof globalThis & {
    ResizeObserver?: MockResizeObserverClass;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    testGlobal.ResizeObserver = class {
      public constructor(callback: ResizeObserverCallback) {
        void callback;
      }
      public disconnect(): void {}
      public observe(): void {}
      public unobserve(): void {}
    } as MockResizeObserverClass;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    Reflect.deleteProperty(testGlobal, 'ResizeObserver');
    document.body.innerHTML = '';
  });

  it('syncs document theme from AppRuntime snapshots and unsubscribes on dispose', () => {
    const runtime = createAppRuntime({ initialTheme: 'dark' });
    const host = createRuntimeHost(runtime);

    expect(document.documentElement.dataset.theme).toBe('dark');

    runtime.setTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');

    host.dispose();

    runtime.setTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('mounts one global toast provider for workspace notifications', () => {
    const host = createRuntimeHost();

    expect(
      document.body.querySelectorAll('[data-component="ToastProvider"]')
    ).toHaveLength(1);

    host.dispose();

    expect(
      document.body.querySelector('[data-component="ToastProvider"]')
    ).toBeNull();
  });

  it('reserves left workspace space when time clustering is docked', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const { canvas } = attachCanvasSurface(host);
    host.hostVisible = true;
    host.activeView = 'canvas';
    host.timeClusteringOpen = true;
    host.timeClusteringLayoutMode = 'docked-left';
    host.timeClusteringModule = createTimeClusteringModuleStub();

    host.applyVisibility();

    expect(host.workspaceRoot.style.left).toBe('360px');
    expect(host.workspaceRoot.style.right).toBe('0px');
    expect(host.workspaceRoot.style.borderRadius).toBe('28px');
    expect(host.islandBackdropRoot.style.display).toBe('block');
    expect(host.islandBackdropRoot.style.background).toBe('rgb(244, 248, 252)');
    expect(host.timeClusteringIslandRoot.style.display).toBe('block');
    expect(host.timeClusteringIslandRoot.style.left).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.width).toBe('360px');
    expect(host.timeClusteringIslandRoot.style.borderRadius).toBe('28px');
    expect(canvas.style.display).toBe('block');

    host.dispose();
  });

  it('lets the time clustering island take over the workspace in fullscreen mode', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const { canvas, canvasUiRoot } = attachCanvasSurface(host);
    host.hostVisible = true;
    host.activeView = 'canvas';
    host.timeClusteringOpen = true;
    host.timeClusteringLayoutMode = 'fullscreen';
    host.timeClusteringModule = createTimeClusteringModuleStub();

    host.applyVisibility();

    expect(host.workspaceRoot.style.display).toBe('none');
    expect(host.timeClusteringIslandRoot.style.display).toBe('block');
    expect(host.timeClusteringIslandRoot.style.right).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.width).toBe('auto');
    expect(canvas.style.display).toBe('none');
    expect(canvasUiRoot.style.display).toBe('none');

    host.dispose();
  });

  it('applies the workspace wallpaper behind the focus board', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    host.hostVisible = true;
    host.activeView = 'focus-board';
    host.currentWallpaperUrl = 'https://example.test/wallpaper.webp';

    host.applyVisibility();

    expect(host.workspaceRoot.style.backgroundImage).toBe(
      'url("https://example.test/wallpaper.webp")'
    );
    expect(host.workspaceRoot.style.backgroundColor).toBe('rgb(244, 247, 251)');

    host.dispose();
  });

  it('applies the workspace wallpaper behind boards', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    host.hostVisible = true;
    host.activeView = 'boards';
    host.currentWallpaperUrl = 'https://example.test/wallpaper.webp';

    host.applyVisibility();

    expect(host.workspaceRoot.style.backgroundImage).toBe(
      'url("https://example.test/wallpaper.webp")'
    );
    expect(host.workspaceRoot.style.backgroundColor).toBe('rgb(244, 247, 251)');
    expect(host.workspaceRoot.dataset.workspaceWallpaperHeaderTone).toBe(
      'on-dark'
    );
    expect(
      host.workspaceRoot.style.getPropertyValue(
        '--workspace-dynamic-text-color'
      )
    ).toBe('#ffffff');

    host.dispose();
  });

  it('uses light-background header tokens for boards without a wallpaper image', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    host.hostVisible = true;
    host.activeView = 'boards';
    host.currentWallpaperUrl = '';

    host.applyVisibility();

    expect(host.workspaceRoot.style.backgroundImage).toBe('');
    expect(host.workspaceRoot.dataset.workspaceWallpaperHeaderTone).toBe(
      'on-light'
    );
    expect(
      host.workspaceRoot.style.getPropertyValue(
        '--workspace-dynamic-text-color'
      )
    ).toBe('#172b4d');

    host.dispose();
  });

  it('opens time clustering in docked-left mode without changing the base view', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi
      .fn<(view: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    host.shell = {
      show,
      getActiveModule: () => null,
      dispose(): void {},
    };
    host.activeView = 'kanban';
    host.timeClusteringOpen = false;
    host.timeClusteringLayoutMode = 'fullscreen';
    host.timeClusteringModule = createTimeClusteringModuleStub();

    host.handleTimeClusteringToggleRequest();

    expect(host.activeView).toBe('kanban');
    expect(show).not.toHaveBeenCalled();
    expect(host.timeClusteringOpen).toBe(true);
    expect(host.timeClusteringLayoutMode).toBe('docked-left');
    host.dispose();
  });

  it('preserves a persisted kanban base view when time clustering is already open', () => {
    localStorage.setItem('workspace-active-view', 'kanban');
    localStorage.setItem('time-clustering-open', '1');
    primeUserPreferencesForTests({
      workspace: { defaultView: 'kanban' },
      timeClustering: {
        layoutMode: 'fullscreen',
        overlapWarningsVisible: false,
      },
    });

    const host = getRuntimeHostInternals(createRuntimeHost());
    host['syncPersistedWorkspacePreferences']();

    expect(host.activeView).toBe('kanban');
    expect(host.timeClusteringOpen).toBe(true);
    expect(host.timeClusteringLayoutMode).toBe('fullscreen');
    expect(host.timeClusteringShowOverlapWarnings).toBe(false);

    host.dispose();
  });

  it('applies chat and time clustering open state from user preferences snapshot', () => {
    primeUserPreferencesForTests({
      workspace: {
        aiAssistantOpen: true,
        timeClusteringOpen: true,
      },
    });

    const host = getRuntimeHostInternals(createRuntimeHost());

    expect(host.chatOpen).toBe(true);
    expect(host.timeClusteringOpen).toBe(true);

    host.dispose();
  });

  it('persists time clustering layout mode changes', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());

    host.handleTimeClusteringLayoutModeChange('fullscreen');

    expect(getTimeClusteringLayoutMode('docked-left')).toBe('fullscreen');
    expect(host.timeClusteringLayoutMode).toBe('fullscreen');

    host.dispose();
  });

  it('persists overlap warning visibility changes', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());

    host.handleTimeClusteringOverlapWarningsChange(false);

    expect(getTimeClusteringOverlapWarningsVisible(true)).toBe(false);
    expect(host.timeClusteringShowOverlapWarnings).toBe(false);

    host.dispose();
  });

  it('keeps docked-left time clustering open when switching the base view', async () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi
      .fn<(view: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    host.shell = {
      show,
      getActiveModule: () => null,
      dispose(): void {},
    };
    host.activeView = 'canvas';
    host.timeClusteringOpen = true;
    host.timeClusteringLayoutMode = 'docked-left';

    await host.setActiveView('kanban');

    expect(show).toHaveBeenCalledWith('kanban');
    expect(host.activeView).toBe('kanban');
    expect(host.timeClusteringOpen).toBe(true);
    expect(host.timeClusteringLayoutMode).toBe('docked-left');
    expect(
      sessionStorage.getItem(WORKSPACE_SESSION_ACTIVE_VIEW_STORAGE_KEY)
    ).toBe('kanban');
    expect(getWorkspaceDefaultView('canvas')).toBe('canvas');

    host.dispose();
  });

  it('does not persist a failed workspace switch into the tab session', async () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi
      .fn<(view: string) => Promise<void>>()
      .mockRejectedValue(new Error('module failed'));
    host.shell = {
      show,
      getActiveModule: () => null,
      dispose(): void {},
    };
    host.activeView = 'canvas';

    await expect(host.setActiveView('kanban')).rejects.toThrow('module failed');

    expect(show).toHaveBeenCalledWith('kanban');
    expect(host.activeView).toBe('canvas');
    expect(
      sessionStorage.getItem(WORKSPACE_SESSION_ACTIVE_VIEW_STORAGE_KEY)
    ).toBe(null);

    host.dispose();
  });

  it('does not switch the current tab when profile default view changes', () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi
      .fn<(view: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    host.shell = {
      show,
      getActiveModule: () => null,
      dispose(): void {},
    };
    host.activeView = 'canvas';

    primeUserPreferencesForTests({
      workspace: {
        defaultView: 'kanban',
      },
    });

    expect(host.activeView).toBe('canvas');
    expect(show).not.toHaveBeenCalled();

    host.dispose();
  });

  it('closes fullscreen time clustering when switching the base view', async () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi
      .fn<(view: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    host.shell = {
      show,
      getActiveModule: () => null,
      dispose(): void {},
    };
    host.activeView = 'canvas';
    host.timeClusteringOpen = true;
    host.timeClusteringLayoutMode = 'fullscreen';

    await host.setActiveView('kanban');

    expect(show).toHaveBeenCalledWith('kanban');
    expect(host.activeView).toBe('kanban');
    expect(host.timeClusteringOpen).toBe(false);
    expect(host.timeClusteringLayoutMode).toBe('docked-left');
    expect(getTimeClusteringLayoutMode('fullscreen')).toBe('docked-left');

    host.dispose();
  });
});
