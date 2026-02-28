import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

type TaskLayoutPlan = {
  position: { x: number; y: number };
  nextHeight: number;
};

type AlignLayoutPlan = {
  positions: Map<string, { x: number; y: number }>;
  nextHeight: number;
};

type ResizeLayoutPlan = {
  positions: Map<string, { x: number; y: number }>;
  nextWidth: number;
  nextHeight: number;
  orderedTasks: TaskElement[];
};

export class StoryLayoutService {
  private readonly paddingX = 36;
  private readonly paddingY = 36;
  private readonly gap = 28;
  private readonly header = 56;

  public planAddTask(
    story: StoryElement,
    tasks: TaskElement[]
  ): TaskLayoutPlan {
    const inside = this.getLayoutTasks(story, tasks);
    const columns = this.getColumns(story);
    const occupied = inside.map((task) => this.getTaskRect(task));

    let row = 0;
    while (true) {
      for (let col = 0; col < columns; col += 1) {
        const position = this.getCellPosition(story, row, col);
        const candidate = {
          x: position.x,
          y: position.y,
          width: TaskElement.width,
          height: TaskElement.height,
        };
        if (!this.intersectsAny(candidate, occupied)) {
          const nextHeight = this.getRequiredHeight(story, row + 1);
          return { position, nextHeight };
        }
      }
      row += 1;
    }
  }

  public planAlignTasks(
    story: StoryElement,
    tasks: TaskElement[]
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

  public planResize(
    story: StoryElement,
    tasks: TaskElement[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan {
    const layoutTasks = this.getLayoutTasks(story, tasks);
    return this.planLayoutForSortedTasks(
      story,
      layoutTasks,
      nextWidth,
      nextHeight
    );
  }

  public planLayoutForSortedTasks(
    story: StoryElement,
    layoutTasks: TaskElement[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan {
    const ordered = this.getOrderedTasks(layoutTasks);
    return this.planLayoutForOrderedTasks(story, ordered, nextWidth, nextHeight);
  }

  public planLayoutForOrderedTasks(
    story: StoryElement,
    orderedTasks: TaskElement[],
    nextWidth: number,
    nextHeight: number
  ): ResizeLayoutPlan {
    const ordered = [...orderedTasks];
    const hasTasks = ordered.length > 0;
    const minWidth = hasTasks ? this.getMinWidth() : 1;
    const clampedWidth = Math.max(nextWidth, minWidth, 1);
    const columns = hasTasks ? this.getColumnsForWidth(clampedWidth) : 1;
    const rows = hasTasks ? Math.ceil(ordered.length / columns) : 0;
    const requiredHeight = hasTasks ? this.getRequiredHeightForRows(rows) : 0;
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

  public getInsertionIndex(
    story: StoryElement,
    existingTaskCount: number,
    pointX: number,
    pointY: number,
    width: number = story.width
  ): number {
    const columns = this.getColumnsForWidth(width);
    const cellWidth = TaskElement.width + this.gap;
    const cellHeight = TaskElement.height + this.gap;
    const startX = story.x + this.paddingX;
    const startY = story.y + this.header + this.paddingY;
    const col = Math.max(
      0,
      Math.min(
        columns - 1,
        Math.floor((pointX - startX + TaskElement.width / 2) / cellWidth)
      )
    );
    const row = Math.max(
      0,
      Math.floor((pointY - startY + TaskElement.height / 2) / cellHeight)
    );
    const index = row * columns + col;
    return Math.max(0, Math.min(existingTaskCount, index));
  }

  public getLayoutTasks(
    story: StoryElement,
    tasks: TaskElement[]
  ): TaskElement[] {
    if (story.tasks.length === 0) {
      return this.getTasksInsideStory(story, tasks);
    }

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const ordered: TaskElement[] = [];
    const seen = new Set<string>();

    story.tasks.forEach((taskRef) => {
      const task = taskById.get(taskRef.id);
      if (!task) return;
      ordered.push(task);
      seen.add(task.id);
    });

    const missingInside = this.getTasksInsideStory(story, tasks)
      .filter((task) => !seen.has(task.id))
      .sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
      });

    const combined = missingInside.length > 0
      ? [...ordered, ...missingInside]
      : ordered;

    return this.getOrderedTasks(combined);
  }

  private getColumns(story: StoryElement): number {
    return this.getColumnsForWidth(story.width);
  }

  private getColumnsForWidth(width: number): number {
    const availableWidth = Math.max(0, width - this.paddingX * 2);
    return Math.max(
      1,
      Math.floor((availableWidth + this.gap) / (TaskElement.width + this.gap))
    );
  }

  private getCellPosition(
    story: StoryElement,
    row: number,
    col: number
  ): { x: number; y: number } {
    const x = story.x + this.paddingX + col * (TaskElement.width + this.gap);
    const y =
      story.y +
      this.header +
      this.paddingY +
      row * (TaskElement.height + this.gap);
    return { x, y };
  }

  private getRequiredHeight(story: StoryElement, rows: number): number {
    return Math.max(story.height, this.getRequiredHeightForRows(rows));
  }

  private getRequiredHeightForRows(rows: number): number {
    const contentHeight =
      rows * TaskElement.height + Math.max(0, rows - 1) * this.gap;
    const requiredHeight =
      this.header + this.paddingY + contentHeight + this.paddingY;
    return requiredHeight;
  }

  private getMinWidth(): number {
    return this.paddingX * 2 + TaskElement.width;
  }

  private getOrderedTasks(tasks: TaskElement[]): TaskElement[] {
    return [...tasks].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
  }

  private getTasksInsideStory(
    story: StoryElement,
    tasks: TaskElement[]
  ): TaskElement[] {
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

  private getTaskRect(task: TaskElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: task.x,
      y: task.y,
      width: TaskElement.width,
      height: TaskElement.height,
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
