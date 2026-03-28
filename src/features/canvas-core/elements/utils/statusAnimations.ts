import { isCircleVisible, isRectVisible } from '../../core/utils/viewBounds.ts';
import {
  drawStatusAnimationEffect,
  hasStatusAnimation,
} from './statusAnimationEffects.ts';
import {
  createCircleOutline,
  createHexOutline,
  createRectOutline,
} from './statusAnimationOutlines.ts';
import type {
  CircleAnimationParams,
  HexAnimationParams,
  OutlinePath,
  RectAnimationParams,
} from './statusAnimationTypes.ts';

export { hasStatusAnimation };

const STATUS_OUTLINE_CACHE_LIMIT = 1024;
const rectOutlineCache = new Map<string, OutlinePath>();
const circleOutlineCache = new Map<string, OutlinePath>();
const hexOutlineCache = new Map<string, OutlinePath>();

export const __clearStatusOutlineCache = (): void => {
  rectOutlineCache.clear();
  circleOutlineCache.clear();
  hexOutlineCache.clear();
};

const roundKey = (value: number): number => Math.round(value * 100) / 100;

const touchCacheEntry = (
  cache: Map<string, OutlinePath>,
  key: string,
  value: OutlinePath
): void => {
  cache.delete(key);
  cache.set(key, value);
};

const setCachedOutline = (
  cache: Map<string, OutlinePath>,
  key: string,
  value: OutlinePath
): OutlinePath => {
  touchCacheEntry(cache, key, value);
  if (cache.size > STATUS_OUTLINE_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  return value;
};

const getCachedRectOutline = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): OutlinePath => {
  const key = `${roundKey(x)}:${roundKey(y)}:${roundKey(width)}:${roundKey(height)}:${roundKey(radius)}`;
  const cached = rectOutlineCache.get(key);
  if (cached) {
    touchCacheEntry(rectOutlineCache, key, cached);
    return cached;
  }
  return setCachedOutline(
    rectOutlineCache,
    key,
    createRectOutline({ x, y, width, height, radius })
  );
};

const getCachedCircleOutline = (
  centerX: number,
  centerY: number,
  radius: number
): OutlinePath => {
  const key = `${roundKey(centerX)}:${roundKey(centerY)}:${roundKey(radius)}`;
  const cached = circleOutlineCache.get(key);
  if (cached) {
    touchCacheEntry(circleOutlineCache, key, cached);
    return cached;
  }
  return setCachedOutline(
    circleOutlineCache,
    key,
    createCircleOutline({ centerX, centerY, radius })
  );
};

const getCachedHexOutline = (
  centerX: number,
  centerY: number,
  radius: number
): OutlinePath => {
  const key = `${roundKey(centerX)}:${roundKey(centerY)}:${roundKey(radius)}`;
  const cached = hexOutlineCache.get(key);
  if (cached) {
    touchCacheEntry(hexOutlineCache, key, cached);
    return cached;
  }
  return setCachedOutline(
    hexOutlineCache,
    key,
    createHexOutline({ centerX, centerY, radius })
  );
};

export const drawStatusAnimationRect = (params: RectAnimationParams): void => {
  const {
    status,
    ctx,
    x,
    y,
    width,
    height,
    radius,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  } = params;
  if (!isRectVisible(viewBounds, x, y, width, height)) return;
  const outline = getCachedRectOutline(x, y, width, height, radius);
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  });
};

export const drawStatusAnimationCircle = (
  params: CircleAnimationParams
): void => {
  const {
    status,
    ctx,
    centerX,
    centerY,
    radius,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  } = params;
  if (!isCircleVisible(viewBounds, centerX, centerY, radius)) return;
  const outline = getCachedCircleOutline(centerX, centerY, radius);
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  });
};

export const drawStatusAnimationHex = (params: HexAnimationParams): void => {
  const {
    status,
    ctx,
    centerX,
    centerY,
    radius,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  } = params;
  if (!isCircleVisible(viewBounds, centerX, centerY, radius)) return;
  const outline = getCachedHexOutline(centerX, centerY, radius);
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
    detail,
  });
};
