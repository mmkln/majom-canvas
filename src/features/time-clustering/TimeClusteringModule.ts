import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringApp } from './TimeClusteringApp.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';

type TimeClusteringModuleOptions = {
  runtime?: AppRuntime;
  initialLayoutMode?: TimeClusteringLayoutMode;
  initialShowOverlapWarnings?: boolean;
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
  onShowOverlapWarningsChange?: (show: boolean) => void;
};

export class TimeClusteringModule {
  public readonly id = 'time-clustering' as const;
  private app: TimeClusteringApp | null = null;
  private layoutMode: TimeClusteringLayoutMode;
  private showOverlapWarnings: boolean;
  private readonly runtime: AppRuntime;

  constructor(private readonly options: TimeClusteringModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.layoutMode = options.initialLayoutMode ?? 'docked-left';
    this.showOverlapWarnings = options.initialShowOverlapWarnings ?? true;
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new TimeClusteringApp({
      runtime: this.runtime,
      initialLayoutMode: this.layoutMode,
      initialShowOverlapWarnings: this.showOverlapWarnings,
      onLayoutModeChange: (mode) => {
        this.layoutMode = mode;
        this.options.onLayoutModeChange?.(mode);
      },
      onShowOverlapWarningsChange: (show) => {
        this.showOverlapWarnings = show;
        this.options.onShowOverlapWarningsChange?.(show);
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

  public setShowOverlapWarnings(show: boolean): void {
    if (this.showOverlapWarnings === show) return;
    this.showOverlapWarnings = show;
    this.app?.setShowOverlapWarnings(show);
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null {
    return null;
  }
}
