import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringApp } from './TimeClusteringApp.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';

type TimeClusteringModuleOptions = {
  runtime?: AppRuntime;
  initialLayoutMode?: TimeClusteringLayoutMode;
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
};

export class TimeClusteringModule {
  public readonly id = 'time-clustering' as const;
  private app: TimeClusteringApp | null = null;
  private layoutMode: TimeClusteringLayoutMode;
  private readonly runtime: AppRuntime;

  constructor(private readonly options: TimeClusteringModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.layoutMode = options.initialLayoutMode ?? 'docked-left';
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new TimeClusteringApp({
      runtime: this.runtime,
      initialLayoutMode: this.layoutMode,
      onLayoutModeChange: (mode) => {
        this.layoutMode = mode;
        this.options.onLayoutModeChange?.(mode);
      },
    });
    app.mount(parent);
    this.app = app;
  }

  public unmount(): void {
    this.app?.unmount();
    this.app = null;
  }

  public setLayoutMode(mode: TimeClusteringLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.app?.setLayoutMode(mode);
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null {
    return null;
  }
}
