import { ShortcutManager as CoreShortcutManager } from 'majom-canvas-core';
import { modalService } from '../../../../ui-lib/src/services/ModalService.ts';

/**
 * Centralized shortcut manager: maps key combinations to handlers.
 */
export class ShortcutManager extends CoreShortcutManager {
  constructor() {
    super({
      shouldHandleEvent: (event) => {
        if (modalService.hasBlockingOverlay()) return false;
        const target = event.target as HTMLElement | null;
        if (!target) return true;
        if (target.isContentEditable) return false;
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          return false;
        }
        return true;
      },
    });
  }
}

export const shortcutManager: ShortcutManager = new ShortcutManager();

