import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import {
  StoryDragPreviewService,
  type StoryDropPlan,
  type StoryResizePreview,
  type TaskDropPlaceholder,
  type TaskReflowPreview,
} from '../services/StoryDragPreviewService.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import type {
  TaskDropPreviewAdapter,
  TaskDropPreviewState,
  TaskDropPreviewUpdateContext,
} from './TaskDropPreviewAdapter.ts';

export class LegacyPlanningTaskDropPreviewAdapter
  implements TaskDropPreviewAdapter
{
  private taskDropPlaceholders: TaskDropPlaceholder[] = [];
  private storyDropPlans: Map<string, StoryDropPlan> = new Map();
  private storyResizePreviews: StoryResizePreview[] = [];
  private taskReflowPreviews: Map<string, TaskReflowPreview> = new Map();
  private readonly storyDragPreviewService: StoryDragPreviewService;

  constructor(storyDragPreviewService?: StoryDragPreviewService) {
    this.storyDragPreviewService =
      storyDragPreviewService ??
      new StoryDragPreviewService(new StoryLayoutService());
  }

  public clear(): void {
    this.taskDropPlaceholders = [];
    this.storyDropPlans.clear();
    this.storyResizePreviews = [];
    this.taskReflowPreviews.clear();
  }

  public update(context: TaskDropPreviewUpdateContext): void {
    const { sceneElements, initialPositions, pointer } = context;
    if (initialPositions.size === 0) {
      this.clear();
      return;
    }

    const hasDraggedStory = Array.from(initialPositions.keys()).some((id) => {
      const element = sceneElements.find((candidate) => candidate.id === id);
      return element instanceof StoryElement;
    });
    if (hasDraggedStory) {
      this.clear();
      return;
    }

    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const draggedTasks = tasks.filter((task) => initialPositions.has(task.id));
    if (draggedTasks.length === 0) {
      this.clear();
      return;
    }

    const stories = sceneElements
      .filter(isPlanningElement)
      .filter(
        (element): element is StoryElement => element instanceof StoryElement
      );
    if (stories.length === 0) {
      this.clear();
      return;
    }

    const preview = this.storyDragPreviewService.compute({
      stories,
      tasks,
      draggedTaskIds: new Set(draggedTasks.map((task) => task.id)),
      initialPositions: new Map(initialPositions),
      pointer,
    });
    this.taskDropPlaceholders = preview.taskDropPlaceholders;
    this.storyDropPlans = preview.storyDropPlans;
    this.storyResizePreviews = preview.storyResizePreviews;
    this.taskReflowPreviews = preview.taskReflowPreviews;
  }

  public getState(): TaskDropPreviewState {
    return {
      taskDropPlaceholders: this.taskDropPlaceholders,
      storyDropPlans: this.storyDropPlans,
      storyResizePreviews: this.storyResizePreviews,
      taskReflowPreviews: this.taskReflowPreviews,
    };
  }
}
