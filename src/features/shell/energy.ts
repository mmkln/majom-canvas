export enum EnergyLevel {
  VERY_LOW = '1',
  LOW = '2',
  NEUTRAL = '3',
  HIGH = '4',
  VERY_HIGH = '5',
}

export const ENERGY_LEVELS: readonly EnergyLevel[] = [
  EnergyLevel.VERY_LOW,
  EnergyLevel.LOW,
  EnergyLevel.NEUTRAL,
  EnergyLevel.HIGH,
  EnergyLevel.VERY_HIGH,
] as const;

export type EnergyRecord = {
  id: string;
  recordedAt: string;
  energy: EnergyLevel;
};

export type EnergyInput = {
  energy: EnergyLevel;
};

export function isEnergyLevel(value: unknown): value is EnergyLevel {
  return ENERGY_LEVELS.includes(value as EnergyLevel);
}
