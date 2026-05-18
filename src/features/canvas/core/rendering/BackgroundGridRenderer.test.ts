import { describe, expect, it } from 'vitest';
import { BackgroundGridRenderer } from './BackgroundGridRenderer.ts';
import type { CanvasBackgroundPalette } from '../../theme/canvasTheme.ts';

describe('BackgroundGridRenderer LOD config', () => {
  it('uses coarse cells at very low scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { radius: number };
      }
    ).resolveGridConfig(0.12);
    expect(config.radius).toBeGreaterThan(100);
  });

  it('uses larger hex cells at low-mid scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { radius: number };
      }
    ).resolveGridConfig(0.3);
    expect(config.radius).toBeGreaterThan(100);
  });

  it('uses finer cells at higher scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { radius: number };
      }
    ).resolveGridConfig(0.9);
    expect(config.radius).toBeLessThan(100);
  });
});

describe('BackgroundGridRenderer theme background contract', () => {
  it('uses the canvas palette grid line color for every LOD config', () => {
    const renderer = new BackgroundGridRenderer();
    const background: CanvasBackgroundPalette = {
      surface: '#F5F4EF',
      gridLine: '#DAD9D0',
    };
    const config = (
      renderer as unknown as {
        resolveGridConfig: (
          scale: number,
          background: CanvasBackgroundPalette
        ) => { lineColor: string };
      }
    ).resolveGridConfig(0.9, background);

    expect(config.lineColor).toBe(background.gridLine);
  });

  it('separates cached grid tiles by line color', () => {
    const renderer = new BackgroundGridRenderer();
    const buildTileKey = (
      renderer as unknown as {
        buildTileKey: (
          config: { radius: number; lineColor: string; alpha: number },
          scaleBucket: number
        ) => string;
      }
    ).buildTileKey.bind(renderer);

    expect(
      buildTileKey({ radius: 60, lineColor: '#DAD9D0', alpha: 0.15 }, 1)
    ).not.toBe(
      buildTileKey({ radius: 60, lineColor: '#475569', alpha: 0.15 }, 1)
    );
  });
});

describe('BackgroundGridRenderer scale buckets', () => {
  it('rounds scales to 0.1 buckets', () => {
    const renderer = new BackgroundGridRenderer();
    const bucket = (
      renderer as unknown as { toScaleBucket: (scale: number) => number }
    ).toScaleBucket(0.46);
    expect(bucket).toBe(0.5);
  });

  it('keeps minimum bucket at 0.1', () => {
    const renderer = new BackgroundGridRenderer();
    const bucket = (
      renderer as unknown as { toScaleBucket: (scale: number) => number }
    ).toScaleBucket(0.01);
    expect(bucket).toBe(0.1);
  });
});

describe('BackgroundGridRenderer snapshot normalization', () => {
  it('rounds viewport and scroll values for stable redraw checks', () => {
    const renderer = new BackgroundGridRenderer();
    const snapshot = (
      renderer as unknown as {
        buildSnapshot: (input: {
          viewportWidth: number;
          viewportHeight: number;
          scrollX: number;
          scrollY: number;
          scaleBucket: number;
          backgroundSurface: string;
          gridLineColor: string;
        }) => {
          viewportWidth: number;
          viewportHeight: number;
          scrollX: number;
          scrollY: number;
          backgroundSurface: string;
          gridLineColor: string;
        };
      }
    ).buildSnapshot({
      viewportWidth: 1000.4,
      viewportHeight: 700.7,
      scrollX: 10.24,
      scrollY: -3.26,
      scaleBucket: 0.5,
      backgroundSurface: '#F5F4EF',
      gridLineColor: '#DAD9D0',
    });

    expect(snapshot.viewportWidth).toBe(1000);
    expect(snapshot.viewportHeight).toBe(701);
    expect(snapshot.scrollX).toBe(10);
    expect(snapshot.scrollY).toBe(-3.5);
    expect(snapshot.backgroundSurface).toBe('#F5F4EF');
    expect(snapshot.gridLineColor).toBe('#DAD9D0');
  });
});
