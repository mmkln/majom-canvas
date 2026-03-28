type InlineTextEditorOptions = {
  value: string;
  placeholder: string;
  multiline?: boolean;
  displayClassName: string;
  inputClassName: string;
  emptyClassName: string;
  displayDataRole: string;
  editorDataRole: string;
  onCommit: (value: string) => void;
};

export class InlineTextEditor {
  public readonly element: HTMLDivElement;
  private editing = false;
  private value: string;

  constructor(private readonly options: InlineTextEditorOptions) {
    this.value = options.value;
    this.element = document.createElement('div');
    this.render();
  }

  private render(): void {
    const host = document.createElement('div');
    host.className = 'min-w-0';

    if (this.editing) {
      const control = document.createElement('textarea');
      control.className = this.options.inputClassName;
      control.value = this.value;
      control.placeholder = this.options.placeholder;
      control.rows = this.options.multiline ? 2 : 1;
      control.dataset.role = this.options.editorDataRole;
      control.addEventListener('input', () => this.syncHeight(control));
      control.addEventListener('blur', () => this.commit(control.value));
      control.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.cancel();
          return;
        }
        if (!this.options.multiline && event.key === 'Enter') {
          event.preventDefault();
          control.blur();
          return;
        }
        if (
          this.options.multiline &&
          event.key === 'Enter' &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          control.blur();
        }
      });

      host.append(control);
      this.element.replaceChildren(host);

      queueMicrotask(() => {
        control.focus();
        control.setSelectionRange(control.value.length, control.value.length);
        this.syncHeight(control);
      });
      return;
    }

    const display = document.createElement('button');
    display.type = 'button';
    display.className = [
      'w-full appearance-none bg-transparent p-0 text-left',
      this.options.displayClassName,
      this.value.trim().length === 0 ? this.options.emptyClassName : '',
    ]
      .join(' ')
      .trim();
    display.dataset.role = this.options.displayDataRole;
    display.textContent =
      this.value.trim().length > 0 ? this.value : this.options.placeholder;
    display.addEventListener('click', () => this.startEditing());

    host.append(display);
    this.element.replaceChildren(host);
  }

  private startEditing(): void {
    this.editing = true;
    this.render();
  }

  private commit(nextValue: string): void {
    const normalized = nextValue.trim();
    const changed = normalized !== this.value.trim();
    this.value = normalized;
    this.editing = false;
    this.render();
    if (changed) {
      this.options.onCommit(normalized);
    }
  }

  private cancel(): void {
    this.editing = false;
    this.render();
  }

  private syncHeight(control: HTMLTextAreaElement): void {
    control.style.height = '0px';
    control.style.height = `${control.scrollHeight}px`;
  }
}

export type { InlineTextEditorOptions };
