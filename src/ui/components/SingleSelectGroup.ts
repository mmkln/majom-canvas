type SelectOption<T> = {
  id: string;
  value: T;
  label: string;
};

type RenderContext<T> = {
  option: SelectOption<T>;
  button: HTMLButtonElement;
  content: HTMLElement;
  active: boolean;
  expanded: boolean;
};

type SingleSelectGroupOptions<T> = {
  options: SelectOption<T>[];
  onSelect: (value: T) => void;
  renderContent?: (option: SelectOption<T>) => HTMLElement;
  applyStyles?: (context: RenderContext<T>) => void;
  isEqual?: (a: T, b: T) => boolean;
  collapseInactive?: boolean;
  collapseMode?: 'expand-active' | 'center-reveal' | 'none';
  buttonWidth?: number;
  expandedActiveWidth?: number;
  buttonPadding?: string;
};

type OptionEntry<T> = {
  option: SelectOption<T>;
  button: HTMLButtonElement;
  content: HTMLElement;
  isFirst: boolean;
};

export class SingleSelectGroup<T> {
  public readonly element: HTMLDivElement;
  private readonly options: OptionEntry<T>[] = [];
  private readonly onSelect: (value: T) => void;
  private readonly renderContent: (option: SelectOption<T>) => HTMLElement;
  private readonly applyStyles?: (context: RenderContext<T>) => void;
  private readonly isEqual: (a: T, b: T) => boolean;
  private readonly collapseMode: 'expand-active' | 'center-reveal' | 'none';
  private readonly buttonWidth: number | null;
  private readonly expandedActiveWidth: number | null;
  private readonly buttonPadding: string;
  private isExpanded: boolean;
  private activeValue: T | null = null;

