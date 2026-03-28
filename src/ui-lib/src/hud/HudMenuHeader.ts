import {
  HUD_MENU_HEADER_CLASS,
  HUD_MENU_HEADER_SUBTITLE_CLASS,
  HUD_MENU_HEADER_TITLE_CLASS,
} from './classNames.ts';

export type HudMenuHeaderOptions = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function createHudMenuHeader(
  options: HudMenuHeaderOptions
): HTMLDivElement {
  const header = document.createElement('div');
  header.setAttribute('data-component', 'HudMenuHeader');
  header.className = `${HUD_MENU_HEADER_CLASS} ${options.className ?? ''}`.trim();

  const title = document.createElement('p');
  title.className = HUD_MENU_HEADER_TITLE_CLASS;
  title.textContent = options.title;
  header.appendChild(title);

  const subtitleText = options.subtitle?.trim();
  if (subtitleText) {
    const subtitle = document.createElement('p');
    subtitle.className = HUD_MENU_HEADER_SUBTITLE_CLASS;
    subtitle.textContent = subtitleText;
    header.appendChild(subtitle);
  }

  return header;
}
