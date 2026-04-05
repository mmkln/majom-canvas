import {
  AnchoredMenu,
  createBadge,
  createInputBase,
  createSurface,
} from '../hud/index.ts';
import { Checkbox } from './Checkbox.ts';

export type TagPickerItem = {
  id: number;
  title: string;
  color: string;
};

export type TagPickerFieldOptions = {
  items?: TagPickerItem[];
  selectedIds?: number[];
  loading?: boolean;
  errorMessage?: string | null;
  variant?: 'compact' | 'inline';
  placeholder?: string;
  searchPlaceholder?: string;
  onCreate?: (title: string) => Promise<TagPickerItem | null> | TagPickerItem | null;
  onChange?: (selectedIds: number[]) => void;
};

const MAX_VISIBLE_TRIGGER_CHIPS = 2;

function normalizeSelectedIds(selectedIds: Iterable<number>): number[] {
  return [...new Set(selectedIds)].sort((left, right) => left - right);
}

function sortTagsForDisplay(
  items: TagPickerItem[],
  selectedIds: ReadonlySet<number>
): TagPickerItem[] {
  return [...items].sort((left, right) => {
    const leftSelected = selectedIds.has(left.id);
    const rightSelected = selectedIds.has(right.id);
    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1;
    }
    return left.title.localeCompare(right.title);
  });
}

function appendTagChipContent(
  container: HTMLElement,
  tag: TagPickerItem
): void {
  const dot = document.createElement('span');
  dot.className = 'h-2 w-2 shrink-0 rounded-full';
  dot.style.backgroundColor = tag.color;

  const label = document.createElement('span');
  label.className = 'truncate';
  label.textContent = tag.title;

  container.append(dot, label);
}

export class TagPickerField {
  public readonly element: HTMLDivElement;

  private readonly variant: 'compact' | 'inline';
  private readonly trigger: HTMLDivElement | null;
  private readonly triggerSummary: HTMLDivElement | null;
  private readonly triggerMeta: HTMLDivElement | null;
  private readonly panel: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  private readonly list: HTMLDivElement;
  private readonly menuController: AnchoredMenu | null;
  private readonly placeholder: string;
  private onCreate?: (
    title: string
  ) => Promise<TagPickerItem | null> | TagPickerItem | null;
  private items: TagPickerItem[] = [];
  private filteredItems: TagPickerItem[] = [];
  private selectedIds = new Set<number>();
  private loading = false;
  private creating = false;
  private errorMessage: string | null = null;
  private createErrorMessage: string | null = null;
  private query = '';
  private readonly onChange?: (selectedIds: number[]) => void;

  constructor(options: TagPickerFieldOptions = {}) {
    this.variant = options.variant ?? 'compact';
    this.items = [...(options.items ?? [])];
    this.filteredItems = [...this.items];
    this.selectedIds = new Set(options.selectedIds ?? []);
    this.loading = options.loading ?? false;
    this.errorMessage = options.errorMessage ?? null;
    this.onChange = options.onChange;
    this.onCreate = options.onCreate;
    this.placeholder = options.placeholder ?? 'Select tags';

    this.element = document.createElement('div');
    this.element.className =
      this.variant === 'compact' ? 'relative' : 'w-full';
    this.element.setAttribute('data-component', 'TagPickerField');

    if (this.variant === 'compact') {
      this.trigger = document.createElement('div');
      this.trigger.dataset.role = 'goal-tag-picker-trigger';
      this.trigger.className =
        'flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80';
      this.trigger.tabIndex = 0;
      this.trigger.setAttribute('role', 'button');
      this.trigger.setAttribute('aria-haspopup', 'dialog');
      this.trigger.setAttribute('aria-expanded', 'false');

      this.triggerSummary = document.createElement('div');
      this.triggerSummary.className =
        'flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden';

      this.triggerMeta = document.createElement('div');
      this.triggerMeta.className =
        'flex shrink-0 items-center gap-2 text-slate-400';

      this.trigger.append(this.triggerSummary, this.triggerMeta);
      this.trigger.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleMenu();
      });
      this.trigger.addEventListener('keydown', (event) => {
        if (
          event.key !== 'Enter' &&
          event.key !== ' ' &&
          event.key !== 'ArrowDown'
        ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.toggleMenu();
      });
      this.panel = createSurface({
        className: 'hidden z-50 w-full min-w-0 p-2.5',
      });
    } else {
      this.trigger = null;
      this.triggerSummary = null;
      this.triggerMeta = null;
      this.panel = document.createElement('div');
      this.panel.className = 'w-full min-w-0';
    }
    this.panel.dataset.role = 'goal-tag-picker-panel';

