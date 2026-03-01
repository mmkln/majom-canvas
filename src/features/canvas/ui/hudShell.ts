import type { CanvasHudMode } from './canvasHudPolicy.ts';

export type CanvasHudSlots = {
  board: HTMLDivElement;
  save: HTMLDivElement;
  navigation: HTMLDivElement;
};

export interface CanvasHudShell {
  readonly mode: CanvasHudMode;
  mount(parent: HTMLElement): CanvasHudSlots;
  unmount(): void;
}

