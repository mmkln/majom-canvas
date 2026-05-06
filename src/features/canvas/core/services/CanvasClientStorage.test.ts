// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  resetUserPreferencesForTests,
  setLastOpenedCanvasIdPreference,
} from '../../../shell/services/UserPreferencesService.ts';
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

describe('CanvasClientStorage tab canvas session', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetUserPreferencesForTests();
  });

  it('restores the tab active canvas before the profile fallback', () => {
    setLastOpenedCanvasIdPreference('canvas-profile');
    CanvasClientStorage.persistCanvasSessionActiveCanvasId('canvas-tab');

    expect(
      CanvasClientStorage.resolveInitialCanvasId([
        'canvas-profile',
        'canvas-tab',
      ])
    ).toBe('canvas-tab');
  });

  it('ignores unavailable tab canvas ids and falls back to the profile canvas', () => {
    setLastOpenedCanvasIdPreference('canvas-profile');
    CanvasClientStorage.persistCanvasSessionActiveCanvasId('canvas-deleted');

    expect(
      CanvasClientStorage.resolveInitialCanvasId([
        'canvas-profile',
        'canvas-other',
      ])
    ).toBe('canvas-profile');
  });

  it('keeps pan and zoom state scoped to the current tab', () => {
    CanvasClientStorage.persistCanvasSessionViewState(
      {
        scrollX: 120,
        scrollY: 240,
        scale: 1.4,
      },
      'canvas-1'
    );

    expect(CanvasClientStorage.readCanvasSessionViewState('canvas-1')).toEqual({
      scrollX: 120,
      scrollY: 240,
      scale: 1.4,
    });
  });
});
