import type { WorkspaceModule } from '../shell/WorkspaceModule.ts';
import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';
import { FocusBoardApp } from './FocusBoardApp.ts';

type FocusBoardModuleOptions = {
  runtime?: AppRuntime;
  onOpenWallpaperPicker?: () => void;
};

export class FocusBoardModule implements WorkspaceModule {
  public readonly id = 'focus-board' as const;

  private readonly runtime: AppRuntime;
  private readonly onOpenWallpaperPicker: () => void;
  private app: FocusBoardApp | null = null;

  constructor(options: FocusBoardModuleOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.onOpenWallpaperPicker = options.onOpenWallpaperPicker ?? (() => {});
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new FocusBoardApp(this.runtime, undefined, {
      onOpenWallpaperPicker: this.onOpenWallpaperPicker,
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
