import { createInput } from '../hud/index.ts';
import {
  HUD_SELECTION_PANEL_HEADER_CLASS,
  HUD_SELECTION_PANEL_LIST_CLASS,
} from '../hud/classNames.ts';
import { DropdownSelectBase } from './DropdownSelectBase.ts';

export type SearchDropdownPage<T> = {
  items: T[];
  hasMore: boolean;
};

type SearchDropdownSelectOptions<T> = {
  size?: 'sm' | 'md';
  value?: T | null;
  placeholder: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  hintLabel: string;
  errorFallbackLabel: string;
  pageSize?: number;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  portalTarget?: HTMLElement;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
  loadPage: (
    term: string,
    page: number,
    pageSize: number
  ) => Promise<SearchDropdownPage<T>>;
  renderTriggerLeading?: (item: T | null) => HTMLElement | null;
  renderTriggerTrailing?: (item: T | null) => HTMLElement | null;
  renderOptionLeading?: (item: T) => HTMLElement | null;
  renderOptionTrailing?: (item: T, selected: boolean) => HTMLElement | null;
};

export class SearchDropdownSelect<T> {
  public readonly element: HTMLDivElement;

  private readonly base: DropdownSelectBase<T>;
  private readonly searchInput: ReturnType<typeof createInput>;
  private readonly pageSize: number;
  private searchTerm = '';
  private items: T[] = [];
  private loading = false;
  private loadingMore = false;
  private hasMore = false;
  private page = 0;
  private error: string | null = null;
  private requestToken = 0;
  private searchTimer: number | null = null;

  constructor(private readonly options: SearchDropdownSelectOptions<T>) {
    this.pageSize = options.pageSize ?? 20;

    this.base = new DropdownSelectBase({
      size: options.size,
      value: options.value,
      placeholder: options.placeholder,
      getKey: options.getKey,
      getLabel: options.getLabel,
      onSelect: options.onSelect,
      className: options.className,
      disabled: options.disabled,
      ariaLabel: options.ariaLabel,
      portalTarget: options.portalTarget,
      renderTriggerLeading: options.renderTriggerLeading,
      renderTriggerTrailing: options.renderTriggerTrailing,
      renderOptionLeading: options.renderOptionLeading,
      renderOptionTrailing: options.renderOptionTrailing,
      onOpenChange: (open) => {
        if (!open) return;
        window.setTimeout(() => this.searchInput.focus(), 0);
        if (this.page === 0 && !this.loading) {
          this.queueSearch();
        }
      },
    });
    this.element = this.base.element;

    this.searchInput = createInput({
      type: 'search',
      placeholder: options.searchPlaceholder,
      searchClearButton: true,
      searchClearLabel: options.clearSearchLabel,
      value: '',
      onInput: (value) => {
        this.searchTerm = value;
        this.queueSearch();
      },
    });
    const searchWrap = document.createElement('div');
    searchWrap.className = HUD_SELECTION_PANEL_HEADER_CLASS;
    this.searchInput.element.classList.add('!shadow-none');
    searchWrap.appendChild(this.searchInput.element);
    this.base.setPanelHeader(searchWrap);
    this.base.contentElement.classList.add(
      ...HUD_SELECTION_PANEL_LIST_CLASS.split(' ')
    );
    this.base.contentElement.addEventListener('scroll', () => {
      const remaining =
        this.base.contentElement.scrollHeight -
        this.base.contentElement.scrollTop -
        this.base.contentElement.clientHeight;
      if (remaining < 80) {
        void this.loadMore();
      }
    });

    this.syncState();
  }

  public setSelected(value: T | null): void {
    this.base.setSelected(value);
  }

  public setDisabled(disabled: boolean): void {
    this.base.setDisabled(disabled);
  }

  public destroy(): void {
    if (this.searchTimer !== null) {
      window.clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.requestToken += 1;
    this.base.destroy();
  }

  private queueSearch(): void {
    if (this.searchTimer !== null) {
      window.clearTimeout(this.searchTimer);
    }
    this.loading = true;
    this.loadingMore = false;
    this.error = null;
    this.page = 0;
    this.hasMore = false;
    this.syncState();

    const token = ++this.requestToken;
    this.searchTimer = window.setTimeout(async () => {
      try {
        const result = await this.options.loadPage(
          this.searchTerm.trim(),
          1,
          this.pageSize
        );
        if (token !== this.requestToken) return;
        this.items = result.items;
        this.page = 1;
        this.hasMore = result.hasMore;
        this.error = null;
      } catch (error) {
        if (token !== this.requestToken) return;
        this.items = [];
        this.error =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : this.options.errorFallbackLabel;
      } finally {
        if (token !== this.requestToken) return;
        this.loading = false;
        this.loadingMore = false;
        this.syncState();
      }
    }, 180);
  }

  private async loadMore(): Promise<void> {
    if (this.loading || this.loadingMore || !this.hasMore) return;
    this.loadingMore = true;
    this.syncState();
    const token = ++this.requestToken;
    try {
      const result = await this.options.loadPage(
        this.searchTerm.trim(),
        this.page + 1,
        this.pageSize
      );
      if (token !== this.requestToken) return;
      this.items = [...this.items, ...result.items];
      this.page += 1;
      this.hasMore = result.hasMore;
      this.error = null;
    } catch (error) {
      if (token !== this.requestToken) return;
      this.error =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : this.options.errorFallbackLabel;
    } finally {
      if (token !== this.requestToken) return;
      this.loadingMore = false;
      this.syncState();
    }
  }

  private syncState(): void {
    this.base.setItems(this.items);
    if (this.loading && this.page === 0) {
      this.base.setStateMessage(this.options.loadingLabel);
      return;
    }
    if (this.error) {
      this.base.setStateMessage(this.error, 'error');
      return;
    }
    if (this.items.length === 0) {
      this.base.setStateMessage(
        this.searchTerm.trim().length === 0
          ? this.options.hintLabel
          : this.options.emptyLabel
      );
      return;
    }
    if (this.loadingMore) {
      this.base.setStateMessage(this.options.loadingLabel);
      return;
    }
    this.base.setStateMessage(null);
  }
}
