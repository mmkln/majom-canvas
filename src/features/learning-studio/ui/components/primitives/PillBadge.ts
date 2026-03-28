type PillBadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverted';

type PillBadgeOptions = {
  label: string;
  tone?: PillBadgeTone;
  size?: 'sm' | 'md';
  uppercase?: boolean;
  className?: string;
  dataRole?: string;
};

export function PillBadge(options: PillBadgeOptions): HTMLSpanElement {
  const element = document.createElement('span');
  const tone = options.tone ?? 'neutral';
  const size = options.size ?? 'sm';
  const toneClass =
    tone === 'info'
      ? 'bg-sky-50 text-sky-700'
      : tone === 'success'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'warning'
          ? 'bg-amber-50 text-amber-700'
          : tone === 'danger'
            ? 'bg-rose-50 text-rose-700'
            : tone === 'inverted'
              ? 'bg-white/10 text-white/80'
              : 'bg-slate-100 text-slate-700';
  const sizeClass =
    size === 'md'
      ? 'px-3 py-1.5 text-xs tracking-[0.06em]'
      : 'px-2.5 py-1 text-[11px] tracking-[0.08em]';

  element.className = [
    'inline-flex items-center rounded-full font-semibold',
    sizeClass,
    options.uppercase ? 'uppercase' : '',
    toneClass,
    options.className ?? '',
  ]
    .join(' ')
    .trim();

  if (options.dataRole) {
    element.dataset.role = options.dataRole;
  }
  element.textContent = options.label;
  return element;
}

export type { PillBadgeOptions, PillBadgeTone };
