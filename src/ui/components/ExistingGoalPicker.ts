import type { Observable, Subscription } from 'rxjs';
import { positionFixedElement } from '../overlayPosition.ts';
import type { Goal } from '../../majom-wrapper/interfaces/index.ts';

type GoalPage = {
  items: Goal[];
  hasMore: boolean;
};

type OpenOptions = {
  anchorX: number;
  anchorY: number;
  sceneX: number;
  sceneY: number;
  onPick: (goal: Goal, sceneX: number, sceneY: number) => void;
  isOnCanvas: (goal: Goal) => boolean;
};

export class ExistingGoalPicker {
  private container: HTMLDivElement | null = null;
  private list: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private outsideHandler: ((event: MouseEvent) => void) | null = null;
  private listScrollHandler: ((event: Event) => void) | null = null;
  private searchDebounce: number | null = null;
  private loadSubscription: Subscription | null = null;
  private requestToken = 0;
  private isLoading = false;
  private loadMoreError = false;
  private currentTerm = '';
  private currentPage = 0;
  private hasMore = false;
  private items: Goal[] = [];
  private activeOptions: OpenOptions | null = null;

  constructor(
    private readonly loadGoalsPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<GoalPage>,
    private readonly pageSize: number = 30
  ) {}

  public open(options: OpenOptions): void {
    this.close();
    this.activeOptions = options;

    const container = document.createElement('div');
    container.className =
      'fixed w-[360px] rounded-md border border-gray-200 bg-white shadow-xl text-sm text-gray-800';
    container.style.padding = '10px';
    container.style.zIndex = '60';

    const header = document.createElement('div');
    header.className = 'mb-2 flex items-center justify-between';
    const title = document.createElement('div');
    title.className = 'font-semibold text-gray-900';
    title.textContent = 'Add existing goal';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className =
      'rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => this.close());
    header.append(title, closeBtn);

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search goals...';
    searchInput.className =
      'mb-2 w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-300 focus:outline-none';

    const list = document.createElement('div');
    list.className = 'max-h-[300px] overflow-auto';

    const footer = document.createElement('div');
    footer.className = 'pt-2';

    container.append(header, searchInput, list, footer);
    document.body.appendChild(container);

    this.container = container;
    this.list = list;
    this.footer = footer;
    this.listScrollHandler = () => this.maybeAutoLoadMore();
    this.list.addEventListener('scroll', this.listScrollHandler);

    positionFixedElement(container, {
      anchorX: options.anchorX,
      anchorY: options.anchorY,
      alignX: 'left',
      alignY: 'top',
      offsetY: 6,
    });

    searchInput.addEventListener('input', () => {
      if (this.searchDebounce !== null) {
        window.clearTimeout(this.searchDebounce);
      }
      this.searchDebounce = window.setTimeout(() => {
        this.resetAndLoad(searchInput.value.trim());
      }, 250);
    });

    this.outsideHandler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (this.container && !this.container.contains(target)) {
        this.close();
      }
    };
    window.addEventListener('mousedown', this.outsideHandler);

