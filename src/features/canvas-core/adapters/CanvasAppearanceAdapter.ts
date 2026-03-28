import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { CanvasInteractionState } from '../elements/interfaces/structuredCanvasNode.ts';

export type CanvasElementAppearance = {
  fillColor?: string;
  chromeColor?: string;
  borderColor?: string;
  selectionStrokeColor?: string | null;
  textColor?: string;
};

export type CanvasAppearanceContext = {
  interactionStates: ReadonlySet<CanvasInteractionState>;
  selected: boolean;
  scale?: number;
};

export interface CanvasAppearanceAdapter {
  resolveElementAppearance?(
    element: ICanvasElement,
    context: CanvasAppearanceContext
  ): CanvasElementAppearance | null;
}
