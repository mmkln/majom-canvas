export const LEARNING_CANVAS_EDITOR_REQUESTED_EVENT =
  'learning-canvas:editor-requested';

export type LearningCanvasEditorRequestedDetail =
  | {
      kind: 'module';
      id: string;
    }
  | {
      kind: 'unit';
      id: string;
    };

export function emitLearningCanvasEditorRequested(
  detail: LearningCanvasEditorRequestedDetail
): void {
  window.dispatchEvent(
    new CustomEvent<LearningCanvasEditorRequestedDetail>(
      LEARNING_CANVAS_EDITOR_REQUESTED_EVENT,
      {
        detail,
      }
    )
  );
}
