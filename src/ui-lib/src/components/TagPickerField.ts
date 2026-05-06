import {
  AnchoredMenu,
  createBadge,
  createInputBase,
  createSurface,
} from '../hud/index.ts';
import {
  HUD_SELECTION_PANEL_CLASS,
  HUD_SELECTION_PANEL_HEADER_CLASS,
  HUD_SELECTION_PANEL_LIST_CLASS,
  HUD_SELECTION_STATE_ROW_CLASS,
  HUD_SELECTION_STATE_ROW_ERROR_CLASS,
  HUD_SELECTION_TRIGGER_CLASS,
} from '../hud/classNames.ts';
import { createIcon } from '../hud/icons.ts';
import { Checkbox } from './Checkbox.ts';

export type TagPickerItem = {
  id: number;
  title: string;
  color: string;
};

export type TagPickerItemPatch = {
  title?: string;
  color?: string;
};

export type TagPickerFieldCopy = {
  title?: string;
  editTitle?: string;
  createTitle?: string;
  searchPlaceholder?: string;
  labelsLegend?: string;
  createButton?: string;
  colorblindButton?: string;
  titleLabel?: string;
  colorLegend?: string;
  removeColor?: string;
  save?: string;
  delete?: string;
  close?: string;
  back?: string;
};

export type TagPickerFieldOptions = {
  items?: TagPickerItem[];
  selectedIds?: number[];
  loading?: boolean;
  errorMessage?: string | null;
  variant?: 'compact' | 'inline' | 'labels';
  placeholder?: string;
  searchPlaceholder?: string;
  copy?: TagPickerFieldCopy;
  onCreate?: (
    title: string,
    color?: string
  ) => Promise<TagPickerItem | null> | TagPickerItem | null;
  onUpdate?: (
    id: number,
    patch: TagPickerItemPatch
  ) => Promise<TagPickerItem | null> | TagPickerItem | null;
  onDelete?: (id: number) => Promise<void> | void;
  onRequestClose?: () => void;
  onChange?: (selectedIds: number[]) => void;
};

const MAX_VISIBLE_TRIGGER_CHIPS = 2;
const LABEL_PICKER_DEFAULT_COLOR = '#4bce97';
const LABEL_PICKER_COLOR_PALETTE = [
  '#baf3db',
  '#f8e6a0',
  '#fddcaa',
  '#ffd2cc',
  '#dfd8fd',
  '#4bce97',
  '#f5cd47',
  '#fea362',
  '#f87168',
  '#c97cf4',
  '#1f845a',
  '#946f00',
  '#c25100',
  '#c9372c',
  '#9f5fcb',
  '#cce0ff',
  '#c6edfb',
  '#d3f1a7',
  '#fdd0ec',
  '#dcdfe4',
  '#579dff',
  '#6cc3e0',
  '#94c748',
  '#e774bb',
  '#8590a2',
  '#0c66e4',
  '#227d9b',
  '#5b7f24',
  '#ae4787',
  '#626f86',
] as const;

const LABEL_PICKER_COPY_REQUIRED: Required<TagPickerFieldCopy> = {
  title: 'Labels',
  editTitle: 'Edit label',
  createTitle: 'Create label',
  searchPlaceholder: 'Search labels...',
  labelsLegend: 'Labels',
  createButton: 'Create a new label',
  colorblindButton: 'Enable colorblind friendly mode',
  titleLabel: 'Title',
  colorLegend: 'Select a color',
  removeColor: 'Remove color',
  save: 'Save',
  delete: 'Delete',
  close: 'Close popover',
  back: 'Return to previous screen',
};

const LABEL_PICKER_HEADER_CLASS =
  'grid grid-cols-[28px_1fr_28px] items-center gap-2 border-b border-slate-200 px-3 py-2';
const LABEL_PICKER_ICON_BUTTON_CLASS =
  'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70';
const LABEL_PICKER_TITLE_CLASS =
  'm-0 text-center text-sm font-semibold leading-5 text-slate-700';
