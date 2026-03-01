import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { EventEmitter } from '../core/EventEmitter.ts';

export interface TextareaProps {
  value?: string;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'inline';
  rows?: number;
  onInput?: (value: string) => void;
  onChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export class Textarea extends Component<TextareaProps> {
  private inputEmitter = new EventEmitter<string>();

  constructor(props: TextareaProps) {
    super(props);
    if (props.onInput) {
      this.onInput(props.onInput);
    }
    if (props.onChange) {
      this.onChange(props.onChange);
    }
  }

  public createElement(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    if (this.props.value !== undefined) textarea.value = this.props.value;
    if (this.props.placeholder) textarea.placeholder = this.props.placeholder;
    if (this.props.disabled) textarea.disabled = true;
    if (this.props.name) textarea.name = this.props.name;
    if (this.props.id) textarea.id = this.props.id;
    if (this.props.required) textarea.required = true;
    if (this.props.minLength !== undefined)
      textarea.minLength = this.props.minLength;
    if (this.props.maxLength !== undefined)
      textarea.maxLength = this.props.maxLength;
    textarea.rows = this.props.rows ?? 3;
    if (this.props.invalid) {
      textarea.setAttribute('aria-invalid', 'true');
    }

    textarea.addEventListener('input', () => {
      this.inputEmitter.emit(textarea.value);
    });

    const variant = this.props.variant ?? 'default';
    const baseStyles = [
      'w-full outline-none transition-colors',
      'disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400',
      'aria-[invalid=true]:border-rose-300 aria-[invalid=true]:bg-rose-50 aria-[invalid=true]:ring-rose-100',
      'resize-y',
    ].join(' ');
    const variantStyles: Record<'default' | 'inline', string> = {
      default:
        'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 md:text-sm',
      inline:
        'rounded-lg border border-indigo-200/70 bg-indigo-50/70 px-3 py-2 text-base font-semibold text-indigo-700 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 md:text-sm',
    };
    textarea.className = twMerge(
      baseStyles,
      variantStyles[variant],
      this.props.className || ''
    );

    return textarea;
  }

  public onInput(listener: (value: string) => void): void {
    this.inputEmitter.on(listener);
  }

  public onChange(listener: (value: string) => void): void {
    this.inputEmitter.on(listener);
  }

  public setValue(value: string): void {
    this.props = { ...this.props, value };
    const textarea = this.element as HTMLTextAreaElement;
    textarea.value = value;
  }

  public getValue(): string {
    return (this.element as HTMLTextAreaElement).value;
  }
}
