export type HudBadgeTone = 'neutral' | 'accent';

export type HudBadgeOptions = {
  label: string;
  tone?: HudBadgeTone;
  title?: string;
  className?: string;
};

const HUD_BADGE_BASE_CLASS =
  'inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em]';

const HUD_BADGE_TONE_CLASS: Record<HudBadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-500',
  accent: 'bg-indigo-100 text-indigo-700',
};

export function createHudBadge(options: HudBadgeOptions): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.setAttribute('data-component', 'HudBadge');
  badge.className =
    `${HUD_BADGE_BASE_CLASS} ${HUD_BADGE_TONE_CLASS[options.tone ?? 'neutral']} ${options.className ?? ''}`.trim();
  badge.textContent = options.label;
  if (typeof options.title === 'string' && options.title.trim().length > 0) {
    badge.title = options.title;
  }
  return badge;
}
