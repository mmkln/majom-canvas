// src/components/Button.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import {
  HUD_BUTTON_BASE_CLASS,
  HUD_DESTRUCTIVE_BUTTON_CLASS,
  HUD_PRIMARY_BUTTON_CLASS,
} from '../hud/classNames.ts';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'lightgray'
  | 'success'
  | 'accent';
export type ButtonSize =
  | 'default'
  | 'sm'
  | 'lg'
  | 'icon'
  | 'icon-sm'
  | 'icon-lg';

export interface ButtonProps {
  text?: string;
  onClick?: (e: MouseEvent) => void;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  children?: string | HTMLElement; // For icon or custom content
  tooltip?: string;
}

export class Button extends Component<ButtonProps> {
  public createElement(): HTMLElement {
    const button = document.createElement('button');
    button.type = this.props.type || 'button';
    if (this.props.text) {
      button.innerText = this.props.text;
    }
    if (this.props.children) {
      if (typeof this.props.children === 'string') {
        button.innerText = this.props.children;
      } else {
        button.appendChild(this.props.children);
      }
    }
    if (this.props.onClick) {
      button.addEventListener('click', this.props.onClick);
    }
    if (this.props.disabled) {
      button.disabled = true;
    }
    if (this.props.tooltip) {
      button.title = this.props.tooltip;
    }

    const baseStyles = [
      'cursor-pointer whitespace-nowrap',
      '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    ].join(' ');

    const variantStyles: Record<ButtonVariant, string> = {
      default: HUD_PRIMARY_BUTTON_CLASS,
      destructive: HUD_DESTRUCTIVE_BUTTON_CLASS,
      outline:
        `${HUD_BUTTON_BASE_CLASS} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100`,
      secondary:
        `${HUD_BUTTON_BASE_CLASS} bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300`,
      ghost:
        `${HUD_BUTTON_BASE_CLASS} border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200`,
      link:
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium leading-5 text-indigo-600 transition-[color,box-shadow] duration-150 ease-out hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:text-slate-400',
      lightgray:
        `${HUD_BUTTON_BASE_CLASS} border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-200`,
      success:
        'inline-flex items-center justify-center rounded-lg border border-transparent bg-emerald-600 px-4 text-sm font-medium leading-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-[background-color,color,border-color,box-shadow] duration-150 ease-out hover:bg-emerald-500 active:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none',
      accent:
        'inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-600 px-4 text-sm font-medium leading-5 text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-[background-color,color,border-color,box-shadow] duration-150 ease-out hover:bg-sky-500 active:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none',
    };
    const sizeStyles: Record<ButtonSize, string> = {
      default: 'h-9 px-4',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-11 px-5',
      icon: 'h-9 w-9',
      'icon-sm': 'h-8 w-8',
      'icon-lg': 'h-11 w-11',
    };

    const variant = this.props.variant || 'default';
    const size = this.props.size || 'default';
    button.className = twMerge(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      this.props.className || ''
    );

    return button;
  }
}
