import { Scene } from '../scene/Scene.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clipboard service stores copies of PlanningElement for paste operations.
 */
export class ClipboardService {
  private items: PlanningElement[] = [];

  public copy(elements: PlanningElement[]): void {
    // Deep clone and assign new IDs
    this.items = elements.map((el) => {
      const clone = el.clone() as PlanningElement;
      clone.id = uuidv4();
      return clone;
    });
  }

  public paste(
    scene: Scene,
    position?: { x: number; y: number }
  ): PlanningElement[] {
    if (!position || this.items.length === 0) {
      return [];
    }

    // Calculate the bounding box of all items
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    this.items.forEach((item) => {
      // Get the element's bounding box using its width/height
      const itemX = item.x;
      const itemY = item.y;
      const itemWidth = (item as any).width || 0;
      const itemHeight = (item as any).height || 0;

      minX = Math.min(minX, itemX);
      minY = Math.min(minY, itemY);
      maxX = Math.max(maxX, itemX + itemWidth);
      maxY = Math.max(maxY, itemY + itemHeight);
    });

    // Calculate center of the bounding box
    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;

    // Calculate offset to move the center to the cursor position
    const offsetX = position.x - centerX;
    const offsetY = position.y - centerY;

    const clones: PlanningElement[] = this.items.map((item) => {
      const newClone = item.clone() as PlanningElement;
      newClone.id = uuidv4();

      // Apply the offset to position the element
      newClone.x = item.x + offsetX;
      newClone.y = item.y + offsetY;

      scene.addElement(newClone);
      return newClone;
    });

    this.restoreStoryTaskContainment(clones);

    return clones;
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
        if (story.containsLogicalPoint(anchorX, anchorY)) {
          story.addTask(task);
        }
      });
    });
  }

  public clear(): void {
    this.items = [];
  }

  /**
   * Get current clipboard items (for undo)
   */
  public getItems(): PlanningElement[] {
    return this.items;
  }
}

export const clipboardService = new ClipboardService();
