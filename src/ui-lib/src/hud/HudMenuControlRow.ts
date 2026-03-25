import { HUD_MENU_CONTROL_ROW_CLASS } from './classNames.ts';

export type HudMenuControlRowOptions = {
  control: HTMLElement;
  className?: string;
};

export function createHudMenuControlRow(
  options: HudMenuControlRowOptions
): HTMLDivElement {
  const row = document.createElement('div');
  row.setAttribute('data-component', 'HudMenuControlRow');
  row.className =
    `${HUD_MENU_CONTROL_ROW_CLASS} ${options.className ?? ''}`.trim();
  row.appendChild(options.control);
  return row;
}
