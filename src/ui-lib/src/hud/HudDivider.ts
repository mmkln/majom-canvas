import {
  HUD_DIVIDER_BASE_CLASS,
  HUD_DIVIDER_DEFAULT_TONE_CLASS,
  HUD_DIVIDER_INSET_CLASS,
  HUD_DIVIDER_SOFT_TONE_CLASS,
  HUD_DIVIDER_SPACED_CLASS,
} from './classNames.ts';

export type HudDividerTone = 'default' | 'soft';

type HudDividerOptions = {
  inset?: boolean;
  spaced?: boolean;
  tone?: HudDividerTone;
};

export function createHudDivider(options: HudDividerOptions = {}): HTMLDivElement {
  const divider = document.createElement('div');
  const toneClass =
    options.tone === 'soft'
      ? HUD_DIVIDER_SOFT_TONE_CLASS
      : HUD_DIVIDER_DEFAULT_TONE_CLASS;
  const insetClass = options.inset ? HUD_DIVIDER_INSET_CLASS : '';
  const spacedClass = options.spaced === false ? '' : HUD_DIVIDER_SPACED_CLASS;
  divider.className =
    `${HUD_DIVIDER_BASE_CLASS} ${toneClass} ${insetClass} ${spacedClass}`.trim();
  return divider;
}
