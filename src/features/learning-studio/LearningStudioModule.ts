import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { LearningStudioApp } from './LearningStudioApp.ts';

type LearningStudioModuleOptions = {
  runtime?: AppRuntime;
};

export class LearningStudioModule implements WorkspaceModule {
  public readonly id = 'learning-studio' as const;
  private readonly runtime: AppRuntime;
  private app: LearningStudioApp | null = null;

  constructor(options: LearningStudioModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new LearningStudioApp({
      runtime: this.runtime,
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
