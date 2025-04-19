import { Scene } from '../scene/Scene.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Clipboard service stores copies of PlanningElement for paste operations.
 */
export class ClipboardService {
  private items: PlanningElement[] = [];

  public copy(elements: PlanningElement[]): void {
    // Deep clone and assign new IDs
    this.items = elements.map(el => {
      const clone = el.clone() as PlanningElement;
      clone.id = uuidv4();
      return clone;
    });
  }

  public paste(scene: Scene, position?: { x: number; y: number }): PlanningElement[] {
    const clones: PlanningElement[] = this.items.map(item => {
      const newClone = item.clone() as PlanningElement;
      newClone.id = uuidv4();
      if (position && this.items.length > 0) {
        const dx = item.x - this.items[0].x;
        const dy = item.y - this.items[0].y;
        newClone.x = position.x + dx;
        newClone.y = position.y + dy;
      }
      scene.addElement(newClone);
      return newClone;
    });
    return clones;
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
