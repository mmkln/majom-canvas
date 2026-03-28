type SurfaceOptions = {
  tagName?: 'section' | 'div' | 'aside' | 'header';
  tone?: 'plain' | 'card' | 'muted' | 'dark';
  radius?: 'none' | 'lg' | 'xl' | '2xl';
  overflow?: 'visible' | 'hidden';
  padding?: 'none' | 'section';
  className?: string;
  dataRole?: string;
};

export function Surface(options: SurfaceOptions = {}): HTMLElement {
  const element = document.createElement(options.tagName ?? 'section');
  const tone = options.tone ?? 'card';
  const radius = options.radius ?? 'xl';
  const overflow = options.overflow ?? 'hidden';
  const padding = options.padding ?? 'none';

  const toneClass =
    tone === 'plain'
      ? ''
      : tone === 'muted'
        ? 'bg-slate-50'
        : tone === 'dark'
          ? 'bg-slate-800 text-white'
          : 'bg-white';

  const radiusClass =
    radius === 'none'
      ? ''
      : radius === 'lg'
        ? 'rounded-[16px]'
        : radius === '2xl'
          ? 'rounded-[24px]'
          : 'rounded-[20px]';
  const paddingClass = padding === 'section' ? 'px-5 py-5 md:px-6' : '';

  element.className = [
    overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible',
    toneClass,
    radiusClass,
    paddingClass,
    options.className ?? '',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    element.dataset.role = options.dataRole;
  }
  return element;
}

export type { SurfaceOptions };
