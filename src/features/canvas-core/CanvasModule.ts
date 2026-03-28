import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type {
  AiAssistantActionExecutionRequest,
  AiAssistantActionExecutionResult,
} from '../ai-assistant/aiAssistantActions.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { AiAssistantToolHost } from '../ai-assistant/services/AiAssistantToolTypes.ts';
import { CanvasApp } from './CanvasApp.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import type { CanvasCoreAdapters } from './adapters/CanvasCoreAdapters.ts';

type CanvasModuleOptions = {
  runtime?: AppRuntime;
  adapters?: CanvasCoreAdapters;
  resolveAdapters?: () => CanvasCoreAdapters | Promise<CanvasCoreAdapters>;
};

export const CANVAS_CORE_CANVAS_ELEMENT_ID = 'canvas-core-canvas';

export class CanvasModule implements WorkspaceModule {
  public readonly id = 'canvas' as const;
  private app: CanvasApp | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private starting = false;
  private readonly runtime: AppRuntime;
  private readonly adapters: CanvasCoreAdapters | null;
  private readonly resolveAdapters:
    | (() => CanvasCoreAdapters | Promise<CanvasCoreAdapters>)
    | null;

  constructor(options: CanvasModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.adapters = options.adapters ?? null;
    this.resolveAdapters = options.resolveAdapters ?? null;
  }

  public async mount(parent: HTMLElement): Promise<void> {
    if (this.app || this.starting) return;
    this.starting = true;
    try {
      parent.style.position = parent.style.position || 'relative';
      parent.style.minHeight = parent.style.minHeight || '100%';
      const canvas = document.createElement('canvas');
      canvas.id = CANVAS_CORE_CANVAS_ELEMENT_ID;
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'auto';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      parent.appendChild(canvas);
      this.canvas = canvas;

      const adapters =
        this.adapters ??
        (this.resolveAdapters
          ? await Promise.resolve(this.resolveAdapters())
          : null);
      if (!adapters) {
        throw new Error(
          'Canvas core adapters were not provided. Inject adapters via CanvasModule options.'
        );
      }

      const nextApp = new CanvasApp(adapters, canvas, this.runtime, parent);
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
