import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringApp } from './TimeClusteringApp.ts';

type TimeClusteringModuleOptions = {
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
};

export class TimeClusteringModule implements WorkspaceModule {
  public readonly id = 'time-clustering' as const;
  private app: TimeClusteringApp | null = null;

  constructor(private readonly options: TimeClusteringModuleOptions = {}) {}

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new TimeClusteringApp({
      onLayoutModeChange: this.options.onLayoutModeChange,
    });
    app.mount(parent);
    this.app = app;
  }

  public unmount(): void {
    this.app?.unmount();
    this.app = null;
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null {
    return null;
  }
}
