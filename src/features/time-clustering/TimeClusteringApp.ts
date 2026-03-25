import { LocalStorageTimeClusteringRepository } from './data/LocalStorageTimeClusteringRepository.ts';
import type { TimeClusteringLayoutMode } from './domain/types.ts';
import { TimeClusteringStore } from './state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './ui/components/TimeClusteringRootView.ts';
import {
  StubTimeClusteringSuggestionService,
  type TimeClusteringSuggestion,
} from './services/TimeClusteringSuggestionService.ts';

type TimeClusteringAppOptions = {
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
  private readonly view = new TimeClusteringRootView({
    store: this.store,
    onRefreshSuggestions: () => this.refreshSuggestions(),
  });
  private disposeLayoutModeSubscription: (() => void) | null = null;
  private lastReportedLayoutMode: TimeClusteringLayoutMode | null = null;

  constructor(options: TimeClusteringAppOptions = {}) {
    this.onLayoutModeChange = options.onLayoutModeChange;
  }

  public mount(parent: HTMLElement): void {
    this.view.mount(parent);
    this.disposeLayoutModeSubscription = this.store.subscribe((snapshot) => {
      if (snapshot.layoutMode === this.lastReportedLayoutMode) return;
      this.lastReportedLayoutMode = snapshot.layoutMode;
      this.onLayoutModeChange?.(snapshot.layoutMode);
    });
  }

  public unmount(): void {
    this.disposeLayoutModeSubscription?.();
    this.disposeLayoutModeSubscription = null;
    this.view.unmount();
    this.store.destroy();
  }

  public async refreshSuggestions(): Promise<TimeClusteringSuggestion[]> {
    const snapshot = this.store.getSnapshot();
    return this.suggestionService.buildSuggestions({
      dateKey: snapshot.selectedDateKey,
      existingPlans: snapshot.plansByDate,
    });
  }
}
