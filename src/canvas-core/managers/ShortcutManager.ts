export type ShortcutHandler = (event: KeyboardEvent) => void;

export type ShortcutKeyNormalizer = (event: KeyboardEvent) => string;

export type ShortcutGuard = (event: KeyboardEvent) => boolean;

export type ShortcutManagerOptions = {
  target?: EventTarget | null;
  shouldHandleEvent?: ShortcutGuard;
  normalizeKey?: ShortcutKeyNormalizer;
  autoAttach?: boolean;
};

const defaultNormalizeKey: ShortcutKeyNormalizer = (event) => {
  if (event.code?.startsWith('Key')) return event.code.slice(3).toLowerCase();
  if (event.code?.startsWith('Digit')) return event.code.slice(5);
  return event.key.toLowerCase();
};

const defaultShouldHandleEvent: ShortcutGuard = (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return true;
  if (target.isContentEditable) return false;
  const tagName = target.tagName;
  return tagName !== 'INPUT' && tagName !== 'TEXTAREA' && tagName !== 'SELECT';
};

/**
 * Keyboard shortcut registry with optional DOM auto-attachment.
 */
export class ShortcutManager {
  private readonly handlers = new Map<string, ShortcutHandler[]>();
  private readonly target: EventTarget | null;
  private readonly shouldHandleEvent: ShortcutGuard;
  private readonly normalizeKey: ShortcutKeyNormalizer;
  private readonly keydownListener = (event: Event): void => {
    this.handleKeyDown(event as KeyboardEvent);
  };
  private attached = false;

  constructor(options: ShortcutManagerOptions = {}) {
    this.target =
      options.target ??
      (typeof document !== 'undefined' ? document : null);
    this.shouldHandleEvent =
      options.shouldHandleEvent ?? defaultShouldHandleEvent;
    this.normalizeKey = options.normalizeKey ?? defaultNormalizeKey;
    if (options.autoAttach !== false) {
      this.attach();
    }
  }

  /**
   * Attaches `keydown` listener to configured target.
   */
  public attach(): void {
    if (this.attached || !this.target) return;
    this.target.addEventListener('keydown', this.keydownListener);
    this.attached = true;
  }

  /**
   * Detaches listener and clears all registered shortcuts.
   */
  public destroy(): void {
    if (!this.attached || !this.target) return;
    this.target.removeEventListener('keydown', this.keydownListener);
    this.attached = false;
    this.handlers.clear();
  }

  /**
   * Registers handler for a normalized key combo (for example `ctrl+c`).
   */
  public register(combo: string, handler: ShortcutHandler): void {
    const key = combo.toLowerCase();
    const existing = this.handlers.get(key);
    if (!existing) {
      this.handlers.set(key, [handler]);
      return;
    }
    existing.push(handler);
  }

  /**
   * Removes one handler or full combo binding when `handler` is omitted.
   */
  public unregister(combo: string, handler?: ShortcutHandler): void {
    const key = combo.toLowerCase();
    const existing = this.handlers.get(key);
    if (!existing) return;
    if (!handler) {
      this.handlers.delete(key);
      return;
    }
    const filtered = existing.filter((candidate) => candidate !== handler);
    if (filtered.length === 0) {
      this.handlers.delete(key);
      return;
    }
    this.handlers.set(key, filtered);
  }

  /**
   * Processes a keydown event and dispatches matching shortcut handlers.
   */
  public handleKeyDown(event: KeyboardEvent): void {
    if (!this.shouldHandleEvent(event)) return;
    const combo = this.toCombo(event);
    const handlers = this.handlers.get(combo);
    if (!handlers || handlers.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    handlers.forEach((handler) => handler(event));
  }

  private toCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    parts.push(this.normalizeKey(event));
    return parts.join('+');
  }
}
