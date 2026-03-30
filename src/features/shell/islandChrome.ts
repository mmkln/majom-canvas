export type IslandChromeTokens = {
  marginPx: number;
  gapPx: number;
  radiusPx: number;
  backdropColor: string;
};

type IslandFrameValue = number | string;

type IslandFrameOptions = {
  left?: IslandFrameValue;
  right?: IslandFrameValue;
  top?: IslandFrameValue;
  bottom?: IslandFrameValue;
  width?: IslandFrameValue;
  height?: IslandFrameValue;
  border?: string;
  borderLeft?: string;
  borderRight?: string;
  background?: string;
  overflow?: string;
  boxShadow?: string;
  backdropFilter?: string;
};

export const FULL_BLEED_ISLAND_CHROME: IslandChromeTokens = {
  marginPx: 0,
  gapPx: 0,
  radiusPx: 0,
  backdropColor: 'transparent',
};

export const MULTI_ISLAND_CHROME: IslandChromeTokens = {
  marginPx: 0,
  gapPx: 0,
  radiusPx: 28,
  backdropColor: '#f4f8fc',
};

function toCssValue(value: IslandFrameValue): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function applyIslandBackdrop(
  element: HTMLElement,
  chrome: IslandChromeTokens
): void {
  element.style.background = chrome.backdropColor;
}

export function applyIslandFrame(
  element: HTMLElement,
  chrome: IslandChromeTokens,
  options: IslandFrameOptions
): void {
  if (options.left !== undefined) {
    element.style.left = toCssValue(options.left);
  }
  if (options.right !== undefined) {
    element.style.right = toCssValue(options.right);
  }
  if (options.top !== undefined) {
    element.style.top = toCssValue(options.top);
  }
  if (options.bottom !== undefined) {
    element.style.bottom = toCssValue(options.bottom);
  }
  if (options.width !== undefined) {
    element.style.width = toCssValue(options.width);
  }
  if (options.height !== undefined) {
    element.style.height = toCssValue(options.height);
  }
  if (options.border !== undefined) {
    element.style.border = options.border;
  }
  if (options.borderLeft !== undefined) {
    element.style.borderLeft = options.borderLeft;
  }
  if (options.borderRight !== undefined) {
    element.style.borderRight = options.borderRight;
  }
  if (options.background !== undefined) {
    element.style.background = options.background;
  }
  if (options.overflow !== undefined) {
    element.style.overflow = options.overflow;
  }
  if (options.boxShadow !== undefined) {
    element.style.boxShadow = options.boxShadow;
  }
  if (options.backdropFilter !== undefined) {
    element.style.backdropFilter = options.backdropFilter;
  }
  element.style.borderRadius = `${chrome.radiusPx}px`;
}
