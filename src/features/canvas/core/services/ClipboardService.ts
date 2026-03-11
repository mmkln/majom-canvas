import { Scene } from '../scene/Scene.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import {
  ClipboardService as CoreClipboardService,
  type ClipboardCloneable,
} from 'majom-canvas-core';

type PlanningClipboardElement = PlanningElement & ClipboardCloneable;

/**
 * Clipboard service stores copies of PlanningElement for paste operations.
 */
export class ClipboardService {
  private readonly coreClipboard = new CoreClipboardService<PlanningClipboardElement>();

  public copy(elements: PlanningElement[]): void {
    this.coreClipboard.copy(elements as PlanningClipboardElement[]);
  }

  public paste(
    scene: Scene,
    position?: { x: number; y: number }
  ): PlanningElement[] {
    return this.coreClipboard.paste(
      {
        addElement: (element) => scene.addElement(element),
      },
      position,
      {
        afterPaste: (elements) => {
          this.restoreStoryTaskContainment(elements as PlanningElement[]);
        },
      }
    ) as PlanningElement[];
  }

  private restoreStoryTaskContainment(elements: PlanningElement[]): void {
    const stories = elements.filter(
      (element): element is StoryElement => element instanceof StoryElement
    );
    const tasks = elements.filter(
      (element): element is TaskElement => element instanceof TaskElement
    );

    if (stories.length === 0 || tasks.length === 0) {
      return;
    }

    stories.forEach((story) => {
      story.tasks = [];
      tasks.forEach((task) => {
        const anchorX = task.x + TaskElement.width / 2;
        const anchorY = task.y + TaskElement.height / 2;
        if (story.contains(anchorX, anchorY)) {
          story.addTask(task);
        }
      });
    });
  }

  public clear(): void {
    this.coreClipboard.clear();
  }

  /**
   * Get current clipboard items (for undo)
   */
  public getItems(): PlanningElement[] {
    return this.coreClipboard.getItems() as PlanningElement[];
  }
}

export const clipboardService = new ClipboardService();

