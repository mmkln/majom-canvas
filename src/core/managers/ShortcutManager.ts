import { modalService } from '../../ui-lib/src/services/ModalService.ts';

type ShortcutHandler = (e: KeyboardEvent) => void;

/**
 * Centralized shortcut manager: maps key combinations to handlers.
 */
export class ShortcutManager {
  private handlers: Map<string, ShortcutHandler[]> = new Map();

  constructor() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /** Register a handler for a key combo, e.g. 'ctrl+z' or 'Backspace' */
  public register(combo: string, handler: ShortcutHandler): void {
    const key = combo.toLowerCase();
    if (!this.handlers.has(key)) this.handlers.set(key, []);
    this.handlers.get(key)!.push(handler);
  }

  /** Unregister a handler or all handlers for a combo */
  public unregister(combo: string, handler?: ShortcutHandler): void {
    const key = combo.toLowerCase();
    if (!this.handlers.has(key)) return;
    if (!handler) {
      this.handlers.delete(key);
    } else {
      const arr = this.handlers.get(key)!.filter(h => h !== handler);
      if (arr.length) this.handlers.set(key, arr);
      else this.handlers.delete(key);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore when modal open
    if (modalService.isOpen() || document.querySelector('[role="dialog"]')) return;
    // Ignore editable fields
    const tgt = e.target as HTMLElement;
    if (['INPUT','TEXTAREA','SELECT'].includes(tgt.tagName) || tgt.isContentEditable) return;

    const combo = this.normalize(e);
    const handlers = this.handlers.get(combo);
    if (handlers) {
      e.preventDefault();
      e.stopPropagation();
      handlers.forEach(h => h(e));
    }
  }

  private normalize(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    if (e.metaKey) parts.push('meta');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
}

export const shortcutManager = new ShortcutManager();
