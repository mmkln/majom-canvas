import { createIcon, type IconName } from '../../../../../ui-lib/src/hud/icons.ts';

type IconButtonTone = 'ghost' | 'subtle' | 'inverted';

type IconButtonSize = 'sm' | 'md';

type IconButtonOptions = {
  icon: IconName;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  title: string;
  ariaLabel?: string;
  className?: string;
  dataRole?: string;
  onClick?: () => void;
};

export function IconButton(options: IconButtonOptions): HTMLButtonElement {
  const tone = options.tone ?? 'ghost';
  const size = options.size ?? 'sm';
  const button = document.createElement('button');
  button.type = 'button';
  button.title = options.title;
  button.setAttribute('aria-label', options.ariaLabel ?? options.title);
  button.className = [
    'inline-flex items-center justify-center rounded-full transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80',
    size === 'md' ? 'h-9 w-9' : 'h-[34px] w-[34px]',
    tone === 'subtle'
      ? 'bg-slate-50 text-slate-600 hover:bg-slate-100 active:bg-slate-200 active:text-slate-800'
      : tone === 'inverted'
        ? 'bg-white/10 text-white hover:bg-white/16 active:bg-white/22'
        : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 active:text-slate-950',
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

  const icon = createIcon(options.icon, {
    size: size === 'md' ? 16 : 14,
    strokeWidth: 1.9,
  });
  icon.classList.add('shrink-0');
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  return button;
}

export type { IconButtonOptions, IconButtonSize, IconButtonTone };