const LABEL_PICKER_BODY_CLASS = 'max-h-[min(640px,calc(100vh-64px))] overflow-y-auto p-3';
const LABEL_PICKER_LABEL_CLASS =
  'm-0 mb-2 text-sm font-semibold leading-5 text-slate-600';
const LABEL_PICKER_BUTTON_CLASS =
  'inline-flex h-9 w-full items-center justify-center rounded-md bg-white px-3 text-sm font-semibold text-slate-600 shadow-[inset_0_0_0_1px_rgba(9,30,66,0.16)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60';
const LABEL_PICKER_ROW_CLASS =
  'grid grid-cols-[24px_1fr_28px] items-center gap-2 py-1.5';
const LABEL_PICKER_CHECK_CLASS =
  'h-[18px] w-[18px] rounded border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/70';
const LABEL_PICKER_SWATCH_CLASS =
  'flex h-8 min-w-0 items-center rounded px-3 text-left text-sm font-medium leading-5';
const LABEL_PICKER_EDIT_BUTTON_CLASS =
  'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70';
const LABEL_PICKER_PALETTE_CLASS = 'grid grid-cols-5 gap-2';
const LABEL_PICKER_COLOR_TILE_CLASS =
  'relative h-8 rounded-md shadow-[inset_0_0_0_1px_rgba(9,30,66,0.16)] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70';

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

function resolveTagPickerCopy(
  copy: TagPickerFieldCopy | undefined,
  searchPlaceholder: string | undefined
): Required<TagPickerFieldCopy> {
  return {
    ...LABEL_PICKER_COPY_REQUIRED,
    ...copy,
    searchPlaceholder:
      searchPlaceholder ?? copy?.searchPlaceholder ?? LABEL_PICKER_COPY_REQUIRED.searchPlaceholder,
  };
}

