import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type {
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
} from '../shell/workspaceChatActions.ts';
import type { WorkspaceChatCanvasSnapshot } from '../shell/workspaceChatEvents.ts';
import { CanvasApp } from './CanvasApp.ts';
import { LocalStorageDataProvider } from './core/data/LocalStorageDataProvider.ts';

export class CanvasModule implements WorkspaceModule {
  public readonly id = 'canvas' as const;
  private app: CanvasApp | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private starting = false;

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

      const nextApp = new CanvasApp(new LocalStorageDataProvider(), canvas);
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
    request: WorkspaceChatActionExecutionRequest
  ): Promise<WorkspaceChatActionExecutionResult> {
    if (!this.app) {
      return {
        status: 'failed',
        errorMessage: 'Canvas is unavailable.',
      };
    }
    return this.app.executeChatAction(request);
  }

  public getWorkspaceChatSnapshot(): WorkspaceChatCanvasSnapshot | null {
    return this.app?.getWorkspaceChatSnapshot() ?? null;
  }
}
