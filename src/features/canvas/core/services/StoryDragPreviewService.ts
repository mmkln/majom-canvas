import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from './StoryLayoutService.ts';

export type TaskDropPlaceholder = {
  storyId: string;
  taskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StoryDropPlan = {
  storyId: string;
  orderedTasks: TaskElement[];
  positions: Map<string, { x: number; y: number }>;
  nextWidth: number;
  nextHeight: number;
};

export type StoryResizePreview = {
  storyId: string;
  x: number;
  y: number;
  width: number;
  currentHeight: number;
  previewHeight: number;
};

export type TaskReflowPreview = {
  taskId: string;
  x: number;
  y: number;
};

export type StoryDragPreviewState = {
  taskDropPlaceholders: TaskDropPlaceholder[];
  storyDropPlans: Map<string, StoryDropPlan>;
  storyResizePreviews: StoryResizePreview[];
  taskReflowPreviews: Map<string, TaskReflowPreview>;
};

export class StoryDragPreviewService {
  constructor(private readonly storyLayoutService: StoryLayoutService) {}

  public compute(args: {
    stories: StoryElement[];
    tasks: TaskElement[];
    draggedTaskIds: Set<string>;
    initialPositions: Map<string, { x: number; y: number }>;
    pointer: { x: number; y: number };
  }): StoryDragPreviewState {
    const { stories, tasks, draggedTaskIds, initialPositions, pointer } = args;
    if (draggedTaskIds.size === 0 || stories.length === 0) {
      return this.emptyState();
    }
    const draggedTasks = tasks.filter((task) => draggedTaskIds.has(task.id));
    if (draggedTasks.length === 0) return this.emptyState();

    const draggedOrder = [...draggedTasks].sort((a, b) => {
      const aPos = initialPositions.get(a.id);
      const bPos = initialPositions.get(b.id);
      if (aPos && bPos) {
        if (aPos.y === bPos.y) return aPos.x - bPos.x;
        return aPos.y - bPos.y;
      }
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
    const draggedByStory = new Map<string, TaskElement[]>();
    draggedOrder.forEach((task) => {
      const anchor = this.getTaskAnchor(task);
      const story = stories.find((candidate) =>
        candidate.contains(anchor.x, anchor.y)
      );
      if (!story) return;
      const list = draggedByStory.get(story.id) ?? [];
      list.push(task);
      draggedByStory.set(story.id, list);
    });

    const placeholderByTaskId = new Map<string, TaskDropPlaceholder>();
    const nextDropPlans = new Map<string, StoryDropPlan>();
    const nextResizePreviews: StoryResizePreview[] = [];
    const nextTaskReflowPreviews = new Map<string, TaskReflowPreview>();

    stories.forEach((story) => {
      const currentLayout = this.storyLayoutService.getLayoutTasks(story, tasks);
      const baseLayout = currentLayout.filter((task) => !draggedTaskIds.has(task.id));
      const incoming = draggedByStory.get(story.id) ?? [];
      const hadRemoval = baseLayout.length !== currentLayout.length;
      const hasIncoming = incoming.length > 0;
      if (!hadRemoval && !hasIncoming) return;

      let orderedForPlan = [...baseLayout];
      if (incoming.length > 0) {
        const anchor = this.getDropAnchorPoint(story, incoming, pointer.x, pointer.y);
        const insertionIndex = this.storyLayoutService.getInsertionIndex(
          story,
          baseLayout.length,
          anchor.x,
          anchor.y
        );
        orderedForPlan = [
          ...baseLayout.slice(0, insertionIndex),
          ...incoming,
          ...baseLayout.slice(insertionIndex),
        ];
      }

      const plan = this.storyLayoutService.planLayoutForOrderedTasks(
        story,
        orderedForPlan,
        story.width,
        story.height
      );
      if (plan.nextHeight > story.height + 0.01) {
        nextResizePreviews.push({
          storyId: story.id,
          x: story.x,
          y: story.y,
          width: story.width,
          currentHeight: story.height,
          previewHeight: plan.nextHeight,
        });
      }
      nextDropPlans.set(story.id, {
        storyId: story.id,
        orderedTasks: plan.orderedTasks,
        positions: plan.positions,
        nextWidth: plan.nextWidth,
        nextHeight: plan.nextHeight,
      });

      plan.positions.forEach((position, taskId) => {
        if (draggedTaskIds.has(taskId)) return;
        nextTaskReflowPreviews.set(taskId, {
          taskId,
          x: position.x,
          y: position.y,
        });
      });
      incoming.forEach((task) => {
        const position = plan.positions.get(task.id);
        if (!position) return;
        placeholderByTaskId.set(task.id, {
          storyId: story.id,
          taskId: task.id,
          x: position.x,
          y: position.y,
          width: TaskElement.width,
          height: TaskElement.height,
        });
      });
    });

    return {
      taskDropPlaceholders: Array.from(placeholderByTaskId.values()),
      storyDropPlans: nextDropPlans,
      storyResizePreviews: nextResizePreviews,
      taskReflowPreviews: nextTaskReflowPreviews,
    };
  }

  private getDropAnchorPoint(
    story: StoryElement,
    incoming: TaskElement[],
    sceneX: number,
    sceneY: number
  ): { x: number; y: number } {
    if (story.contains(sceneX, sceneY)) {
      return { x: sceneX, y: sceneY };
    }
    const first = incoming[0];
    return {
      x: first.x + TaskElement.width / 2,
      y: first.y + TaskElement.height / 2,
    };
  }

  private emptyState(): StoryDragPreviewState {
    return {
      taskDropPlaceholders: [],
      storyDropPlans: new Map(),
      storyResizePreviews: [],
      taskReflowPreviews: new Map(),
    };
  }

  private getTaskAnchor(task: TaskElement): { x: number; y: number } {
    return {
      x: task.x + TaskElement.width / 2,
      y: task.y + TaskElement.height / 2,
    };
  }
}
