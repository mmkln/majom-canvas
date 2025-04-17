// utils/typeGuards.ts
import { IPlanningElement } from '../interfaces/planningElement.ts';

export function isPlanningElement(element: any): element is IPlanningElement {
  return 'width' in element && 'height' in element && 'fillColor' in element && 'lineWidth' in element && 'isHovered' in element;
}
