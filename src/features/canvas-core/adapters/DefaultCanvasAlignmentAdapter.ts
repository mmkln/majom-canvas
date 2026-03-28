import type { AlignmentSubject } from '../core/alignment/types.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type {
  CanvasAlignmentAdapter,
  CanvasAlignmentContext,
} from './CanvasAlignmentAdapter.ts';
import {
  createAlignmentSubject,
  getAggregateAlignmentRect,
  getElementAlignmentSubject,
  isAlignmentRectVisibleInViewport,
} from './CanvasAlignmentAdapterUtils.ts';

export class DefaultCanvasAlignmentAdapter implements CanvasAlignmentAdapter {
  public getMovingSubject(
    context: CanvasAlignmentContext
  ): AlignmentSubject | null {
    const bounds = getAggregateAlignmentRect(context.movingElements);
    if (!bounds) return null;
    return createAlignmentSubject({
      id: '__moving__',
      bounds,
      role: 'element',
      scopeKind: 'local',
      scopeId: null,
    });
  }

  public getReferenceSubjects(
    context: CanvasAlignmentContext
  ): AlignmentSubject[] {
    const movingIds = new Set(
      context.movingElements.map((element) => element.id)
    );

    return context.elements
      .filter((element) => !movingIds.has(element.id))
      .map((element) => this.toReferenceSubject(element))
      .filter((subject) => subject !== null)
      .filter((subject) =>
        isAlignmentRectVisibleInViewport(subject.bounds, context.viewport)
      );
  }

  public getVirtualSubjects(
    context: CanvasAlignmentContext
  ): AlignmentSubject[] {
    if (!context.viewport) {
      return [];
    }
    return [
      createAlignmentSubject({
        id: '__viewport__',
        bounds: context.viewport,
        role: 'viewport',
        scopeKind: 'viewport',
        scopeId: null,
        priority: 40,
      }),
    ];
  }

  protected toReferenceSubject(
    element: ICanvasElement
  ): AlignmentSubject | null {
    return getElementAlignmentSubject(element);
  }
}
