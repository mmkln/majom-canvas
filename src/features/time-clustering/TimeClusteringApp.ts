import { LocalStorageTimeClusteringRepository } from './data/LocalStorageTimeClusteringRepository.ts';
import { TimeClusteringStore } from './state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './ui/components/TimeClusteringRootView.ts';
import {
  StubTimeClusteringSuggestionService,
  type TimeClusteringSuggestion,
} from './services/TimeClusteringSuggestionService.ts';

export class TimeClusteringApp {
  private readonly store = new TimeClusteringStore(new LocalStorageTimeClusteringRepository());
  private readonly suggestionService = new StubTimeClusteringSuggestionService();
  private readonly view = new TimeClusteringRootView({
    store: this.store,
    onRefreshSuggestions: () => this.refreshSuggestions(),
  });

  public mount(parent: HTMLElement): void {
    this.view.mount(parent);
  }

  public unmount(): void {
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
