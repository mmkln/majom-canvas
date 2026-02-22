import type { Observable, Subscription } from 'rxjs';
import type { Goal } from '../../majom-wrapper/interfaces/index.ts';
import {
  EXISTING_GOAL_EVENT_NAMES,
  emitExistingGoalDragMoved,
  emitExistingGoalDragStateChanged,
  type ExistingGoalDropCompletedDetail,
} from '../events/existingGoalEvents.ts';

type GoalPage = {
  items: Goal[];
  hasMore: boolean;
};

type OpenOptions = {
  sceneX: number;
  sceneY: number;
  onPick: (goal: Goal, sceneX: number, sceneY: number) => void;
  isOnCanvas: (goal: Goal) => boolean;
};

export class ExistingGoalPicker {
  private backdrop: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private list: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private compactPanel: HTMLDivElement | null = null;
  private listScrollHandler: ((event: Event) => void) | null = null;
  private dropCompletedHandler: ((event: Event) => void) | null = null;
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
  private pickerDragActive = false;
  private pendingDropCompleted = false;
  private viewMode: 'full' | 'mini' = 'full';
  private suppressPickUntilTs = 0;
  private readonly pickSuppressionMs = 180;

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

    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-black/12';
    backdrop.style.zIndex = '55';
    backdrop.style.pointerEvents = 'none';

    const container = document.createElement('div');
    container.className =
      'fixed right-0 top-0 h-full w-[520px] max-w-[96vw] border-l border-gray-200 bg-white shadow-2xl text-sm text-gray-800';
    container.style.padding = '16px 14px 12px 14px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0';
    container.style.zIndex = '60';
    container.style.transition = 'width 140ms ease, padding 140ms ease';

    const header = document.createElement('div');
    header.className = 'mb-3 flex items-center justify-between';
    const title = document.createElement('div');
    title.className = 'text-base font-semibold text-gray-900';
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
      'mb-3 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none';

    const list = document.createElement('div');
    list.className = 'min-h-0 flex-1 overflow-auto pr-1';

    const footer = document.createElement('div');
    footer.className = 'border-t border-gray-100 pt-2';

    const compactPanel = document.createElement('div');
    compactPanel.className =
      'hidden h-full flex-col items-center justify-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-3 text-center';
    compactPanel.style.display = 'none';
    const compactTitle = document.createElement('div');
    compactTitle.className =
      'text-[10px] font-semibold uppercase tracking-wide text-gray-600';
    compactTitle.textContent = 'Picker minimized';
    const compactHint = document.createElement('div');
    compactHint.className = 'text-[10px] text-gray-500';
    compactHint.textContent = 'Drop on canvas';
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className =
      'rounded border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-100';
    expandBtn.textContent = 'Expand';
    expandBtn.addEventListener('click', () => this.setViewMode('full'));
    compactPanel.append(compactTitle, compactHint, expandBtn);

    container.append(header, searchInput, list, footer, compactPanel);
    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    this.backdrop = backdrop;
    this.container = container;
    this.header = header;
    this.searchInput = searchInput;
    this.list = list;
    this.footer = footer;
    this.compactPanel = compactPanel;
    this.listScrollHandler = () => this.maybeAutoLoadMore();
    this.list.addEventListener('scroll', this.listScrollHandler);
    this.pendingDropCompleted = false;
    this.setViewMode('full');

    searchInput.addEventListener('input', () => {
      if (this.searchDebounce !== null) {
        window.clearTimeout(this.searchDebounce);
      }
      this.searchDebounce = window.setTimeout(() => {
        this.resetAndLoad(searchInput.value.trim());
      }, 250);
    });

    this.resetAndLoad('');
    searchInput.focus();

