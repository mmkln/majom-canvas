import { createHudIconButton } from './HudIconButton.ts';
import type { IconName } from './icons.ts';

export const HUD_SIDEBAR_TOKENS = {
  compactWidthPx: 64,
  comfortWidthPx: 72,
  sectionGapPx: 12,
  controlGapPx: 6,
  railButtonSizePx: 36,
  railButtonRadiusPx: 12,
  dividerWidthPx: 48,
} as const;

export const HUD_SIDEBAR_RAIL_BUTTON_CLASS =
  'h-9 w-9 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 active:text-slate-900 focus-visible:ring-slate-300 data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:hover:bg-indigo-50 data-[active=true]:hover:text-indigo-700 data-[active=true]:active:bg-indigo-100';

export const HUD_SIDEBAR_DIVIDER_CLASS = 'block h-px bg-slate-200/85';

export type HudSidebarRailButtonBadgeVariant = 'count' | 'dot' | 'pill';
export type HudSidebarRailButtonBadgeTone =
  | 'accent'
  | 'success'
  | 'warning'
  | 'neutral'
  | 'danger';

export type HudSidebarRailButtonBadgeOptions = {
  variant?: HudSidebarRailButtonBadgeVariant;
  tone?: HudSidebarRailButtonBadgeTone;
  value?: string | number | null;
  max?: number;
  title?: string;
  hidden?: boolean;
};

export type HudSidebarRailButtonOptions = {
  icon: IconName;
  title: string;
  ariaLabel: string;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: HudSidebarRailButtonBadgeOptions | null;
  onClick?: (event: MouseEvent) => void;
};

const HUD_SIDEBAR_RAIL_BADGE_BASE_CLASS =
  'pointer-events-none absolute -right-1 -top-1 z-10 items-center justify-center shadow-[0_0_0_2px_white]';

const HUD_SIDEBAR_RAIL_BADGE_CLASS_BY_VARIANT: Record<
  HudSidebarRailButtonBadgeVariant,
  string
> = {
  count:
    'inline-flex min-w-[1rem] rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
  dot: 'inline-flex h-2.5 w-2.5 rounded-full',
  pill: 'inline-flex min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none uppercase tracking-[0.04em]',
};

const HUD_SIDEBAR_RAIL_BADGE_CLASS_BY_TONE: Record<
  HudSidebarRailButtonBadgeTone,
  string
> = {
  accent: 'bg-indigo-500 text-white',
  success: 'bg-emerald-500 text-white',
  warning: 'bg-amber-500 text-white',
  neutral: 'bg-slate-500 text-white',
  danger: 'bg-rose-500 text-white',
};

export function createHudSidebarRailButton(
  options: HudSidebarRailButtonOptions
): HTMLButtonElement {
  const button = createHudIconButton({
    icon: options.icon,
    title: options.title,
    ariaLabel: options.ariaLabel,
    tone: 'text',
    size: 'md',
    disabled: options.disabled,
    onClick: options.onClick,
    className:
      `${HUD_SIDEBAR_RAIL_BUTTON_CLASS} ${options.className ?? ''}`.trim(),
  });
  button.setAttribute('data-sidebar-rail-button', 'true');
  setHudSidebarRailButtonActive(button, options.active ?? false);
  setHudSidebarRailButtonBadge(button, options.badge ?? null);
  return button;
}

export function setHudSidebarRailButtonActive(
  button: HTMLButtonElement,
  active: boolean
): void {
  button.dataset.active = active ? 'true' : 'false';
}

export function createHudSidebarRailButtonBadge(
  options: HudSidebarRailButtonBadgeOptions = {}
): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.setAttribute('data-component', 'HudSidebarRailBadge');
  badge.setAttribute('data-sidebar-rail-badge', 'true');
  badge.setAttribute('aria-hidden', 'true');
  applyHudSidebarRailButtonBadgeState(badge, options);
  return badge;
}

export function setHudSidebarRailButtonBadge(
  button: HTMLButtonElement,
  options: HudSidebarRailButtonBadgeOptions | null
): HTMLSpanElement | null {
  let badge = button.querySelector<HTMLSpanElement>(
    '[data-sidebar-rail-badge="true"]'
  );

  if (!options) {
    if (badge) {
      badge.style.display = 'none';
      badge.textContent = '';
      badge.removeAttribute('title');
    }
    return badge;
  }

  if (!badge) {
    badge = createHudSidebarRailButtonBadge(options);
    button.classList.add('relative', 'overflow-visible');
    button.appendChild(badge);
  }

  applyHudSidebarRailButtonBadgeState(badge, options);
  return badge;
}

export function createHudSidebarDivider(
  className: string = ''
): HTMLSpanElement {
  const divider = document.createElement('span');
  divider.setAttribute('aria-hidden', 'true');
  divider.setAttribute('data-component', 'HudSidebarDivider');
  divider.className = `${HUD_SIDEBAR_DIVIDER_CLASS} ${className}`.trim();
  divider.style.width = `${HUD_SIDEBAR_TOKENS.dividerWidthPx}px`;
  return divider;
}

function applyHudSidebarRailButtonBadgeState(
  badge: HTMLSpanElement,
  options: HudSidebarRailButtonBadgeOptions
): void {
  const variant = options.variant ?? 'count';
  const tone = options.tone ?? 'accent';
  const text = formatHudSidebarRailBadgeValue(options, variant);
  const hidden = options.hidden === true || (variant !== 'dot' && !text);

  badge.className =
    `${HUD_SIDEBAR_RAIL_BADGE_BASE_CLASS} ${HUD_SIDEBAR_RAIL_BADGE_CLASS_BY_VARIANT[variant]} ${HUD_SIDEBAR_RAIL_BADGE_CLASS_BY_TONE[tone]}`.trim();
  badge.dataset.variant = variant;
  badge.dataset.tone = tone;
  badge.style.display = hidden ? 'none' : 'inline-flex';
  badge.textContent = variant === 'dot' ? '' : text;
  if (options.title) {
    badge.title = options.title;
  } else {
    badge.removeAttribute('title');
  }
}

function formatHudSidebarRailBadgeValue(
  options: HudSidebarRailButtonBadgeOptions,
  variant: HudSidebarRailButtonBadgeVariant
): string {
  if (variant === 'dot') return '';

  const rawValue = options.value;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    if (rawValue <= 0) return '';
    if (variant === 'count') {
      const max = options.max ?? 9;
      return rawValue > max ? `${max}+` : String(rawValue);
    }
    return String(rawValue);
  }

  const text = typeof rawValue === 'string' ? rawValue.trim() : '';
  return text;
}
