// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRuntime } from '../../../../app-runtime/index.ts';
import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';
import { CanvasMenu } from './CanvasMenu.ts';

describe('CanvasMenu', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('disables nested smart guide toggles until alignment guides are enabled', () => {
    const onSmartGuidesToggle = vi.fn();
    const onSpacingGuidesToggle = vi.fn();
    const menu = new CanvasMenu(undefined, undefined, {
      runtime: createAppRuntime({ initialLocale: 'en' }),
      initialSmartGuidesEnabled: false,
      initialSpacingGuidesEnabled: true,
      initialContainerGuidesEnabled: true,
      initialViewportCenterGuidesEnabled: true,
      onSmartGuidesToggle,
      onSpacingGuidesToggle,
    });

    menu.mount(document.body);

    const smartGuidesInput = document.querySelector(
      'input[aria-label="Alignment guides"]'
    ) as HTMLInputElement | null;
    const guideOptionsTrigger = document.querySelector(
      'button[data-role="canvas-guide-options-trigger"]'
    ) as HTMLButtonElement | null;

    guideOptionsTrigger?.click();

    let spacingGuidesInput = document.querySelector(
      'input[aria-label="Spacing guides"]'
    ) as HTMLInputElement | null;

    expect(smartGuidesInput).not.toBeNull();
    expect(guideOptionsTrigger).not.toBeNull();
    expect(spacingGuidesInput).not.toBeNull();
    expect(spacingGuidesInput?.disabled).toBe(true);

    smartGuidesInput!.checked = true;
    smartGuidesInput!.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onSmartGuidesToggle).toHaveBeenCalledWith(true);

    const updatedGuideOptionsTrigger = document.querySelector(
      'button[data-role="canvas-guide-options-trigger"]'
    ) as HTMLButtonElement | null;
    updatedGuideOptionsTrigger?.click();

    spacingGuidesInput = document.querySelector(
      'input[aria-label="Spacing guides"]'
    ) as HTMLInputElement | null;
    expect(spacingGuidesInput?.disabled).toBe(false);

    spacingGuidesInput!.checked = false;
    spacingGuidesInput!.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onSpacingGuidesToggle).toHaveBeenCalledWith(false);
    expect(CanvasClientStorage.getCanvasSpacingGuidesEnabled(true)).toBe(false);

    menu.unmount();
  });
});
