// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { CanvasClientStorage } from './CanvasClientStorage.ts';

describe('CanvasClientStorage smart guide preferences', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('persists individual smart guide preference toggles', () => {
    expect(CanvasClientStorage.getCanvasSpacingGuidesEnabled(true)).toBe(true);
    expect(CanvasClientStorage.getCanvasContainerGuidesEnabled(true)).toBe(
      true
    );
    expect(
      CanvasClientStorage.getCanvasViewportCenterGuidesEnabled(true)
    ).toBe(true);

    CanvasClientStorage.setCanvasSpacingGuidesEnabled(false);
    CanvasClientStorage.setCanvasContainerGuidesEnabled(false);
    CanvasClientStorage.setCanvasViewportCenterGuidesEnabled(false);

    expect(CanvasClientStorage.getCanvasSpacingGuidesEnabled(true)).toBe(false);
    expect(CanvasClientStorage.getCanvasContainerGuidesEnabled(true)).toBe(
      false
    );
    expect(
      CanvasClientStorage.getCanvasViewportCenterGuidesEnabled(true)
    ).toBe(false);
  });
});
