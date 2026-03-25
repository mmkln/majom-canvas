import { LocalStorageTimeClusteringRepository } from './data/LocalStorageTimeClusteringRepository.ts';
import { TimeClusteringStore } from './state/TimeClusteringStore.ts';
import { TimeClusteringRootView } from './ui/components/TimeClusteringRootView.ts';
import { StubTimeClusteringSuggestionService } from './services/TimeClusteringSuggestionService.ts';

export class TimeClusteringApp {
  private readonly store = new TimeClusteringStore(new LocalStorageTimeClusteringRepository());
  private readonly view = new TimeClusteringRootView(this.store);
  private readonly suggestionService = new StubTimeClusteringSuggestionService();

  public mount(parent: HTMLElement): void {
    this.view.mount(parent);
  }

  public unmount(): void {
    this.view.unmount();
    this.store.destroy();
  }

  public async refreshSuggestions(): Promise<void> {
    const snapshot = this.store.getSnapshot();
    await this.suggestionService.buildSuggestions({
      dateKey: snapshot.selectedDateKey,
      existingPlans: snapshot.plansByDate,
    });
  }
}
