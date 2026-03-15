import { describe, expect, it } from 'vitest';
import { BackgroundGridRenderer } from './BackgroundGridRenderer.ts';

describe('BackgroundGridRenderer LOD config', () => {
  it('switches to none at very low scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { mode: string };
      }
    ).resolveGridConfig(0.12);
    expect(config.mode).toBe('none');
  });

  it('switches to dots at low-mid scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { mode: string; spacing: number };
      }
    ).resolveGridConfig(0.3);
    expect(config.mode).toBe('dots');
    expect(config.spacing).toBeGreaterThan(0);
  });

  it('switches to hex at higher scales', () => {
    const renderer = new BackgroundGridRenderer();
    const config = (
      renderer as unknown as {
        resolveGridConfig: (scale: number) => { mode: string; radius: number };
      }
    ).resolveGridConfig(0.9);
    expect(config.mode).toBe('hex');
    expect(config.radius).toBeGreaterThan(0);
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
          mode: 'none' | 'dots' | 'hex';
          spacing: number;
        }) => {
          viewportWidth: number;
          viewportHeight: number;
          scrollX: number;
          scrollY: number;
        };
      }
    ).buildSnapshot({
      viewportWidth: 1000.4,
      viewportHeight: 700.7,
      scrollX: 10.24,
      scrollY: -3.26,
      scaleBucket: 0.5,
      mode: 'dots',
      spacing: 220,
    });

    expect(snapshot.viewportWidth).toBe(1000);
    expect(snapshot.viewportHeight).toBe(701);
    expect(snapshot.scrollX).toBe(10);
    expect(snapshot.scrollY).toBe(-3.5);
  });
});
