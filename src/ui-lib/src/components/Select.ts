import { Component } from '../core/Component.ts';
import { twMerge } from 'tailwind-merge';
import {
  HUD_SELECT_BASE_CLASS,
  HUD_SELECT_DEFAULT_CLASS,
  HUD_SELECT_INLINE_CLASS,
} from '../hud/classNames.ts';

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
    const variantStyles: Record<'default' | 'inline', string> = {
      default: HUD_SELECT_DEFAULT_CLASS,
      inline: HUD_SELECT_INLINE_CLASS,
    };
    select.className = twMerge(
      HUD_SELECT_BASE_CLASS,
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
