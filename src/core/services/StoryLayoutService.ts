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

export class StoryLayoutService {
  private readonly padding = 36;
  private readonly gap = 28;
  private readonly header = 56;

  public planAddTask(
    story: StoryElement,
    tasks: TaskElement[]
  ): TaskLayoutPlan {
    const inside = this.getTasksInsideStory(story, tasks);
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
    const inside = this.getTasksInsideStory(story, tasks);
    if (inside.length === 0) {
      return { positions: new Map(), nextHeight: story.height };
    }
    const ordered = [...inside].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
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

  private getColumns(story: StoryElement): number {
    const availableWidth = Math.max(0, story.width - this.padding * 2);
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
    const x = story.x + this.padding + col * (TaskElement.width + this.gap);
    const y =
      story.y +
      this.header +
      this.padding +
      row * (TaskElement.height + this.gap);
    return { x, y };
  }

  private getRequiredHeight(story: StoryElement, rows: number): number {
    const contentHeight =
      rows * TaskElement.height + Math.max(0, rows - 1) * this.gap;
    const requiredHeight =
      this.header + this.padding + contentHeight + this.padding;
    return Math.max(story.height, requiredHeight);
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
