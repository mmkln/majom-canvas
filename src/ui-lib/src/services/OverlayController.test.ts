import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { modalService } from './ModalService.ts';
import { OverlayController } from './OverlayController.ts';

describe('OverlayController', () => {
  beforeEach(() => {
    while (modalService.isOpen()) {
      modalService.closeTopmost();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    while (modalService.isOpen()) {
      modalService.closeTopmost();
    }
  });

  it('opens and closes through modalService when registered', () => {
    const openSpy = vi.spyOn(modalService, 'open');
    const closeSpy = vi.spyOn(modalService, 'close');
    const controller = new OverlayController({
      intent: 'confirm',
      source: 'OverlayController.test',
    });

    const presentation = controller.open({
      presentation: 'bottom-sheet',
      blocking: true,
      dismissOnBackdrop: false,
      dismissOnEscape: true,
    });

    expect(presentation).toBe('bottom-sheet');
    expect(controller.getOverlayId()).toBeTypeOf('string');
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(modalService.isOpen()).toBe(true);

    controller.close();
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(controller.getOverlayId()).toBeNull();
    expect(modalService.isOpen()).toBe(false);
  });

  it('does not register in modalService when registerInService is false', () => {
    const openSpy = vi.spyOn(modalService, 'open');
    const controller = new OverlayController({
      intent: 'picker',
      source: 'OverlayController.test',
    });

    const presentation = controller.open({
      presentation: 'dialog',
      registerInService: false,
    });

    expect(presentation).toBe('dialog');
    expect(controller.getOverlayId()).toBeNull();
    expect(openSpy).not.toHaveBeenCalled();
    expect(modalService.isOpen()).toBe(false);
  });

  it('replaces previous overlay id on repeated open', () => {
    const closeSpy = vi.spyOn(modalService, 'close');
    const controller = new OverlayController({
      intent: 'info',
      source: 'OverlayController.test',
    });

    controller.open({ presentation: 'dialog' });
    const firstOverlayId = controller.getOverlayId();
    expect(firstOverlayId).toBeTypeOf('string');
    expect(modalService.isOpen()).toBe(true);

    controller.open({ presentation: 'fullscreen' });
    const secondOverlayId = controller.getOverlayId();
    expect(secondOverlayId).toBeTypeOf('string');
    expect(secondOverlayId).not.toBe(firstOverlayId);
    expect(closeSpy).toHaveBeenCalledWith(firstOverlayId);
    expect(modalService.getSnapshot()).toHaveLength(1);
  });

  it('resolvePresentation stores last presentation', () => {
    const controller = new OverlayController({
      intent: 'form',
      source: 'OverlayController.test',
    });

    const resolved = controller.resolvePresentation('fullscreen');
    expect(resolved).toBe('fullscreen');
    expect(controller.getLastPresentation()).toBe('fullscreen');
  });
});
