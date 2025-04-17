// utils/typeGuards.ts
import { PlanningElement } from '../PlanningElement.ts';
import type { IPlanningElement } from '../interfaces/planningElement.ts';

export function isPlanningElement(element: any): element is IPlanningElement {
  return element instanceof PlanningElement;
}
