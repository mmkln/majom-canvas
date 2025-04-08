// src/components/Button.ts
import { twMerge } from 'tailwind-merge';
import { Component } from '../core/Component';
import { ThemeManager } from '../core/Theme';

export interface ButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export class Button extends Component<ButtonProps> {
  protected createElement(): HTMLElement {
    const button = document.createElement('button');
    button.innerText = this.props.text;
    if (this.props.onClick) button.addEventListener('click', this.props.onClick);

    const theme = ThemeManager.getTheme();
    const baseStyles = 'font-semibold rounded focus:outline-none focus:ring-2';
    const sizeStyles = {
      small: 'px-2 py-1 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg',
    };

    button.className = twMerge(
      baseStyles,
      theme.button[this.props.variant || 'primary'],
      sizeStyles[this.props.size || 'medium'],
      this.props.className || ''
    );

    return button;
  }
}
