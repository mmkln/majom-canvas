import {
  HUD_SELECTION_CHIP_BASE_CLASS,
  HUD_SELECTION_CHIP_COMPACT_CLASS,
  HUD_SELECTION_CHIP_DEFAULT_CLASS,
  HUD_SELECTION_CHIP_SELECTED_CLASS,
  HUD_SELECTION_CHIP_UNSELECTED_CLASS,
} from './classNames.ts';

export type HudSelectionChipSize = 'compact' | 'default';

export type HudSelectionChipState = {
  selected?: boolean;
  disabled?: boolean;
};

export type HudSelectionChipOptions = HudSelectionChipState & {
  title?: string;
  ariaLabel?: string;
  size?: HudSelectionChipSize;
  className?: string;
};

function buildSelectionChipClassName(options: {
  size: HudSelectionChipSize;
  className?: string;
}): string {
  return [
    HUD_SELECTION_CHIP_BASE_CLASS,
    options.size === 'compact'
      ? HUD_SELECTION_CHIP_COMPACT_CLASS
      : HUD_SELECTION_CHIP_DEFAULT_CLASS,
    HUD_SELECTION_CHIP_SELECTED_CLASS,
    HUD_SELECTION_CHIP_UNSELECTED_CLASS,
    options.className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function setHudSelectionChipState(
  element: HTMLButtonElement,
  state: HudSelectionChipState
): void {
  element.dataset.selected = state.selected ? 'true' : 'false';
  element.disabled = Boolean(state.disabled);
}

export function createHudSelectionChip(
  options: HudSelectionChipOptions = {}
): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = buildSelectionChipClassName({
    size: options.size ?? 'default',
    className: options.className,
  });

  if (options.title) {
    element.title = options.title;
  }
  if (options.ariaLabel) {
    element.setAttribute('aria-label', options.ariaLabel);
  }

  setHudSelectionChipState(element, {
    selected: options.selected,
    disabled: options.disabled,
  });

  return element;
}
