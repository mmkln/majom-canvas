import { describe, expect, it } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { PanZoomManager } from '../managers/PanZoomManager.ts';
import { createDefaultConnectionInteractionAdapter } from './ConnectionInteractionAdapter.ts';

describe('createDefaultConnectionInteractionAdapter', () => {
  it('creates adapter with safe defaults', () => {
    const canvas = { width: 1200, height: 800 } as HTMLCanvasElement;
    const scene = new Scene();
    const panZoom = new PanZoomManager(canvas);

    const adapter = createDefaultConnectionInteractionAdapter({
      scene,
      panZoom,
    });

    expect(adapter.isCreating()).toBe(false);
    expect(adapter.getTemporaryLine()).toBeNull();
    expect(adapter.start(100, 100)).toBe(false);
    expect(adapter.hitTest(100, 100)).toBeNull();
  });
});
