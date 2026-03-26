import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type {
  AiAssistantActionExecutionRequest,
  AiAssistantActionExecutionResult,
} from '../ai-assistant/aiAssistantActions.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { AiAssistantToolHost } from '../ai-assistant/services/AiAssistantToolTypes.ts';
import { CanvasApp } from './CanvasApp.ts';
import { LocalStorageDataProvider } from './core/data/LocalStorageDataProvider.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';

type CanvasModuleOptions = {
  runtime?: AppRuntime;
};

export class CanvasModule implements WorkspaceModule {
  public readonly id = 'canvas' as const;
  private app: CanvasApp | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private starting = false;
  private readonly runtime: AppRuntime;

  constructor(options: CanvasModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
  }

  public async mount(parent: HTMLElement): Promise<void> {
    if (this.app || this.starting) return;
    this.starting = true;
    try {
      const canvas = document.createElement('canvas');
      canvas.id = 'myCanvas';
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'auto';
      parent.appendChild(canvas);
      this.canvas = canvas;

      const nextApp = new CanvasApp(
        new LocalStorageDataProvider(),
        canvas,
        this.runtime
      );
      try {
        await nextApp.init();
        this.app = nextApp;
      } catch (error) {
        nextApp.destroy();
        canvas.remove();
        this.canvas = null;
        throw error;
      }
    } finally {
      this.starting = false;
    }
  }

  public unmount(): void {
    this.app?.destroy();
    this.app = null;
    this.canvas?.remove();
    this.canvas = null;
  }

  public async executeChatAction(
    request: AiAssistantActionExecutionRequest
  ): Promise<AiAssistantActionExecutionResult> {
    if (!this.app) {
      return {
        status: 'failed',
        errorMessage: 'Canvas is unavailable.',
      };
    }
    return this.app.executeChatAction(request);
  }

  public async executeChatActions(
    requests: AiAssistantActionExecutionRequest[]
  ): Promise<AiAssistantActionExecutionResult[]> {
    if (!this.app) {
      return requests.map(() => ({
        status: 'failed' as const,
        errorMessage: 'Canvas is unavailable.',
      }));
    }
    return this.app.executeChatActions(requests);
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null {
    return this.app?.getAiAssistantSnapshot() ?? null;
  }

  public getAiAssistantToolHost(): AiAssistantToolHost | null {
    return this.app;
  }
}
