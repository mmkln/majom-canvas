import { OverlayController } from '../../../ui-lib/src/services/OverlayController.ts';
import type { OverlayIntent } from '../../../ui-lib/src/services/ModalService.ts';
import {
  getModalContainerClass,
  getModalOverlayClass,
} from '../../../ui-lib/src/components/modalLayout.ts';

type OpenMobileBottomSheetOptions = {
  content: HTMLElement;
  ariaLabel: string;
  onRequestClose: () => void;
  zIndex?: number;
  containerClassName?: string;
  showGrabber?: boolean;
};

/**
 * Reusable mobile bottom-sheet host powered by shared ui-lib overlay policy.
 */
export class MobileBottomSheet {
  private readonly overlayController: OverlayController;
  private overlay: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private grabber: HTMLDivElement | null = null;
  private content: HTMLElement | null = null;
  private contentOriginParent: Node | null = null;
  private contentOriginNextSibling: Node | null = null;
  private onRequestClose: (() => void) | null = null;
  private dragPointerId: number | null = null;
  private dragStartY = 0;
  private dragCurrentY = 0;
  private dragStartTs = 0;
  private closeAnimationTimer: number | null = null;
  private readonly closeDistancePx = 88;
  private readonly closeVelocityPxPerMs = 0.9;

  constructor(intent: OverlayIntent, source: string) {
    this.overlayController = new OverlayController({ intent, source });
  }

  public isOpen(): boolean {
    return this.overlay !== null;
  }

