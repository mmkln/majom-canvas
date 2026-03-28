type SectionTitleOptions = {
  text: string;
  level?: 2 | 3 | 4;
  tone?: 'default' | 'muted' | 'strong';
  className?: string;
  dataRole?: string;
};

export function SectionTitle(options: SectionTitleOptions): HTMLHeadingElement {
  const level = options.level ?? 3;
  const tone = options.tone ?? 'default';
  const element = document.createElement(`h${level}`) as HTMLHeadingElement;
  element.className = [
    'text-[15px] font-medium tracking-tight',
    tone === 'muted'
      ? 'text-slate-300'
      : tone === 'strong'
        ? 'text-slate-950'
        : 'text-slate-900',
    options.className ?? '',
  ]
    .join(' ')
    .trim();
  if (options.dataRole) {
    element.dataset.role = options.dataRole;
  }
  element.textContent = options.text;
  return element;
}

export type { SectionTitleOptions };
