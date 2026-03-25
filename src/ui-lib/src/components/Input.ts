// src/components/Input.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { EventEmitter } from '../core/EventEmitter.ts';
import {
  HUD_INPUT_BASE_CLASS,
  HUD_INPUT_DEFAULT_CLASS,
  HUD_INPUT_INLINE_CLASS,
} from '../hud/classNames.ts';

export interface InputProps {
  value?: string;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'inline';
  type?: string;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
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
  private inputEmitter = new EventEmitter<string>();

  constructor(props: InputProps) {
    super(props);
    if (props.onInput) {
      this.onInput(props.onInput);
    }
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
    if (this.props.minLength !== undefined)
      input.minLength = this.props.minLength;
    if (this.props.maxLength !== undefined)
      input.maxLength = this.props.maxLength;
    if (this.props.pattern) input.pattern = this.props.pattern;
    if (this.props.invalid) {
      input.setAttribute('aria-invalid', 'true');
    }

    input.addEventListener('input', () => {
      this.inputEmitter.emit(input.value);
    });

    const variant = this.props.variant ?? 'default';
    const variantStyles: Record<'default' | 'inline', string> = {
      default: HUD_INPUT_DEFAULT_CLASS,
      inline: HUD_INPUT_INLINE_CLASS,
    };
    input.className = twMerge(
      HUD_INPUT_BASE_CLASS,
      variantStyles[variant],
      this.props.className || ''
    );

    return input;
  }

  public onInput(listener: (value: string) => void): void {
    this.inputEmitter.on(listener);
  }

  public onChange(listener: (value: string) => void): void {
    this.inputEmitter.on(listener);
  }

  public setValue(value: string): void {
    this.props = { ...this.props, value };
    const input = this.element as HTMLInputElement;
    input.value = value;
  }

  public getValue(): string {
    return (this.element as HTMLInputElement).value;
  }
}
