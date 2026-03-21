import type { Observable, Subscription } from 'rxjs';
import {
  EXISTING_PICKER_EVENT_NAMES,
  emitExistingPickerDragEnded,
  emitExistingPickerDragMoved,
  emitExistingPickerDragStarted,
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
import { createIcon, type IconName } from '../icons.ts';
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
  canvasChanges?: Observable<unknown>;
};

type ExistingEntityPickerConfig<TItem> = {
  drawerTitle: string;
  searchPlaceholder: string;
  itemLabel: string;
  dragKind: ExistingPickerKind;
  getTitle: (item: TItem) => string;
  getDescription?: (item: TItem) => string | null | undefined;
  getStatus?: (item: TItem) => unknown;
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
  private canvasChangesSubscription: Subscription | null = null;
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
  private activePointerDrag:
    | {
        item: TItem;
        title: string;
        pointerId: number;
        started: boolean;
        lastClientX: number;
        lastClientY: number;
        cleanup: () => void;
      }
    | null = null;
  private readonly pickSuppressionMs = 180;
  private readonly dragStartThresholdPx = 6;
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
        ? 'fixed inset-x-0 bottom-0 top-auto h-[min(86dvh,44rem)] w-full rounded-none rounded-t-[1.75rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-slate-700'
        : 'fixed right-0 top-0 h-full w-[540px] max-w-[96vw] rounded-none rounded-l-[1.75rem] p-4 text-sm text-slate-700',
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
    header.className = 'mb-4 flex items-start justify-between gap-3';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'min-w-0 flex-1';
    const title = document.createElement('div');
    title.className = 'truncate text-[20px] font-semibold leading-7 text-slate-950';
    title.textContent = 'Add to canvas';
    const subtitle = document.createElement('div');
    subtitle.className = 'mt-1.5 text-[12px] leading-5 text-slate-500';
    subtitle.textContent = this.getDrawerSubtitle();
    titleWrap.append(title, subtitle);

    const closeBtn = createIconButton({
      icon: 'x-mark',
      size: 'sm',
      tone: 'text',
      title: 'Close',
      ariaLabel: 'Close picker',
    });
    closeBtn.addEventListener('click', () => this.close());
    header.append(titleWrap, closeBtn);

    const searchInput = createInputBase({
      type: 'search',
      placeholder: this.config.searchPlaceholder,
      className:
        'mb-2 h-11 rounded-xl border-slate-200 bg-slate-50/80 px-4 text-[14px] shadow-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white',
    });

    const list = document.createElement('div');
    list.className = 'min-h-0 flex-1 overflow-auto pr-1';

    const footerDivider = createDivider({ inset: false, tone: 'soft' });
    const footer = document.createElement('div');
    footer.className = 'pt-3';

    const compactPanel = document.createElement('div');
    compactPanel.className =
      'hidden h-full flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-slate-50 px-3 py-4 text-center';
    compactPanel.style.display = 'none';
    const compactTitle = document.createElement('div');
    compactTitle.className =
      'text-[11px] font-medium tracking-[0.01em] text-slate-600';
    compactTitle.textContent = 'Placing on canvas';
    const compactHint = document.createElement('div');
    compactHint.className = 'max-w-[12rem] text-[11px] leading-4 text-slate-500';
    compactHint.textContent = `Drop the ${this.config.itemLabel.toLowerCase()} where you want it to appear.`;
    const expandBtn = createTextButton({
      text: 'Back to list',
      tone: 'soft',
      className: 'px-3 py-1.5 text-[11px] font-medium',
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
    containerParts.push(
      header,
      searchInput,
      footerDivider,
      list,
      footer,
      compactPanel
    );
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
    this.canvasChangesSubscription = options.canvasChanges?.subscribe(() => {
      this.refreshRenderedItems();
    }) ?? null;

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
      this.refreshRenderedItems();
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
    this.canvasChangesSubscription?.unsubscribe();
    this.canvasChangesSubscription = null;
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
    if (this.activePointerDrag) {
      this.cancelActivePointerDrag();
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
      this.renderEmptyState();
      return;
    }
    this.items.forEach((item) => {
      const onCanvas = this.activeOptions?.isOnCanvas(item) ?? false;
      const row = document.createElement('div');
      row.className =
        'group mb-2 cursor-pointer rounded-2xl border border-transparent bg-slate-50/78 px-4 py-3 transition-all duration-150 hover:border-slate-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300';
      if (onCanvas) {
        row.classList.remove(
          'border-transparent',
          'bg-slate-50/78',
          'hover:border-slate-200',
          'hover:bg-white'
        );
        row.classList.add(
          'border-slate-200',
          'bg-slate-100/90',
          'hover:border-slate-300',
          'hover:bg-slate-100'
        );
      }
      row.setAttribute('role', 'button');
      row.tabIndex = 0;

      const handlePick = (force: boolean = false): void => {
        if (!force && this.shouldSuppressPick()) return;
        this.activeOptions?.onPick(
          item,
          this.activeOptions.sceneX,
          this.activeOptions.sceneY
        );
        this.refreshRenderedItems();
      };

      row.addEventListener('click', handlePick);
      row.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        handlePick(true);
      });
      row.addEventListener('pointerdown', (event: PointerEvent) => {
        this.beginPointerDrag(item, event);
      });

      const topRow = document.createElement('div');
      topRow.className = 'flex items-start justify-between gap-3';

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';
      const title = document.createElement('div');
      title.className =
        'truncate text-[15px] font-semibold leading-5 text-slate-950';
      title.textContent =
        this.config.getTitle(item) ||
        `Untitled ${this.config.itemLabel.toLowerCase()}`;
      textWrap.appendChild(title);

      if (onCanvas) {
        const statusLine = document.createElement('div');
        statusLine.className = 'mt-1 text-[11px] font-medium text-slate-500';
        statusLine.textContent = this.config.onCanvasLabel ?? 'Already on canvas';
        textWrap.appendChild(statusLine);
      }

      const actionBtn = createTextButton({
        text: onCanvas
          ? (this.config.findLabel ?? 'Find')
          : (this.config.addLabel ?? 'Add'),
        tone: onCanvas ? 'text' : 'soft',
        className:
          'h-8 shrink-0 rounded-full px-3 py-1 text-[11px] font-medium',
      });
      actionBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        handlePick(true);
      });

      topRow.append(textWrap, actionBtn);

      const meta = document.createElement('div');
      meta.className =
        'mt-2 flex flex-wrap items-center gap-2 overflow-hidden text-[11px] text-slate-500';

      const statusValue = this.config.getStatus?.(item);
      if (statusValue !== undefined && statusValue !== null) {
        const statusChip = this.createChip(
          this.formatEnum(statusValue),
          this.getStatusChipPalette(statusValue)
        );
        meta.append(statusChip);
      }
      const priorityValue = this.config.getPriority?.(item);
      if (priorityValue !== undefined && priorityValue !== null) {
        const priorityChip = this.createPriorityChip(priorityValue);
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
        description.className =
          'mt-2 truncate text-[12px] leading-5 text-slate-500';
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
    if (this.viewMode === 'mini') {
      return;
    }
    if (this.items.length === 0 && !this.hasMore && !this.loadMoreError) {
      return;
    }

    if (this.hasMore || this.loadMoreError) {
      if (!this.loadMoreError) {
        const hint = document.createElement('div');
        hint.className =
          'flex items-center justify-between gap-3 px-1 text-[11px] text-slate-400';
        const label = document.createElement('span');
        label.textContent = this.isLoading
          ? 'Loading more results...'
          : 'Scroll for more';
        const meta = document.createElement('span');
        meta.textContent = `${this.items.length} shown`;
        hint.append(label, meta);
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
    summary.className =
      'flex items-center justify-between gap-3 px-1 text-[11px] text-slate-400';
    const loaded = document.createElement('span');
    loaded.textContent = `${this.items.length} results`;
    const onCanvasCount = this.items.filter((item) =>
      this.activeOptions?.isOnCanvas(item)
    ).length;
    const state = document.createElement('span');
    state.textContent =
      onCanvasCount > 0 ? `${onCanvasCount} on canvas` : 'Ready to place';
    summary.append(loaded, state);
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
    row.className =
      'rounded-[1.25rem] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500';
    row.textContent = message;
    this.list.appendChild(row);
  }

  private renderEmptyState(): void {
    if (!this.list) return;
    this.list.innerHTML = '';
    const card = document.createElement('div');
    card.className =
      'rounded-[1.25rem] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500';
    const title = document.createElement('div');
    title.className = 'text-[14px] font-medium text-slate-700';
    title.textContent = this.currentTerm
      ? `No ${this.config.itemLabel.toLowerCase()}s found`
      : `No ${this.config.itemLabel.toLowerCase()}s to show`;
    const subtitle = document.createElement('div');
    subtitle.className = 'mt-2 text-[12px] leading-5 text-slate-500';
    subtitle.textContent = this.currentTerm
      ? `Try a different keyword or drag another ${this.config.itemLabel.toLowerCase()} onto the canvas.`
      : `Search existing ${this.config.itemLabel.toLowerCase()}s or add one directly from the canvas.`;
    card.append(title, subtitle);
    this.list.appendChild(card);
  }

  private refreshRenderedItems(): void {
    if (!this.container || !this.activeOptions) return;
    this.renderItems();
    this.renderFooter();
  }

  private beginPointerDrag(item: TItem, event: PointerEvent): void {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    if (this.activePointerDrag) return;

    const title = this.config.getTitle(item) || this.config.itemLabel;
    const dragState = {
      item,
      title,
      pointerId: event.pointerId,
      started: false,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      cleanup: () => undefined,
    };

    const cleanup = (): void => {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('pointerup', handlePointerUp, true);
      window.removeEventListener('pointercancel', handlePointerCancel, true);
      document.body.style.userSelect = '';
    };

    const handlePointerMove = (moveEvent: PointerEvent): void => {
      if (this.activePointerDrag !== dragState) return;
      if (moveEvent.pointerId !== dragState.pointerId) return;
      dragState.lastClientX = moveEvent.clientX;
      dragState.lastClientY = moveEvent.clientY;

      if (!dragState.started) {
        const dx = moveEvent.clientX - event.clientX;
        const dy = moveEvent.clientY - event.clientY;
        if (Math.hypot(dx, dy) < this.dragStartThresholdPx) {
          return;
        }
        dragState.started = true;
        this.startPickerDrag(dragState.item, dragState.title, moveEvent.clientX, moveEvent.clientY);
      }

      moveEvent.preventDefault();
      this.emitDragMove(moveEvent.clientX, moveEvent.clientY);
    };

    const finishPointerDrag = (
      endEvent: PointerEvent,
      cancelled: boolean
    ): void => {
      if (this.activePointerDrag !== dragState) return;
      if (endEvent.pointerId !== dragState.pointerId) return;
      dragState.lastClientX = endEvent.clientX;
      dragState.lastClientY = endEvent.clientY;
      this.activePointerDrag = null;
      cleanup();
      if (!dragState.started) return;
      endEvent.preventDefault();
      this.finishPickerDrag(
        dragState.item,
        dragState.title,
        dragState.lastClientX,
        dragState.lastClientY,
        cancelled
      );
    };

    const handlePointerUp = (upEvent: PointerEvent): void => {
      finishPointerDrag(upEvent, false);
    };

    const handlePointerCancel = (cancelEvent: PointerEvent): void => {
      finishPointerDrag(cancelEvent, true);
    };

    dragState.cleanup = cleanup;
    this.activePointerDrag = dragState;
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, true);
    window.addEventListener('pointerup', handlePointerUp, true);
    window.addEventListener('pointercancel', handlePointerCancel, true);
  }

  private startPickerDrag(
    item: TItem,
    title: string,
    clientX: number,
    clientY: number
  ): void {
    this.pickerDragActive = true;
    this.pendingDropCompleted = false;
    this.suppressPickUntilTs = performance.now() + this.pickSuppressionMs;
    requestAnimationFrame(() => {
      if (this.pickerDragActive) {
        this.setViewMode('mini');
      }
    });
    emitExistingPickerDragStarted(
      this.config.dragKind,
      item,
      title,
      clientX,
      clientY
    );
  }

  private finishPickerDrag(
    item: TItem,
    title: string,
    clientX: number,
    clientY: number,
    cancelled: boolean
  ): void {
    if (!this.pickerDragActive) return;
    this.pickerDragActive = false;
    this.suppressPickUntilTs = performance.now() + this.pickSuppressionMs;
    emitExistingPickerDragEnded(
      this.config.dragKind,
      item,
      title,
      clientX,
      clientY,
      cancelled
    );
    if (this.pendingDropCompleted) {
      this.pendingDropCompleted = false;
      this.setViewMode('full');
    } else {
      this.setViewMode('mini');
    }
  }

  private cancelActivePointerDrag(): void {
    const dragState = this.activePointerDrag;
    if (!dragState) return;
    this.activePointerDrag = null;
    dragState.cleanup();
    if (!dragState.started) return;
    this.finishPickerDrag(
      dragState.item,
      dragState.title,
      dragState.lastClientX,
      dragState.lastClientY,
      true
    );
  }

  private createChip(label: string, palette: string): HTMLSpanElement {
    const chip = document.createElement('span');
    chip.className =
      `inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${palette}`.trim();
    chip.textContent = label;
    return chip;
  }

  private createPriorityChip(priority: unknown): HTMLSpanElement {
    const chip = document.createElement('span');
    chip.className =
      `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${this.getPriorityChipPalette(priority)}`.trim();

    const iconSpec = this.getPriorityIconSpec(priority);
    if (iconSpec) {
      const icon = createIcon(iconSpec.icon, { size: 12, strokeWidth: 2 });
      icon.classList.add('shrink-0', iconSpec.iconColorClassName);
      chip.appendChild(icon);
    }

    const label = document.createElement('span');
    label.textContent = this.formatEnum(priority);
    chip.appendChild(label);
    return chip;
  }

  private getStatusChipPalette(status: unknown): string {
    const normalized = this.normalizeChipValue(status);
    if (
      normalized.includes('completed') ||
      normalized.includes('done') ||
      normalized.includes('archived')
    ) {
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-700';
    }
    if (
      normalized.includes('active') ||
      normalized.includes('in progress') ||
      normalized.includes('progress')
    ) {
      return 'border-blue-200/80 bg-blue-50 text-blue-700';
    }
    if (normalized.includes('pending') || normalized.includes('described')) {
      return 'border-amber-200/80 bg-amber-50 text-amber-700';
    }
    if (normalized.includes('cancelled') || normalized.includes('canceled')) {
      return 'border-slate-200 bg-slate-100 text-slate-600';
    }
    return 'border-slate-200/80 bg-white text-slate-600';
  }

  private getPriorityChipPalette(priority: unknown): string {
    const normalized = this.normalizeChipValue(priority);
    if (normalized === 'highest') {
      return 'border-rose-200/80 bg-rose-50 text-rose-700';
    }
    if (normalized === 'high') {
      return 'border-rose-200/80 bg-rose-50 text-rose-700';
    }
    if (normalized === 'medium') {
      return 'border-orange-200/80 bg-orange-50 text-orange-700';
    }
    if (normalized === 'low') {
      return 'border-emerald-200/80 bg-emerald-50 text-emerald-700';
    }
    if (normalized === 'lowest') {
      return 'border-teal-200/80 bg-teal-50 text-teal-700';
    }
    return 'border-slate-200/80 bg-white text-slate-600';
  }

  private getPriorityIconSpec(
    priority: unknown
  ): { icon: IconName; iconColorClassName: string } | null {
    const normalized = this.normalizeChipValue(priority);
    if (normalized === 'highest') {
      return {
        icon: 'chevron-double-up',
        iconColorClassName: 'text-red-500',
      };
    }
    if (normalized === 'high') {
      return {
        icon: 'chevron-up',
        iconColorClassName: 'text-red-500',
      };
    }
    if (normalized === 'medium') {
      return {
        icon: 'bars-2',
        iconColorClassName: 'text-orange-500',
      };
    }
    if (normalized === 'low') {
      return {
        icon: 'chevron-down',
        iconColorClassName: 'text-sky-500',
      };
    }
    if (normalized === 'lowest') {
      return {
        icon: 'chevron-double-down',
        iconColorClassName: 'text-sky-500',
      };
    }
    return null;
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

  private emitDragMove(clientX: number, clientY: number): void {
    emitExistingPickerDragMoved(this.config.dragKind, clientX, clientY);
  }

  private getDrawerSubtitle(): string {
    return `Search existing ${this.config.itemLabel.toLowerCase()}s and place them where you need.`;
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
