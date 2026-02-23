// UI-lib Modal component for consistent modal dialogs
import { modalService } from '../services/ModalService.ts';
export interface ModalOptions {
  onClose?: () => void;
  zIndex?: number;
  subtitle?: string;
  hideCloseButton?: boolean;
}
export function createModalShell(
  title: string,
  options?: ModalOptions
): { overlay: HTMLDivElement; container: HTMLDivElement } {
  const overlay = document.createElement('div');
  // Track modal open
  modalService.register();
  overlay.className =
    'fixed inset-0 bg-black/15 backdrop-blur-xs flex items-center justify-center';
  const zIndexValue = options?.zIndex ?? 200;
  overlay.style.zIndex = zIndexValue.toString();

  const container = document.createElement('div');
  container.className =
    'relative w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white px-6 pb-5 pt-5 shadow-[0_24px_56px_rgba(15,23,42,0.18)]';
  container.tabIndex = 0;

  const headerWrap = document.createElement('div');
  headerWrap.className = 'pr-8';

  const headerEl = document.createElement('h2');
  headerEl.className =
    'text-base font-semibold leading-6 tracking-tight text-slate-900';
  headerEl.textContent = title;
  headerWrap.appendChild(headerEl);

  if (options?.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'mt-1 text-sm leading-5 text-slate-500';
    subtitleEl.textContent = options.subtitle;
    headerWrap.appendChild(subtitleEl);
  }

  if (options?.onClose && !options.hideCloseButton) {
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className =
      'absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML =
      '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" class=\"h-4 w-4\" aria-hidden=\"true\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M6 6l8 8M14 6l-8 8\"/></svg>';
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onClose?.();
    });
    container.appendChild(closeButton);
  }

  const divider = document.createElement('div');
  divider.className = 'my-4 -mx-6 border-t border-slate-200';

  container.append(headerWrap, divider);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
  // Override remove() to unregister modalService
  const originalRemove = overlay.remove;
  overlay.remove = function () {
    // Clear focus to prevent stale inputs catching key events
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') active.blur();
    modalService.unregister();
    originalRemove.call(this);
  };
  // Handle click outside container to trigger onClose
  if (options?.onClose) {
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
  return { overlay, container };
}
