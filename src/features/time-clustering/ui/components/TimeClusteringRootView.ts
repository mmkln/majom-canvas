import type { TimeClusteringStore } from '../../state/TimeClusteringStore.ts';

export class TimeClusteringRootView {
  private readonly root: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly subtitle: HTMLParagraphElement;
  private disposeStoreSubscription: (() => void) | null = null;

  constructor(private readonly store: TimeClusteringStore) {
    this.root = document.createElement('div');
    this.root.className = 'h-full w-full p-4 text-zinc-100';

    this.title = document.createElement('h2');
    this.title.className = 'text-lg font-semibold';
    this.title.textContent = 'Time Clustering';

    this.subtitle = document.createElement('p');
    this.subtitle.className = 'mt-2 text-sm text-zinc-400';

    this.root.append(this.title, this.subtitle);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
    this.disposeStoreSubscription = this.store.subscribe((snapshot) => {
      this.subtitle.textContent = `Mode: ${snapshot.viewMode} • Date: ${snapshot.selectedDateKey} • Days planned: ${Object.keys(
        snapshot.plansByDate
      ).length}`;
    });
  }

  public unmount(): void {
    this.disposeStoreSubscription?.();
    this.disposeStoreSubscription = null;
    this.root.remove();
  }
}
