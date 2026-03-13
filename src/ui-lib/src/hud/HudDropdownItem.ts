import {
  HUD_MENU_ITEM_ACCENT_CREATE_CLASS,
  HUD_MENU_ITEM_BASE_CLASS,
  HUD_MENU_ITEM_DANGER_CLASS,
  HUD_MENU_ITEM_DEFAULT_CLASS,
  HUD_MENU_ITEM_DISABLED_CLASS,
  HUD_MENU_ITEM_EMPHASIS_CLASS,
  HUD_MENU_ITEM_SELECTED_CLASS,
} from './classNames.ts';

export type HudMenuItemVariant =
  | 'default'
  | 'emphasis'
  | 'selected'
  | 'accent-create'
  | 'danger';
export type HudDropdownItemTone = 'default' | 'accent' | 'danger';

type HudDropdownItemOptions = {
  label: string;
  variant?: HudMenuItemVariant;
  tone?: HudDropdownItemTone;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  leading?: HTMLElement | null;
  trailing?: HTMLElement | null;
  onClick?: (event: MouseEvent) => void;
};

const classByVariant: Record<HudMenuItemVariant, string> = {
  default: HUD_MENU_ITEM_DEFAULT_CLASS,
  emphasis: HUD_MENU_ITEM_EMPHASIS_CLASS,
  selected: HUD_MENU_ITEM_SELECTED_CLASS,
  'accent-create': HUD_MENU_ITEM_ACCENT_CREATE_CLASS,
  danger: HUD_MENU_ITEM_DANGER_CLASS,
};

const toneToVariant: Record<HudDropdownItemTone, HudMenuItemVariant> = {
  default: 'default',
  accent: 'accent-create',
  danger: 'danger',
};

export function createHudDropdownItem(
  options: HudDropdownItemOptions
): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('data-component', 'HudDropdownItem');
  button.type = 'button';
  const tooltip =
    typeof options.tooltip === 'string' ? options.tooltip.trim() : '';
  if (tooltip.length > 0) {
    button.title = tooltip;
  }
  const explicitVariant = options.variant;
  const fallbackVariant = options.active
    ? 'selected'
    : toneToVariant[options.tone ?? 'default'];
  const variant = explicitVariant ?? fallbackVariant;
  button.className =
    `${HUD_MENU_ITEM_BASE_CLASS} ${classByVariant[variant]} ${options.className ?? ''}`.trim();
  if (variant === 'selected') {
    button.setAttribute('aria-current', 'true');
  }
  if (options.disabled) {
    button.classList.add(HUD_MENU_ITEM_DISABLED_CLASS);
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  const content = document.createElement('span');
  content.className = 'inline-flex min-w-0 items-center gap-2';
  if (options.leading) {
    content.appendChild(options.leading);
  }

  const label = document.createElement('span');
  label.className = 'truncate';
  label.textContent = options.label;
  content.appendChild(label);

  button.appendChild(content);

  if (options.trailing) {
    button.appendChild(options.trailing);
  }

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}
