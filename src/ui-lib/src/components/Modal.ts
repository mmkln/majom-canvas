// UI-lib Modal component for consistent modal dialogs
import {
  type OverlayIntent,
  type OverlayPresentation,
} from '../services/ModalService.ts';
import { OverlayController } from '../services/OverlayController.ts';
import {
  MODAL_BODY_CLASS,
  MODAL_DIVIDER_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  createModalActionRow,
  getModalActionButtonClass,
  getModalContainerClass,
  getModalContainerMaxHeight,
  getModalOverlayClass,
  type ModalActionButtonPreset,
  type ModalActionRowOptions,
  type ModalActionRowVariant,
} from './modalLayout.ts';
export interface ModalOptions {
  onClose?: () => void;
  zIndex?: number;
  subtitle?: string;
  hideCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  intent?: OverlayIntent;
  presentation?: OverlayPresentation;
  /** @deprecated Prefer intent/presentation. */
  mobileFullscreen?: boolean;
}

export function createModalShell(
  title: string,
  options?: ModalOptions
): {
  overlay: HTMLDivElement;
  container: HTMLDivElement;
  header: HTMLDivElement;
  divider: HTMLDivElement;
  body: HTMLDivElement;
  footer: HTMLDivElement;
} {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-component', 'ModalOverlay');
  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const closeOnBackdrop = options?.closeOnBackdrop ?? true;
  const closeOnEscape = options?.closeOnEscape ?? true;
  const intent = options?.intent ?? 'info';
  const explicitPresentation =
    options?.presentation ?? (options?.mobileFullscreen ? 'fullscreen' : undefined);
  const overlayController = new OverlayController({
    intent,
    source: 'createModalShell',
  });
  const presentation = overlayController.open({
    presentation: explicitPresentation,
    blocking: true,
    dismissOnBackdrop: closeOnBackdrop,
    dismissOnEscape: closeOnEscape,
    restoreFocusTo: previousActiveElement,
  });
  overlay.className = getModalOverlayClass(presentation);
  const zIndexValue = options?.zIndex ?? 200;
  overlay.style.zIndex = zIndexValue.toString();

  const container = document.createElement('div');
  container.setAttribute('data-component', 'ModalContainer');
  container.className = getModalContainerClass(presentation);
  container.style.maxHeight = getModalContainerMaxHeight(presentation);
  container.style.overflowY = 'hidden';
  container.style.overscrollBehavior = 'contain';
  container.tabIndex = 0;
  container.dataset.overlayIntent = intent;
  container.dataset.overlayPresentation = presentation;

  const headerWrap = document.createElement('div');
  headerWrap.className = MODAL_HEADER_CLASS;

  const headerEl = document.createElement('h2');
  headerEl.className =
    'text-base font-semibold leading-6 tracking-tight text-slate-900';
  headerEl.textContent = title;
  headerWrap.appendChild(headerEl);

  if (options?.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'mt-1 text-sm leading-5 text-slate-600';
    subtitleEl.textContent = options.subtitle;
    const subtitleId = `modal-subtitle-${Math.random().toString(36).slice(2, 11)}`;
    subtitleEl.id = subtitleId;
    container.setAttribute('aria-describedby', subtitleId);
    headerWrap.appendChild(subtitleEl);
  }

  if (options?.onClose && !options.hideCloseButton) {
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className =
      'absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 md:right-4 md:top-4 md:h-9 md:w-9';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l8 8M14 6l-8 8"/></svg>';
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onClose?.();
    });
    container.appendChild(closeButton);
  }

  const divider = document.createElement('div');
  divider.className = MODAL_DIVIDER_CLASS;

  const body = document.createElement('div');
  body.className = MODAL_BODY_CLASS;
  body.style.overscrollBehavior = 'contain';

  const footer = document.createElement('div');
  footer.className = MODAL_FOOTER_CLASS;

  if (presentation === 'bottom-sheet') {
    const grabber = document.createElement('div');
    grabber.className =
      'mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-300/90 md:hidden';
    grabber.setAttribute('aria-hidden', 'true');
    container.appendChild(grabber);
  }

  container.append(headerWrap, divider, body, footer);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
  // Override remove() to keep overlay stack in sync.
  const originalRemove = overlay.remove.bind(overlay);
  let closed = false;
  overlay.remove = function () {
    if (closed) return;
    closed = true;
    // Clear focus to prevent stale inputs catching key events
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') active.blur();
    originalRemove();
    overlayController.close();
  };
  // Handle click outside container to trigger onClose
  if (options?.onClose && closeOnBackdrop) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) options.onClose!();
    });
  }
  // Accessibility: ARIA and focus management
  // role and modal attributes
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-modal', 'true');
  // Associate header
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 11)}`;
  headerEl.id = titleId;
  container.setAttribute('aria-labelledby', titleId);
  // Focus trap inside modal
  const focusable =
    'a[href], area[href], input, select, textarea, button, iframe, object, embed, [tabindex]:not([tabindex="-1"])';
  const getFocusableElements = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(focusable)).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true'
    );
  requestAnimationFrame(() => {
    const elements = getFocusableElements();
    (elements[0] ?? container).focus();
  });
  container.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && options?.onClose && closeOnEscape) {
      e.preventDefault();
      options.onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const elements = getFocusableElements();
    if (elements.length === 0) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey) {
      if (active === first || active === container) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || active === container) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  return { overlay, container, header: headerWrap, divider, body, footer };
}

export {
  createModalActionRow,
  getModalActionButtonClass,
  type ModalActionButtonPreset,
  type ModalActionRowOptions,
  type ModalActionRowVariant,
};
