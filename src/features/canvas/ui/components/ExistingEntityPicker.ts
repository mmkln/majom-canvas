import type { Observable, Subscription } from 'rxjs';
import {
  EXISTING_PICKER_EVENT_NAMES,
  emitExistingPickerDragMoved,
  emitExistingPickerDragStateChanged,
  type ExistingPickerDropCompletedDetail,
  type ExistingPickerKind,
} from '../events/existingPickerEvents.ts';
import {
  createDivider,
  createIconButton,
  createInputBase,
  createSurface,
  createTextButton,
} from '../primitives/index.ts';
import { OverlayController } from '../../../../ui-lib/src/services/OverlayController.ts';

export type ExistingPickerPage<TItem> = {
  items: TItem[];
  hasMore: boolean;
};

export type ExistingEntityPickerOpenOptions<TItem> = {
  sceneX: number;
  sceneY: number;
  onPick: (item: TItem, sceneX: number, sceneY: number) => void;
  isOnCanvas: (item: TItem) => boolean;
};

type ExistingEntityPickerConfig<TItem> = {
  drawerTitle: string;
  searchPlaceholder: string;
  itemLabel: string;
  dragKind: ExistingPickerKind;
  getTitle: (item: TItem) => string;
  getDescription?: (item: TItem) => string | null | undefined;
  getStatus?: (item: TItem) => unknown;
  getStatusLabel?: (status: unknown, item: TItem) => string;
  getStatusPalette?: (status: unknown, item: TItem) => string;
  getPriority?: (item: TItem) => unknown;
  getUpdatedAt?: (item: TItem) => unknown;
  onCanvasLabel?: string;
  addLabel?: string;
  findLabel?: string;
};

export class ExistingEntityPicker<TItem> {
  private backdrop: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private header: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private list: HTMLDivElement | null = null;
  private footerDivider: HTMLDivElement | null = null;
  private footer: HTMLDivElement | null = null;
  private compactPanel: HTMLDivElement | null = null;
  private listScrollHandler: ((event: Event) => void) | null = null;
  private dropCompletedHandler: ((event: Event) => void) | null = null;
  private backdropCloseHandler: ((event: MouseEvent) => void) | null = null;
  private searchDebounce: number | null = null;
  private loadSubscription: Subscription | null = null;
  private requestToken = 0;
  private isLoading = false;
  private loadMoreError = false;
  private currentTerm = '';
  private currentPage = 0;
  private hasMore = false;
  private items: TItem[] = [];
  private activeOptions: ExistingEntityPickerOpenOptions<TItem> | null = null;
  private pickerDragActive = false;
  private pendingDropCompleted = false;
  private viewMode: 'full' | 'mini' = 'full';
  private suppressPickUntilTs = 0;
  private mobilePresentation = false;
  private readonly pickSuppressionMs = 180;
  private readonly overlayController = new OverlayController({
    intent: 'picker',
    source: 'ExistingEntityPicker',
  });

  constructor(
    private readonly loadItemsPage: (
      term: string,
      page: number,
      pageSize: number
    ) => Observable<ExistingPickerPage<TItem>>,
    private readonly config: ExistingEntityPickerConfig<TItem>,
    private readonly pageSize: number = 30
  ) {}

