import { createIcon, type IconName } from './icons.ts';
import {
  createHudDropdownItem,
  type HudDropdownItemTone,
  type HudMenuItemVariant,
} from './HudDropdownItem.ts';

type HudSplitSecondaryTone =
  | 'default'
  | 'favorite-active'
  | 'favorite-inactive';

export type HudSplitDropdownItemOptions = {
  label: string;
  variant?: HudMenuItemVariant;
  tone?: HudDropdownItemTone;
  className?: string;
  primaryTransparent?: boolean;
  hideSelectedTrailing?: boolean;
  disabled?: boolean;
  leading?: HTMLElement | null;
  trailing?: HTMLElement | null;
  secondaryIcon: IconName;
  secondaryLabel: string;
  secondaryTone?: HudSplitSecondaryTone;
  secondaryPressed?: boolean;
  secondaryClassName?: string;
  secondaryDisabled?: boolean;
  secondaryRevealOnHover?: boolean;
  tertiaryIcon?: IconName;
  tertiaryLabel?: string;
  tertiaryTone?: HudSplitSecondaryTone;
  tertiaryPressed?: boolean;
  tertiaryClassName?: string;
  tertiaryDisabled?: boolean;
  tertiaryRevealOnHover?: boolean;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onTertiaryClick?: (event: MouseEvent, button: HTMLButtonElement) => void;
  onPointerEnter?: () => void;
  onFocusWithin?: () => void;
};

const PRIMARY_BASE_CLASS = '!w-auto grow border-0 !rounded-none';
const PRIMARY_TRANSPARENT_CLASS =
  '!bg-transparent hover:!bg-indigo-50 group-hover:!bg-indigo-50 focus-visible:!bg-indigo-50 group-focus-within:!bg-indigo-50 group-hover:!text-slate-800 group-focus-within:!text-slate-800';

const SECONDARY_BASE_CLASS =
  'inline-flex w-11 shrink-0 items-center justify-center border-l border-transparent bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-inset';
const SECONDARY_INTERACTIVE_CLASS =
  'group-hover:border-indigo-100 group-focus-within:border-indigo-100 group-hover:bg-indigo-50 group-focus-within:bg-indigo-50 group-hover:text-indigo-600 group-focus-within:text-indigo-600 hover:!bg-indigo-100 focus-visible:!bg-indigo-100';
const SECONDARY_REVEAL_INTERACTION_CLASS =
  'pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto focus-visible:pointer-events-auto';
const SECONDARY_ICON_REVEAL_CLASS =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100';
const SECONDARY_DISABLED_CLASS = `${SECONDARY_BASE_CLASS} text-slate-300 cursor-not-allowed`;

const SECONDARY_TONE_CLASS: Record<HudSplitSecondaryTone, string> = {
  default:
    'text-slate-500 hover:!text-indigo-600 focus-visible:!text-indigo-700',
  'favorite-active':
    '!text-amber-500 hover:!text-amber-500 focus-visible:!text-amber-500 hover:!bg-amber-100 focus-visible:!bg-amber-100',
  'favorite-inactive':
    'text-slate-400/55 group-hover:text-amber-500 group-focus-within:text-amber-500 hover:!text-amber-500 focus-visible:!text-amber-500',
};

export function createHudSplitDropdownItem(
  options: HudSplitDropdownItemOptions
): HTMLDivElement {
  const row = document.createElement('div');
  const isSelected = options.variant === 'selected';
  row.className =
    `group flex w-full items-stretch overflow-hidden transition-colors ${isSelected ? 'bg-indigo-50' : ''}`.trim();

  const primary = createHudDropdownItem({
    label: options.label,
    variant: options.variant,
    tone: options.tone,
    className:
      `${options.className ?? ''} ${PRIMARY_BASE_CLASS} ${options.primaryTransparent ? PRIMARY_TRANSPARENT_CLASS : ''}`.trim(),
    disabled: options.disabled,
    leading: options.leading ?? null,
    trailing:
      isSelected && options.hideSelectedTrailing ? null : (options.trailing ?? null),
    onClick: () => options.onPrimaryClick?.(),
  });
  primary.setAttribute('role', 'menuitem');

  const secondary = createActionButton({
    icon: options.secondaryIcon,
    label: options.secondaryLabel,
    tone: options.secondaryTone ?? 'default',
    pressed: options.secondaryPressed,
    disabled: options.secondaryDisabled ?? options.disabled ?? false,
    className: options.secondaryClassName,
    revealOnHover: options.secondaryRevealOnHover,
    onClick: (event, button) => {
      if (button.disabled) return;
      options.onSecondaryClick?.();
    },
  });

  const notifyFocusWithin = (): void => {
    options.onFocusWithin?.();
  };
  row.addEventListener('mouseenter', () => {
    options.onPointerEnter?.();
  });
  primary.addEventListener('focus', notifyFocusWithin);
  secondary.addEventListener('focus', notifyFocusWithin);
  row.append(primary, secondary);

  const hasTertiaryAction =
    options.tertiaryIcon !== undefined && options.tertiaryLabel !== undefined;
  if (hasTertiaryAction) {
    const tertiary = createActionButton({
      icon: options.tertiaryIcon,
      label: options.tertiaryLabel,
      tone: options.tertiaryTone ?? 'default',
      pressed: options.tertiaryPressed,
      disabled: options.tertiaryDisabled ?? options.disabled ?? false,
      className: options.tertiaryClassName,
      revealOnHover: options.tertiaryRevealOnHover,
      onClick: (event, button) => {
        if (button.disabled) return;
        options.onTertiaryClick?.(event, button);
      },
    });
    tertiary.addEventListener('focus', notifyFocusWithin);
    row.appendChild(tertiary);
  }

  return row;
}

function createActionButton(options: {
  icon: IconName;
  label: string;
  tone: HudSplitSecondaryTone;
  pressed?: boolean;
  disabled: boolean;
  className?: string;
  revealOnHover?: boolean;
  onClick?: (event: MouseEvent, button: HTMLButtonElement) => void;
}): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  const baseClass = options.disabled
    ? SECONDARY_DISABLED_CLASS
    : `${SECONDARY_BASE_CLASS} ${SECONDARY_INTERACTIVE_CLASS} ${SECONDARY_TONE_CLASS[options.tone]} ${options.revealOnHover ? SECONDARY_REVEAL_INTERACTION_CLASS : ''}`.trim();
  button.className = `${baseClass} ${options.className ?? ''}`.trim();
  button.title = options.label;
  button.setAttribute('aria-label', options.label);
  button.setAttribute('role', 'menuitem');
  if (typeof options.pressed === 'boolean') {
    button.setAttribute('aria-pressed', options.pressed ? 'true' : 'false');
  }
  if (options.disabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  const icon = createIcon(options.icon, {
    size: 14,
    strokeWidth: 1.9,
  });
  if (options.revealOnHover) {
    icon.classList.add(...SECONDARY_ICON_REVEAL_CLASS.split(' '));
  }
  icon.setAttribute('aria-hidden', 'true');
  button.appendChild(icon);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    options.onClick?.(event, button);
  });
  return button;
}
