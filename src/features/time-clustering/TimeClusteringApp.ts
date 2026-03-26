import { LocalStorageTimeClusteringRepository } from './data/LocalStorageTimeClusteringRepository.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringStore } from './state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './ui/components/TimeClusteringRootView.ts';
import {
  StubTimeClusteringSuggestionService,
  type TimeClusteringSuggestion,
} from './services/TimeClusteringSuggestionService.ts';
import { AppRuntime, createAppRuntime } from '../../app-runtime/index.ts';

type TimeClusteringAppOptions = {
  runtime?: AppRuntime;
  initialLayoutMode?: TimeClusteringLayoutMode;
  initialShowOverlapWarnings?: boolean;
  onLayoutModeChange?: (mode: TimeClusteringLayoutMode) => void;
  onShowOverlapWarningsChange?: (show: boolean) => void;
};

export class TimeClusteringApp {
  private readonly onLayoutModeChange?: (
    mode: TimeClusteringLayoutMode
  ) => void;
  private readonly onShowOverlapWarningsChange?: (show: boolean) => void;
  private readonly store = new TimeClusteringStore(
    new LocalStorageTimeClusteringRepository()
  );
  private readonly suggestionService =
    new StubTimeClusteringSuggestionService();
  private readonly view: TimeClusteringRootView;
  private readonly runtime: AppRuntime;
  private layoutMode: TimeClusteringLayoutMode;
  private showOverlapWarnings: boolean;

  constructor(options: TimeClusteringAppOptions = {}) {
    this.runtime = options.runtime ?? createAppRuntime();
    this.layoutMode = options.initialLayoutMode ?? 'docked-left';
    this.showOverlapWarnings = options.initialShowOverlapWarnings ?? true;
    this.onLayoutModeChange = options.onLayoutModeChange;
    this.onShowOverlapWarningsChange = options.onShowOverlapWarningsChange;
    this.view = new TimeClusteringRootView({
      runtime: this.runtime,
      store: this.store,
      layoutMode: this.layoutMode,
      showOverlapWarnings: this.showOverlapWarnings,
      onLayoutModeChange: (mode) => this.setLayoutMode(mode),
      onShowOverlapWarningsChange: (show) =>
        this.setShowOverlapWarnings(show),
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

  public setShowOverlapWarnings(show: boolean): void {
    if (this.showOverlapWarnings === show) return;
    this.showOverlapWarnings = show;
    this.view.setShowOverlapWarnings(show);
    this.onShowOverlapWarningsChange?.(show);
  }

  public async refreshSuggestions(): Promise<TimeClusteringSuggestion[]> {
    const snapshot = this.store.getSnapshot();
    return this.suggestionService.buildSuggestions({
      dateKey: snapshot.selectedDateKey,
      existingClusters: snapshot.clusters,
    });
  }
}
