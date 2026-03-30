import {
  AnchoredMenu,
  createSegmentedControl,
  createSurface,
  createTextButton,
  setTextButtonState,
  type SegmentedControl,
} from '../hud/index.ts';
import {
  TagPickerField,
  type TagPickerFieldOptions,
  type TagPickerItem,
} from './TagPickerField.ts';

export type BulkTagActionMode = 'add' | 'remove' | 'replace';

export type BulkTagActionPopoverOptions = {
  triggerButton: HTMLButtonElement;
  items?: TagPickerItem[];
  loading?: boolean;
  errorMessage?: string | null;
  selectedIds?: number[];
  mode?: BulkTagActionMode;
  modeLabels: Record<BulkTagActionMode, string>;
  applyLabels: Record<BulkTagActionMode, string>;
  searchPlaceholder?: string;
  onCreate?: TagPickerFieldOptions['onCreate'];
  onApply?: (payload: { mode: BulkTagActionMode; tagIds: number[] }) => void;
};

export class BulkTagActionPopover {
  public readonly element: HTMLDivElement;

  private readonly triggerButton: HTMLButtonElement;
  private readonly panel: HTMLDivElement;
  private readonly menuController: AnchoredMenu;
  private readonly modeControl: SegmentedControl<BulkTagActionMode>;
  private readonly tagPicker: TagPickerField;
  private readonly applyButton: HTMLButtonElement;
  private readonly modeLabels: Record<BulkTagActionMode, string>;
  private readonly applyLabels: Record<BulkTagActionMode, string>;
  private mode: BulkTagActionMode;
  private selectedIds: number[] = [];
  private loading = false;
  private errorMessage: string | null = null;
  private onCreate?: TagPickerFieldOptions['onCreate'];
  private onApply?: (payload: {
    mode: BulkTagActionMode;
    tagIds: number[];
  }) => void;

