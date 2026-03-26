import type { AiAssistantCanvasSnapshot } from '../ai-assistant/aiAssistantEvents.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringApp } from './TimeClusteringApp.ts';
import { I18nService, createAppI18nService } from '../../i18n/index.ts';

type TimeClusteringModuleOptions = {
  i18n?: I18nService;
  initialLayoutMode?: TimeClusteringLayoutMode;
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
};

export class TimeClusteringModule {
  public readonly id = 'time-clustering' as const;
  private app: TimeClusteringApp | null = null;
  private layoutMode: TimeClusteringLayoutMode;
  private readonly i18n: I18nService;

  constructor(private readonly options: TimeClusteringModuleOptions = {}) {
    this.i18n = options.i18n ?? createAppI18nService();
    this.layoutMode = options.initialLayoutMode ?? 'docked-left';
  }

  public mount(parent: HTMLElement): void {
    if (this.app) return;
    const app = new TimeClusteringApp({
      i18n: this.i18n,
      initialLayoutMode: this.layoutMode,
      onLayoutModeChange: (mode) => {
        this.layoutMode = mode;
        this.options.onLayoutModeChange?.(mode);
      },
    });
    app.mount(parent);
    this.app = app;
  }

  public unmount(): void {
    this.app?.unmount();
    this.app = null;
  }

  public setLayoutMode(mode: TimeClusteringLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.app?.setLayoutMode(mode);
  }

  public getAiAssistantSnapshot(): AiAssistantCanvasSnapshot | null {
    return null;
  }
}
