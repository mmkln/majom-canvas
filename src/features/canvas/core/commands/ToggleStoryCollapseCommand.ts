import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

export class ToggleStoryCollapseCommand extends Command {
  private readonly previousState: {
    isCollapsed: boolean;
    width: number;
    height: number;
    expandedWidth: number;
    expandedHeight: number;
  };
  private readonly nextState: {
    isCollapsed: boolean;
    width: number;
    height: number;
    expandedWidth: number;
    expandedHeight: number;
  };

  constructor(
    private readonly scene: Scene,
    private readonly story: StoryElement,
    collapsed: boolean = !story.isCollapsed
  ) {
    super();
    this.previousState = {
      isCollapsed: story.isCollapsed,
      width: story.width,
      height: story.height,
      expandedWidth: story.expandedWidth,
      expandedHeight: story.expandedHeight,
    };

    const nextExpandedWidth = collapsed
      ? Math.max(story.getLogicalWidth(), StoryElement.collapsedMinWidth)
      : Math.max(story.expandedWidth, StoryElement.collapsedMinWidth);
    const nextExpandedHeight = collapsed
      ? Math.max(story.getLogicalHeight(), StoryElement.collapsedHeight)
      : Math.max(story.expandedHeight, StoryElement.collapsedHeight);
    const collapsedWidth = collapsed
      ? new StoryElement({
          title: story.title,
          tasks: story.tasks,
          width: nextExpandedWidth,
          height: nextExpandedHeight,
          isCollapsed: true,
          expandedWidth: nextExpandedWidth,
          expandedHeight: nextExpandedHeight,
        }).width
      : nextExpandedWidth;
    this.nextState = {
      isCollapsed: collapsed,
      width: collapsed ? collapsedWidth : nextExpandedWidth,
      height: collapsed ? StoryElement.collapsedHeight : nextExpandedHeight,
      expandedWidth: nextExpandedWidth,
      expandedHeight: nextExpandedHeight,
    };
  }

  public execute(): void {
    this.apply(this.nextState);
  }

  public undo(): void {
    this.apply(this.previousState);
  }

  private apply(state: {
    isCollapsed: boolean;
    width: number;
    height: number;
    expandedWidth: number;
    expandedHeight: number;
  }): void {
    this.story.isCollapsed = state.isCollapsed;
    this.story.width = state.width;
    this.story.height = state.height;
    this.story.expandedWidth = state.expandedWidth;
    this.story.expandedHeight = state.expandedHeight;
    this.story.hoveredResizeHandle = null;

    const selected = this.scene.getSelectedElements();
    const hiddenSelectedTasks = selected.filter(
      (element): element is TaskElement =>
        element instanceof TaskElement &&
        this.story.tasks.some((task) => task.id === element.id)
    );
    if (hiddenSelectedTasks.length > 0 || this.story.selected) {
      this.scene.setSelected([this.story]);
    } else {
      this.scene.changes.next();
    }

    this.notifyPositionsDirty();
  }

  private notifyPositionsDirty(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('canvasPositionsDirty', {
        detail: { elements: [this.story] },
      })
    );
  }
}
