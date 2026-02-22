import {
  HUD_DROPDOWN_ITEM_ACTIVE_CLASS,
  HUD_DROPDOWN_ITEM_CLASS,
  HUD_DROPDOWN_ITEM_DEFAULT_CLASS,
} from './hudClassNames.ts';

export type HudDropdownItemTone = 'default' | 'accent' | 'danger';

type HudDropdownItemOptions = {
  label: string;
  tone?: HudDropdownItemTone;
  active?: boolean;
  className?: string;
  leading?: HTMLElement | null;
  trailing?: HTMLElement | null;
  onClick?: (event: MouseEvent) => void;
};

const toneClassByType: Record<HudDropdownItemTone, string> = {
  default: HUD_DROPDOWN_ITEM_DEFAULT_CLASS,
  accent: 'font-semibold text-indigo-600',
  danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
};

export function createHudDropdownItem(
  options: HudDropdownItemOptions
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${HUD_DROPDOWN_ITEM_CLASS} ${toneClassByType[options.tone ?? 'default']} ${options.className ?? ''}`.trim();

  if (options.active) {
    button.classList.add(HUD_DROPDOWN_ITEM_ACTIVE_CLASS);
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