    this.resetAndLoad('');
    searchInput.focus();
  }

  public close(): void {
    if (this.searchDebounce !== null) {
      window.clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
    if (this.outsideHandler) {
      window.removeEventListener('mousedown', this.outsideHandler);
      this.outsideHandler = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    if (this.list && this.listScrollHandler) {
      this.list.removeEventListener('scroll', this.listScrollHandler);
    }
    this.list = null;
    this.footer = null;
    this.listScrollHandler = null;
    this.activeOptions = null;
    this.items = [];
    this.currentPage = 0;
    this.hasMore = false;
    this.currentTerm = '';
    this.isLoading = false;
    this.loadMoreError = false;
  }

  private resetAndLoad(term: string): void {
    this.currentTerm = term;
    this.currentPage = 0;
    this.hasMore = false;
    this.items = [];
    this.loadMoreError = false;
    this.renderMessage('Loading...');
    this.renderFooter();
    this.fetchPage(1, false);
  }

  private fetchPage(page: number, append: boolean): void {
    if (!this.activeOptions) return;
    const token = ++this.requestToken;
    this.isLoading = true;
    this.loadMoreError = false;
    if (!append) {
      this.renderMessage('Loading...');
    }
    this.renderFooter();
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = this.loadGoalsPage(
      this.currentTerm,
      page,
      this.pageSize
    ).subscribe({
      next: (result) => {
        if (token !== this.requestToken || !this.container) return;
        this.isLoading = false;
        this.currentPage = page;
        this.hasMore = result.hasMore;
        this.items = append ? [...this.items, ...result.items] : result.items;
        this.renderGoals();
        this.renderFooter();
        this.maybeAutoLoadMore();
      },
      error: () => {
        if (token !== this.requestToken || !this.container) return;
        this.isLoading = false;
        this.loadMoreError = true;
        if (!append) {
          this.renderMessage('Failed to load goals');
        }
        this.renderFooter();
      },
    });
  }

  private loadMore(): void {
    if (this.isLoading || !this.hasMore) return;
    this.fetchPage(this.currentPage + 1, true);
  }

  private renderGoals(): void {
    if (!this.list || !this.activeOptions) return;
    this.list.innerHTML = '';
    if (this.items.length === 0) {
      this.renderMessage('No goals found');
      return;
    }
    this.items.forEach((goal) => {
      const onCanvas = this.activeOptions?.isOnCanvas(goal) ?? false;
      const row = document.createElement('div');
      row.className =
        'mb-1 cursor-pointer rounded border px-2 py-2 transition-colors hover:bg-gray-50';
      row.style.borderColor = onCanvas ? '#bbf7d0' : '#f3f4f6';
      row.style.background = onCanvas ? '#f0fdf4' : '#ffffff';
      row.setAttribute('role', 'button');
      row.tabIndex = 0;

      const handlePick = (): void => {
        this.activeOptions?.onPick(
          goal,
          this.activeOptions.sceneX,
          this.activeOptions.sceneY
        );
        this.close();
      };

      row.addEventListener('click', handlePick);
      row.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handlePick();
      });

      const topRow = document.createElement('div');
      topRow.className = 'flex items-start justify-between gap-2';

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0';
      const title = document.createElement('div');
      title.className = 'truncate font-medium text-gray-900';
      title.textContent = goal.title || 'Untitled goal';
      textWrap.appendChild(title);

      if (onCanvas) {
        const badge = document.createElement('span');
        badge.className =
          'inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700';
        badge.textContent = 'On canvas';
        textWrap.appendChild(badge);
      }

      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className =
        'shrink-0 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100';
      actionBtn.textContent = onCanvas ? 'Find' : 'Add';
      actionBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        handlePick();
      });

      topRow.append(textWrap, actionBtn);

      const meta = document.createElement('div');
      meta.className = 'mt-1 text-xs text-gray-500';
      const metaParts = [
        `Status: ${this.formatEnum(goal.status)}`,
        `Priority: ${this.formatEnum(goal.priority)}`,
      ];
      const updatedAt = this.getUpdatedAtLabel(goal);
      if (updatedAt) {
        metaParts.push(`Updated: ${updatedAt}`);
      }
      meta.textContent = metaParts.join(' | ');

      row.append(topRow, meta);

      const shortDescription = this.truncateDescription(goal.description);
      if (shortDescription.length > 0) {
        const description = document.createElement('div');
        description.className = 'mt-1 text-xs text-gray-600';
        description.textContent = shortDescription;
        row.appendChild(description);
      }

      this.list.appendChild(row);
    });
  }

  private renderFooter(): void {
    if (!this.footer || !this.activeOptions) return;
    this.footer.innerHTML = '';
    if (this.items.length === 0 && !this.hasMore && !this.loadMoreError) {
      return;
    }

    if (this.hasMore || this.loadMoreError) {
      if (!this.loadMoreError) {
        const hint = document.createElement('div');
        hint.className = 'px-1 text-[11px] text-gray-400';
        hint.textContent = this.isLoading
          ? 'Loading more...'
          : 'Scroll down to load more';
        this.footer.appendChild(hint);
        return;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className =
        'w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60';
      button.disabled = this.isLoading;
      button.textContent = this.loadMoreError
        ? 'Retry load more'
        : this.isLoading
          ? 'Loading...'
          : 'Load more';
      button.addEventListener('click', () => this.loadMore());
      this.footer.appendChild(button);
      return;
    }

    const summary = document.createElement('div');
    summary.className = 'px-1 text-[11px] text-gray-400';
    summary.textContent = `Loaded ${this.items.length} goals`;
    this.footer.appendChild(summary);
  }

  private maybeAutoLoadMore(): void {
    if (!this.list || this.isLoading || !this.hasMore || this.loadMoreError) {
      return;
    }
    const remaining =
      this.list.scrollHeight - this.list.scrollTop - this.list.clientHeight;
    if (remaining <= 48) {
      this.loadMore();
    }
  }

  private renderMessage(message: string): void {
    if (!this.list) return;
    this.list.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'px-1 py-2 text-xs text-gray-500';
    row.textContent = message;
    this.list.appendChild(row);
  }

  private formatEnum(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return 'Unknown';
    }
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private truncateDescription(value: unknown, maxLength: number = 120): string {
    if (typeof value !== 'string') return '';
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}...`;
  }

  private getUpdatedAtLabel(goal: Goal): string | null {
    const raw = (goal as Goal & { updated_at?: unknown }).updated_at;
    if (raw === undefined || raw === null) return null;
    const date =
      raw instanceof Date ? raw : new Date(typeof raw === 'string' ? raw : '');
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }
}
