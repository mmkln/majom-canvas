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
  RectAnimationParams,
} from './statusAnimationTypes.ts';

export { hasStatusAnimation };

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
  } = params;
  if (!isRectVisible(viewBounds, x, y, width, height)) return;
  const outline = createRectOutline({ x, y, width, height, radius });
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
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
  } = params;
  if (!isCircleVisible(viewBounds, centerX, centerY, radius)) return;
  const outline = createCircleOutline({ centerX, centerY, radius });
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
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
  } = params;
  if (!isCircleVisible(viewBounds, centerX, centerY, radius)) return;
  const outline = createHexOutline({ centerX, centerY, radius });
  drawStatusAnimationEffect({
    status,
    ctx,
    outline,
    lineWidth,
    scale,
    color,
    timeMs,
    viewBounds,
  });
};
