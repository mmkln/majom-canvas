import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import { TimeClusteringApp } from './TimeClusteringApp.ts';

export class TimeClusteringModule implements WorkspaceModule {
  public readonly id = 'time-clustering' as const;
  private app: TimeClusteringApp | null = null;

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new TimeClusteringApp();
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
