import { ICanvasElement } from '../interfaces/canvasElement.ts';
import type { IStructuredCanvasNode } from '../../elements/interfaces/structuredCanvasNode.ts';
import { isCanvasLayoutContainer } from '../../elements/utils/typeGuards.ts';

/**
 * Utility service for selection-related logic, e.g. grouping elements for drag.
 */
export class SelectionService {
  /**
   * Returns all selected elements plus tasks of any selected Stories.
   */
  public static getDragGroup(selected: ICanvasElement[]): ICanvasElement[] {
    const group = new Set<ICanvasElement>(selected);
    selected
      .filter((element) => isCanvasLayoutContainer(element))
      .forEach((container) => {
        container
          .getOrderedLayoutChildren()
          .forEach((child: IStructuredCanvasNode) => group.add(child));
      });
    return Array.from(group);
  }
}
