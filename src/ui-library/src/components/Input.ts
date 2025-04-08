// src/components/Input.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component';
import { EventEmitter } from '../core/EventEmitter';
import { ThemeManager } from '../core/Theme';

export interface InputProps {
  value: string;
  placeholder?: string;
  className?: string;
  type?: string;
  onChange?: (value: string) => void;
}

export class Input extends Component<InputProps> {
  private changeEmitter = new EventEmitter<string>();

  constructor(props: InputProps) {
    super(props);
    if (props.onChange) {
      this.onChange(props.onChange);
    }
  }

  protected createElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = this.props.type || 'text';
    input.value = this.props.value;
    input.placeholder = this.props.placeholder || '';
    input.addEventListener('input', () => {
      this.changeEmitter.emit(input.value);
    });

    const theme = ThemeManager.getTheme();
    const baseStyles = theme.input;
    input.className = twMerge(baseStyles, this.props.className || '');

    return input;
  }

  public onChange(listener: (value: string) => void): void {
    this.changeEmitter.on(listener);
  }

  public setValue(value: string): void {
    this.updateProps({ value });
  }

  public getValue(): string {
    return (this.element as HTMLInputElement).value;
  }
}
