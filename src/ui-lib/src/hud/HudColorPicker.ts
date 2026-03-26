export type HudColorPickerOption<T> = {
  id: string;
  value: T;
  label: string;
  swatchColor: string;
  backgroundColor?: string;
  borderColor?: string;
  title?: string;
  disabled?: boolean;
};

export type HudColorPickerOptions<T> = {
  options: HudColorPickerOption<T>[];
  value?: T | null;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  isEqual?: (a: T, b: T) => boolean;
  onChange?: (value: T) => void;
};

type Entry<T> = {
  option: HudColorPickerOption<T>;
  button: HTMLButtonElement;
  swatch: HTMLSpanElement;
};

function toggleClassNames(
  element: Element,
  classNames: string,
  enabled: boolean
): void {
  classNames
    .split(/\s+/)
    .filter(Boolean)
    .forEach((token) => element.classList.toggle(token, enabled));
}

export class HudColorPicker<T> {
  public readonly element: HTMLDivElement;

  private readonly options: HudColorPickerOptions<T>;
  private readonly entries: Entry<T>[] = [];
  private readonly isEqual: (a: T, b: T) => boolean;
  private value: T | null;

  constructor(options: HudColorPickerOptions<T>) {
    this.options = options;
    this.isEqual = options.isEqual ?? ((a, b) => a === b);
    this.value = options.value ?? null;

    this.element = document.createElement('div');
    this.element.setAttribute('data-component', 'HudColorPicker');
    this.element.className = [
      'flex flex-wrap gap-2',
      options.className ?? '',
    ]
      .join(' ')
      .trim();
    this.element.setAttribute('role', 'radiogroup');
    if (options.ariaLabel) {
      this.element.setAttribute('aria-label', options.ariaLabel);
    }

    this.render();
  }

  public getValue(): T | null {
    return this.value;
  }

  public setValue(value: T | null): void {
    this.value = value;
    this.syncButtons();
  }

  public setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    this.syncButtons();
  }

  private render(): void {
    this.element.innerHTML = '';
    this.entries.length = 0;

    this.options.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className =
        'inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:hover:opacity-100';
      button.setAttribute('role', 'radio');
      button.dataset.value = String(option.value);
      button.title = option.title ?? option.label;
      button.setAttribute('aria-label', option.label);

      const swatch = document.createElement('span');
      swatch.className =
        'inline-flex h-[18px] w-[18px] shrink-0 rounded-full border transition-[border-color,box-shadow,opacity] duration-150 ease-out';
      swatch.style.background = option.swatchColor;
      swatch.style.borderColor = 'rgba(15, 23, 42, 0.08)';

      button.append(swatch);
      button.addEventListener('click', () => this.handleOptionClick(option));

      this.entries.push({ option, button, swatch });
      this.element.appendChild(button);
    });

    this.syncButtons();
  }

  private syncButtons(): void {
    this.entries.forEach((entry) => {
      const isActive = this.isActive(entry);
      const isDisabled = this.isDisabled(entry);
      entry.button.disabled = isDisabled;
      entry.button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      entry.button.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      entry.button.dataset.selected = isActive ? 'true' : 'false';
      toggleClassNames(entry.button, 'opacity-60', isDisabled);
      entry.swatch.style.borderColor =
        isActive && !isDisabled
          ? 'rgba(79, 70, 229, 0.48)'
          : 'rgba(15, 23, 42, 0.08)';
      entry.swatch.style.boxShadow =
        isActive && !isDisabled
          ? '0 0 0 2px #ffffff, 0 0 0 4px rgba(99, 102, 241, 0.42)'
          : 'none';
      entry.swatch.style.opacity = isDisabled ? '0.55' : '1';
    });
  }

  private handleOptionClick(option: HudColorPickerOption<T>): void {
    const entry = this.entries.find((item) => item.option.id === option.id);
    if (!entry || this.isDisabled(entry) || this.isActive(entry)) return;

    this.value = option.value;
    this.syncButtons();
    this.options.onChange?.(option.value);
  }

  private isActive(entry: Entry<T>): boolean {
    return this.value !== null && this.isEqual(entry.option.value, this.value);
  }

  private isDisabled(entry: Entry<T>): boolean {
    return this.options.disabled === true || entry.option.disabled === true;
  }
}

export function createHudColorPicker<T>(
  options: HudColorPickerOptions<T>
): HudColorPicker<T> {
  return new HudColorPicker(options);
}
