export type InlineTextEditorOptions = {
  value: string;
  placeholder: string;
  multiline?: boolean;
  editorRows?: number;
  displayClassName: string;
  inputClassName: string;
  emptyDisplayClassName?: string;
  displayDataRole?: string;
  editorDataRole?: string;
  displayAriaLabel?: string | ((hasValue: boolean) => string);
  normalizeValue?: (value: string) => string;
  onInput?: (value: string) => void;
  onCommit?: (value: string) => void;
  onCancel?: () => void;
};

export class InlineTextEditor {
  public readonly element: HTMLDivElement;

  private editing = false;
  private committedValue: string;
  private draftValue: string;
  private editorControl: HTMLTextAreaElement | null = null;
  private displayControl: HTMLButtonElement | null = null;

  constructor(private readonly options: InlineTextEditorOptions) {
    this.committedValue = this.normalizeValue(options.value);
    this.draftValue = this.committedValue;
    this.element = document.createElement('div');
    this.element.className = 'min-w-0';
    this.render();
  }

  public setValue(value: string): void {
    const normalized = this.normalizeValue(value);
    this.committedValue = normalized;
    this.draftValue = normalized;

    if (this.editing && this.editorControl) {
      this.editorControl.value = normalized;
      this.syncHeight(this.editorControl);
      return;
    }

    this.render();
  }

  public getValue(): string {
    return this.committedValue;
  }

  public getDraftValue(): string {
    if (this.editing && this.editorControl) {
      return this.editorControl.value;
    }
    return this.draftValue;
  }

  public isEditing(): boolean {
    return this.editing;
  }

  public startEditing(
    options: { focus?: boolean; select?: boolean } = {}
  ): void {
    if (this.editing) {
      if (options.focus ?? true) {
        this.focusEditor({ select: options.select ?? false });
      }
      return;
    }

    this.editing = true;
    this.draftValue = this.committedValue;
    this.render();

    if (options.focus ?? true) {
      queueMicrotask(() => {
        this.focusEditor({ select: options.select ?? false });
      });
    }
  }

  public showDisplay(options: { focus?: boolean } = {}): void {
    if (!this.editing) {
      if (options.focus ?? true) {
        this.focusDisplay();
      }
      return;
    }

    this.editing = false;
    this.render();
    if (options.focus ?? true) {
      this.focusDisplay();
    }
  }

  public commit(options: { focusDisplay?: boolean } = {}): void {
    const nextValue = this.normalizeValue(this.getDraftValue());
    const changed = nextValue !== this.committedValue;
    this.committedValue = nextValue;
    this.draftValue = nextValue;
    this.editing = false;
    this.render();

    if (options.focusDisplay) {
      this.focusDisplay();
    }

    if (changed) {
      this.options.onCommit?.(nextValue);
    }
  }

  public cancel(options: { focusDisplay?: boolean } = {}): void {
    this.draftValue = this.committedValue;
    this.editing = false;
    this.render();

    if (options.focusDisplay) {
      this.focusDisplay();
    }

    this.options.onCancel?.();
  }

  public focusEditor(options: { select?: boolean } = {}): void {
    this.editorControl?.focus();
    if (options.select && this.editorControl) {
      this.editorControl.select();
      return;
    }
    if (this.editorControl) {
      const end = this.editorControl.value.length;
      this.editorControl.setSelectionRange(end, end);
    }
  }

  public focusDisplay(): void {
    this.displayControl?.focus();
  }

  private render(): void {
    this.element.replaceChildren(this.editing ? this.renderEditor() : this.renderDisplay());
  }

  private renderDisplay(): HTMLDivElement {
    const host = document.createElement('div');
    host.className = 'min-w-0';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = [
      'w-full appearance-none bg-transparent p-0 text-left',
      this.hasContent() ? this.options.displayClassName : this.options.emptyDisplayClassName ?? this.options.displayClassName,
    ]
      .filter(Boolean)
      .join(' ');
    if (this.options.displayDataRole) {
      button.dataset.role = this.options.displayDataRole;
    }
    if (this.options.displayAriaLabel) {
      const label =
        typeof this.options.displayAriaLabel === 'function'
          ? this.options.displayAriaLabel(this.hasContent())
          : this.options.displayAriaLabel;
      button.setAttribute('aria-label', label);
    }
    button.textContent = this.hasContent()
      ? this.committedValue
      : this.options.placeholder;
    button.addEventListener('click', () => this.startEditing());

    this.displayControl = button;
    this.editorControl = null;

    host.append(button);
    return host;
  }

  private renderEditor(): HTMLDivElement {
    const host = document.createElement('div');
    host.className = 'min-w-0';

    const control = document.createElement('textarea');
    control.className = this.options.inputClassName;
    control.value = this.draftValue;
    control.placeholder = this.options.placeholder;
    control.rows = this.options.multiline ? (this.options.editorRows ?? 2) : 1;
    if (this.options.editorDataRole) {
      control.dataset.role = this.options.editorDataRole;
    }

    control.addEventListener('input', () => {
      this.draftValue = control.value;
      this.options.onInput?.(control.value);
      this.syncHeight(control);
    });
    control.addEventListener('blur', () => {
      this.commit({ focusDisplay: false });
    });
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancel({ focusDisplay: false });
        return;
      }

      if (!this.options.multiline && event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.commit({ focusDisplay: true });
        return;
      }

      if (
        this.options.multiline &&
        event.key === 'Enter' &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.commit({ focusDisplay: true });
      }
    });

    this.editorControl = control;
    this.displayControl = null;

    host.append(control);
    queueMicrotask(() => this.syncHeight(control));
    return host;
  }

  private hasContent(): boolean {
    return this.committedValue.trim().length > 0;
  }

  private normalizeValue(value: string): string {
    if (this.options.normalizeValue) {
      return this.options.normalizeValue(value);
    }
    return value;
  }

  private syncHeight(control: HTMLTextAreaElement): void {
    if (!this.options.multiline) return;
    control.style.height = '0px';
    control.style.height = `${control.scrollHeight}px`;
  }
}