  public open(options: OpenMobileBottomSheetOptions): void {
    this.close();

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    this.overlayController.open({
      presentation: 'bottom-sheet',
      blocking: true,
      dismissOnBackdrop: true,
      dismissOnEscape: true,
      restoreFocusTo: previousActiveElement,
    });

    const overlay = document.createElement('div');
    overlay.className = getModalOverlayClass('bottom-sheet');
    overlay.style.zIndex = String(options.zIndex ?? 220);

    const container = document.createElement('div');
    container.className = `${getModalContainerClass('bottom-sheet')} ${options.containerClassName ?? ''}`.trim();
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('aria-label', options.ariaLabel);
    container.tabIndex = 0;
    container.style.transform = 'translateY(0px)';

    if (options.showGrabber ?? true) {
      const grabber = document.createElement('div');
      grabber.className =
        'mx-auto mb-2 mt-0.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-300/90 cursor-grab active:cursor-grabbing';
      grabber.style.touchAction = 'none';
      grabber.setAttribute('aria-hidden', 'true');
      container.appendChild(grabber);
      this.grabber = grabber;
      this.grabber.addEventListener('pointerdown', this.handleGrabberPointerDown);
    }

    this.content = options.content;
    this.contentOriginParent = options.content.parentNode;
    this.contentOriginNextSibling = options.content.nextSibling;
    options.content.classList.remove('hidden');
    container.appendChild(options.content);

    this.onRequestClose = options.onRequestClose;
    overlay.addEventListener('click', (event) => {
      if (event.target !== overlay) return;
      this.onRequestClose?.();
    });
    container.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      this.onRequestClose?.();
    });

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.container = container;
    requestAnimationFrame(() => container.focus());
  }

  public close(): void {
    this.stopDragging({ resetTransform: false });
    if (this.closeAnimationTimer !== null) {
      window.clearTimeout(this.closeAnimationTimer);
      this.closeAnimationTimer = null;
    }
    if (this.grabber) {
      this.grabber.removeEventListener('pointerdown', this.handleGrabberPointerDown);
      this.grabber = null;
    }
    if (this.content) {
      this.content.classList.add('hidden');
      if (this.contentOriginParent) {
        const parent = this.contentOriginParent;
        const nextSibling = this.contentOriginNextSibling;
        const appendTarget = parent instanceof Element || parent instanceof DocumentFragment;
        if (appendTarget) {
          if (nextSibling && nextSibling.parentNode === parent) {
            parent.insertBefore(this.content, nextSibling);
          } else {
            parent.appendChild(this.content);
          }
        }
      }
    }

    if (this.overlay) {
      this.overlay.remove();
    }
    this.overlayController.close();
    this.overlay = null;
    this.container = null;
    this.content = null;
    this.contentOriginParent = null;
    this.contentOriginNextSibling = null;
    this.onRequestClose = null;
  }

  private readonly handleGrabberPointerDown = (event: PointerEvent): void => {
    if (!this.container || !this.grabber) return;
    if (event.button !== 0) return;
    this.stopDragging({ resetTransform: true });

    this.dragPointerId = event.pointerId;
    this.dragStartY = event.clientY;
    this.dragCurrentY = event.clientY;
    this.dragStartTs = performance.now();
    this.container.style.transition = 'none';
    this.grabber.setPointerCapture(event.pointerId);

    window.addEventListener('pointermove', this.handleDragPointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', this.handleDragPointerUp, {
      passive: false,
    });
    window.addEventListener('pointercancel', this.handleDragPointerCancel, {
      passive: false,
    });
    event.preventDefault();
  };

  private readonly handleDragPointerMove = (event: PointerEvent): void => {
    if (!this.container) return;
    if (this.dragPointerId === null || event.pointerId !== this.dragPointerId) {
      return;
    }
    this.dragCurrentY = event.clientY;
    const offset = Math.max(0, event.clientY - this.dragStartY);
    this.applyDragOffset(offset);
    if (offset > 0) {
      event.preventDefault();
    }
  };

  private readonly handleDragPointerUp = (event: PointerEvent): void => {
    if (!this.container) return;
    if (this.dragPointerId === null || event.pointerId !== this.dragPointerId) {
      return;
    }

    const offset = Math.max(0, this.dragCurrentY - this.dragStartY);
    const elapsedMs = Math.max(1, performance.now() - this.dragStartTs);
    const velocity = offset / elapsedMs;
    const shouldClose =
      offset >= this.closeDistancePx || velocity >= this.closeVelocityPxPerMs;
    this.stopDragging({ resetTransform: false });

    if (!shouldClose) {
      this.container.style.transition = 'transform 180ms ease-out';
      this.container.style.transform = 'translateY(0px)';
      return;
    }

    const targetOffset = Math.max(window.innerHeight, offset + 220);
    this.container.style.transition = 'transform 150ms ease-out';
    this.container.style.transform = `translateY(${targetOffset}px)`;
    this.closeAnimationTimer = window.setTimeout(() => {
      this.closeAnimationTimer = null;
      this.onRequestClose?.();
    }, 130);
  };

  private readonly handleDragPointerCancel = (event: PointerEvent): void => {
    if (this.dragPointerId === null || event.pointerId !== this.dragPointerId) {
      return;
    }
    this.stopDragging({ resetTransform: true });
  };

  private stopDragging(options: { resetTransform: boolean }): void {
    const activePointerId = this.dragPointerId;
    this.dragPointerId = null;
    this.dragStartY = 0;
    this.dragCurrentY = 0;
    this.dragStartTs = 0;
    window.removeEventListener('pointermove', this.handleDragPointerMove);
    window.removeEventListener('pointerup', this.handleDragPointerUp);
    window.removeEventListener('pointercancel', this.handleDragPointerCancel);
    if (this.grabber && activePointerId !== null) {
      if (this.grabber.hasPointerCapture(activePointerId)) {
        this.grabber.releasePointerCapture(activePointerId);
      }
    }
    if (options.resetTransform && this.container) {
      this.container.style.transition = 'transform 180ms ease-out';
      this.container.style.transform = 'translateY(0px)';
    }
  }

  private applyDragOffset(offsetPx: number): void {
    if (!this.container) return;
    this.container.style.transform = `translateY(${Math.round(offsetPx)}px)`;
  }
}
