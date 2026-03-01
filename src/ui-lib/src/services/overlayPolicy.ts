import type {
  OverlayIntent,
  OverlayPresentation,
} from './ModalService.ts';

export type OverlayDeviceContext = {
  viewportWidth: number;
  viewportHeight: number;
  coarsePointer: boolean;
};

export type OverlayPolicyInput = {
  intent: OverlayIntent;
  preferredPresentation?: OverlayPresentation;
};

export function getOverlayDeviceContext(
  win: Window | null = typeof window !== 'undefined' ? window : null
): OverlayDeviceContext {
  if (!win) {
    return {
      viewportWidth: 1024,
      viewportHeight: 768,
      coarsePointer: false,
    };
  }

  const viewport = win.visualViewport;
  const viewportWidth = Math.max(
    0,
    Math.round(viewport?.width ?? win.innerWidth)
  );
  const viewportHeight = Math.max(
    0,
    Math.round(viewport?.height ?? win.innerHeight)
  );
  const coarsePointer =
    typeof win.matchMedia === 'function' &&
    win.matchMedia('(pointer: coarse)').matches;

  return {
    viewportWidth,
    viewportHeight,
    coarsePointer,
  };
}

export function isMobileOverlayContext(
  context: OverlayDeviceContext
): boolean {
  return context.viewportWidth <= 767 || context.coarsePointer;
}

export function resolveOverlayPresentation(
  input: OverlayPolicyInput,
  win: Window | null = typeof window !== 'undefined' ? window : null
): OverlayPresentation {
  if (input.preferredPresentation) return input.preferredPresentation;

  const device = getOverlayDeviceContext(win);
  if (!isMobileOverlayContext(device)) {
    return 'dialog';
  }

  switch (input.intent) {
    case 'form':
      return 'bottom-sheet';
    case 'confirm':
    case 'picker':
    case 'info':
    default:
      return 'bottom-sheet';
  }
}
