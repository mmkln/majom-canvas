import {
  HUD_MENU_ICON_BUTTON_BASE_CLASS,
  HUD_MENU_ICON_BUTTON_DANGER_CLASS,
  HUD_MENU_ICON_BUTTON_DEFAULT_CLASS,
  HUD_MENU_ICON_BUTTON_WARNING_CLASS,
  HUD_MENU_ICON_ROW_CLASS,
  HUD_MENU_ITEM_DISABLED_CLASS,
} from './classNames.ts';
import { createIcon, type IconName } from './icons.ts';

export type HudDropdownIconActionTone = 'default' | 'warning' | 'danger';

export type HudDropdownIconAction = {
  icon: IconName;
  label: string;
  tone?: HudDropdownIconActionTone;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  iconClassName?: string;
  iconSize?: number;
  iconStrokeWidth?: number;
  onClick?: (event: MouseEvent) => void;
};

export type HudDropdownIconRowOptions = {
  actions: HudDropdownIconAction[];
  className?: string;
};

const classByTone: Record<HudDropdownIconActionTone, string> = {
  default: HUD_MENU_ICON_BUTTON_DEFAULT_CLASS,
  warning: HUD_MENU_ICON_BUTTON_WARNING_CLASS,
  danger: HUD_MENU_ICON_BUTTON_DANGER_CLASS,
};

export function createHudDropdownIconRow(
  options: HudDropdownIconRowOptions
): HTMLDivElement {
  const row = document.createElement('div');
  row.setAttribute('data-component', 'HudDropdownIconRow');
  row.setAttribute('role', 'presentation');
  row.className = `${HUD_MENU_ICON_ROW_CLASS} ${options.className ?? ''}`.trim();

  options.actions.forEach((action) => {
    const tone = action.tone ?? 'default';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-component', 'HudDropdownIconAction');
    button.setAttribute('role', 'menuitem');
    button.title = action.label;
    button.setAttribute('aria-label', action.label);
    button.setAttribute('aria-pressed', action.selected ? 'true' : 'false');
    button.className = [
      HUD_MENU_ICON_BUTTON_BASE_CLASS,
      classByTone[tone],
      action.className ?? '',
      action.disabled ? HUD_MENU_ITEM_DISABLED_CLASS : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (action.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    const icon = createIcon(action.icon, {
      size: action.iconSize ?? 16,
      strokeWidth: action.iconStrokeWidth ?? 1.9,
    });
    if (action.iconClassName) {
      icon.classList.add(
        ...action.iconClassName.split(/\s+/).filter(Boolean)
      );
    }
    icon.setAttribute('aria-hidden', 'true');
    button.appendChild(icon);

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (button.disabled) return;
      action.onClick?.(event);
    });
    row.appendChild(button);
  });

  return row;
}
