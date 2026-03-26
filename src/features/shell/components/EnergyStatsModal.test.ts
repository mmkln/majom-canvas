// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../app-runtime/index.ts';
import { EnergyLevel } from '../energy.ts';
import { EnergyStatsModal } from './EnergyStatsModal.ts';

describe('EnergyStatsModal', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a step chart with period switching and hover tooltip', async () => {
    const loadEnergyHistory = vi.fn().mockResolvedValue([
      {
        id: 'energy-3',
        recordedAt: '2026-03-26T10:00:00.000Z',
        energy: EnergyLevel.HIGH,
      },
      {
        id: 'energy-2',
        recordedAt: '2026-03-25T10:00:00.000Z',
        energy: EnergyLevel.NEUTRAL,
      },
      {
        id: 'energy-1',
        recordedAt: '2026-03-24T10:00:00.000Z',
        energy: EnergyLevel.LOW,
      },
    ]);
    const runtime = createAppRuntime({
      initialLocale: 'en',
      energyService: {
        loadEnergy: async () => null,
        loadEnergyHistory,
        saveEnergy: async (level) => ({
          id: 'energy-save',
          recordedAt: '2026-03-26T10:00:00.000Z',
          energy: level,
        }),
      },
    });
    const modal = new EnergyStatsModal(runtime);

    modal.open();
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(loadEnergyHistory).toHaveBeenCalledWith({ days: 14 });
    expect(document.body.textContent).toContain('14d');
    const chart = document.body.querySelector(
      'svg[data-role="energy-line-chart"]'
    ) as SVGSVGElement;
    expect(chart).not.toBeNull();
    expect(chart.querySelector('path')?.getAttribute('d')).toMatch(/[HV]/);
    expect(
      document.body.querySelector('div[data-component="HudSegmentedControl"]')
    ).not.toBeNull();
    expect(document.body.textContent).not.toContain('Distribution');
    expect(document.body.textContent).not.toContain('Recent entries');

    const point = document.body.querySelector('circle[cx]') as SVGCircleElement;
    point.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const tooltip = document.body.querySelector(
      '[data-role="energy-chart-tooltip"]'
    ) as HTMLDivElement;
    expect(tooltip.style.display).toBe('block');
    expect(tooltip.textContent).toMatch(/Low battery|Steady|It's rolling/);

    const periodButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent?.trim() === '30d');
    expect(periodButton).toBeDefined();
    periodButton?.click();
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(loadEnergyHistory).toHaveBeenLastCalledWith({ days: 30 });

    modal.destroy();
  });
});
