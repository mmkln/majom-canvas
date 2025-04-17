// src/components/Input.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { EventEmitter } from '../core/EventEmitter.ts';

export interface InputProps {
  value?: string;
  placeholder?: string;
  className?: string;
  type?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export class Input extends Component<InputProps> {
  private changeEmitter = new EventEmitter<string>();

  constructor(props: InputProps) {
    super(props);
    if (props.onChange) {
      this.onChange(props.onChange);
    }
  }

  public createElement(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = this.props.type || 'text';
    if (this.props.value !== undefined) input.value = this.props.value;
    if (this.props.placeholder) input.placeholder = this.props.placeholder;
    if (this.props.disabled) input.disabled = true;
    if (this.props.name) input.name = this.props.name;
    if (this.props.id) input.id = this.props.id;
    if (this.props.autoFocus) input.autofocus = true;
    if (this.props.autoComplete) input.autocomplete = this.props.autoComplete;
    if (this.props.required) input.required = true;
    if (this.props.minLength !== undefined) input.minLength = this.props.minLength;
    if (this.props.maxLength !== undefined) input.maxLength = this.props.maxLength;
    if (this.props.pattern) input.pattern = this.props.pattern;

    input.addEventListener('input', () => {
      this.changeEmitter.emit(input.value);
    });

    // Tailwind base styles for input (matching modern UI/UX)
    const baseStyles = [
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
    ].join(' ');
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
