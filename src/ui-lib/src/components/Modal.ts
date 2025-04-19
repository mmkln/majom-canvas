// UI-lib Modal component for consistent modal dialogs
export interface ModalOptions { onClose?: () => void; zIndex?: number; }
export function createModalShell(title: string, options?: ModalOptions): { overlay: HTMLDivElement; container: HTMLDivElement } {
  const overlay = document.createElement('div');
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
  // Handle click outside container to trigger onClose
  if (options?.onClose) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) options.onClose!();
    });
  }
  container.focus();

  return { overlay, container };
}
