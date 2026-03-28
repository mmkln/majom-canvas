import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { clipboardService } from '../services/ClipboardService.ts';
import { notify } from '../services/NotificationService.ts';
import { CanvasManager } from '../managers/CanvasManager.ts';
import type { PlanningElement } from '../../elements/PlanningElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryLayoutService } from '../services/StoryLayoutService.ts';
import { emitTaskStoryLinkSet } from '../canvasLinkLifecycle.ts';

/**
 * Command to paste PlanningElements from clipboard into the scene.
 */
export class PasteCommand extends Command {
  private clones: PlanningElement[] = [];
  private readonly storyLayoutService = new StoryLayoutService();
  private pastedIntoStory:
    | {
        storyId: string;
        previousHeight: number;
        taskIds: string[];
      }
    | null = null;

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager
  ) {
    super();
  }

  execute(): void {
    this.pastedIntoStory = null;
    let position = this.canvasManager.getLastMouseCoords();
    if (!position) {
      const canvas = this.canvasManager.getCanvas();
      const panZoom = this.canvasManager.getPanZoomManager();
      position = {
        x: (canvas.width / 2 + panZoom.scrollX) / panZoom.scale,
        y: (canvas.height / 2 + panZoom.scrollY) / panZoom.scale,
      };
    }
    this.clones = clipboardService.paste(this.scene, position);
    this.tryAttachPastedTasksToSelectedStory();
    notify(`Pasted ${this.clones.length} items`, 'success');
  }

  undo(): void {
    if (this.pastedIntoStory) {
      const { storyId, taskIds, previousHeight } = this.pastedIntoStory;
      const story = this.scene
        .getElements()
        .find(
          (element): element is StoryElement =>
            element instanceof StoryElement && element.id === storyId
        );
      if (story) {
        taskIds.forEach((taskId) => story.removeTask(taskId));
        story.height = previousHeight;
      }
      this.pastedIntoStory = null;
    }
    this.scene.removeElements(this.clones);
    notify(`Undid paste of ${this.clones.length} items`, 'info');
  }

  private tryAttachPastedTasksToSelectedStory(): void {
    if (this.clones.length === 0) return;
    const selectedStory = this.getSingleSelectedStory();
    if (!selectedStory) return;

    const pastedTasks = this.clones.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );
    if (pastedTasks.length !== this.clones.length) return;

    const allTasks = this.scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);
    const previousHeight = selectedStory.height;

    pastedTasks.forEach((task) => {
      const plan = this.storyLayoutService.planAddTask(selectedStory, allTasks);
      task.x = plan.position.x;
      task.y = plan.position.y;
      selectedStory.addTask(task);
      selectedStory.height = Math.max(selectedStory.height, plan.nextHeight);
      emitTaskStoryLinkSet(task, selectedStory);
    });

    this.pastedIntoStory = {
      storyId: selectedStory.id,
      previousHeight,
      taskIds: pastedTasks.map((task) => task.id),
    };
  }

  private getSingleSelectedStory(): StoryElement | null {
    const selected = this.scene.getSelectedElements();
    if (selected.length !== 1) return null;
    return selected[0] instanceof StoryElement ? selected[0] : null;
  }
}
