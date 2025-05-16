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
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    this.items.forEach(item => {
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