  public open(options: ExistingEntityPickerOpenOptions<TItem>): void {
    this.close();
    this.activeOptions = options;
    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const presentation = this.overlayController.resolvePresentation();
    this.mobilePresentation = presentation !== 'dialog';
    this.overlayController.open({
      presentation,
      registerInService: this.mobilePresentation,
      blocking: true,
      dismissOnBackdrop: true,
      dismissOnEscape: true,
      restoreFocusTo: previousActiveElement,
    });

    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 bg-slate-950/10';
    backdrop.style.zIndex = '55';
    backdrop.style.pointerEvents = this.mobilePresentation ? 'auto' : 'none';

    const container = createSurface({
      elevated: true,
      className: this.mobilePresentation
        ? 'fixed inset-x-0 bottom-0 top-auto h-[min(86dvh,44rem)] w-full rounded-none rounded-t-2xl p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm text-slate-700'
        : 'fixed right-0 top-0 h-full w-[520px] max-w-[96vw] rounded-none rounded-l-2xl p-3 text-sm text-slate-700',
    });
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0';
    container.style.zIndex = '60';
    container.style.transition = 'width 140ms ease, padding 140ms ease';
    container.setAttribute('aria-label', this.config.drawerTitle);
    if (this.mobilePresentation) {
      container.setAttribute('role', 'dialog');
      container.setAttribute('aria-modal', 'true');
    } else {
      container.setAttribute('role', 'complementary');
      container.removeAttribute('aria-modal');
    }
    container.tabIndex = 0;

    const header = document.createElement('div');
    header.className = 'mb-2 flex items-center justify-between gap-2 px-1';
    const title = document.createElement('div');
    title.className = 'truncate text-sm font-semibold text-slate-900';
    title.textContent = this.config.drawerTitle;

    const closeBtn = createIconButton({
      icon: 'x-mark',
      size: 'sm',
      tone: 'text',
      title: 'Close',
      ariaLabel: 'Close picker',
    });
    closeBtn.addEventListener('click', () => this.close());
    header.append(title, closeBtn);

    const searchInput = createInputBase({
      type: 'search',
      placeholder: this.config.searchPlaceholder,
      className: 'mb-2 h-10',
    });

    const list = document.createElement('div');
    list.className = 'min-h-0 flex-1 overflow-auto pr-1';

    const footerDivider = createDivider({ inset: false, tone: 'soft' });
    const footer = document.createElement('div');
    footer.className = 'pt-2';

    const compactPanel = document.createElement('div');
    compactPanel.className =
      'hidden h-full flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center';
    compactPanel.style.display = 'none';
    const compactTitle = document.createElement('div');
    compactTitle.className =
      'text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500';
    compactTitle.textContent = 'Picker minimized';
    const compactHint = document.createElement('div');
    compactHint.className = 'text-[11px] text-slate-500';
    compactHint.textContent = `Drop ${this.config.itemLabel.toLowerCase()} on canvas`;
    const expandBtn = createTextButton({
      text: 'Expand',
      tone: 'soft',
      className: 'px-2 py-1 text-[11px] font-medium',
    });
    expandBtn.addEventListener('click', () => this.setViewMode('full'));
    compactPanel.append(compactTitle, compactHint, expandBtn);

    const containerParts: HTMLElement[] = [];
    if (this.mobilePresentation) {
      const grabber = document.createElement('div');
      grabber.className =
        'mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-300/90';
      grabber.setAttribute('aria-hidden', 'true');
      containerParts.push(grabber);
    }
    containerParts.push(header, searchInput, footerDivider, list, footer, compactPanel);
    container.append(...containerParts);
    document.body.appendChild(backdrop);
    document.body.appendChild(container);
    if (this.mobilePresentation) {
      this.backdropCloseHandler = (event: MouseEvent) => {
        if (event.target !== backdrop) return;
        this.close();
      };
      backdrop.addEventListener('click', this.backdropCloseHandler);
    }

    this.backdrop = backdrop;
    this.container = container;
    this.header = header;
    this.searchInput = searchInput;
    this.list = list;
    this.footerDivider = footerDivider;
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
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      this.close();
    });

    this.dropCompletedHandler = (event: Event) => {
      const customEvent =
        event as CustomEvent<ExistingPickerDropCompletedDetail>;
      if (customEvent.detail?.kind !== this.config.dragKind) return;
      this.pendingDropCompleted = true;
      if (!this.pickerDragActive) {
        this.pendingDropCompleted = false;
        this.setViewMode('full');
      }
    };
    window.addEventListener(
      EXISTING_PICKER_EVENT_NAMES.dropCompleted,
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
        EXISTING_PICKER_EVENT_NAMES.dropCompleted,
        this.dropCompletedHandler
      );
      this.dropCompletedHandler = null;
    }
    if (this.backdrop && this.backdropCloseHandler) {
      this.backdrop.removeEventListener('click', this.backdropCloseHandler);
      this.backdropCloseHandler = null;
    }
    this.overlayController.close();
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
    this.footerDivider = null;
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
    this.mobilePresentation = false;
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
    this.loadSubscription = this.loadItemsPage(
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
        this.renderItems();
        this.renderFooter();
        this.maybeAutoLoadMore();
      },
      error: () => {
        if (token !== this.requestToken || !this.container) return;
        this.isLoading = false;
        this.loadMoreError = true;
        if (!append) {
          this.renderMessage('Failed to load items');
        }
        this.renderFooter();
      },
    });
  }

  private loadMore(): void {
    if (this.isLoading || !this.hasMore) return;
    this.fetchPage(this.currentPage + 1, true);
  }

  private renderItems(): void {
    if (!this.list || !this.activeOptions) return;
    this.list.innerHTML = '';
    if (this.items.length === 0) {
      this.renderMessage('No items found');
      return;
    }
    this.items.forEach((item) => {
      const onCanvas = this.activeOptions?.isOnCanvas(item) ?? false;
      const row = document.createElement('div');
      row.className =
        'mb-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200';
      if (onCanvas) {
        row.classList.remove(
          'border-slate-200',
          'bg-white',
          'hover:bg-slate-50'
        );
        row.classList.add(
          'border-emerald-200',
          'bg-emerald-50/60',
          'hover:bg-emerald-50'
        );
      }
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      row.draggable = true;

      const handlePick = (force: boolean = false): void => {
        if (!force && this.shouldSuppressPick()) return;
        this.activeOptions?.onPick(
          item,
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
            kind: this.config.dragKind,
            item,
          })
        );
        dataTransfer.setData(
          'text/plain',
          this.config.getTitle(item) || this.config.itemLabel
        );
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
      title.className =
        'truncate text-[14px] font-semibold leading-5 text-slate-900';
      title.textContent =
        this.config.getTitle(item) ||
        `Untitled ${this.config.itemLabel.toLowerCase()}`;
      textWrap.appendChild(title);

      if (onCanvas) {
        const badge = document.createElement('span');
        badge.className =
          'mt-0.5 inline-flex w-fit rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-emerald-700';
        badge.textContent = this.config.onCanvasLabel ?? 'On canvas';
        textWrap.appendChild(badge);
      }

      const actionBtn = createTextButton({
        text: onCanvas
          ? (this.config.findLabel ?? 'Find')
          : (this.config.addLabel ?? 'Add'),
        tone: onCanvas ? 'text' : 'soft',
        className: 'h-7 px-2 py-1 text-xs font-medium',
      });
      actionBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        handlePick(true);
      });

      topRow.append(textWrap, actionBtn);

      const meta = document.createElement('div');
      meta.className =
        'mt-1 flex items-center gap-2 overflow-hidden text-[11px] text-slate-500';

      const statusValue = this.config.getStatus?.(item);
      if (statusValue !== undefined && statusValue !== null) {
        const statusChip = this.createChip(
          this.config.getStatusLabel?.(statusValue, item) ??
            this.formatEnum(statusValue),
          this.config.getStatusPalette?.(statusValue, item) ??
            this.getStatusChipPalette(statusValue)
        );
        meta.append(statusChip);
      }
      const priorityValue = this.config.getPriority?.(item);
      if (priorityValue !== undefined && priorityValue !== null) {
        const priorityChip = this.createChip(
          this.formatEnum(priorityValue),
          this.getPriorityChipPalette(priorityValue)
        );
        meta.append(priorityChip);
      }
      const updatedAtValue = this.config.getUpdatedAt?.(item);
      const updatedAt = this.getUpdatedAtLabel(updatedAtValue);
      if (updatedAt) {
        const updated = document.createElement('span');
        updated.className = 'truncate text-[11px] text-slate-500';
        updated.textContent = `Updated ${updatedAt}`;
        meta.appendChild(updated);
      }

      row.append(topRow);
      if (meta.childNodes.length > 0) {
        row.append(meta);
      }

      const shortDescription = this.truncateDescription(
        this.config.getDescription?.(item)
      );
      if (shortDescription.length > 0) {
        const description = document.createElement('div');
        description.className = 'mt-1 truncate text-xs text-slate-600';
        description.textContent = shortDescription;
        row.appendChild(description);
      }

      this.list.appendChild(row);
    });
  }

  private renderFooter(): void {
    if (!this.footer || !this.activeOptions) return;
    this.footer.innerHTML = '';
    if (this.footerDivider) {
      this.footerDivider.style.display = 'none';
    }
    if (this.items.length === 0 && !this.hasMore && !this.loadMoreError) {
      return;
    }

    if (this.hasMore || this.loadMoreError) {
      if (!this.loadMoreError) {
        const hint = document.createElement('div');
        hint.className = 'px-1 text-[11px] text-slate-400';
        hint.textContent = this.isLoading
          ? 'Loading more...'
          : 'Scroll down to load more';
        this.footer.appendChild(hint);
        if (this.footerDivider) {
          this.footerDivider.style.display = '';
        }
        return;
      }
      const retryBtn = createTextButton({
        text: this.loadMoreError ? 'Retry load more' : 'Load more',
        tone: 'soft',
        disabled: this.isLoading,
        className: 'w-full justify-center px-2 py-1 text-xs',
        onClick: () => this.loadMore(),
      });
      this.footer.appendChild(retryBtn);
      if (this.footerDivider) {
        this.footerDivider.style.display = '';
      }
      return;
    }

    const summary = document.createElement('div');
    summary.className = 'px-1 text-[11px] text-slate-400';
    summary.textContent = `Loaded ${this.items.length} items`;
    this.footer.appendChild(summary);
    if (this.footerDivider) {
      this.footerDivider.style.display = '';
    }
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
    row.className = 'px-1 py-4 text-center text-xs text-slate-500';
    row.textContent = message;
    this.list.appendChild(row);
  }

  private createChip(label: string, palette: string): HTMLSpanElement {
    const chip = document.createElement('span');
    chip.className =
      `inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${palette}`.trim();
    chip.textContent = label;
    return chip;
  }

  private getStatusChipPalette(status: unknown): string {
    const normalized = this.normalizeChipValue(status);
    if (
      normalized.includes('completed') ||
      normalized.includes('done') ||
      normalized.includes('archived')
    ) {
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }
    if (
      normalized.includes('active') ||
      normalized.includes('in progress') ||
      normalized.includes('progress')
    ) {
      return 'border-blue-200 bg-blue-100 text-blue-700';
    }
    if (normalized.includes('pending') || normalized.includes('described')) {
      return 'border-yellow-200 bg-yellow-100 text-yellow-700';
    }
    if (normalized.includes('cancelled') || normalized.includes('canceled')) {
      return 'border-amber-200 bg-amber-100 text-amber-700';
    }
    return 'border-slate-200 bg-slate-100 text-slate-600';
  }

  private getPriorityChipPalette(priority: unknown): string {
    const normalized = this.normalizeChipValue(priority);
    if (normalized === 'highest') {
      return 'border-rose-300 bg-rose-100 text-rose-800';
    }
    if (normalized === 'high') {
      return 'border-rose-200 bg-rose-100 text-rose-700';
    }
    if (normalized === 'medium') {
      return 'border-orange-200 bg-orange-100 text-orange-700';
    }
    if (normalized === 'low') {
      return 'border-emerald-200 bg-emerald-100 text-emerald-700';
    }
    if (normalized === 'lowest') {
      return 'border-teal-200 bg-teal-100 text-teal-700';
    }
    return 'border-slate-200 bg-slate-100 text-slate-600';
  }

  private normalizeChipValue(value: unknown): string {
    return typeof value === 'string'
      ? value.trim().toLowerCase().replace(/[_-]+/g, ' ')
      : '';
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

  private truncateDescription(
    value: string | null | undefined,
    maxLength: number = 120
  ): string {
    if (typeof value !== 'string') return '';
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}...`;
  }

  private getUpdatedAtLabel(raw: unknown): string | null {
    if (raw === undefined || raw === null) return null;
    const date =
      raw instanceof Date
        ? raw
        : new Date(
            typeof raw === 'string' || typeof raw === 'number' ? raw : ''
          );
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  private emitDragState(active: boolean): void {
    emitExistingPickerDragStateChanged(this.config.dragKind, active);
  }

  private emitDragMove(clientX: number, clientY: number): void {
    emitExistingPickerDragMoved(this.config.dragKind, clientX, clientY);
  }

  private shouldSuppressPick(): boolean {
    return (
      this.pickerDragActive || performance.now() < this.suppressPickUntilTs
    );
  }

  private setViewMode(mode: 'full' | 'mini'): void {
    if (this.mobilePresentation && mode === 'mini') {
      mode = 'full';
    }
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
      if (this.footerDivider) {
        this.footerDivider.style.display = 'none';
      }
      this.list.style.display = 'none';
      this.footer.style.display = 'none';
      this.compactPanel.style.display = 'flex';
      if (this.backdrop) {
        this.backdrop.style.background = 'rgba(15, 23, 42, 0.06)';
      }
      return;
    }

    this.container.style.width = '';
    this.container.style.padding = '16px 14px 12px 14px';
    this.header.style.display = '';
    this.searchInput.style.display = '';
    if (this.footerDivider) {
      this.footerDivider.style.display = '';
    }
    this.list.style.display = '';
    this.footer.style.display = '';
    this.compactPanel.style.display = 'none';
    if (this.backdrop) {
      this.backdrop.style.background = '';
    }
  }
}
