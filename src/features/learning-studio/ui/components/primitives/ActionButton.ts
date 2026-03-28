import { createIcon, type IconName } from '../../../../../ui-lib/src/hud/icons.ts';

type ActionButtonTone =
  | 'neutral'
  | 'subtle'
  | 'ghost'
  | 'primary'
  | 'inverted';

type ActionButtonSize = 'sm' | 'md';

type ActionButtonIconPlacement = 'leading' | 'trailing';

type ActionButtonOptions = {
  label?: string;
  tone?: ActionButtonTone;
  size?: ActionButtonSize;
  icon?: IconName;
  iconPlacement?: ActionButtonIconPlacement;
  iconSize?: number;
  iconStrokeWidth?: number;
  leading?: HTMLElement;
  trailing?: HTMLElement;
  className?: string;
  dataRole?: string;
  onClick?: () => void;
};

export function ActionButton(options: ActionButtonOptions): HTMLButtonElement {
  const tone = options.tone ?? 'neutral';
  const size = options.size ?? 'sm';
  const iconPlacement = options.iconPlacement ?? 'leading';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = [
    'inline-flex items-center justify-center gap-2 rounded-full transition-[background-color,color] duration-150',
    size === 'md' ? 'px-4 py-2.5 text-sm' : 'px-3 py-2 text-[13px]',
    tone === 'subtle'
      ? 'bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
      : tone === 'ghost'
        ? 'bg-transparent text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800 active:bg-slate-100 active:text-slate-900'
      : tone === 'primary'
        ? 'bg-slate-900 text-white font-semibold hover:bg-slate-800 active:bg-slate-700'
      : tone === 'inverted'
        ? 'bg-white/10 text-white font-semibold hover:bg-white/16 active:bg-white/22'
        : 'bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
    options.className ?? '',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    button.dataset.role = options.dataRole;
  }
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  const icon = options.icon
    ? createIcon(options.icon, {
        size: options.iconSize ?? (size === 'md' ? 16 : 14),
        strokeWidth: options.iconStrokeWidth ?? 2,
      })
    : null;
  if (icon) {
    icon.classList.add('shrink-0');
    icon.setAttribute('aria-hidden', 'true');
  }

  if (options.leading) {
    button.append(options.leading);
  }
  if (icon && iconPlacement === 'leading') {
    button.append(icon);
  }
  if (options.label) {
    const label = document.createElement('span');
    label.textContent = options.label;
    button.append(label);
  }
  if (icon && iconPlacement === 'trailing') {
    button.append(icon);
  }
  if (options.trailing) {
    button.append(options.trailing);
  }

  return button;
}

export type {
  ActionButtonIconPlacement,
  ActionButtonOptions,
  ActionButtonSize,
  ActionButtonTone,
};
