// utils/typeGuards.ts
import { StructuredCanvasNode } from '../StructuredCanvasNode.ts';
import { PlanningElement } from '../PlanningElement.ts';
import type { ICanvasLayoutContainer } from '../interfaces/canvasLayoutContainer.ts';
import type { IPlanningElement } from '../interfaces/planningElement.ts';
import type { IStructuredCanvasNode } from '../interfaces/structuredCanvasNode.ts';

export function isStructuredCanvasNode(
  element: unknown
): element is IStructuredCanvasNode {
  return element instanceof StructuredCanvasNode;
}

export function isPlanningElement(element: any): element is IPlanningElement {
  return element instanceof PlanningElement;
}

export function isCanvasLayoutContainer(
  element: unknown
): element is ICanvasLayoutContainer {
  if (!isStructuredCanvasNode(element)) {
    return false;
  }
  return (
    typeof (element as ICanvasLayoutContainer).getLayoutMetrics === 'function' &&
    typeof (element as ICanvasLayoutContainer).getOrderedLayoutChildren ===
      'function' &&
    typeof (element as ICanvasLayoutContainer).replaceOrderedLayoutChildren ===
      'function' &&
    typeof (element as ICanvasLayoutContainer).acceptsLayoutChild === 'function'
  );
}
