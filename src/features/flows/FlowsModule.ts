import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { FlowsApp } from './FlowsApp.ts';

type FlowsModuleOptions = {
  runtime?: AppRuntime;
};

export class FlowsModule implements WorkspaceModule {
  public readonly id = 'flows' as const;

  private readonly runtime: AppRuntime;
  private app: FlowsApp | null = null;

  constructor(options: FlowsModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new FlowsApp({ runtime: this.runtime });
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
