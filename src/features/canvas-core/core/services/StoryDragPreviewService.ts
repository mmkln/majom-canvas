import type { ICanvasLayoutContainer } from '../../elements/interfaces/canvasLayoutContainer.ts';
import type { IStructuredCanvasNode } from '../../elements/interfaces/structuredCanvasNode.ts';
import { StoryLayoutService } from './StoryLayoutService.ts';

export type TaskDropPlaceholder = {
  storyId: string;
  taskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StoryDropPlan<
  TChild extends IStructuredCanvasNode = IStructuredCanvasNode,
> = {
  storyId: string;
  orderedTasks: TChild[];
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

export type StoryDragPreviewState<
  TChild extends IStructuredCanvasNode = IStructuredCanvasNode,
> = {
  taskDropPlaceholders: TaskDropPlaceholder[];
  storyDropPlans: Map<string, StoryDropPlan<TChild>>;
  storyResizePreviews: StoryResizePreview[];
  taskReflowPreviews: Map<string, TaskReflowPreview>;
};

export class StoryDragPreviewService {
  constructor(private readonly storyLayoutService: StoryLayoutService) {}

  public compute<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(args: {
    stories: TContainer[];
    tasks: TChild[];
    draggedTaskIds: Set<string>;
    initialPositions: Map<string, { x: number; y: number }>;
    pointer: { x: number; y: number };
  }): StoryDragPreviewState<TChild> {
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
    const draggedByStory = new Map<string, TChild[]>();
    const pointerStory =
      draggedOrder.length > 1
        ? (stories.find((story) => story.contains(pointer.x, pointer.y)) ??
          null)
        : null;
    if (pointerStory) {
      draggedByStory.set(pointerStory.id, draggedOrder);
    } else {
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
    }

    const placeholderByTaskId = new Map<string, TaskDropPlaceholder>();
    const nextDropPlans = new Map<string, StoryDropPlan<TChild>>();
    const nextResizePreviews: StoryResizePreview[] = [];
    const nextTaskReflowPreviews = new Map<string, TaskReflowPreview>();

    stories.forEach((story) => {
      const currentLayout = this.storyLayoutService.getLayoutTasks(
        story,
        tasks
      );
      const baseLayout = currentLayout.filter(
        (task) => !draggedTaskIds.has(task.id)
      );
      const incoming = draggedByStory.get(story.id) ?? [];
      const hadRemoval = baseLayout.length !== currentLayout.length;
      const hasIncoming = incoming.length > 0;
      if (!hadRemoval && !hasIncoming) return;

      let orderedForPlan = [...baseLayout];
      if (incoming.length > 0) {
        const anchor = this.getDropAnchorPoint(
          story,
          incoming,
          pointer.x,
          pointer.y
        );
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
          width: task.width,
          height: task.height,
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

  private getDropAnchorPoint<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    incoming: TChild[],
    sceneX: number,
    sceneY: number
  ): { x: number; y: number } {
    if (story.contains(sceneX, sceneY)) {
      return { x: sceneX, y: sceneY };
    }
    const first = incoming[0];
    return {
      x: first.x + first.width / 2,
      y: first.y + first.height / 2,
    };
  }

  private emptyState<
    TChild extends IStructuredCanvasNode,
  >(): StoryDragPreviewState<TChild> {
    return {
      taskDropPlaceholders: [],
      storyDropPlans: new Map(),
      storyResizePreviews: [],
      taskReflowPreviews: new Map(),
    };
  }

  private getTaskAnchor<TChild extends IStructuredCanvasNode>(
    task: TChild
  ): { x: number; y: number } {
    return {
      x: task.x + task.width / 2,
      y: task.y + task.height / 2,
    };
  }
}
