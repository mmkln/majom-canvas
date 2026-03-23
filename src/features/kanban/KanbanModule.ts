import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import { KanbanApp } from './KanbanApp.ts';

export class KanbanModule implements WorkspaceModule {
  public readonly id = 'kanban' as const;
  private app: KanbanApp | null = null;

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new KanbanApp();
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
