import { ICanvasElement } from '../interfaces/canvasElement.ts';
import { Story } from '../../elements/Story.ts';

/**
 * Utility service for selection-related logic, e.g. grouping elements for drag.
 */
export class SelectionService {
  /**
   * Returns all selected elements plus tasks of any selected Stories.
   */
  public static getDragGroup(
    selected: ICanvasElement[]
  ): ICanvasElement[] {
    const group = new Set<ICanvasElement>(selected);
    selected
      .filter((el): el is Story => el instanceof Story)
      .forEach((story: Story) => {
        story.tasks.forEach((task) => group.add(task));
      });
    return Array.from(group);
  }
}
