// src/components/Button.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component.ts';
import { ThemeManager } from '../core/Theme.ts';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
}

export class Button extends Component<ButtonProps> {
  protected createElement(): HTMLElement {
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

    // Tailwind-based style logic
    const baseStyles = [
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    ].join(' ');

    const variantStyles: Record<ButtonVariant, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
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

