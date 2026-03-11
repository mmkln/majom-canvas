import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { emitTaskStoryLinkSet } from '../canvasLinkLifecycle.ts';
import type { StoryDropPlan } from '../services/StoryDragPreviewService.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import type {
  TaskStoryLayoutAdapter,
  TaskStoryLayoutChanges,
  TaskStoryLayoutContext,
} from './TaskStoryLayoutAdapter.ts';
import { createEmptyTaskStoryLayoutChanges } from './TaskStoryLayoutAdapter.ts';

export class LegacyPlanningTaskStoryLayoutAdapter
  implements TaskStoryLayoutAdapter
{
  constructor(private readonly storyLayoutService: StoryLayoutService) {}

  public compute(context: TaskStoryLayoutContext): TaskStoryLayoutChanges {
    const { mode, draggingItem, selectedElements, sceneElements } = context;
    if (mode === 'item' && !(draggingItem instanceof TaskElement)) {
      return createEmptyTaskStoryLayoutChanges();
    }

    const selectedTasks = selectedElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    if (selectedTasks.length === 0) {
      return createEmptyTaskStoryLayoutChanges();
    }

    const stories = sceneElements
      .filter(isPlanningElement)
      .filter((element): element is StoryElement => element instanceof StoryElement);
    if (stories.length === 0) {
      return createEmptyTaskStoryLayoutChanges();
    }

    const prevStoryMap = this.getTaskStoryMap(stories);
    this.updateTaskStoryAssignments(selectedTasks, stories);
    const affectedStories = this.getAffectedStoriesForTasks(
      selectedTasks,
      stories,
      prevStoryMap
    );
    return this.applyAutoLayoutToStories(
      affectedStories,
      context.draggedElementIds,
      context.dropPlans,
      sceneElements
    );
  }

  private updateTaskStoryAssignments(
    tasks: TaskElement[],
    stories: StoryElement[]
  ): void {
    if (tasks.length === 0) return;
    const prevStoryMap = this.getTaskStoryMap(stories);
    stories.forEach((story) => {
      tasks.forEach((task) => {
        const anchor = this.getTaskAnchor(task);
        if (story.contains(anchor.x, anchor.y)) story.addTask(task);
        else story.removeTask(task.id);
      });
    });
    const nextStoryMap = this.getTaskStoryMap(stories);
    if (typeof window === 'undefined') return;
    tasks.forEach((task) => {
      const prevStoryId = prevStoryMap.get(task.id) ?? null;
      const nextStoryId = nextStoryMap.get(task.id) ?? null;
      if (prevStoryId === nextStoryId) return;
      const nextStory = nextStoryId
        ? (stories.find((story) => story.id === nextStoryId) ?? null)
        : null;
      emitTaskStoryLinkSet(task, nextStory);
    });
  }

  private getTaskStoryMap(stories: StoryElement[]): Map<string, string> {
    const map = new Map<string, string>();
    stories.forEach((story) => {
      story.tasks.forEach((task) => {
        if (!map.has(task.id)) {
          map.set(task.id, story.id);
        }
      });
    });
    return map;
  }

  private getAffectedStoriesForTasks(
    tasks: TaskElement[],
    stories: StoryElement[],
    prevStoryMap: Map<string, string>
  ): StoryElement[] {
    if (tasks.length === 0) return [];
    const nextStoryMap = this.getTaskStoryMap(stories);
    const storyIds = new Set<string>();
    tasks.forEach((task) => {
      const prevId = prevStoryMap.get(task.id);
      const nextId = nextStoryMap.get(task.id);
      if (prevId) storyIds.add(prevId);
      if (nextId) storyIds.add(nextId);
    });
    return stories.filter((story) => storyIds.has(story.id));
  }

  private applyAutoLayoutToStories(
    stories: StoryElement[],
    skipTaskIds: Set<string>,
    dropPlans: Map<string, StoryDropPlan>,
    sceneElements: ICanvasElement[]
  ): TaskStoryLayoutChanges {
    const changes = createEmptyTaskStoryLayoutChanges();
    if (stories.length === 0) {
      return changes;
    }

    const tasks = sceneElements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const epsilon = 0.01;

    stories.forEach((story) => {
      const layoutTasks = this.storyLayoutService.getLayoutTasks(story, tasks);
      if (layoutTasks.length === 0) return;

      const initialTaskPositions = new Map(
        layoutTasks.map((task) => [task.id, { x: task.x, y: task.y }])
      );
      const initialStory = {
        x: story.x,
        y: story.y,
        width: story.width,
        height: story.height,
      };
      const dropPlan = dropPlans.get(story.id);

      if (dropPlan) {
        story.width = dropPlan.nextWidth;
        story.height = dropPlan.nextHeight;
        dropPlan.positions.forEach((pos, id) => {
          const task = taskById.get(id);
          if (!task) return;
          task.x = pos.x;
          task.y = pos.y;
        });
        story.tasks = dropPlan.orderedTasks;
      } else {
        const plan = this.storyLayoutService.planResize(
          story,
          tasks,
          story.width,
          story.height
        );
        story.width = plan.nextWidth;
        story.height = plan.nextHeight;
        if (plan.positions.size > 0) {
          plan.positions.forEach((pos, id) => {
            const task = taskById.get(id);
            if (!task) return;
            task.x = pos.x;
            task.y = pos.y;
          });
          story.tasks = plan.orderedTasks;
        }
      }

      if (
        Math.abs(story.width - initialStory.width) > epsilon ||
        Math.abs(story.height - initialStory.height) > epsilon
      ) {
        changes.resizedInitial.set(story.id, initialStory);
        changes.resizedFinal.set(story.id, {
          x: story.x,
          y: story.y,
          width: story.width,
          height: story.height,
        });
      }

      initialTaskPositions.forEach((pos, id) => {
        const task = taskById.get(id);
        if (!task) return;
        const dx = Math.abs(task.x - pos.x);
        const dy = Math.abs(task.y - pos.y);
        if (dx <= epsilon && dy <= epsilon) return;
        if (skipTaskIds.has(id)) return;
        changes.movedInitial.set(id, pos);
        changes.movedFinal.set(id, { x: task.x, y: task.y });
      });
    });

    return changes;
  }

  private getTaskAnchor(task: TaskElement): { x: number; y: number } {
    return {
      x: task.x + TaskElement.width / 2,
      y: task.y + TaskElement.height / 2,
    };
  }
}
