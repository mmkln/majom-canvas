// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { AppRuntime, createAppRuntime } from './AppRuntime.ts';
import { I18nService } from '../i18n/I18nService.ts';
import { EnergyLevel } from '../features/shell/energy.ts';

describe('AppRuntime', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
  });

  it('exposes the active locale in its snapshot', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });

    expect(runtime.getSnapshot().locale).toBe('uk');
    expect(runtime.getSnapshot().energy.level).toBeNull();
    expect(runtime.i18n.getLocale()).toBe('uk');
  });

  it('notifies subscribers when locale changes through runtime', () => {
    const runtime = createAppRuntime({ initialLocale: 'en' });
    const changes: string[] = [];
    const unsubscribe = runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    });

    runtime.setLocale('uk');
    runtime.setLocale('uk');
    unsubscribe();
    runtime.setLocale('en');

    expect(changes).toEqual(['uk']);
  });

  it('fans out locale changes triggered directly on i18n', () => {
    const runtime = new AppRuntime({
      i18n: new I18nService({ initialLocale: 'en' }),
    });
    const changes: string[] = [];

    runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    });
    runtime.i18n.setLocale('uk');

    expect(changes).toEqual(['uk']);
  });

  it('can emit the current snapshot immediately on subscribe', () => {
    const runtime = createAppRuntime({ initialLocale: 'uk' });
    const changes: string[] = [];

    runtime.subscribe((snapshot) => {
      changes.push(snapshot.locale);
    }, { emitCurrent: true });

    expect(changes).toEqual(['uk']);
  });

  it('loads and updates energy state through the runtime service', async () => {
    const runtime = createAppRuntime({
      energyService: {
        loadEnergy: async () => ({
          id: 'energy-1',
          recordedAt: '2026-03-26T08:00:00.000Z',
          energy: EnergyLevel.LOW,
        }),
        saveEnergy: async (level) => ({
          id: 'energy-2',
          recordedAt: '2026-03-26T09:00:00.000Z',
          energy: level,
        }),
      },
    });

    await runtime.ensureEnergyLoaded();
    expect(runtime.getEnergyState().level).toBe(EnergyLevel.LOW);

    await runtime.setEnergyLevel(EnergyLevel.HIGH);

    expect(runtime.getEnergyState().level).toBe(EnergyLevel.HIGH);
    expect(runtime.getEnergyState().recordId).toBe('energy-2');
    expect(runtime.getSnapshot().energy.saving).toBe(false);
  });
});
