import {
  HUD_DISCLOSURE_ROW_BASE_CLASS,
  HUD_DISCLOSURE_ROW_DEFAULT_CLASS,
  HUD_DISCLOSURE_ROW_DEFAULT_EXPANDED_CLASS,
  HUD_DISCLOSURE_ROW_DANGER_CLASS,
  HUD_DISCLOSURE_ROW_DANGER_EXPANDED_CLASS,
} from './classNames.ts';
import { createIcon } from './icons.ts';

export type HudDisclosureRowTone = 'default' | 'danger';

export type HudDisclosureRowOptions = {
  label: string;
  description?: string;
  expanded?: boolean;
  tone?: HudDisclosureRowTone;
  className?: string;
  disabled?: boolean;
  leading?: HTMLElement | null;
  onClick?: (event: MouseEvent) => void;
};

export function createHudDisclosureRow(
  options: HudDisclosureRowOptions
): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('data-component', 'HudDisclosureRow');
  button.type = 'button';
  button.setAttribute('aria-expanded', options.expanded ? 'true' : 'false');

  const tone = options.tone ?? 'default';
  const toneClass =
    tone === 'danger'
      ? options.expanded
        ? HUD_DISCLOSURE_ROW_DANGER_EXPANDED_CLASS
        : HUD_DISCLOSURE_ROW_DANGER_CLASS
      : options.expanded
        ? HUD_DISCLOSURE_ROW_DEFAULT_EXPANDED_CLASS
        : HUD_DISCLOSURE_ROW_DEFAULT_CLASS;
  button.className =
    `${HUD_DISCLOSURE_ROW_BASE_CLASS} ${toneClass} ${options.className ?? ''}`.trim();

  if (options.disabled) {
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
  }

  const content = document.createElement('span');
  content.className = 'flex min-w-0 items-start gap-3';

  if (options.leading) {
    options.leading.classList.add('mt-0.5', 'shrink-0');
    content.appendChild(options.leading);
  }

  const textWrap = document.createElement('span');
  textWrap.className = 'flex min-w-0 flex-col gap-0.5';

  const label = document.createElement('span');
  label.className = 'truncate text-sm font-medium leading-5';
  label.textContent = options.label;
  textWrap.appendChild(label);

  const description = typeof options.description === 'string'
    ? options.description.trim()
    : '';
  if (description.length > 0) {
    const descriptionEl = document.createElement('span');
    descriptionEl.className =
      'text-[13px] font-normal leading-5 text-slate-500';
    descriptionEl.textContent = description;
    textWrap.appendChild(descriptionEl);
  }

  content.appendChild(textWrap);

  const trailing = document.createElement('span');
  trailing.className = 'mt-0.5 inline-flex shrink-0 items-center';
  const chevron = createIcon(
    options.expanded ? 'chevron-down' : 'chevron-right',
    {
      size: 15,
      strokeWidth: 1.9,
    }
  );
  chevron.classList.add('shrink-0');
  trailing.appendChild(chevron);

  button.append(content, trailing);

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}