    this.dropCompletedHandler = (event: Event) => {
      const customEvent = event as CustomEvent<ExistingGoalDropCompletedDetail>;
      if (customEvent.detail?.kind !== 'existing-goal') return;
      this.pendingDropCompleted = true;
      if (!this.pickerDragActive) {
        this.pendingDropCompleted = false;
        this.setViewMode('full');
      }
    };
    window.addEventListener(
      EXISTING_GOAL_EVENT_NAMES.dropCompleted,
      this.dropCompletedHandler
    );
  }

  public close(): void {
    if (this.searchDebounce !== null) {
      window.clearTimeout(this.searchDebounce);
      this.searchDebounce = null;
    }
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
    if (this.dropCompletedHandler) {
      window.removeEventListener(
        EXISTING_GOAL_EVENT_NAMES.dropCompleted,
        this.dropCompletedHandler
      );
      this.dropCompletedHandler = null;
    }
    if (this.pickerDragActive) {
      this.pickerDragActive = false;
      this.emitDragState(false);
    }
    this.pendingDropCompleted = false;
    this.setViewMode('full');
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    if (this.backdrop) {
      this.backdrop.remove();
      this.backdrop = null;
    }
    if (this.list && this.listScrollHandler) {
      this.list.removeEventListener('scroll', this.listScrollHandler);
    }
    this.header = null;
    this.searchInput = null;
    this.list = null;
    this.footer = null;
    this.compactPanel = null;
    this.listScrollHandler = null;
    this.activeOptions = null;
    this.items = [];
    this.currentPage = 0;
    this.hasMore = false;
    this.currentTerm = '';
    this.isLoading = false;
    this.loadMoreError = false;
    this.suppressPickUntilTs = 0;
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
        'mb-2 cursor-pointer rounded-lg border px-3 py-2 transition-colors hover:bg-gray-50';
      row.style.borderColor = onCanvas ? '#bbf7d0' : '#e5e7eb';
      row.style.background = onCanvas ? '#f0fdf4' : '#ffffff';
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.draggable = true;

      const handlePick = (force: boolean = false): void => {
        if (!force && this.shouldSuppressPick()) return;
        this.activeOptions?.onPick(
          goal,
          this.activeOptions.sceneX,
          this.activeOptions.sceneY
        );
      };

      row.addEventListener('click', handlePick);
      row.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handlePick(true);
      });
      row.addEventListener('dragstart', (event: DragEvent) => {
        const dataTransfer = event.dataTransfer;
        if (!dataTransfer) return;
        this.pickerDragActive = true;
        this.pendingDropCompleted = false;
        this.suppressPickUntilTs = performance.now() + this.pickSuppressionMs;
        requestAnimationFrame(() => {
          if (this.pickerDragActive) {
            this.setViewMode('mini');
          }
        });
        this.emitDragState(true);
        dataTransfer.effectAllowed = 'copy';
        dataTransfer.setData(
          'application/json',
          JSON.stringify({
            kind: 'existing-goal',
            goal,
          })
        );
        dataTransfer.setData('text/plain', goal.title || 'Goal');
      });
      row.addEventListener('drag', (event: DragEvent) => {
        if (!this.pickerDragActive) return;
        if (event.clientX === 0 && event.clientY === 0) return;
        this.emitDragMove(event.clientX, event.clientY);
      });
      row.addEventListener('dragend', () => {
        if (!this.pickerDragActive) return;
        this.pickerDragActive = false;
        this.suppressPickUntilTs = performance.now() + this.pickSuppressionMs;
        this.emitDragState(false);
        if (this.pendingDropCompleted) {
          this.pendingDropCompleted = false;
          this.setViewMode('full');
        } else {
          this.setViewMode('mini');
        }
      });

      const topRow = document.createElement('div');
      topRow.className = 'flex items-start justify-between gap-2';

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';
      const title = document.createElement('div');
      title.className = 'truncate text-[15px] font-semibold leading-5 text-gray-900';
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
        'shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100';
      actionBtn.textContent = onCanvas ? 'Find' : 'Add';
      actionBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        handlePick(true);
      });

      topRow.append(textWrap, actionBtn);

      const meta = document.createElement('div');
      meta.className =
        'mt-1 flex items-center gap-2 overflow-hidden text-[11px] text-gray-500';
      const statusChip = this.createChip(
        this.formatEnum(goal.status),
        this.getStatusChipPalette(goal.status)
      );
      const priorityChip = this.createChip(
        this.formatEnum(goal.priority),
        this.getPriorityChipPalette(goal.priority)
      );
      meta.append(statusChip, priorityChip);
      const updatedAt = this.getUpdatedAtLabel(goal);
      if (updatedAt) {
        const updated = document.createElement('span');
        updated.className = 'truncate text-[11px] text-gray-500';
        updated.textContent = `Updated ${updatedAt}`;
        meta.appendChild(updated);
      }

      row.append(topRow, meta);

      const shortDescription = this.truncateDescription(goal.description);
      if (shortDescription.length > 0) {
        const description = document.createElement('div');
        description.className = 'mt-1 truncate text-xs text-gray-600';
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
    row.className = 'px-1 py-4 text-center text-xs text-gray-500';
    row.textContent = message;
    this.list.appendChild(row);
  }

  private createChip(
    label: string,
    palette: { bg: string; border: string; text: string }
  ): HTMLSpanElement {
    const chip = document.createElement('span');
    chip.className =
      'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
    chip.textContent = label;
    chip.style.background = palette.bg;
    chip.style.borderColor = palette.border;
    chip.style.color = palette.text;
    return chip;
  }

  private getStatusChipPalette(status: unknown): {
    bg: string;
    border: string;
    text: string;
  } {
    const normalized = typeof status === 'string' ? status.toLowerCase() : '';
    if (normalized.includes('done')) {
      return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
    }
    if (normalized.includes('progress')) {
      return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
    }
    if (normalized.includes('pending')) {
      return { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' };
    }
    return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
  }

  private getPriorityChipPalette(priority: unknown): {
    bg: string;
    border: string;
    text: string;
  } {
    const normalized =
      typeof priority === 'string' ? priority.toLowerCase() : '';
    if (normalized === 'high') {
      return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' };
    }
    if (normalized === 'medium') {
      return { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' };
    }
    if (normalized === 'low') {
      return { bg: '#dcfce7', border: '#86efac', text: '#166534' };
    }
    return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
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

  private emitDragState(active: boolean): void {
    emitExistingGoalDragStateChanged(active);
  }

  private emitDragMove(clientX: number, clientY: number): void {
    emitExistingGoalDragMoved(clientX, clientY);
  }

  private shouldSuppressPick(): boolean {
    return this.pickerDragActive || performance.now() < this.suppressPickUntilTs;
  }

  private setViewMode(mode: 'full' | 'mini'): void {
    this.viewMode = mode;
    if (
      !this.container ||
      !this.header ||
      !this.searchInput ||
      !this.list ||
      !this.footer ||
      !this.compactPanel
    ) {
      return;
    }

    if (mode === 'mini') {
      this.container.style.width = '132px';
      this.container.style.padding = '12px 8px';
      this.header.style.display = 'none';
      this.searchInput.style.display = 'none';
      this.list.style.display = 'none';
      this.footer.style.display = 'none';
      this.compactPanel.style.display = 'flex';
      if (this.backdrop) {
        this.backdrop.style.background = 'rgba(17, 24, 39, 0.05)';
      }
      return;
    }

    this.container.style.width = '';
    this.container.style.padding = '16px 14px 12px 14px';
    this.header.style.display = '';
    this.searchInput.style.display = '';
    this.list.style.display = '';
    this.footer.style.display = '';
    this.compactPanel.style.display = 'none';
    if (this.backdrop) {
      this.backdrop.style.background = '';
    }
  }
}
