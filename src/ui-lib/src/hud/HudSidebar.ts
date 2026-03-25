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

export type HudSidebarRailButtonOptions = {
  icon: IconName;
  title: string;
  ariaLabel: string;
  className?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
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
  return button;
}

export function setHudSidebarRailButtonActive(
  button: HTMLButtonElement,
  active: boolean
): void {
  button.dataset.active = active ? 'true' : 'false';
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
