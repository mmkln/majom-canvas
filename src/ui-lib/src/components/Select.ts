import { Component } from '../core/Component.ts';
import { twMerge } from 'tailwind-merge';

export interface SelectItem {
  value: string;
  label: string;
}

export interface SelectProps {
  items: SelectItem[];
  className?: string;
  variant?: 'default' | 'inline';
  selectedValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
}

export class Select extends Component<SelectProps> {
  constructor(readonly props: SelectProps) {
    super(props);
  }

  protected createElement(): HTMLElement {
    const select = document.createElement('select');
    if (this.props.disabled) {
      select.disabled = true;
    }
    if (this.props.invalid) {
      select.setAttribute('aria-invalid', 'true');
    }
    const variant = this.props.variant ?? 'default';
    const baseStyles = [
      'w-full cursor-pointer outline-none transition-colors',
      'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
      'aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50 aria-[invalid=true]:ring-rose-100',
    ].join(' ');
    const variantStyles: Record<'default' | 'inline', string> = {
      default:
        'h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base text-slate-800 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 md:text-sm',
      inline:
        'h-[34px] rounded-lg border border-indigo-200/70 bg-indigo-50/70 px-3 text-base font-semibold text-indigo-700 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 md:text-sm',
    };
    select.className = twMerge(
      baseStyles,
      variantStyles[variant],
      this.props.className ?? ''
    );
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
