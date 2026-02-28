import { ElementStatus } from '../ElementStatus.ts';

export type ViewBounds =
  | {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    }
  | null
  | undefined;

export type RectAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: ViewBounds;
};

export type CircleAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: ViewBounds;
};

export type HexAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: ViewBounds;
};

export type OutlinePath = {
  drawPath: (ctx: CanvasRenderingContext2D, offset: number) => void;
  perimeter: (offset: number) => number;
  pointAt: (t: number, offset: number) => { x: number; y: number };
};

export type OutlineAnimationParams = {
  status: ElementStatus;
  ctx: CanvasRenderingContext2D;
  outline: OutlinePath;
  lineWidth: number;
  scale: number;
  color?: string;
  timeMs: number;
  viewBounds?: ViewBounds;
};

export type OutlineEffectParams = Omit<OutlineAnimationParams, 'status'>;
