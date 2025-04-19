import { Component } from '../core/Component.ts';

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
    select.className = this.props.className ?? '';
    this.props.items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      if (this.props.selectedValue === item.value) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
    select.addEventListener('change', e => {
      const value = (e.target as HTMLSelectElement).value;
      if (this.props.onChange) this.props.onChange(value);
    });
    return select;
  }
}
