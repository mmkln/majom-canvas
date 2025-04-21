import { Scene } from '../scene/Scene.ts';
import { PlanningElement } from '../../elements/PlanningElement.ts';
import { v4 as uuidv4 } from 'uuid';
import { getBoundingBox } from '../utils/geometryUtils.ts';

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
    // Compute reference origin (top-left of bounding box) for relative paste
    let baseX = 0, baseY = 0;
    if (position && this.items.length) {
      const bbox = getBoundingBox(this.items.map(item => ({ x: item.x, y: item.y }))); 
      baseX = bbox.minX;
      baseY = bbox.minY;
    }
    const clones: PlanningElement[] = this.items.map(item => {
      const newClone = item.clone() as PlanningElement;
      newClone.id = uuidv4();
      if (position) {
        const dx = item.x - baseX;
        const dy = item.y - baseY;
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