  constructor(options: BulkTagActionPopoverOptions) {
    this.triggerButton = options.triggerButton;
    this.triggerButton.setAttribute('aria-haspopup', 'dialog');
    this.triggerButton.setAttribute('aria-expanded', 'false');
    this.triggerButton.dataset.role = 'bulk-tag-action-trigger';
    this.modeLabels = options.modeLabels;
    this.applyLabels = options.applyLabels;
    this.mode = options.mode ?? 'add';
    this.selectedIds = [...(options.selectedIds ?? [])];
    this.loading = options.loading ?? false;
    this.errorMessage = options.errorMessage ?? null;
    this.onCreate = options.onCreate;
    this.onApply = options.onApply;

    this.element = document.createElement('div');
    this.element.className = 'relative inline-flex shrink-0';
    this.element.setAttribute('data-component', 'BulkTagActionPopover');

    this.panel = createSurface({
      className:
        'fixed left-0 top-0 z-[120] hidden w-[320px] min-w-[320px] overflow-hidden !rounded-xl p-0',
    });
    this.panel.dataset.role = 'bulk-tag-action-panel';
    this.panel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    this.panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.close();
      this.triggerButton.focus();
    });

    const content = document.createElement('div');
    content.className = 'flex flex-col';

    this.modeControl = createSegmentedControl<BulkTagActionMode>({
      options: [
        {
          id: 'bulk-tag-mode-add',
          value: 'add',
          label: this.modeLabels.add,
        },
        {
          id: 'bulk-tag-mode-remove',
          value: 'remove',
          label: this.modeLabels.remove,
        },
        {
          id: 'bulk-tag-mode-replace',
          value: 'replace',
          label: this.modeLabels.replace,
        },
      ],
      value: this.mode,
      size: 'sm',
      variant: 'bare',
      fullWidth: true,
      ariaLabel: 'Bulk tag action mode',
      onChange: (mode) => {
        this.mode = mode;
        this.syncApplyButton();
      },
    });
    this.modeControl.element.dataset.role = 'bulk-tag-action-mode';

    this.tagPicker = new TagPickerField({
      variant: 'inline',
      items: options.items ?? [],
      selectedIds: this.selectedIds,
      loading: this.loading,
      errorMessage: this.errorMessage,
      searchPlaceholder: options.searchPlaceholder,
      onCreate: this.onCreate,
      onChange: (selectedIds) => {
        this.selectedIds = [...selectedIds];
        this.syncApplyButton();
      },
    });

    this.applyButton = createTextButton({
      text: this.getApplyLabel(),
      tone: 'primary',
      size: 'sm',
      fullWidth: true,
      onClick: (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.handleApply();
      },
    });
    this.applyButton.dataset.role = 'bulk-tag-action-apply';

    const modeSection = document.createElement('div');
    modeSection.className = 'px-4 pb-3 pt-3';
    modeSection.appendChild(this.modeControl.element);

    const pickerSection = document.createElement('div');
    pickerSection.className = 'border-t border-slate-100 px-4 py-3';
    pickerSection.appendChild(this.tagPicker.element);

    const actionSection = document.createElement('div');
    actionSection.className = 'border-t border-slate-100 px-4 py-3';
    actionSection.appendChild(this.applyButton);

    content.append(modeSection, pickerSection, actionSection);
    this.panel.appendChild(content);

    this.element.append(this.triggerButton, this.panel);

    this.menuController = new AnchoredMenu({
      container: this.element,
      panel: this.panel,
      positioning: 'viewport',
      onOpenChange: (open) => {
        this.triggerButton.setAttribute(
          'aria-expanded',
          open ? 'true' : 'false'
        );
      },
    });
    this.menuController.mount();

    this.triggerButton.addEventListener('click', this.handleTriggerClick);
    this.syncApplyButton();
  }

  public update(
    options: Partial<
      Pick<
        BulkTagActionPopoverOptions,
        | 'items'
        | 'loading'
        | 'errorMessage'
        | 'selectedIds'
        | 'mode'
        | 'onCreate'
        | 'onApply'
      >
    >
  ): void {
    if (options.mode !== undefined) {
      this.mode = options.mode;
      this.modeControl.setValue(this.mode);
    }
    if (options.selectedIds !== undefined) {
      this.selectedIds = [...options.selectedIds];
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
    if (options.onApply !== undefined) {
      this.onApply = options.onApply;
    }

    this.tagPicker.update({
      items: options.items,
      selectedIds: options.selectedIds,
      loading: options.loading,
      errorMessage: options.errorMessage,
      onCreate: options.onCreate,
    });
    this.syncApplyButton();
    if (this.menuController.isOpen()) {
      this.menuController.reposition();
    }
  }

  public reset(): void {
    this.mode = 'add';
    this.selectedIds = [];
    this.modeControl.setValue(this.mode);
    this.tagPicker.update({ selectedIds: [] });
    this.syncApplyButton();
  }

  public close(): void {
    this.menuController.close();
  }

  public destroy(): void {
    this.triggerButton.removeEventListener('click', this.handleTriggerClick);
    this.menuController.close();
    this.menuController.unmount();
    this.tagPicker.destroy();
    this.modeControl.destroy();
  }

  private readonly handleTriggerClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    if (this.menuController.isOpen()) {
      this.close();
      return;
    }
    this.menuController.openAt({
      anchor: this.triggerButton,
      placement: 'bottom-start',
      gap: 8,
      margin: 8,
    });
    window.requestAnimationFrame(() => {
      this.tagPicker.focusSearch();
    });
  };

  private handleApply(): void {
    if (this.loading || this.selectedIds.length === 0) {
      return;
    }
    this.onApply?.({
      mode: this.mode,
      tagIds: [...this.selectedIds],
    });
    this.close();
    this.reset();
  }

  private syncApplyButton(): void {
    this.applyButton.textContent = this.getApplyLabel();
    setTextButtonState(this.applyButton, {
      disabled: this.loading || this.selectedIds.length === 0,
    });
  }

  private getApplyLabel(): string {
    return this.applyLabels[this.mode];
  }
}