  constructor(options: SingleSelectGroupOptions<T>) {
    this.onSelect = options.onSelect;
    this.renderContent = options.renderContent ?? this.defaultRenderContent;
    this.applyStyles = options.applyStyles;
    this.isEqual = options.isEqual ?? ((a, b) => a === b);
    this.collapseMode =
      options.collapseMode ??
      (options.collapseInactive ? 'expand-active' : 'none');
    this.buttonWidth =
      options.buttonWidth ?? (this.collapseMode === 'none' ? null : 32);
    this.expandedActiveWidth =
      options.expandedActiveWidth ?? this.buttonWidth;
    this.buttonPadding = options.buttonPadding ?? '0 10px';
    this.isExpanded = this.collapseMode === 'none';

    this.element = document.createElement('div');
    this.element.style.display = 'inline-flex';
    this.element.style.alignItems = 'center';
    this.element.style.gap = '0';
    this.element.style.padding = '0';
    this.element.style.borderRadius = '999px';
    this.element.style.border = '1px solid #e5e7eb';
    this.element.style.background = '#f3f4f6';
    this.element.style.overflow = 'hidden';
    this.element.setAttribute('role', 'radiogroup');

    const total = options.options.length;
    options.options.forEach((option, index) => {
      const isFirst = index === 0;
      const isLast = index === total - 1;
      const button = document.createElement('button');
      button.type = 'button';
      button.title = option.label;
      button.setAttribute('aria-label', option.label);
      button.setAttribute('role', 'radio');
      if (this.buttonWidth) {
        button.style.width = `${this.buttonWidth}px`;
        button.style.minWidth = `${this.buttonWidth}px`;
      } else {
        button.style.minWidth = '28px';
      }
      button.style.height = '32px';
      button.style.padding = this.buttonPadding;
      button.style.border = 'none';
      button.style.background = 'transparent';
      button.style.display = 'inline-flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.cursor = 'pointer';
      button.style.transition =
        'background 150ms ease, border-color 150ms ease, opacity 200ms ease, max-width 220ms ease, width 220ms ease, transform 220ms ease, padding 220ms ease';
      button.style.overflow = 'hidden';
      button.style.transformOrigin = 'center';
      button.style.borderLeft = isFirst ? 'none' : '1px solid #e5e7eb';
      button.style.borderTopLeftRadius = isFirst ? '8px' : '0';
      button.style.borderBottomLeftRadius = isFirst ? '8px' : '0';
      button.style.borderTopRightRadius = isLast ? '8px' : '0';
      button.style.borderBottomRightRadius = isLast ? '8px' : '0';

      const content = this.renderContent(option);
      button.appendChild(content);
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (
          this.activeValue !== null &&
          this.isEqual(option.value, this.activeValue)
        ) {
          return;
        }
        this.setActive(option.value);
        this.onSelect(option.value);
      });
      button.addEventListener('mouseenter', () => {
        if (
          this.activeValue !== null &&
          this.isEqual(option.value, this.activeValue)
        ) {
          return;
        }
        button.style.background = '#e5e7eb';
      });
      button.addEventListener('mouseleave', () => {
        this.updateStyles();
      });

      this.element.appendChild(button);
      this.options.push({ option, button, content, isFirst });
    });

    if (this.collapseMode !== 'none' && this.buttonWidth) {
      const baseWidth = this.buttonWidth;
      const activeWidth =
        this.collapseMode === 'center-reveal' && this.expandedActiveWidth
          ? this.expandedActiveWidth
          : baseWidth;
      const totalWidth = baseWidth * (total - 1) + activeWidth + (total - 1);
      this.element.style.width = `${totalWidth}px`;
    }

    if (this.collapseMode !== 'none') {
      this.element.addEventListener('mouseenter', () => {
        this.setExpanded(true);
      });
      this.element.addEventListener('mouseleave', () => {
        this.setExpanded(false);
      });
      this.element.addEventListener('focusin', () => {
        this.setExpanded(true);
      });
      this.element.addEventListener('focusout', () => {
        if (this.element.contains(document.activeElement)) return;
        this.setExpanded(false);
      });
    }

    this.updateStyles();
  }

  public setActive(value: T | null): void {
    this.activeValue = value;
    this.updateStyles();
  }

  private setExpanded(expanded: boolean): void {
    if (this.collapseMode === 'none') return;
    if (this.isExpanded === expanded) return;
    this.isExpanded = expanded;
    this.updateStyles();
  }

  private updateStyles(): void {
    const showAll =
      this.collapseMode === 'none' ||
      this.isExpanded ||
      this.activeValue === null;
    const isCenterReveal = this.collapseMode === 'center-reveal';
    this.element.style.justifyContent = showAll
      ? 'flex-start'
      : isCenterReveal
        ? 'center'
        : 'flex-start';
    this.options.forEach((entry) => {
      const active =
        this.activeValue !== null &&
        this.isEqual(entry.option.value, this.activeValue);
      entry.button.setAttribute('aria-checked', active ? 'true' : 'false');
      entry.button.tabIndex = active ? 0 : -1;
      if (this.applyStyles) {
        this.applyStyles({
          option: entry.option,
          button: entry.button,
          content: entry.content,
          active,
          expanded: showAll,
        });
      } else {
        entry.button.style.background = active ? '#ffffff' : 'transparent';
      }

      if (showAll) {
        entry.button.style.opacity = '1';
        entry.button.style.pointerEvents = 'auto';
        entry.button.style.padding = this.buttonPadding;
        if (this.buttonWidth) {
          const width =
            isCenterReveal && active && this.expandedActiveWidth
              ? this.expandedActiveWidth
              : this.buttonWidth;
          entry.button.style.width = `${width}px`;
          entry.button.style.minWidth = `${width}px`;
          entry.button.style.maxWidth = `${width}px`;
        } else {
          entry.button.style.width = 'auto';
          entry.button.style.maxWidth = 'none';
        }
        entry.button.style.flex = '0 0 auto';
        entry.button.style.transform = 'scaleX(1)';
        entry.button.style.borderLeft =
          entry.isFirst || !this.buttonWidth ? 'none' : '1px solid #e5e7eb';
      } else if (isCenterReveal && active) {
        entry.button.style.opacity = '1';
        entry.button.style.pointerEvents = 'auto';
        entry.button.style.padding = this.buttonPadding;
        if (this.buttonWidth) {
          entry.button.style.width = `${this.buttonWidth}px`;
          entry.button.style.minWidth = `${this.buttonWidth}px`;
          entry.button.style.maxWidth = `${this.buttonWidth}px`;
        } else {
          entry.button.style.width = 'auto';
          entry.button.style.maxWidth = 'none';
        }
        entry.button.style.flex = '0 0 auto';
        entry.button.style.transform = 'scaleX(1)';
        entry.button.style.borderLeft = 'none';
      } else if (active) {
        entry.button.style.opacity = '1';
        entry.button.style.pointerEvents = 'auto';
        entry.button.style.padding = this.buttonPadding;
        entry.button.style.width = '100%';
        entry.button.style.minWidth = '0';
        entry.button.style.maxWidth = '100%';
        entry.button.style.flex = '1 1 auto';
        entry.button.style.transform = 'scaleX(1)';
        entry.button.style.borderLeft = 'none';
      } else {
        entry.button.style.opacity = '0';
        entry.button.style.pointerEvents = 'none';
        entry.button.style.padding = '0';
        entry.button.style.width = '0';
        entry.button.style.minWidth = '0';
        entry.button.style.maxWidth = '0';
        entry.button.style.flex = '0 0 0px';
        entry.button.style.transform = 'scaleX(0.6)';
        entry.button.style.borderLeft = 'none';
      }
    });
  }

  private defaultRenderContent(option: SelectOption<T>): HTMLElement {
    const span = document.createElement('span');
    span.textContent = option.label;
    span.style.fontSize = '12px';
    span.style.fontWeight = '600';
    span.style.color = '#374151';
    return span;
  }
}
