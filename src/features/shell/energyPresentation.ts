import type { AppTranslationKey, I18nService } from '../../i18n/index.ts';
import { EnergyLevel } from './energy.ts';

const ENERGY_LABEL_KEY_BY_LEVEL: Record<EnergyLevel, AppTranslationKey> = {
  [EnergyLevel.VERY_LOW]: 'workspaceControls.energyVeryLow',
  [EnergyLevel.LOW]: 'workspaceControls.energyLow',
  [EnergyLevel.NEUTRAL]: 'workspaceControls.energyNeutral',
  [EnergyLevel.HIGH]: 'workspaceControls.energyHigh',
  [EnergyLevel.VERY_HIGH]: 'workspaceControls.energyVeryHigh',
};

export function getEnergyLevelLabel(
  i18n: I18nService,
  level: EnergyLevel
): string {
  return i18n.t(ENERGY_LABEL_KEY_BY_LEVEL[level]);
}
