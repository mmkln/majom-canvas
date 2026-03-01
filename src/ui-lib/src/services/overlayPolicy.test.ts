import { describe, expect, it } from 'vitest';
import {
  getOverlayDeviceContext,
  isMobileOverlayContext,
  resolveOverlayPresentation,
} from './overlayPolicy.ts';

type MockWindow = {
  innerWidth: number;
  innerHeight: number;
  visualViewport?: { width: number; height: number } | null;
  matchMedia: (query: string) => { matches: boolean };
};

function createMockWindow(params: {
  width: number;
  height: number;
  coarsePointer?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
}): Window {
  const coarsePointer = params.coarsePointer ?? false;
  const visualViewport =
    params.viewportWidth && params.viewportHeight
      ? { width: params.viewportWidth, height: params.viewportHeight }
      : null;
  const mock: MockWindow = {
    innerWidth: params.width,
    innerHeight: params.height,
    visualViewport,
    matchMedia: (query: string) => ({
      matches: query === '(pointer: coarse)' ? coarsePointer : false,
    }),
  };
  return mock as unknown as Window;
}

describe('overlayPolicy', () => {
  it('returns desktop defaults when window is missing', () => {
    const context = getOverlayDeviceContext(null);
    expect(context).toEqual({
      viewportWidth: 1024,
      viewportHeight: 768,
      coarsePointer: false,
    });
    expect(isMobileOverlayContext(context)).toBe(false);
  });

  it('detects mobile context by width or coarse pointer', () => {
    const narrow = getOverlayDeviceContext(
      createMockWindow({ width: 360, height: 800 })
    );
    const coarse = getOverlayDeviceContext(
      createMockWindow({ width: 1280, height: 800, coarsePointer: true })
    );
    expect(isMobileOverlayContext(narrow)).toBe(true);
    expect(isMobileOverlayContext(coarse)).toBe(true);
  });

  it('prefers explicit presentation over policy', () => {
    const presentation = resolveOverlayPresentation(
      { intent: 'confirm', preferredPresentation: 'fullscreen' },
      createMockWindow({ width: 360, height: 800 })
    );
    expect(presentation).toBe('fullscreen');
  });

  it('returns dialog on desktop for all intents', () => {
    const desktop = createMockWindow({ width: 1280, height: 800 });
    expect(
      resolveOverlayPresentation({ intent: 'confirm' }, desktop)
    ).toBe('dialog');
    expect(resolveOverlayPresentation({ intent: 'picker' }, desktop)).toBe(
      'dialog'
    );
    expect(resolveOverlayPresentation({ intent: 'info' }, desktop)).toBe(
      'dialog'
    );
    expect(resolveOverlayPresentation({ intent: 'form' }, desktop)).toBe(
      'dialog'
    );
  });

  it('returns mobile presentations by intent', () => {
    const mobile = createMockWindow({ width: 390, height: 844 });
    expect(resolveOverlayPresentation({ intent: 'confirm' }, mobile)).toBe(
      'bottom-sheet'
    );
    expect(resolveOverlayPresentation({ intent: 'picker' }, mobile)).toBe(
      'bottom-sheet'
    );
    expect(resolveOverlayPresentation({ intent: 'info' }, mobile)).toBe(
      'bottom-sheet'
    );
    expect(resolveOverlayPresentation({ intent: 'form' }, mobile)).toBe(
      'bottom-sheet'
    );
  });

  it('treats widths up to 767px as mobile and 768px as desktop', () => {
    const mobileBoundary = createMockWindow({ width: 767, height: 900 });
    const desktopBoundary = createMockWindow({ width: 768, height: 900 });

    expect(
      resolveOverlayPresentation({ intent: 'confirm' }, mobileBoundary)
    ).toBe('bottom-sheet');
    expect(
      resolveOverlayPresentation({ intent: 'confirm' }, desktopBoundary)
    ).toBe('dialog');
  });
});
