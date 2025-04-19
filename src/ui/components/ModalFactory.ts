// Reusable modal shell for consistent UI
export function createModalShell(title: string, zIndex = 200): { overlay: HTMLDivElement; container: HTMLDivElement } {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/15 backdrop-blur-xs flex items-center justify-center';
  overlay.style.zIndex = zIndex.toString();

  const container = document.createElement('div');
  container.className = 'bg-white rounded-lg p-6 w-96 space-y-4 shadow-lg';
  container.tabIndex = 0;

  const headerEl = document.createElement('h2');
  headerEl.className = 'text-lg font-semibold';
  headerEl.textContent = title;
  container.appendChild(headerEl);

  overlay.appendChild(container);
  document.body.appendChild(overlay);
  container.focus();

  return { overlay, container };
}
