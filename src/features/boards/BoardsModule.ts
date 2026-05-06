import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { BoardsApp } from './BoardsApp.ts';

type BoardsModuleOptions = {
  runtime?: AppRuntime;
};

export class BoardsModule implements WorkspaceModule {
  public readonly id = 'boards' as const;
  private readonly runtime: AppRuntime;
  private app: BoardsApp | null = null;

  constructor(options: BoardsModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new BoardsApp({ runtime: this.runtime });
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
