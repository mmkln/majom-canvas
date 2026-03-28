import type { CanvasRuntimeSemanticsAdapter } from '../../canvas-core/adapters/CanvasRuntimeSemanticsAdapter.ts';
import type { ICanvasElement } from '../../canvas-core/core/interfaces/canvasElement.ts';
import type { ICanvasLayoutContainer } from '../../canvas-core/elements/interfaces/canvasLayoutContainer.ts';
import type { IStructuredCanvasNode } from '../../canvas-core/elements/interfaces/structuredCanvasNode.ts';
import {
  isCanvasLayoutContainer,
  isStructuredCanvasNode,
} from '../../canvas-core/elements/utils/typeGuards.ts';

const LEARNING_HIT_TEST_PRIORITIES: Record<string, number> = {
  checkpoint: 360,
  exercise: 350,
  lesson: 320,
  module: 260,
};

export class LearningCanvasRuntimeSemanticsAdapter
  implements CanvasRuntimeSemanticsAdapter
{
  public getHitTestPriority(element: ICanvasElement): number {
    if (!isStructuredCanvasNode(element)) {
      return 0;
    }
    const nodeKind = element.nodeKind;
    if (this.isLayoutChild(element)) {
      return LEARNING_HIT_TEST_PRIORITIES[nodeKind] ?? 320;
    }
    if (this.isLayoutContainer(element)) {
      return LEARNING_HIT_TEST_PRIORITIES[nodeKind] ?? 260;
    }
    return LEARNING_HIT_TEST_PRIORITIES[nodeKind] ?? 120;
  }

  public isLayoutContainer(
    element: ICanvasElement
  ): element is ICanvasLayoutContainer<IStructuredCanvasNode> {
    return isCanvasLayoutContainer(element);
  }

  public isLayoutChild(element: ICanvasElement): element is IStructuredCanvasNode {
    return (
      isStructuredCanvasNode(element) &&
      (element.nodeKind === 'lesson' ||
        element.nodeKind === 'exercise' ||
        element.nodeKind === 'checkpoint')
    );
  }

  public canResizeElement(element: ICanvasElement): boolean {
    return this.isLayoutContainer(element);
  }
}
