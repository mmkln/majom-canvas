// src/components/Button.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { ThemeManager } from '../core/Theme.ts';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'lightgray';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

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

    // Tailwind-based style logic
    const baseStyles = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
      'cursor-pointer',
    ].join(' ');

    const variantStyles: Record<ButtonVariant, string> = {
      default: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80 transition-colors', // force white text for primary
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 transition-colors',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 transition-colors',
      ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-colors',
      link: 'text-primary underline-offset-4 hover:underline active:text-primary/80 transition-colors',
      lightgray: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 border border-gray-300 transition-colors',
    };
    const sizeStyles: Record<ButtonSize, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10',
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
