export type ViewBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const getViewBounds = (
  panZoom: { scrollX: number; scrollY: number; scale: number },
  canvas: { width: number; height: number }
): ViewBounds => {
  const viewMinX = panZoom.scrollX / panZoom.scale;
  const viewMinY = panZoom.scrollY / panZoom.scale;
  const viewMaxX = (panZoom.scrollX + canvas.width) / panZoom.scale;
  const viewMaxY = (panZoom.scrollY + canvas.height) / panZoom.scale;
  return {
    minX: viewMinX,
    minY: viewMinY,
    maxX: viewMaxX,
    maxY: viewMaxY,
  };
};

export const isRectVisible = (
  viewBounds: ViewBounds | null | undefined,
  x: number,
  y: number,
  width: number,
  height: number
): boolean => {
  if (!viewBounds) return true;
  const right = x + width;
  const bottom = y + height;
  return (
    right >= viewBounds.minX &&
    x <= viewBounds.maxX &&
    bottom >= viewBounds.minY &&
    y <= viewBounds.maxY
  );
};

export const isCircleVisible = (
  viewBounds: ViewBounds | null | undefined,
  centerX: number,
  centerY: number,
  radius: number
): boolean => {
  if (!viewBounds) return true;
  const left = centerX - radius;
  const right = centerX + radius;
  const top = centerY - radius;
  const bottom = centerY + radius;
  return (
    right >= viewBounds.minX &&
    left <= viewBounds.maxX &&
    bottom >= viewBounds.minY &&
    top <= viewBounds.maxY
  );
};
