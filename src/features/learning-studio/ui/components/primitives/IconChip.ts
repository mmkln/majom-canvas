import { createIcon, type IconName } from '../../../../../ui-lib/src/hud/icons.ts';

type IconChipTone =
  | 'neutral'
  | 'dark'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

type IconChipOptions = {
  icon: IconName;
  tone?: IconChipTone;
  size?: number;
  strokeWidth?: number;
  className?: string;
  iconClassName?: string;
  dataRole?: string;
};

export function IconChip(options: IconChipOptions): HTMLSpanElement {
  const tone = options.tone ?? 'neutral';
  const toneClass =
    tone === 'dark'
      ? 'bg-slate-900 text-white'
      : tone === 'info'
        ? 'bg-sky-100 text-sky-600'
        : tone === 'success'
          ? 'bg-emerald-100 text-emerald-600'
          : tone === 'warning'
            ? 'bg-amber-100 text-amber-600'
            : tone === 'danger'
              ? 'bg-rose-100 text-rose-600'
              : 'bg-slate-100 text-slate-600';

  const element = document.createElement('span');
  element.className = [
    'inline-flex shrink-0 items-center justify-center rounded-full',
    toneClass,
    options.className ?? 'h-10 w-10',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    element.dataset.role = options.dataRole;
  }

  const icon = createIcon(options.icon, {
    size: options.size ?? 18,
    strokeWidth: options.strokeWidth ?? 1.9,
  });
  if (options.iconClassName) {
    icon.classList.add(...options.iconClassName.split(' ').filter(Boolean));
  }
  icon.setAttribute('aria-hidden', 'true');
  element.append(icon);
  return element;
}

export type { IconChipOptions, IconChipTone };