    this.searchInput = createInputBase({
      variant: 'default',
      placeholder: options.searchPlaceholder ?? 'Search tags...',
      className: 'h-8.5 w-full',
      onInput: (value) => {
        this.query = value;
        this.createErrorMessage = null;
        this.applyFilter();
        this.renderList();
      },
      onKeyDown: (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          void this.createTagFromQuery();
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          this.menuController?.close();
          this.trigger?.focus();
        }
      },
    });
    this.searchInput.dataset.goalTagSearchInput = 'true';

    this.list = document.createElement('div');
    this.list.className = 'max-h-60 space-y-1.5 overflow-y-auto pt-2';
    this.list.dataset.role = 'goal-tag-picker-list';

    this.panel.append(this.searchInput, this.list);
    if (this.variant === 'compact') {
      this.panel.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        this.menuController?.close();
        this.trigger?.focus();
      });
    }

    if (this.trigger) {
      this.element.append(this.trigger, this.panel);
      this.menuController = new AnchoredMenu({
        container: this.element,
        panel: this.panel,
        onOpenChange: (open) => {
          this.trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
        },
      });
      this.menuController.mount();
    } else {
      this.element.append(this.panel);
      this.menuController = null;
    }

    this.renderTrigger();
    this.renderList();
  }

  public update(options: Partial<TagPickerFieldOptions>): void {
    if (options.items !== undefined) {
      this.items = [...options.items];
      this.applyFilter();
    }
    if (options.selectedIds !== undefined) {
      this.selectedIds = new Set(options.selectedIds);
    }
    if (typeof options.loading === 'boolean') {
      this.loading = options.loading;
    }
    if (options.errorMessage !== undefined) {
      this.errorMessage = options.errorMessage;
    }
    if (options.onCreate !== undefined) {
      this.onCreate = options.onCreate;
    }
    this.renderTrigger();
    this.renderList();
    if (this.menuController?.isOpen()) {
      this.menuController.reposition();
    }
  }

  public destroy(): void {
    this.menuController?.close();
    this.menuController?.unmount();
  }

  public getSelectedIds(): number[] {
    return normalizeSelectedIds(this.selectedIds);
  }

  public focusSearch(): void {
    this.searchInput.focus();
    this.searchInput.select();
  }

  private applyFilter(): void {
    const query = this.query.trim().toLowerCase();
    this.filteredItems =
      query.length === 0
        ? [...this.items]
        : this.items.filter((tag) => tag.title.toLowerCase().includes(query));
  }

  private getCreateCandidateTitle(): string | null {
    if (!this.onCreate || this.loading || this.creating || this.errorMessage) {
      return null;
    }
    const title = this.query.trim();
    if (title.length === 0) {
      return null;
    }
    const normalized = title.toLowerCase();
    const exactMatchExists = this.items.some(
      (tag) => tag.title.trim().toLowerCase() === normalized
    );
    if (exactMatchExists || this.filteredItems.length > 0) {
      return null;
    }
    return title;
  }

  private renderTrigger(): void {
    if (!this.triggerSummary || !this.triggerMeta) {
      return;
    }
    const triggerSummary = this.triggerSummary;
    const triggerMeta = this.triggerMeta;
    triggerSummary.replaceChildren();
    triggerMeta.replaceChildren();

    const selectedItems = sortTagsForDisplay(this.items, this.selectedIds).filter(
      (tag) => this.selectedIds.has(tag.id)
    );
    if (selectedItems.length === 0) {
      const placeholder = document.createElement('span');
      placeholder.className = 'text-sm leading-5 text-slate-400';
      placeholder.textContent = this.placeholder;
      triggerSummary.appendChild(placeholder);
    } else {
      selectedItems
        .slice(0, MAX_VISIBLE_TRIGGER_CHIPS)
        .forEach((tag) => triggerSummary.appendChild(this.createRemovableChip(tag)));

      const overflow = selectedItems.length - MAX_VISIBLE_TRIGGER_CHIPS;
      if (overflow > 0) {
        triggerSummary.appendChild(
          createBadge({
            label: `+${overflow}`,
            tone: 'neutral',
          })
        );
      }
    }

    const hint = document.createElement('span');
    hint.className = 'text-xs font-medium text-slate-500';
    hint.textContent =
      selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Browse';
    triggerMeta.appendChild(hint);

    const chevron = document.createElement('span');
    chevron.className = 'text-xs text-slate-400';
    chevron.textContent = '▾';
    triggerMeta.appendChild(chevron);
  }

  private renderList(): void {
    this.list.replaceChildren();
    const isInline = this.variant === 'inline';

    if (this.loading) {
      const loading = document.createElement('p');
      loading.className = isInline
        ? 'px-4 py-3 text-sm leading-5 text-slate-500'
        : 'px-1 py-2 text-sm leading-5 text-slate-500';
      loading.textContent = 'Loading tags...';
      this.list.appendChild(loading);
      return;
    }

    if (this.errorMessage) {
      const error = document.createElement('p');
      error.className = isInline
        ? 'px-4 py-3 text-sm leading-5 text-rose-600'
        : 'px-1 py-2 text-sm leading-5 text-rose-600';
      error.textContent = this.errorMessage;
      this.list.appendChild(error);
      return;
    }

    const createCandidateTitle = this.getCreateCandidateTitle();

    if (createCandidateTitle) {
      this.list.appendChild(this.createCreateRow(createCandidateTitle));
    }

    if (this.createErrorMessage) {
      const createError = document.createElement('p');
      createError.className = isInline
        ? 'px-4 py-3 text-sm leading-5 text-rose-600'
        : 'px-1 py-1.5 text-sm leading-5 text-rose-600';
      createError.textContent = this.createErrorMessage;
      this.list.appendChild(createError);
    }

    if (this.filteredItems.length === 0 && !createCandidateTitle) {
      const empty = document.createElement('p');
      empty.className = isInline
        ? 'px-4 py-3 text-sm leading-5 text-slate-500'
        : 'px-1 py-2 text-sm leading-5 text-slate-500';
      empty.textContent =
        this.items.length === 0 ? 'No tags available.' : 'No matching tags.';
      this.list.appendChild(empty);
      return;
    }

    sortTagsForDisplay(this.filteredItems, this.selectedIds).forEach((tag) => {
      const row = document.createElement('div');
      const isSelected = this.selectedIds.has(tag.id);
      row.className = [
        isInline
          ? 'flex items-center justify-between gap-3 rounded-lg px-4 py-3 transition-colors'
          : 'flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors',
        isSelected
          ? 'bg-indigo-50/70 ring-1 ring-indigo-100'
          : 'bg-slate-50/70 hover:bg-slate-100/80',
      ].join(' ');

      const info = document.createElement('div');
      info.className = 'flex min-w-0 items-center gap-2';

      const dot = document.createElement('span');
      dot.className = 'h-2.5 w-2.5 shrink-0 rounded-full';
      dot.style.backgroundColor = tag.color;

      const title = document.createElement('span');
      title.className = 'truncate text-sm font-medium text-slate-700';
      title.textContent = tag.title;

      info.append(dot, title);

      const checkbox = new Checkbox({
        checked: this.selectedIds.has(tag.id),
        ariaLabel: tag.title,
        stopPropagation: true,
        onChange: (checked) => {
          this.setTagSelected(tag.id, checked);
        },
      });

      row.addEventListener('click', (event) => {
        if (checkbox.getElement().contains(event.target as Node)) return;
        this.setTagSelected(tag.id, !this.selectedIds.has(tag.id));
      });

      row.append(info, checkbox.getElement());
      this.list.appendChild(row);
    });
  }

  private setTagSelected(tagId: number, selected: boolean): void {
    if (selected) this.selectedIds.add(tagId);
    else this.selectedIds.delete(tagId);
    this.createErrorMessage = null;
    this.renderTrigger();
    this.renderList();
    this.onChange?.(this.getSelectedIds());
  }

  private createCreateRow(title: string): HTMLButtonElement {
    const row = document.createElement('button');
    row.type = 'button';
    row.dataset.role = 'goal-tag-picker-create';
    row.dataset.createTitle = title;
    row.className =
      this.variant === 'inline'
        ? 'flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-white px-4 py-3 text-left transition-colors hover:border-indigo-300 hover:from-indigo-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80 disabled:cursor-wait disabled:opacity-70'
        : 'flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-indigo-200 bg-gradient-to-r from-indigo-50/90 to-white px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:from-indigo-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80 disabled:cursor-wait disabled:opacity-70';
    row.disabled = this.creating;
    row.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.createTagFromQuery();
    });

    const info = document.createElement('div');
    info.className = 'flex min-w-0 items-center gap-3';

    const accent = document.createElement('span');
    accent.className =
      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-200';
    accent.textContent = '+';

    const copy = document.createElement('div');
    copy.className = 'min-w-0';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-indigo-500';
    eyebrow.textContent = 'Create tag';

    const label = document.createElement('div');
    label.className = 'truncate text-sm font-semibold text-slate-800';
    label.textContent = `"${title}"`;

    copy.append(eyebrow, label);
    info.append(accent, copy);

    const badge = createBadge({
      label: this.creating ? 'Creating' : 'New',
      tone: 'accent',
    });

    row.append(info, badge);
    return row;
  }

  private createRemovableChip(tag: TagPickerItem): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className =
      'inline-flex min-w-0 max-w-[140px] shrink-0 items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium leading-4 text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80';
    chip.dataset.role = 'goal-tag-picker-selected-chip';
    chip.dataset.tagId = String(tag.id);
    chip.setAttribute('aria-label', `Remove ${tag.title}`);
    chip.title = `Remove ${tag.title}`;
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setTagSelected(tag.id, false);
    });

    appendTagChipContent(chip, tag);

    const remove = document.createElement('span');
    remove.className = 'shrink-0 text-slate-400';
    remove.textContent = '×';
    chip.appendChild(remove);

    return chip;
  }

  private async createTagFromQuery(): Promise<void> {
    const title = this.getCreateCandidateTitle();
    if (!title || !this.onCreate) {
      return;
    }

    this.creating = true;
    this.createErrorMessage = null;
    this.renderList();
    if (this.menuController?.isOpen()) {
      this.menuController.reposition();
    }

    try {
      const created = await this.onCreate(title);
      if (!created) {
        return;
      }
      const existingIndex = this.items.findIndex((tag) => tag.id === created.id);
      if (existingIndex >= 0) {
        this.items[existingIndex] = created;
      } else {
        this.items = [...this.items, created];
      }
      this.selectedIds.add(created.id);
      this.query = '';
      this.searchInput.value = '';
      this.applyFilter();
      this.renderTrigger();
      this.onChange?.(this.getSelectedIds());
    } catch (error) {
      this.createErrorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to create tag.';
    } finally {
      this.creating = false;
      this.renderList();
      if (this.menuController?.isOpen()) {
        this.menuController.reposition();
      }
      window.requestAnimationFrame(() => {
        this.focusSearch();
      });
    }
  }

  private toggleMenu(): void {
    if (!this.menuController || !this.trigger) {
      return;
    }
    if (this.menuController.isOpen()) {
      this.menuController.close();
      return;
    }
    this.menuController.openAt({
      anchor: this.trigger,
      placement: 'bottom-start',
      gap: 8,
      matchAnchorWidth: true,
    });
    window.requestAnimationFrame(() => {
      this.focusSearch();
    });
  }
}
