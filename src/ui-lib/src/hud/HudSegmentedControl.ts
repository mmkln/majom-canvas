import {
  HUD_SEGMENTED_CONTROL_CLASS,
  HUD_SEGMENTED_ITEM_ACTIVE_CLASS,
  HUD_SEGMENTED_ITEM_CLASS,
  HUD_SEGMENTED_ITEM_DISABLED_CLASS,
  HUD_SEGMENTED_ITEM_INACTIVE_CLASS,
  HUD_SEGMENTED_ITEM_MD_CLASS,
  HUD_SEGMENTED_ITEM_SM_CLASS,
} from './classNames.ts';

export type HudSegmentedControlSize = 'sm' | 'md';

export type HudSegmentedControlOption<T> = {
  id: string;
  value: T;
  label: string;
  title?: string;
  disabled?: boolean;
};

type HudSegmentedControlOptions<T> = {
  options: HudSegmentedControlOption<T>[];
  value?: T | null;
  size?: HudSegmentedControlSize;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  isEqual?: (a: T, b: T) => boolean;
  onChange?: (value: T) => void;
};

type Entry<T> = {
  option: HudSegmentedControlOption<T>;
  button: HTMLButtonElement;
};

const classBySize: Record<HudSegmentedControlSize, string> = {
  sm: HUD_SEGMENTED_ITEM_SM_CLASS,
  md: HUD_SEGMENTED_ITEM_MD_CLASS,
};

function toggleClassNames(
  element: HTMLElement,
  classNames: string,
  enabled: boolean
): void {
  classNames
    .split(/\s+/)
    .filter(Boolean)
    .forEach((token) => element.classList.toggle(token, enabled));
}

export class HudSegmentedControl<T> {
  public readonly element: HTMLDivElement;

  private readonly entries: Entry<T>[] = [];
  private readonly options: HudSegmentedControlOptions<T>;
  private readonly isEqual: (a: T, b: T) => boolean;
  private value: T | null;

  constructor(options: HudSegmentedControlOptions<T>) {
    this.options = options;
    this.isEqual = options.isEqual ?? ((a, b) => a === b);
    this.value = options.value ?? null;

    this.element = document.createElement('div');
    this.element.className =
      `${HUD_SEGMENTED_CONTROL_CLASS} ${options.className ?? ''}`.trim();
    if (options.fullWidth) {
      this.element.style.display = 'flex';
      this.element.style.width = '100%';
    }
    this.element.setAttribute('role', 'radiogroup');
    if (options.ariaLabel) {
      this.element.setAttribute('aria-label', options.ariaLabel);
    }

    this.render();
    this.element.addEventListener('keydown', this.handleKeyDown);
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

  public focus(): void {
    const active = this.getActiveEntry();
    const firstEnabled = this.entries.find((entry) => !this.isDisabled(entry));
    (active ?? firstEnabled)?.button.focus();
  }

  public destroy(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }

  private render(): void {
    this.element.innerHTML = '';
    this.entries.length = 0;

    const sizeClass = classBySize[this.options.size ?? 'md'];
    this.options.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${HUD_SEGMENTED_ITEM_CLASS} ${sizeClass}`;
      if (this.options.fullWidth) {
        button.style.flex = '1 1 0';
        button.style.minWidth = '0';
      }
      button.setAttribute('role', 'radio');
      button.dataset.index = String(index);
      button.textContent = option.label;
      if (option.title) {
        button.title = option.title;
      }
      button.addEventListener('click', () => this.handleOptionClick(option));

      this.entries.push({ option, button });
      this.element.appendChild(button);
    });

    this.syncButtons();
  }

  private syncButtons(): void {
    const activeEntry = this.getActiveEntry();
    const fallbackFocusable =
      activeEntry ??
      this.entries.find((entry) => !this.isDisabled(entry)) ??
      null;

    this.entries.forEach((entry) => {
      const isActive = this.isActive(entry);
      const isDisabled = this.isDisabled(entry);
      entry.button.setAttribute('aria-checked', isActive ? 'true' : 'false');
      entry.button.disabled = isDisabled;
      entry.button.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      entry.button.tabIndex = fallbackFocusable === entry ? 0 : -1;

      toggleClassNames(entry.button, HUD_SEGMENTED_ITEM_ACTIVE_CLASS, isActive);
      toggleClassNames(
        entry.button,
        HUD_SEGMENTED_ITEM_INACTIVE_CLASS,
        !isActive && !isDisabled
      );
      toggleClassNames(
        entry.button,
        HUD_SEGMENTED_ITEM_DISABLED_CLASS,
        isDisabled
      );
    });
  }

  private handleOptionClick(option: HudSegmentedControlOption<T>): void {
    const entry = this.entries.find((item) => item.option.id === option.id);
    if (!entry || this.isDisabled(entry) || this.isActive(entry)) return;

    this.value = option.value;
    this.syncButtons();
    this.options.onChange?.(option.value);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const current = document.activeElement as HTMLButtonElement | null;
    if (!current || !this.element.contains(current)) return;

    if (
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowLeft' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    event.preventDefault();

    const enabledEntries = this.entries.filter(
      (entry) => !this.isDisabled(entry)
    );
    if (enabledEntries.length === 0) return;

    const currentEntry =
      this.entries.find((entry) => entry.button === current) ??
      this.getActiveEntry();
    if (!currentEntry) return;

    let nextEntry: Entry<T> | null = null;
    if (event.key === 'Home') {
      nextEntry = enabledEntries[0];
    } else if (event.key === 'End') {
      nextEntry = enabledEntries[enabledEntries.length - 1];
    } else {
      const currentEnabledIndex = enabledEntries.indexOf(currentEntry);
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex =
        (currentEnabledIndex + delta + enabledEntries.length) %
        enabledEntries.length;
      nextEntry = enabledEntries[nextIndex];
    }

    if (!nextEntry) return;
    nextEntry.button.focus();
    if (!this.isActive(nextEntry)) {
      this.value = nextEntry.option.value;
      this.syncButtons();
      this.options.onChange?.(nextEntry.option.value);
    }
  };

  private getActiveEntry(): Entry<T> | null {
    return this.entries.find((entry) => this.isActive(entry)) ?? null;
  }

  private isActive(entry: Entry<T>): boolean {
    return this.value !== null && this.isEqual(entry.option.value, this.value);
  }

  private isDisabled(entry: Entry<T>): boolean {
    return Boolean(this.options.disabled || entry.option.disabled);
  }
}

export function createHudSegmentedControl<T>(
  options: HudSegmentedControlOptions<T>
): HudSegmentedControl<T> {
  return new HudSegmentedControl(options);
}
