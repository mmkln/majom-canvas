export type CanvasHudMode = 'desktop' | 'mobile';

export type CanvasHudPolicy = {
  mode: CanvasHudMode;
  isCoarsePointer: boolean;
  isShortViewport: boolean;
  viewportWidth: number;
  viewportHeight: number;
  workspaceSwitcherBottomOffsetPx: number;
  miniMapDefaultVisible: boolean;
  showBottomUndoRedo: boolean;
};

type ResolveCanvasHudPolicyOptions = {
  windowRef?: Window | null;
};

const MOBILE_MAX_WIDTH = 767;
const MOBILE_COARSE_MAX_WIDTH = 900;
const SHORT_VIEWPORT_MAX_HEIGHT = 700;
const DESKTOP_SWITCHER_OFFSET = 16;
const MOBILE_SWITCHER_OFFSET = 88;

export function resolveCanvasHudPolicy(
  options: ResolveCanvasHudPolicyOptions = {}
): CanvasHudPolicy {
  const win =
    options.windowRef ??
    (typeof window !== 'undefined' ? window : null);

  if (!win) {
    return {
      mode: 'desktop',
      isCoarsePointer: false,
      isShortViewport: false,
      viewportWidth: 1280,
      viewportHeight: 800,
      workspaceSwitcherBottomOffsetPx: DESKTOP_SWITCHER_OFFSET,
      miniMapDefaultVisible: true,
      showBottomUndoRedo: false,
    };
  }

  const viewport = win.visualViewport;
  const viewportWidth = Math.round(viewport?.width ?? win.innerWidth);
  const viewportHeight = Math.round(viewport?.height ?? win.innerHeight);
  const isCoarsePointer =
    typeof win.matchMedia === 'function' &&
    win.matchMedia('(pointer: coarse)').matches;
  const isShortViewport = viewportHeight <= SHORT_VIEWPORT_MAX_HEIGHT;
  const isMobileByWidth = viewportWidth <= MOBILE_MAX_WIDTH;
  const isMobileByCoarse =
    isCoarsePointer && viewportWidth <= MOBILE_COARSE_MAX_WIDTH;
  const mode: CanvasHudMode =
    isMobileByWidth || isMobileByCoarse ? 'mobile' : 'desktop';

  return {
    mode,
    isCoarsePointer,
    isShortViewport,
    viewportWidth,
    viewportHeight,
    workspaceSwitcherBottomOffsetPx:
      mode === 'mobile' ? MOBILE_SWITCHER_OFFSET : DESKTOP_SWITCHER_OFFSET,
    miniMapDefaultVisible: mode === 'desktop',
    showBottomUndoRedo: mode === 'mobile',
  };
}
