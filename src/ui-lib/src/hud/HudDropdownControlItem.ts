import {
  HUD_MENU_CONTROL_ITEM_CLASS,
  HUD_MENU_ITEM_DEFAULT_CLASS,
  HUD_MENU_ITEM_DANGER_CLASS,
  HUD_MENU_ITEM_DISABLED_CLASS,
  HUD_MENU_ITEM_HINT_TRIGGER_CLASS,
  HUD_MENU_ITEM_SELECTED_CLASS,
} from './classNames.ts';
import { createIcon } from './icons.ts';

export type HudDropdownControlItemTone = 'default' | 'danger';

export type HudDropdownControlItemOptions = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  hint?: string;
  tone?: HudDropdownControlItemTone;
  className?: string;
  leading?: HTMLElement | null;
  control: HTMLElement;
  onClick?: (event: MouseEvent) => void;
};

export function createHudDropdownControlItem(
  options: HudDropdownControlItemOptions
): HTMLDivElement {
  const row = document.createElement('div');
  row.setAttribute('data-component', 'HudDropdownControlItem');
  const variantClass = options.active
    ? HUD_MENU_ITEM_SELECTED_CLASS
    : options.tone === 'danger'
      ? HUD_MENU_ITEM_DANGER_CLASS
      : HUD_MENU_ITEM_DEFAULT_CLASS;
  row.className =
    `${HUD_MENU_CONTROL_ITEM_CLASS} ${variantClass} ${options.className ?? ''}`.trim();

  const tooltip =
    typeof options.tooltip === 'string' ? options.tooltip.trim() : '';
  if (tooltip.length > 0) {
    row.title = tooltip;
  }

  if (options.disabled) {
    row.classList.add(...HUD_MENU_ITEM_DISABLED_CLASS.split(' '));
    row.setAttribute('aria-disabled', 'true');
  }

  const hint = typeof options.hint === 'string' ? options.hint.trim() : '';
  if (hint.length > 0) {
    row.setAttribute('aria-description', hint);
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
  row.appendChild(content);

  const controlWrap = document.createElement('span');
  controlWrap.className = 'ml-3 inline-flex shrink-0 items-center';
  options.control.classList.add('shrink-0');
  controlWrap.appendChild(options.control);
  row.appendChild(controlWrap);

  if (options.onClick && !options.disabled) {
    row.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof Node && controlWrap.contains(target)) {
        return;
      }
      options.onClick?.(event);
    });
  }

  return row;
}
