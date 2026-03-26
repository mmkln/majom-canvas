import { LocalStorageTimeClusteringRepository } from './data/LocalStorageTimeClusteringRepository.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringStore } from './state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './ui/components/TimeClusteringRootView.ts';
import {
  StubTimeClusteringSuggestionService,
  type TimeClusteringSuggestion,
} from './services/TimeClusteringSuggestionService.ts';
import { I18nService, createAppI18nService } from '../../i18n/index.ts';

type TimeClusteringAppOptions = {
  i18n?: I18nService;
  initialLayoutMode?: TimeClusteringLayoutMode;
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
};

export class TimeClusteringApp {
  private readonly onLayoutModeChange?: (
    mode: TimeClusteringLayoutMode
  ) => void;
  private readonly store = new TimeClusteringStore(
    new LocalStorageTimeClusteringRepository()
  );
  private readonly suggestionService =
    new StubTimeClusteringSuggestionService();
  private readonly view: TimeClusteringRootView;
  private readonly i18n: I18nService;
  private layoutMode: TimeClusteringLayoutMode;

  constructor(options: TimeClusteringAppOptions = {}) {
    this.i18n = options.i18n ?? createAppI18nService();
    this.layoutMode = options.initialLayoutMode ?? 'docked-left';
    this.onLayoutModeChange = options.onLayoutModeChange;
    this.view = new TimeClusteringRootView({
      i18n: this.i18n,
      store: this.store,
      layoutMode: this.layoutMode,
      onLayoutModeChange: (mode) => this.setLayoutMode(mode),
      onRefreshSuggestions: () => this.refreshSuggestions(),
    });
  }

  public mount(parent: HTMLElement): void {
    this.view.mount(parent);
  }

  public unmount(): void {
    this.view.unmount();
    this.store.destroy();
  }

  public setLayoutMode(mode: TimeClusteringLayoutMode): void {
    if (this.layoutMode === mode) return;
    this.layoutMode = mode;
    this.view.setLayoutMode(mode);
    this.onLayoutModeChange?.(mode);
  }

  public async refreshSuggestions(): Promise<TimeClusteringSuggestion[]> {
    const snapshot = this.store.getSnapshot();
    return this.suggestionService.buildSuggestions({
      dateKey: snapshot.selectedDateKey,
      existingClusters: snapshot.clusters,
    });
  }
}
