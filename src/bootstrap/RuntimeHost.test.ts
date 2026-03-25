// @vitest-environment jsdom
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WallpaperService } from '../features/shell/services/WallpaperService.ts';

vi.mock('./GlobalAppHeader.ts', () => ({
  GLOBAL_APP_SIDEBAR_WIDTH_PX: 0,
}));

vi.mock('../config/env/index.ts', () => ({
  API_URL: 'https://example.test',
  CANVAS_PERF_LOG: false,
  GROK_API_KEY: '',
  IS_DEVELOPMENT_MODE: true,
  KANBAN_DEV_ENABLED: true,
  ROUTINES_ENABLED: false,
  TIME_CLUSTERING_DEV_ENABLED: true,
}));

vi.mock('../features/shell/WorkspaceViewSwitcher.ts', () => ({
  WorkspaceViewSwitcher: class {
    public mount(): void {}
    public unmount(): void {}
    public setActiveView(): void {}
    public setVisible(): void {}
    public setChatOpen(): void {}
    public setTimeClusteringOpen(): void {}
  },
}));

vi.mock('../features/ai-assistant/components/AiAssistantPanel.ts', () => ({
  AiAssistantPanel: class {
    public mount(): void {}
    public unmount(): void {}
    public setVisible(): void {}
    public setIslandMode(): void {}
    public getWidthPx(): number {
      return 380;
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

type RuntimeHostInternalAccess = {
  workspaceRoot: HTMLDivElement;
  timeClusteringIslandRoot: HTMLDivElement;
  hostVisible: boolean;
  activeView: 'canvas' | 'kanban' | 'time-clustering';
  timeClusteringOpen: boolean;
  timeClusteringLayoutMode: 'docked-left' | 'fullscreen';
  timeClusteringModule: {
    mount: (parent: HTMLElement) => void;
    unmount: () => void;
    getAiAssistantSnapshot: () => null;
  } | null;
  shell: {
    show: (view: string) => Promise<void>;
    getActiveModule: () => null;
    dispose: () => void;
  } | null;
  applyVisibility: () => void;
  setActiveView: (
    view: 'canvas' | 'kanban' | 'time-clustering'
  ) => Promise<void>;
  dispose: () => void;
};

type MockResizeObserverClass = {
  new (callback: ResizeObserverCallback): ResizeObserver;
};

function createRuntimeHost(): RuntimeHost {
  const wallpaper$ = new BehaviorSubject('');
  const wallpaperService = {
    wallpaper$: wallpaper$.asObservable(),
    wallpaperUrl: '',
  } as unknown as WallpaperService;
  return new RuntimeHost(wallpaperService);
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
    delete testGlobal.ResizeObserver;
    document.body.innerHTML = '';
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

    expect(host.workspaceRoot.style.left).toBe('380px');
    expect(host.workspaceRoot.style.right).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.display).toBe('block');
    expect(host.timeClusteringIslandRoot.style.left).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.width).toBe('380px');
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

    expect(host.workspaceRoot.style.left).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.display).toBe('block');
    expect(host.timeClusteringIslandRoot.style.right).toBe('0px');
    expect(host.timeClusteringIslandRoot.style.width).toBe('auto');
    expect(canvas.style.display).toBe('block');
    expect(canvasUiRoot.style.display).toBe('block');

    host.dispose();
  });

  it('toggles time clustering without changing the base view', async () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    host.activeView = 'canvas';
    host.timeClusteringOpen = false;

    await host.setActiveView('time-clustering');

    expect(host.activeView).toBe('canvas');
    expect(host.timeClusteringOpen).toBe(true);
    host.dispose();
  });

  it('keeps time clustering open while switching the base view in fullscreen', async () => {
    const host = getRuntimeHostInternals(createRuntimeHost());
    const show = vi.fn<[string], Promise<void>>().mockResolvedValue();
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
    expect(host.timeClusteringOpen).toBe(true);

    host.dispose();
  });
});
