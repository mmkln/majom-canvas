import {
  HUD_MENU_ITEM_ACCENT_CREATE_CLASS,
  HUD_MENU_ITEM_BASE_CLASS,
  HUD_MENU_ITEM_DANGER_CLASS,
  HUD_MENU_ITEM_DEFAULT_CLASS,
  HUD_MENU_ITEM_DISABLED_CLASS,
  HUD_MENU_ITEM_EMPHASIS_CLASS,
  HUD_MENU_ITEM_HINT_TRIGGER_CLASS,
  HUD_MENU_ITEM_SELECTED_CLASS,
} from './classNames.ts';
import { createIcon } from './icons.ts';

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
  hint?: string;
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
    button.classList.add(...HUD_MENU_ITEM_DISABLED_CLASS.split(' '));
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }
  const hint = typeof options.hint === 'string' ? options.hint.trim() : '';
  if (hint.length > 0) {
    button.setAttribute('aria-description', hint);
  }

  const content = document.createElement('span');
  content.className = 'inline-flex min-w-0 items-center gap-2';
  if (options.leading) {
    options.leading.classList.add('shrink-0');
    content.appendChild(options.leading);
  }

  const textContent = document.createElement('span');
  textContent.className = 'inline-flex min-w-0 items-center gap-1.5';

  const label = document.createElement('span');
  label.className = 'truncate';
  label.textContent = options.label;
  textContent.appendChild(label);

  if (hint) {
    const hintTrigger = document.createElement('span');
    hintTrigger.className = HUD_MENU_ITEM_HINT_TRIGGER_CLASS;
    hintTrigger.title = hint;
    hintTrigger.setAttribute('aria-label', hint);
    hintTrigger.setAttribute('data-hud-dropdown-hint', 'true');
    hintTrigger.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    hintTrigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    const hintIcon = createIcon('exclamation-circle', {
      size: 12,
      strokeWidth: 1.8,
    });
    hintIcon.classList.add('shrink-0');
    hintIcon.setAttribute('aria-hidden', 'true');
    hintTrigger.appendChild(hintIcon);
    textContent.appendChild(hintTrigger);
  }

  content.appendChild(textContent);

  button.appendChild(content);

  if (options.trailing) {
    button.appendChild(options.trailing);
  }

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}
