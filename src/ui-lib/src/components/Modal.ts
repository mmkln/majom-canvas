// UI-lib Modal component for consistent modal dialogs
import { modalService } from '../services/ModalService.ts';
export interface ModalOptions { onClose?: () => void; zIndex?: number; }
export function createModalShell(title: string, options?: ModalOptions): { overlay: HTMLDivElement; container: HTMLDivElement } {
  const overlay = document.createElement('div');
  // Track modal open
  modalService.register();
  overlay.className = 'fixed inset-0 bg-black/15 backdrop-blur-xs flex items-center justify-center';
  const zIndexValue = options?.zIndex ?? 200;
  overlay.style.zIndex = zIndexValue.toString();

  const container = document.createElement('div');
  container.className = 'bg-white rounded-lg p-6 w-96 space-y-4 shadow-lg';
  container.tabIndex = 0;

  const headerEl = document.createElement('h2');
  headerEl.className = 'text-lg font-semibold';
  headerEl.textContent = title;
  container.appendChild(headerEl);

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
  const titleId = `modal-title-${Math.random().toString(36).substr(2,9)}`;
  headerEl.id = titleId;
  container.setAttribute('aria-labelledby', titleId);
  container.focus();
  // Focus trap inside modal
  const focusable = 'a[href], area[href], input, select, textarea, button, iframe, object, embed, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(container.querySelectorAll<HTMLElement>(focusable)).filter(el => !el.hasAttribute('disabled'));
  const first = elements[0];
  const last = elements[elements.length - 1];
  container.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  return { overlay, container };
}