function getReadableTextColor(color: string): string {
  const hex = color.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return '#172b4d';
  }
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.58 ? '#172b4d' : '#ffffff';
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

  private readonly variant: 'compact' | 'inline' | 'labels';
  private readonly trigger: HTMLDivElement | null;
  private readonly triggerSummary: HTMLDivElement | null;
  private readonly triggerMeta: HTMLDivElement | null;
  private readonly panel: HTMLDivElement;
  private readonly selectedSection: HTMLDivElement;
  private readonly selectedSummary: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  private readonly list: HTMLDivElement;
  private readonly menuController: AnchoredMenu | null;
  private readonly placeholder: string;
  private readonly copy: Required<TagPickerFieldCopy>;
  private onCreate?: (
    title: string,
    color?: string
  ) => Promise<TagPickerItem | null> | TagPickerItem | null;
  private onUpdate?: (
    id: number,
    patch: TagPickerItemPatch
  ) => Promise<TagPickerItem | null> | TagPickerItem | null;
  private onDelete?: (id: number) => Promise<void> | void;
  private readonly onRequestClose?: () => void;
  private items: TagPickerItem[] = [];
  private filteredItems: TagPickerItem[] = [];
  private selectedIds = new Set<number>();
  private loading = false;
  private creating = false;
  private saving = false;
  private editingTag: TagPickerItem | null = null;
  private editingIsCreate = false;
  private errorMessage: string | null = null;
  private createErrorMessage: string | null = null;
  private editErrorMessage: string | null = null;
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
    this.onUpdate = options.onUpdate;
    this.onDelete = options.onDelete;
    this.onRequestClose = options.onRequestClose;
    this.placeholder = options.placeholder ?? 'Select tags';
    this.copy = resolveTagPickerCopy(options.copy, options.searchPlaceholder);

    this.element = document.createElement('div');
    this.element.className =
      this.variant === 'compact' ? 'relative' : 'w-full';
    this.element.setAttribute('data-component', 'TagPickerField');

    if (this.variant === 'compact') {
      this.trigger = document.createElement('div');
      this.trigger.dataset.role = 'goal-tag-picker-trigger';
      this.trigger.className = `min-h-[48px] ${HUD_SELECTION_TRIGGER_CLASS}`;
      this.trigger.tabIndex = 0;
      this.trigger.setAttribute('role', 'button');
      this.trigger.setAttribute('aria-haspopup', 'dialog');
      this.trigger.setAttribute('aria-expanded', 'false');

      this.triggerSummary = document.createElement('div');
      this.triggerSummary.className =
        'flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden';

      this.triggerMeta = document.createElement('div');
      this.triggerMeta.className =
        'ml-auto flex shrink-0 items-center gap-2';

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
        elevated: true,
        className: `hidden z-50 w-full min-w-0 ${HUD_SELECTION_PANEL_CLASS}`,
      });
    } else {
      this.trigger = null;
      this.triggerSummary = null;
      this.triggerMeta = null;
      this.panel = createSurface({
        className:
          this.variant === 'labels'
            ? 'w-full min-w-0 bg-white'
            : `w-full min-w-0 ${HUD_SELECTION_PANEL_CLASS}`,
      });
    }
    this.panel.dataset.role = 'goal-tag-picker-panel';

    this.selectedSection = document.createElement('div');
    this.selectedSection.dataset.role = 'goal-tag-picker-selected-section';
    this.selectedSection.className =
      'hidden border-b border-slate-200 px-3.5 py-3';

    this.selectedSummary = document.createElement('div');
    this.selectedSummary.dataset.role = 'goal-tag-picker-selected-summary';
    this.selectedSummary.className = 'flex flex-wrap gap-2';

    this.selectedSection.append(this.selectedSummary);

    this.searchInput = createInputBase({
      variant: 'default',
      placeholder:
        this.variant === 'labels'
          ? this.copy.searchPlaceholder
          : options.searchPlaceholder ?? 'Search tags...',
      className: 'h-9 w-full',
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
          if (this.variant === 'labels') {
            this.requestClose();
            return;
          }
          this.menuController?.close();
          this.trigger?.focus();
        }
      },
    });
    this.searchInput.dataset.goalTagSearchInput = 'true';
    this.searchInput.classList.add('!shadow-none');

    const searchWrap = document.createElement('div');
    searchWrap.className = HUD_SELECTION_PANEL_HEADER_CLASS;
    searchWrap.appendChild(this.searchInput);

    this.list = document.createElement('div');
    this.list.className = HUD_SELECTION_PANEL_LIST_CLASS;
    this.list.dataset.role = 'goal-tag-picker-list';

    if (this.variant === 'labels') {
      this.renderLabelsScreen();
    } else {
      this.panel.append(this.selectedSection, searchWrap, this.list);
    }
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
    this.renderSelectedSection();
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
    if (options.onUpdate !== undefined) {
      this.onUpdate = options.onUpdate;
    }
    if (options.onDelete !== undefined) {
      this.onDelete = options.onDelete;
    }
    this.renderTrigger();
    this.renderSelectedSection();
    if (this.variant === 'labels') {
      this.renderLabelsScreen();
      return;
    }
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
      placeholder.className = 'min-w-0 flex-1 truncate text-sm text-slate-500';
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

    if (selectedItems.length > 0) {
      triggerMeta.appendChild(
        createBadge({
          label: String(selectedItems.length),
          tone: 'neutral',
        })
      );
    }

    const chevron = createIcon(
      this.menuController?.isOpen() ? 'chevron-up' : 'chevron-down',
      {
      size: 16,
      strokeWidth: 1.9,
      }
    );
    chevron.className.baseVal = 'shrink-0 text-slate-400';
    chevron.setAttribute('aria-hidden', 'true');
    triggerMeta.appendChild(chevron);
  }

  private renderList(): void {
    this.list.replaceChildren();

    if (this.variant === 'labels') {
      this.renderLabelRows();
      return;
    }

    if (this.loading) {
      const loading = document.createElement('div');
      loading.className = HUD_SELECTION_STATE_ROW_CLASS;
      loading.textContent = 'Loading tags...';
      this.list.appendChild(loading);
      return;
    }

    if (this.errorMessage) {
      const error = document.createElement('div');
      error.className = HUD_SELECTION_STATE_ROW_ERROR_CLASS;
      error.textContent = this.errorMessage;
      this.list.appendChild(error);
      return;
    }

    const createCandidateTitle = this.getCreateCandidateTitle();

    if (createCandidateTitle) {
      this.list.appendChild(this.createCreateRow(createCandidateTitle));
    }

    if (this.createErrorMessage) {
      const createError = document.createElement('div');
      createError.className = HUD_SELECTION_STATE_ROW_ERROR_CLASS;
      createError.textContent = this.createErrorMessage;
      this.list.appendChild(createError);
    }

    if (this.filteredItems.length === 0 && !createCandidateTitle) {
      const empty = document.createElement('div');
      empty.className = HUD_SELECTION_STATE_ROW_CLASS;
      empty.textContent =
        this.items.length === 0 ? 'No tags available.' : 'No matching tags.';
      this.list.appendChild(empty);
      return;
    }

    sortTagsForDisplay(this.filteredItems, this.selectedIds).forEach((tag) => {
      const row = document.createElement('div');
      const isSelected = this.selectedIds.has(tag.id);
      row.className = [
        'flex items-center justify-between gap-3 px-3.5 py-3 transition-colors',
        isSelected
          ? 'bg-indigo-50/65'
          : 'hover:bg-slate-50',
      ].join(' ');

      const info = document.createElement('div');
      info.className = 'flex min-w-0 items-center gap-2.5';

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

  private renderSelectedSection(): void {
    if (this.variant === 'labels') {
      return;
    }
    this.selectedSummary.replaceChildren();
    const selectedItems = sortTagsForDisplay(this.items, this.selectedIds).filter(
      (tag) => this.selectedIds.has(tag.id)
    );

    if (selectedItems.length === 0) {
      this.selectedSection.classList.add('hidden');
      return;
    }

    this.selectedSection.classList.remove('hidden');
    selectedItems.forEach((tag) => {
      this.selectedSummary.appendChild(this.createPanelSelectedChip(tag));
    });
  }

  private renderLabelsScreen(): void {
    this.editingTag = null;
    this.editingIsCreate = false;
    this.editErrorMessage = null;
    this.panel.replaceChildren();

    const header = this.createLabelPickerHeader({
      title: this.copy.title,
      showBack: false,
    });
    const body = document.createElement('div');
    body.className = LABEL_PICKER_BODY_CLASS;

    this.searchInput.placeholder = this.copy.searchPlaceholder;
    const searchWrap = document.createElement('div');
    searchWrap.className = 'mb-3';
    searchWrap.append(this.searchInput);

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'm-0 border-0 p-0';
    const legend = document.createElement('legend');
    legend.className = LABEL_PICKER_LABEL_CLASS;
    legend.textContent = this.copy.labelsLegend;
    fieldset.append(legend, this.list);

    body.append(searchWrap, fieldset);
    if (this.onCreate) {
      const createButton = document.createElement('button');
      createButton.type = 'button';
      createButton.className = `${LABEL_PICKER_BUTTON_CLASS} mt-2`;
      createButton.textContent = this.copy.createButton;
      createButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openCreateLabelEditor();
      });
      body.append(createButton);
    }

    const divider = document.createElement('hr');
    divider.className = 'my-3 border-0 border-t border-slate-200';

    const colorblindButton = document.createElement('button');
    colorblindButton.type = 'button';
    colorblindButton.className = LABEL_PICKER_BUTTON_CLASS;
    colorblindButton.textContent = this.copy.colorblindButton;
    body.append(divider, colorblindButton);

    this.panel.append(header, body);
    this.applyFilter();
    this.renderList();
  }

  private renderLabelRows(): void {
    if (this.loading) {
      const loading = document.createElement('div');
      loading.className = 'py-3 text-sm text-slate-500';
      loading.textContent = 'Loading tags...';
      this.list.appendChild(loading);
      return;
    }

    if (this.errorMessage) {
      const error = document.createElement('div');
      error.className = 'py-3 text-sm font-medium text-red-600';
      error.textContent = this.errorMessage;
      this.list.appendChild(error);
      return;
    }

    if (this.createErrorMessage) {
      const createError = document.createElement('div');
      createError.className = 'py-2 text-sm font-medium text-red-600';
      createError.textContent = this.createErrorMessage;
      this.list.appendChild(createError);
    }

    if (this.filteredItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'py-3 text-sm text-slate-500';
      empty.textContent =
        this.items.length === 0 ? 'No tags available.' : 'No matching tags.';
      this.list.appendChild(empty);
      return;
    }

    const rows = document.createElement('ul');
    rows.className = 'm-0 list-none p-0';

    sortTagsForDisplay(this.filteredItems, this.selectedIds).forEach((tag) => {
      const item = document.createElement('li');
      const row = document.createElement('label');
      row.className = LABEL_PICKER_ROW_CLASS;
      row.setAttribute('data-testid', 'clickable-checkbox');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = LABEL_PICKER_CHECK_CLASS;
      checkbox.checked = this.selectedIds.has(tag.id);
      checkbox.setAttribute('aria-label', tag.title || this.copy.labelsLegend);
      checkbox.addEventListener('change', () => {
        this.setTagSelected(tag.id, checkbox.checked);
      });

      const swatch = document.createElement('span');
      swatch.className = LABEL_PICKER_SWATCH_CLASS;
      swatch.style.backgroundColor = tag.color;
      swatch.style.color = getReadableTextColor(tag.color);
      swatch.setAttribute('data-testid', 'card-label');
      swatch.dataset.color = tag.color;
      swatch.textContent = tag.title;

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = LABEL_PICKER_EDIT_BUTTON_CLASS;
      edit.setAttribute('aria-label', `Edit ${tag.title || this.copy.labelsLegend}`);
      edit.setAttribute('data-testid', 'card-label-edit-button');
      edit.append(createIcon('pencil-square', { size: 18, strokeWidth: 1.9 }));
      edit.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openEditLabelEditor(tag);
      });

      row.append(checkbox, swatch, edit);
      item.append(row);
      rows.append(item);
    });

    this.list.append(rows);
  }

  private createLabelPickerHeader(options: {
    title: string;
    showBack: boolean;
  }): HTMLElement {
    const header = document.createElement('header');
    header.className = LABEL_PICKER_HEADER_CLASS;

    const start = document.createElement('div');
    if (options.showBack) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = LABEL_PICKER_ICON_BUTTON_CLASS;
      back.setAttribute('aria-label', this.copy.back);
      back.append(createIcon('chevron-left', { size: 22, strokeWidth: 2 }));
      back.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.renderLabelsScreen();
      });
      start.append(back);
    }

    const title = document.createElement('h2');
    title.className = LABEL_PICKER_TITLE_CLASS;
    title.textContent = options.title;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = LABEL_PICKER_ICON_BUTTON_CLASS;
    close.setAttribute('aria-label', this.copy.close);
    close.append(createIcon('x-mark', { size: 20, strokeWidth: 2 }));
    close.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.requestClose();
    });

    header.append(start, title, close);
    return header;
  }

  private openCreateLabelEditor(): void {
    this.editingIsCreate = true;
    this.editingTag = {
      id: -1,
      title: this.query.trim(),
      color: LABEL_PICKER_DEFAULT_COLOR,
    };
    this.renderLabelEditorScreen();
  }

  private openEditLabelEditor(tag: TagPickerItem): void {
    this.editingIsCreate = false;
    this.editingTag = { ...tag };
    this.renderLabelEditorScreen();
  }

  private renderLabelEditorScreen(): void {
    const draft = this.editingTag;
    if (!draft) return;

    this.panel.replaceChildren();
    const header = this.createLabelPickerHeader({
      title: this.editingIsCreate ? this.copy.createTitle : this.copy.editTitle,
      showBack: true,
    });
    const body = document.createElement('div');
    body.className = LABEL_PICKER_BODY_CLASS;

    const preview = document.createElement('div');
    preview.className = 'mb-4 rounded bg-slate-100 px-5 py-6';
    const previewSwatch = document.createElement('div');
    previewSwatch.className = `${LABEL_PICKER_SWATCH_CLASS} w-full`;
    previewSwatch.style.backgroundColor = draft.color;
    previewSwatch.style.color = getReadableTextColor(draft.color);
    previewSwatch.setAttribute('data-testid', 'card-label-edit-preview');
    previewSwatch.textContent = draft.title;
    preview.append(previewSwatch);

    const titleLabel = document.createElement('label');
    titleLabel.className = LABEL_PICKER_LABEL_CLASS;
    titleLabel.htmlFor = 'edit-label-title-input';
    titleLabel.textContent = this.copy.titleLabel;

    const titleInput = createInputBase({
      variant: 'default',
      value: draft.title,
      className: 'mb-3 h-10 w-full',
      onInput: (value) => {
        draft.title = value;
        previewSwatch.textContent = value;
      },
    });
    titleInput.id = 'edit-label-title-input';

    const colorFieldset = document.createElement('fieldset');
    colorFieldset.className = 'm-0 border-0 p-0';
    const colorLegend = document.createElement('legend');
    colorLegend.className = LABEL_PICKER_LABEL_CLASS;
    colorLegend.textContent = this.copy.colorLegend;
    const palette = this.createColorPalette(draft, previewSwatch);
    const removeColor = document.createElement('button');
    removeColor.type = 'button';
    removeColor.className = `${LABEL_PICKER_BUTTON_CLASS} mt-3`;
    removeColor.append(createIcon('x-mark', { size: 18, strokeWidth: 2 }));
    const removeText = document.createElement('span');
    removeText.className = 'ml-2';
    removeText.textContent = this.copy.removeColor;
    removeColor.append(removeText);
    removeColor.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      draft.color = '#dcdfe4';
      previewSwatch.style.backgroundColor = draft.color;
      previewSwatch.style.color = getReadableTextColor(draft.color);
      this.renderLabelEditorScreen();
    });
    colorFieldset.append(colorLegend, palette, removeColor);

    body.append(preview, titleLabel, titleInput, colorFieldset);

    if (this.editErrorMessage) {
      const error = document.createElement('div');
      error.className = 'mt-3 text-sm font-medium text-red-600';
      error.textContent = this.editErrorMessage;
      body.append(error);
    }

    const divider = document.createElement('hr');
    divider.className = 'my-4 border-0 border-t border-slate-200';
    const actions = document.createElement('div');
    actions.className = 'flex items-center justify-between gap-3';

    const save = document.createElement('button');
    save.type = 'button';
    save.className =
      'inline-flex h-9 items-center rounded-md bg-blue-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-wait disabled:opacity-70';
    save.textContent = this.copy.save;
    save.disabled = this.saving || draft.title.trim().length === 0;
    save.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.saveLabelEditorDraft();
    });
    actions.append(save);

    if (!this.editingIsCreate && this.onDelete) {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className =
        'inline-flex h-9 items-center rounded-md bg-red-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 disabled:cursor-wait disabled:opacity-70';
      deleteButton.textContent = this.copy.delete;
      deleteButton.disabled = this.saving;
      deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.deleteEditingLabel();
      });
      actions.append(deleteButton);
    }

    body.append(divider, actions);
    this.panel.append(header, body);
    window.requestAnimationFrame(() => {
      titleInput.focus();
      titleInput.select();
    });
  }

  private createColorPalette(
    draft: TagPickerItem,
    preview: HTMLElement
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = LABEL_PICKER_PALETTE_CLASS;
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('data-testid', 'color-palette');

    LABEL_PICKER_COLOR_PALETTE.forEach((color) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = LABEL_PICKER_COLOR_TILE_CLASS;
      tile.style.backgroundColor = color;
      tile.setAttribute('role', 'radio');
      tile.setAttribute('aria-label', color);
      tile.setAttribute('aria-checked', draft.color === color ? 'true' : 'false');
      tile.setAttribute('data-testid', `color-tile-${color.replace('#', '')}`);
      if (draft.color === color) {
        const check = createIcon('check', { size: 22, strokeWidth: 2.4 });
        check.style.color = getReadableTextColor(color);
        tile.append(check);
      }
      tile.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        draft.color = color;
        preview.style.backgroundColor = color;
        preview.style.color = getReadableTextColor(color);
        this.renderLabelEditorScreen();
      });
      group.append(tile);
    });

    return group;
  }

  private async saveLabelEditorDraft(): Promise<void> {
    const draft = this.editingTag;
    if (!draft || this.saving) return;
    const title = draft.title.trim();
    if (!title) return;

    this.saving = true;
    this.editErrorMessage = null;
    this.renderLabelEditorScreen();
    try {
      const saved = this.editingIsCreate
        ? await this.onCreate?.(title, draft.color)
        : await this.onUpdate?.(draft.id, { title, color: draft.color });
      if (saved) {
        this.upsertLocalItem(saved);
        if (this.editingIsCreate) {
          this.selectedIds.add(saved.id);
          this.onChange?.(this.getSelectedIds());
        }
      }
      this.query = '';
      this.searchInput.value = '';
      this.applyFilter();
      this.saving = false;
      this.renderLabelsScreen();
    } catch (error) {
      this.editErrorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save label.';
      this.saving = false;
      this.renderLabelEditorScreen();
    } finally {
      this.saving = false;
    }
  }

  private async deleteEditingLabel(): Promise<void> {
    const draft = this.editingTag;
    if (!draft || !this.onDelete || this.saving) return;
    this.saving = true;
    this.editErrorMessage = null;
    this.renderLabelEditorScreen();
    try {
      await this.onDelete(draft.id);
      this.items = this.items.filter((tag) => tag.id !== draft.id);
      this.selectedIds.delete(draft.id);
      this.applyFilter();
      this.onChange?.(this.getSelectedIds());
      this.saving = false;
      this.renderLabelsScreen();
    } catch (error) {
      this.editErrorMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to delete label.';
      this.saving = false;
      this.renderLabelEditorScreen();
    } finally {
      this.saving = false;
    }
  }

  private upsertLocalItem(item: TagPickerItem): void {
    const index = this.items.findIndex((tag) => tag.id === item.id);
    if (index >= 0) {
      this.items = this.items.map((tag) => (tag.id === item.id ? item : tag));
      return;
    }
    this.items = [...this.items, item];
  }

  private requestClose(): void {
    this.onRequestClose?.();
    this.menuController?.close();
    this.trigger?.focus();
  }

  private setTagSelected(tagId: number, selected: boolean): void {
    if (selected) this.selectedIds.add(tagId);
    else this.selectedIds.delete(tagId);
    this.createErrorMessage = null;
    this.renderTrigger();
    this.renderSelectedSection();
    this.renderList();
    this.onChange?.(this.getSelectedIds());
  }

  private createCreateRow(title: string): HTMLButtonElement {
    const row = document.createElement('button');
    row.type = 'button';
    row.dataset.role = 'goal-tag-picker-create';
    row.dataset.createTitle = title;
    row.className =
      'flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80 disabled:cursor-wait disabled:opacity-70';
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
      'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-semibold text-indigo-600';
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
      'inline-flex min-w-0 max-w-[140px] shrink-0 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium leading-4 text-slate-700 transition-colors hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80';
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

  private createPanelSelectedChip(tag: TagPickerItem): HTMLButtonElement {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className =
      'inline-flex min-w-0 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200/80';
    chip.dataset.role = 'goal-tag-picker-panel-selected-chip';
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
      this.renderSelectedSection();
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
