import type { AppTranslationKey, I18nService } from '../../i18n/index.ts';
import { EnergyLevel } from './energy.ts';

const ENERGY_LABEL_KEY_BY_LEVEL: Record<EnergyLevel, AppTranslationKey> = {
  [EnergyLevel.VERY_LOW]: 'workspaceControls.energyVeryLow',
  [EnergyLevel.LOW]: 'workspaceControls.energyLow',
  [EnergyLevel.NEUTRAL]: 'workspaceControls.energyNeutral',
  [EnergyLevel.HIGH]: 'workspaceControls.energyHigh',
  [EnergyLevel.VERY_HIGH]: 'workspaceControls.energyVeryHigh',
};

const ENERGY_VISUALS: Record<
  EnergyLevel,
  { webp: string; alt: string }
> = {
  [EnergyLevel.VERY_LOW]: {
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f480/512.webp',
    alt: '💀',
  },
  [EnergyLevel.LOW]: {
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fae9/512.webp',
    alt: '🫩',
  },
  [EnergyLevel.NEUTRAL]: {
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f610/512.webp',
    alt: '😐',
  },
  [EnergyLevel.HIGH]: {
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f61b/512.webp',
    alt: '😛',
  },
  [EnergyLevel.VERY_HIGH]: {
    webp: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp',
    alt: '😎',
  },
};

export function getEnergyLevelLabel(
  i18n: I18nService,
  level: EnergyLevel
): string {
  return i18n.t(ENERGY_LABEL_KEY_BY_LEVEL[level]);
}

export function getEnergyVisual(level: EnergyLevel | null): {
  webp: string;
  alt: string;
} {
  return ENERGY_VISUALS[level ?? EnergyLevel.NEUTRAL];
}
