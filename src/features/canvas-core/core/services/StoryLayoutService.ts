import type {
  CanvasLayoutMetrics,
  ICanvasLayoutContainer,
} from '../../elements/interfaces/canvasLayoutContainer.ts';
import type { IStructuredCanvasNode } from '../../elements/interfaces/structuredCanvasNode.ts';

type TaskLayoutPlan = {
  position: { x: number; y: number };
  nextHeight: number;
};

type AlignLayoutPlan = {
  positions: Map<string, { x: number; y: number }>;
  nextHeight: number;
};

type ResizeLayoutPlan<TChild extends IStructuredCanvasNode> = {
  positions: Map<string, { x: number; y: number }>;
  nextWidth: number;
  nextHeight: number;
  orderedTasks: TChild[];
};

export class StoryLayoutService {
  public planAddTask<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    tasks: TChild[]
  ): TaskLayoutPlan {
    const inside = this.getLayoutTasks(story, tasks);
    const metrics = story.getLayoutMetrics();
    const columns = this.getColumns(story);
    const occupied = inside.map((task) => this.getTaskRect(task));

    let row = 0;
    while (true) {
      for (let col = 0; col < columns; col += 1) {
        const position = this.getCellPosition(story, row, col);
        const candidate = {
          x: position.x,
          y: position.y,
          width: metrics.childWidth,
          height: metrics.childHeight,
        };
        if (!this.intersectsAny(candidate, occupied)) {
          const nextHeight = this.getRequiredHeight(story, row + 1);
          return { position, nextHeight };
        }
      }
      row += 1;
    }
  }

  public planAlignTasks<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    tasks: TChild[]
  ): AlignLayoutPlan {
    const inside = this.getLayoutTasks(story, tasks);
    if (inside.length === 0) {
      return { positions: new Map(), nextHeight: story.height };
    }
    const ordered = this.getOrderedTasks(inside);
    const columns = this.getColumns(story);
    const positions = new Map<string, { x: number; y: number }>();
    ordered.forEach((task, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      positions.set(task.id, this.getCellPosition(story, row, col));
    });
    const rows = Math.ceil(ordered.length / columns);
    const nextHeight = this.getRequiredHeight(story, rows);
    return { positions, nextHeight };
  }

  public planResize<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    tasks: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan<TChild> {
    const layoutTasks = this.getLayoutTasks(story, tasks);
    return this.planLayoutForSortedTasks(
      story,
      layoutTasks,
      nextWidth,
      nextHeight
    );
  }

  public planLayoutForSortedTasks<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    layoutTasks: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan<TChild> {
    const ordered = this.getOrderedTasks(layoutTasks);
    return this.planLayoutForOrderedTasks(
      story,
      ordered,
      nextWidth,
      nextHeight
    );
  }

  public planLayoutForOrderedTasks<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    orderedTasks: TChild[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan<TChild> {
    const ordered = [...orderedTasks];
    const hasTasks = ordered.length > 0;
    const metrics = story.getLayoutMetrics();
    const minWidth = hasTasks ? this.getMinWidth(metrics) : 1;
    const clampedWidth = Math.max(nextWidth, minWidth, 1);
    const columns = hasTasks ? this.getColumnsForWidth(clampedWidth, metrics) : 1;
    const rows = hasTasks ? Math.ceil(ordered.length / columns) : 0;
    const requiredHeight = hasTasks
      ? this.getRequiredHeightForRows(rows, metrics)
      : 0;
    const clampedHeight = Math.max(nextHeight, requiredHeight, 1);
    const positions = new Map<string, { x: number; y: number }>();
    ordered.forEach((task, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      positions.set(task.id, this.getCellPosition(story, row, col));
    });
    return {
      positions,
      nextWidth: clampedWidth,
      nextHeight: clampedHeight,
      orderedTasks: ordered,
    };
  }

  public getInsertionIndex<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    existingTaskCount: number,
    pointX: number,
    pointY: number,
    width: number = story.width
  ): number {
    const metrics = story.getLayoutMetrics();
    const columns = this.getColumnsForWidth(width, metrics);
    const cellWidth = metrics.childWidth + metrics.gap;
    const cellHeight = metrics.childHeight + metrics.gap;
    const startX = story.x + metrics.paddingX;
    const startY = story.y + metrics.header + metrics.paddingY;
    const col = Math.max(
      0,
      Math.min(
        columns - 1,
        Math.floor((pointX - startX + metrics.childWidth / 2) / cellWidth)
      )
    );
    const row = Math.max(
      0,
      Math.floor((pointY - startY + metrics.childHeight / 2) / cellHeight)
    );
    const index = row * columns + col;
    return Math.max(0, Math.min(existingTaskCount, index));
  }

  public getLayoutTasks<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    tasks: TChild[]
  ): TChild[] {
    const orderedChildren = story.getOrderedLayoutChildren();
    if (orderedChildren.length === 0) {
      return this.getTasksInsideStory(story, tasks);
    }

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const ordered: TChild[] = [];
    const seen = new Set<string>();

    orderedChildren.forEach((taskRef) => {
      const task = taskById.get(taskRef.id);
      if (!task || !story.acceptsLayoutChild(task)) return;
      ordered.push(task);
      seen.add(task.id);
    });

    const missingInside = this.getTasksInsideStory(story, tasks)
      .filter((task) => !seen.has(task.id))
      .sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
      });

    const combined =
      missingInside.length > 0 ? [...ordered, ...missingInside] : ordered;

    return this.getOrderedTasks(combined);
  }

  private getColumns<TChild extends IStructuredCanvasNode>(
    story: ICanvasLayoutContainer<TChild>
  ): number {
    return this.getColumnsForWidth(story.width, story.getLayoutMetrics());
  }

  private getColumnsForWidth(
    width: number,
    metrics: CanvasLayoutMetrics
  ): number {
    const availableWidth = Math.max(0, width - metrics.paddingX * 2);
    return Math.max(
      1,
      Math.floor(
        (availableWidth + metrics.gap) / (metrics.childWidth + metrics.gap)
      )
    );
  }

  private getCellPosition<TChild extends IStructuredCanvasNode>(
    story: ICanvasLayoutContainer<TChild>,
    row: number,
    col: number
  ): { x: number; y: number } {
    const metrics = story.getLayoutMetrics();
    const x =
      story.x + metrics.paddingX + col * (metrics.childWidth + metrics.gap);
    const y =
      story.y +
      metrics.header +
      metrics.paddingY +
      row * (metrics.childHeight + metrics.gap);
    return { x, y };
  }

  private getRequiredHeight<TChild extends IStructuredCanvasNode>(
    story: ICanvasLayoutContainer<TChild>,
    rows: number
  ): number {
    return Math.max(
      story.height,
      this.getRequiredHeightForRows(rows, story.getLayoutMetrics())
    );
  }

  private getRequiredHeightForRows(
    rows: number,
    metrics: CanvasLayoutMetrics
  ): number {
    const contentHeight =
      rows * metrics.childHeight + Math.max(0, rows - 1) * metrics.gap;
    const requiredHeight =
      metrics.header + metrics.paddingY + contentHeight + metrics.paddingY;
    return requiredHeight;
  }

  private getMinWidth(metrics: CanvasLayoutMetrics): number {
    return metrics.paddingX * 2 + metrics.childWidth;
  }

  private getOrderedTasks<TChild extends IStructuredCanvasNode>(
    tasks: TChild[]
  ): TChild[] {
    return [...tasks].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
  }

  private getTasksInsideStory<
    TContainer extends ICanvasLayoutContainer<TChild>,
    TChild extends IStructuredCanvasNode,
  >(
    story: TContainer,
    tasks: TChild[]
  ): TChild[] {
    const storyRect = {
      x: story.x,
      y: story.y,
      width: story.width,
      height: story.height,
    };
    return tasks.filter((task) =>
      this.intersects(storyRect, this.getTaskRect(task))
    );
  }

  private getTaskRect(task: IStructuredCanvasNode): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: task.x,
      y: task.y,
      width: task.width,
      height: task.height,
    };
  }

  private intersects(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private intersectsAny(
    candidate: { x: number; y: number; width: number; height: number },
    rects: Array<{ x: number; y: number; width: number; height: number }>
  ): boolean {
    return rects.some((rect) => this.intersects(candidate, rect));
  }
}
