// src/components/Input.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { EventEmitter } from '../core/EventEmitter.ts';

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
    const baseStyles = [
      'w-full outline-none transition-colors',
      'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
      'aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50 aria-[invalid=true]:ring-rose-100',
    ].join(' ');
    const variantStyles: Record<'default' | 'inline', string> = {
      default:
        'h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200',
      inline:
        'h-[34px] rounded-lg border border-indigo-200/70 bg-indigo-50/70 px-3 text-sm font-semibold text-indigo-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100',
    };
    input.className = twMerge(
      baseStyles,
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
