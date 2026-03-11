import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import type {
  StoryDropPlan,
  StoryResizePreview,
  TaskDropPlaceholder,
  TaskReflowPreview,
} from '../services/StoryDragPreviewService.ts';

export type {
  StoryDropPlan,
  StoryResizePreview,
  TaskDropPlaceholder,
  TaskReflowPreview,
};

export type TaskDropPreviewState = {
  taskDropPlaceholders: TaskDropPlaceholder[];
  storyDropPlans: Map<string, StoryDropPlan>;
  storyResizePreviews: StoryResizePreview[];
  taskReflowPreviews: Map<string, TaskReflowPreview>;
};

export type TaskDropPreviewUpdateContext = {
  sceneElements: ICanvasElement[];
  initialPositions: ReadonlyMap<string, { x: number; y: number }>;
  pointer: { x: number; y: number };
};

export interface TaskDropPreviewAdapter {
  clear(): void;
  update(context: TaskDropPreviewUpdateContext): void;
  getState(): TaskDropPreviewState;
}

export class NoopTaskDropPreviewAdapter implements TaskDropPreviewAdapter {
  public clear(): void {
    // no-op
  }

  public update(_context: TaskDropPreviewUpdateContext): void {
    // no-op
  }

  public getState(): TaskDropPreviewState {
    return {
      taskDropPlaceholders: [],
      storyDropPlans: new Map(),
      storyResizePreviews: [],
      taskReflowPreviews: new Map(),
    };
  }
}
