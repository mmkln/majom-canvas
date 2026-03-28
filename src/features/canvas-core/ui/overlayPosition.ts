type AlignX = 'left' | 'center' | 'right';
type AlignY = 'top' | 'center' | 'bottom';

type FixedPositionOptions = {
  anchorX: number;
  anchorY: number;
  alignX?: AlignX;
  alignY?: AlignY;
  offsetX?: number;
  offsetY?: number;
  margin?: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const measureElement = (
  element: HTMLElement
): { width: number; height: number } => {
  const rect = element.getBoundingClientRect();
  if (rect.width || rect.height) {
    return { width: rect.width, height: rect.height };
  }
  const prevDisplay = element.style.display;
  const prevVisibility = element.style.visibility;
  const prevPointerEvents = element.style.pointerEvents;
  const computedDisplay = window.getComputedStyle(element).display;
  if (computedDisplay === 'none') {
    element.style.display = 'block';
  }
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  const next = element.getBoundingClientRect();
  element.style.display = prevDisplay;
  element.style.visibility = prevVisibility;
  element.style.pointerEvents = prevPointerEvents;
  return { width: next.width, height: next.height };
};

export const positionFixedElement = (
  element: HTMLElement,
  options: FixedPositionOptions
): { left: number; top: number } => {
  const {
    anchorX,
    anchorY,
    alignX = 'left',
    alignY = 'top',
    offsetX = 0,
    offsetY = 0,
    margin = 8,
  } = options;
  const { width, height } = measureElement(element);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = anchorX + offsetX;
  if (alignX === 'center') {
    left -= width / 2;
  } else if (alignX === 'right') {
    left -= width;
  }

  let top = anchorY + offsetY;
  if (alignY === 'center') {
    top -= height / 2;
  } else if (alignY === 'bottom') {
    top -= height;
  }

  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  left = clamp(left, margin, maxLeft);
  top = clamp(top, margin, maxTop);

  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  return { left, top };
};
