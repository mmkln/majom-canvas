// src/components/Checkbox.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { EventEmitter } from '../core/EventEmitter.ts';
import { ThemeManager } from '../core/Theme.ts';

export interface CheckboxProps {
  checked: boolean;
  label?: string;
  className?: string;
  onChange?: (checked: boolean) => void;
}

export class Checkbox extends Component<CheckboxProps> {
  private changeEmitter = new EventEmitter<boolean>();
  private container!: HTMLDivElement;
  private input!: HTMLInputElement;
  private labelElement?: HTMLLabelElement;

  constructor(props: CheckboxProps) {
    super(props);
    if (props.onChange) {
      this.onChange(props.onChange);
    }
  }

  protected createElement(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'flex items-center';

    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.checked = this.props.checked;
    this.input.addEventListener('change', () => {
      this.changeEmitter.emit(this.input.checked);
    });

    const theme = ThemeManager.getTheme();
    const baseStyles = theme.checkbox;
    this.input.className = twMerge(baseStyles, this.props.className || '');

    this.container.appendChild(this.input);

    if (this.props.label) {
      this.labelElement = document.createElement('label');
      this.labelElement.innerText = this.props.label;
      this.labelElement.className = 'ml-2';
      this.container.appendChild(this.labelElement);
    }

    return this.container;
  }

  public onChange(listener: (checked: boolean) => void): void {
    this.changeEmitter.on(listener);
  }

  public setChecked(checked: boolean): void {
    this.updateProps({ checked });
  }

  public isChecked(): boolean {
    return this.input.checked;
  }
}
