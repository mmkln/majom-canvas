export type OverlayIntent = 'confirm' | 'form' | 'picker' | 'info';
export type OverlayPresentation = 'dialog' | 'bottom-sheet' | 'fullscreen';

export type OverlayDescriptor = {
  id?: string;
  intent?: OverlayIntent;
  presentation?: OverlayPresentation;
  blocking?: boolean;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  restoreFocusTo?: HTMLElement | null;
  source?: string;
};

export type OverlaySnapshot = {
  id: string;
  intent: OverlayIntent;
  presentation: OverlayPresentation;
  blocking: boolean;
  dismissOnBackdrop: boolean;
  dismissOnEscape: boolean;
  source: string | null;
};

type OverlayRecord = {
  id: string;
  intent: OverlayIntent;
  presentation: OverlayPresentation;
  blocking: boolean;
  dismissOnBackdrop: boolean;
  dismissOnEscape: boolean;
  restoreFocusTo: HTMLElement | null;
  source: string | null;
};

export class ModalService {
  private readonly stack: OverlayRecord[] = [];
  private nextId = 0;
  private previousBodyOverflow: string | null = null;
  private previousBodyPaddingRight: string | null = null;
  private previousHtmlOverflow: string | null = null;
  private scrollLockApplied = false;

  public open(descriptor: OverlayDescriptor = {}): string {
    const id = descriptor.id ?? `overlay-${++this.nextId}`;
    const record: OverlayRecord = {
      id,
      intent: descriptor.intent ?? 'info',
      presentation: descriptor.presentation ?? 'dialog',
      blocking: descriptor.blocking ?? true,
      dismissOnBackdrop: descriptor.dismissOnBackdrop ?? true,
      dismissOnEscape: descriptor.dismissOnEscape ?? true,
      restoreFocusTo: descriptor.restoreFocusTo ?? null,
      source: descriptor.source ?? null,
    };
    const wasEmpty = this.stack.length === 0;
    this.stack.push(record);
    if (wasEmpty) {
      this.lockScroll();
    }
    return id;
  }

  public close(id: string): void {
    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index === -1) return;
    const [removed] = this.stack.splice(index, 1);
    if (this.stack.length === 0) {
      this.unlockScroll();
    }
    this.restoreFocus(removed.restoreFocusTo);
  }

  public closeTopmost(): void {
    const topmost = this.getTopmost();
    if (!topmost) return;
    this.close(topmost.id);
  }

  /** Backward-compatible alias for legacy usages. */
  register(): string {
    return this.open({ source: 'legacy-register', blocking: true });
  }

  /** Backward-compatible alias for legacy usages. */
  unregister(id?: string): void {
    if (id) {
      this.close(id);
      return;
    }
    this.closeTopmost();
  }

  isOpen(): boolean {
    return this.stack.length > 0;
  }

  public hasBlockingOverlay(): boolean {
    return this.stack.some((entry) => entry.blocking);
  }

  public getTopmost(): OverlaySnapshot | null {
    const top = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    return top ? this.toSnapshot(top) : null;
  }

  public getSnapshot(): OverlaySnapshot[] {
    return this.stack.map((record) => this.toSnapshot(record));
  }

  private lockScroll(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    if (this.scrollLockApplied) return;

    const body = document.body;
    const html = document.documentElement;
    this.previousBodyOverflow = body.style.overflow;
    this.previousBodyPaddingRight = body.style.paddingRight;
    this.previousHtmlOverflow = html.style.overflow;

    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    this.scrollLockApplied = true;
  }

  private unlockScroll(): void {
    if (typeof document === 'undefined') return;
    if (!this.scrollLockApplied) return;

    const body = document.body;
    const html = document.documentElement;
    body.style.overflow = this.previousBodyOverflow ?? '';
    body.style.paddingRight = this.previousBodyPaddingRight ?? '';
    html.style.overflow = this.previousHtmlOverflow ?? '';

    this.previousBodyOverflow = null;
    this.previousBodyPaddingRight = null;
    this.previousHtmlOverflow = null;
    this.scrollLockApplied = false;
  }

  private restoreFocus(target: HTMLElement | null): void {
    if (typeof window === 'undefined') return;
    if (!target || !target.isConnected) return;
    if (typeof target.focus !== 'function') return;
    window.requestAnimationFrame(() => target.focus());
  }

  private toSnapshot(record: OverlayRecord): OverlaySnapshot {
    return {
      id: record.id,
      intent: record.intent,
      presentation: record.presentation,
      blocking: record.blocking,
      dismissOnBackdrop: record.dismissOnBackdrop,
      dismissOnEscape: record.dismissOnEscape,
      source: record.source,
    };
  }
}

/** Singleton service for tracking open modals */
export const modalService = new ModalService();
