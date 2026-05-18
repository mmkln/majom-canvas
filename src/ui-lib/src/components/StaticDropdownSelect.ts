import { DropdownSelectBase } from './DropdownSelectBase.ts';

type StaticDropdownSelectOptions<T> = {
  size?: 'sm' | 'md';
  value?: T | null;
  placeholder: string;
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getHint?: (item: T) => string | null | undefined;
  onSelect: (item: T) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  portalTarget?: HTMLElement;
  renderTriggerLeading?: (item: T | null) => HTMLElement | null;
  renderTriggerTrailing?: (item: T | null) => HTMLElement | null;
  renderOptionLeading?: (item: T) => HTMLElement | null;
  renderOptionTrailing?: (item: T, selected: boolean) => HTMLElement | null;
};

export class StaticDropdownSelect<T> {
  public readonly element: HTMLDivElement;
  private readonly base: DropdownSelectBase<T>;

  constructor(options: StaticDropdownSelectOptions<T>) {
    this.base = new DropdownSelectBase({
      size: options.size,
      value: options.value,
      placeholder: options.placeholder,
      getKey: options.getKey,
      getLabel: options.getLabel,
      getHint: options.getHint,
      onSelect: options.onSelect,
      className: options.className,
      disabled: options.disabled,
      ariaLabel: options.ariaLabel,
      portalTarget: options.portalTarget,
      renderTriggerLeading: options.renderTriggerLeading,
      renderTriggerTrailing: options.renderTriggerTrailing,
      renderOptionLeading: options.renderOptionLeading,
      renderOptionTrailing: options.renderOptionTrailing,
    });
    this.base.setItems(options.items);
    this.element = this.base.element;
  }

  public setSelected(value: T | null): void {
    this.base.setSelected(value);
  }

  public setDisabled(disabled: boolean): void {
    this.base.setDisabled(disabled);
  }

  public destroy(): void {
    this.base.destroy();
  }
}
