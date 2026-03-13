import { HUD_SURFACE_CLASS, HUD_SURFACE_ELEVATED_CLASS } from './classNames.ts';

type HudSurfaceOptions = {
  elevated?: boolean;
  className?: string;
};

export function createHudSurface(
  options: HudSurfaceOptions = {}
): HTMLDivElement {
  const surface = document.createElement('div');
  surface.setAttribute('data-component', 'HudSurface');
  const baseClass = options.elevated
    ? HUD_SURFACE_ELEVATED_CLASS
    : HUD_SURFACE_CLASS;
  surface.className = `${baseClass} ${options.className ?? ''}`.trim();
  return surface;
}
