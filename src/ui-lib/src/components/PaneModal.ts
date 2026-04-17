import {
  type OverlayIntent,
  type OverlayPresentation,
} from '../services/ModalService.ts';
import { OverlayController } from '../services/OverlayController.ts';
import {
  getModalContainerMaxHeight,
  getModalOverlayClass,
} from './modalLayout.ts';

export interface PaneModalOptions {
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

function getPaneModalContainerClass(
  presentation: OverlayPresentation
): string {
  if (presentation === 'fullscreen') {
    return 'relative flex h-[calc(100dvh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom)))] w-full max-w-[48rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:h-auto md:max-h-[min(88vh,56rem)] md:w-[min(48rem,calc(100vw-2rem))] md:rounded-xl';
  }
  if (presentation === 'bottom-sheet') {
    return 'relative flex w-screen max-w-none flex-col overflow-hidden rounded-none rounded-t-2xl border-x-0 border-b-0 border-t border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:w-[min(48rem,calc(100vw-2rem))] md:max-h-[min(88vh,56rem)] md:rounded-xl md:border';
  }
  return 'relative flex w-full max-w-[48rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.18)] md:w-[min(48rem,calc(100vw-2rem))] md:max-h-[min(88vh,56rem)] md:rounded-xl';
}

export function createPaneModalShell(
  title: string,
  options?: PaneModalOptions
): {
  overlay: HTMLDivElement;
  container: HTMLDivElement;
  header: HTMLDivElement;
  headerInner: HTMLDivElement;
  titleWrap: HTMLDivElement;
  titleElement: HTMLHeadingElement;
  actions: HTMLDivElement;
  divider: HTMLDivElement;
  body: HTMLDivElement;
} {
  const overlay = document.createElement('div');
  overlay.setAttribute('data-component', 'PaneModalOverlay');
  const previousActiveElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const closeOnBackdrop = options?.closeOnBackdrop ?? true;
  const closeOnEscape = options?.closeOnEscape ?? true;
  const intent = options?.intent ?? 'info';
  const explicitPresentation =
    options?.presentation ?? (options?.mobileFullscreen ? 'fullscreen' : undefined);
  const overlayController = new OverlayController({
    intent,
    source: 'createPaneModalShell',
  });
  const presentation = overlayController.open({
    presentation: explicitPresentation,
    blocking: true,
    dismissOnBackdrop: closeOnBackdrop,
    dismissOnEscape: closeOnEscape,
    restoreFocusTo: previousActiveElement,
  });
  overlay.className = getModalOverlayClass(presentation);
  overlay.style.zIndex = String(options?.zIndex ?? 200);

  const container = document.createElement('div');
  container.setAttribute('data-component', 'PaneModalContainer');
  container.className = getPaneModalContainerClass(presentation);
  container.style.maxHeight = getModalContainerMaxHeight(presentation);
  container.style.overflowY = 'hidden';
  container.style.overscrollBehavior = 'contain';
  container.tabIndex = 0;
  container.dataset.overlayIntent = intent;
  container.dataset.overlayPresentation = presentation;

  const header = document.createElement('div');
  header.setAttribute('data-component', 'PaneModalHeader');
  header.className = 'shrink-0';

  const headerInner = document.createElement('div');
  headerInner.setAttribute('data-component', 'PaneModalHeaderInner');
  headerInner.className = 'px-4 py-4 md:px-6 md:py-5';

  const headerTopRow = document.createElement('div');
  headerTopRow.setAttribute('data-component', 'PaneModalHeaderTopRow');
  headerTopRow.className = 'flex items-center justify-between gap-3';

  const titleWrap = document.createElement('div');
  titleWrap.setAttribute('data-component', 'PaneModalTitleWrap');
  titleWrap.className = 'min-w-0 flex-1';

  const headerEl = document.createElement('h2');
  headerEl.className =
    'min-w-0 text-base font-semibold leading-6 tracking-tight text-slate-900';
  headerEl.textContent = title;
  titleWrap.appendChild(headerEl);

  if (options?.subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'mt-1 text-sm leading-5 text-slate-500';
    subtitleEl.textContent = options.subtitle;
    const subtitleId = `pane-modal-subtitle-${Math.random().toString(36).slice(2, 11)}`;
    subtitleEl.id = subtitleId;
    container.setAttribute('aria-describedby', subtitleId);
    titleWrap.appendChild(subtitleEl);
  }

  const actions = document.createElement('div');
  actions.setAttribute('data-component', 'PaneModalHeaderActions');
  actions.className = 'flex shrink-0 items-center self-center gap-2';

  headerTopRow.append(titleWrap, actions);
  headerInner.appendChild(headerTopRow);
  header.appendChild(headerInner);

  if (options?.onClose && !options.hideCloseButton) {
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className =
      'inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-200 md:h-9 md:w-9';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 6l8 8M14 6l-8 8"/></svg>';
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onClose?.();
    });
    actions.appendChild(closeButton);
  }

  const divider = document.createElement('div');
  divider.setAttribute('data-component', 'PaneModalDivider');
  divider.className = 'shrink-0 border-t border-slate-200';

  const body = document.createElement('div');
  body.setAttribute('data-component', 'PaneModalBody');
  body.className = 'min-h-0 flex-1 overflow-hidden';
  body.style.overscrollBehavior = 'contain';

  if (presentation === 'bottom-sheet') {
    const grabber = document.createElement('div');
    grabber.className =
      'mx-auto mt-2 mb-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-300/90 md:hidden';
    grabber.setAttribute('aria-hidden', 'true');
    container.appendChild(grabber);
  }

  container.append(header, divider, body);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const originalRemove = overlay.remove.bind(overlay);
  let closed = false;
  overlay.remove = function () {
    if (closed) return;
    closed = true;
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') active.blur();
    originalRemove();
    overlayController.close();
  };

  if (options?.onClose && closeOnBackdrop) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) options.onClose?.();
    });
  }

  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-modal', 'true');
  const titleId = `pane-modal-title-${Math.random().toString(36).slice(2, 11)}`;
  headerEl.id = titleId;
  container.setAttribute('aria-labelledby', titleId);

  const focusable =
    'a[href], area[href], input, select, textarea, button, iframe, object, embed, [tabindex]:not([tabindex="-1"])';
  const getFocusableElements = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(focusable)).filter(
      (el) =>
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-hidden') !== 'true'
    );

  requestAnimationFrame(() => {
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      active !== document.body &&
      active !== container &&
      container.contains(active)
    ) {
      return;
    }
    const elements = getFocusableElements();
    (elements[0] ?? container).focus();
  });

  container.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && options?.onClose && closeOnEscape) {
      event.preventDefault();
      options.onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const elements = getFocusableElements();
    if (elements.length === 0) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || active === container) {
        event.preventDefault();
        last.focus();
      }
      return;
    }
    if (active === last || active === container) {
      event.preventDefault();
      first.focus();
    }
  });

  return {
    overlay,
    container,
    header,
    headerInner,
    titleWrap,
    titleElement: headerEl,
    actions,
    divider,
    body,
  };
}
