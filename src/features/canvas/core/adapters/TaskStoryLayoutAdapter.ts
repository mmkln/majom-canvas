import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { StoryDropPlan } from '../services/StoryDragPreviewService.ts';

export type TaskStoryLayoutChanges = {
  movedInitial: Map<string, { x: number; y: number }>;
  movedFinal: Map<string, { x: number; y: number }>;
  resizedInitial: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  resizedFinal: Map<
    string,
    { x: number; y: number; width: number; height: number }
  >;
};

export type TaskStoryLayoutMode = 'group' | 'item';

export type TaskStoryLayoutContext = {
  mode: TaskStoryLayoutMode;
  draggingItem: ICanvasElement | null;
  selectedElements: ICanvasElement[];
  sceneElements: ICanvasElement[];
  draggedElementIds: Set<string>;
  dropPlans: Map<string, StoryDropPlan>;
};

export const createEmptyTaskStoryLayoutChanges =
  (): TaskStoryLayoutChanges => ({
    movedInitial: new Map<string, { x: number; y: number }>(),
    movedFinal: new Map<string, { x: number; y: number }>(),
    resizedInitial: new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >(),
    resizedFinal: new Map<
      string,
      { x: number; y: number; width: number; height: number }
    >(),
  });

export interface TaskStoryLayoutAdapter {
  compute(context: TaskStoryLayoutContext): TaskStoryLayoutChanges;
}

export class NoopTaskStoryLayoutAdapter implements TaskStoryLayoutAdapter {
  public compute(_context: TaskStoryLayoutContext): TaskStoryLayoutChanges {
    return createEmptyTaskStoryLayoutChanges();
  }
}
