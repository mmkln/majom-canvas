import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type {
  AlignmentInteractionMode,
  AlignmentPreferences,
  AlignmentRect,
  AlignmentSubject,
} from '../core/alignment/types.ts';

export type CanvasAlignmentContext = {
  elements: ReadonlyArray<ICanvasElement>;
  movingElements: ReadonlyArray<ICanvasElement>;
  viewport: AlignmentRect | null;
  mode: AlignmentInteractionMode;
  preferences: AlignmentPreferences;
};

export interface CanvasAlignmentAdapter {
  getMovingSubject(context: CanvasAlignmentContext): AlignmentSubject | null;
  getReferenceSubjects(context: CanvasAlignmentContext): AlignmentSubject[];
  getVirtualSubjects?(context: CanvasAlignmentContext): AlignmentSubject[];
}
