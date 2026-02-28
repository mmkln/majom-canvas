import { createIcon, type IconName } from './icons.ts';
import {
  createHudDropdownItem,
  type HudDropdownItemTone,
  type HudMenuItemVariant,
} from './HudDropdownItem.ts';

export type HudSplitDropdownItemOptions = {
  label: string;
  variant?: HudMenuItemVariant;
  tone?: HudDropdownItemTone;
  className?: string;
  leading?: HTMLElement | null;
  trailing?: HTMLElement | null;
  secondaryIcon: IconName;
  secondaryLabel: string;
  secondaryClassName?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onPointerEnter?: () => void;
  onFocusWithin?: () => void;
};

const PRIMARY_CLASS =
  '!w-auto grow border-0 !rounded-none !bg-transparent hover:!bg-indigo-50 group-hover:!bg-indigo-50 focus-visible:!bg-indigo-50 group-focus-within:!bg-indigo-50 group-hover:!text-slate-800 group-focus-within:!text-slate-800';

const SECONDARY_CLASS =
  'inline-flex w-11 shrink-0 items-center justify-center border-l border-transparent text-slate-500 transition-colors bg-transparent group-hover:border-indigo-100 group-hover:bg-indigo-50 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 hover:!bg-indigo-100 hover:!text-indigo-600 focus-visible:!bg-indigo-100 focus-visible:!text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-inset';

export function createHudSplitDropdownItem(
  options: HudSplitDropdownItemOptions
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'group flex w-full items-stretch overflow-hidden transition-colors';

  const primary = createHudDropdownItem({
    label: options.label,
    variant: options.variant,
    tone: options.tone,
    className: `${options.className ?? ''} ${PRIMARY_CLASS}`.trim(),
    leading: options.leading ?? null,
    trailing: options.trailing ?? null,
    onClick: () => options.onPrimaryClick?.(),
  });
  primary.setAttribute('role', 'menuitem');

  const secondary = document.createElement('button');
  secondary.type = 'button';
  secondary.className =
    `${SECONDARY_CLASS} ${options.secondaryClassName ?? ''}`.trim();
  secondary.title = options.secondaryLabel;
  secondary.setAttribute('aria-label', options.secondaryLabel);
  secondary.setAttribute('role', 'menuitem');

  const icon = createIcon(options.secondaryIcon, { size: 14, strokeWidth: 1.9 });
  icon.setAttribute('aria-hidden', 'true');
  secondary.appendChild(icon);
  secondary.addEventListener('click', (event) => {
    event.stopPropagation();
    options.onSecondaryClick?.();
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
  return row;
}
