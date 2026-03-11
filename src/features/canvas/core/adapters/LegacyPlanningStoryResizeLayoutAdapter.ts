import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import type {
  ResizeMovedTasks,
  StoryResizeLayoutAdapter,
  StoryResizeStartContext,
  StoryResizeUpdateContext,
  StoryResizeUpdateResult,
} from './StoryResizeLayoutAdapter.ts';

export class LegacyPlanningStoryResizeLayoutAdapter
  implements StoryResizeLayoutAdapter
{
  private readonly resizeInitialTaskPositions = new Map<
    string,
    { x: number; y: number }
  >();

  constructor(private readonly storyLayoutService: StoryLayoutService) {}

  public onResizeStart(context: StoryResizeStartContext): void {
    const { story, sceneElements } = context;
    this.resizeInitialTaskPositions.clear();
    if (!(story instanceof StoryElement)) return;
    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const layoutTasks = this.storyLayoutService.getLayoutTasks(story, tasks);
    layoutTasks.forEach((task) => {
      this.resizeInitialTaskPositions.set(task.id, { x: task.x, y: task.y });
    });
  }

  public onResizeUpdate(context: StoryResizeUpdateContext): StoryResizeUpdateResult {
    const { story, sceneElements, nextWidth, nextHeight } = context;
    if (!(story instanceof StoryElement)) {
      return {
        nextWidth,
        nextHeight,
      };
    }
    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const plan = this.storyLayoutService.planResize(
      story,
      tasks,
      nextWidth,
      nextHeight
    );

    if (plan.positions.size > 0) {
      const taskById = new Map(tasks.map((task) => [task.id, task]));
      plan.positions.forEach((pos, id) => {
        const task = taskById.get(id);
        if (!task) return;
        task.x = pos.x;
        task.y = pos.y;
      });
      story.tasks = plan.orderedTasks;
    }

    return {
      nextWidth: plan.nextWidth,
      nextHeight: plan.nextHeight,
    };
  }

  public collectMovedTasks(sceneElements: ICanvasElement[]): ResizeMovedTasks {
    const initial = new Map<string, { x: number; y: number }>();
    const final = new Map<string, { x: number; y: number }>();
    if (this.resizeInitialTaskPositions.size === 0) {
      return { initial, final };
    }

    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const epsilon = 0.01;

    this.resizeInitialTaskPositions.forEach((pos, id) => {
      const task = taskById.get(id);
      if (!task) return;
      const dx = Math.abs(task.x - pos.x);
      const dy = Math.abs(task.y - pos.y);
      if (dx <= epsilon && dy <= epsilon) return;
      initial.set(id, pos);
      final.set(id, { x: task.x, y: task.y });
    });

    return { initial, final };
  }

  public clear(): void {
    this.resizeInitialTaskPositions.clear();
  }
}
