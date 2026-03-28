import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { ICanvasLayoutContainer } from '../elements/interfaces/canvasLayoutContainer.ts';
import type { IStructuredCanvasNode } from '../elements/interfaces/structuredCanvasNode.ts';
import {
  isCanvasLayoutContainer,
  isStructuredCanvasNode,
} from '../elements/utils/typeGuards.ts';

export interface CanvasRuntimeSemanticsAdapter {
  getHitTestPriority(element: ICanvasElement): number;
  isLayoutContainer(
    element: ICanvasElement
  ): element is ICanvasLayoutContainer<IStructuredCanvasNode>;
  isLayoutChild(element: ICanvasElement): element is IStructuredCanvasNode;
  canResizeElement(element: ICanvasElement): boolean;
}

const LAYOUT_CHILD_KINDS = new Set([
  'task',
  'lesson',
  'exercise',
  'checkpoint',
]);

const DEFAULT_HIT_TEST_PRIORITIES: Record<string, number> = {
  checkpoint: 340,
  exercise: 330,
  task: 320,
  lesson: 300,
  story: 220,
  module: 220,
  goal: 180,
};

export const DEFAULT_CANVAS_RUNTIME_SEMANTICS_ADAPTER: CanvasRuntimeSemanticsAdapter =
  {
    getHitTestPriority(element: ICanvasElement): number {
      if (!isStructuredCanvasNode(element)) {
        return 0;
      }
      const nodeKind = element.nodeKind;
      if (this.isLayoutChild(element)) {
        return DEFAULT_HIT_TEST_PRIORITIES[nodeKind] ?? 300;
      }
      if (this.isLayoutContainer(element)) {
        return DEFAULT_HIT_TEST_PRIORITIES[nodeKind] ?? 220;
      }
      return DEFAULT_HIT_TEST_PRIORITIES[nodeKind] ?? 120;
    },

    isLayoutContainer(
      element: ICanvasElement
    ): element is ICanvasLayoutContainer<IStructuredCanvasNode> {
      return isCanvasLayoutContainer(element);
    },

    isLayoutChild(element: ICanvasElement): element is IStructuredCanvasNode {
      return (
        isStructuredCanvasNode(element) &&
        LAYOUT_CHILD_KINDS.has(element.nodeKind)
      );
    },

    canResizeElement(element: ICanvasElement): boolean {
      return this.isLayoutContainer(element);
    },
  };
