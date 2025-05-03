import { Component } from '../core/Component.ts';
import { twMerge } from 'tailwind-merge';

export interface SelectItem {
  value: string;
  label: string;
}

export interface SelectProps {
  items: SelectItem[];
  className?: string;
  selectedValue?: string;
  onChange?: (value: string) => void;
}

export class Select extends Component<SelectProps> {
  constructor(readonly props: SelectProps) {
    super(props);
  }

  protected createElement(): HTMLElement {
    const select = document.createElement('select');
    // Apply default Button-like Tailwind styles + user classes
    const baseStyles = [
      'appearance-none inline-flex items-center justify-between w-full gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground ring-offset-background transition-colors cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ].join(' ');
    select.className = twMerge(baseStyles, this.props.className ?? '');
    this.props.items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      if (this.props.selectedValue === item.value) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
    select.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      if (this.props.onChange) this.props.onChange(value);
    });
    return select;
  }
}
