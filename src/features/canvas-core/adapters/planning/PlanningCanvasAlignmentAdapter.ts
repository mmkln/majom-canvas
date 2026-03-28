import type { AlignmentSubject } from '../../core/alignment/types.ts';
import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type {
  CanvasAlignmentAdapter,
  CanvasAlignmentContext,
} from '../CanvasAlignmentAdapter.ts';
import { DefaultCanvasAlignmentAdapter } from '../DefaultCanvasAlignmentAdapter.ts';
import {
  createAlignmentSubject,
  getAggregateAlignmentRect,
  getElementAlignmentSubject,
  isAlignmentRectVisibleInViewport,
} from '../CanvasAlignmentAdapterUtils.ts';

const PLANNING_ALIGNMENT_PRIORITIES = {
  task: 320,
  story: 220,
  goal: 180,
} as const;

export class PlanningCanvasAlignmentAdapter
  extends DefaultCanvasAlignmentAdapter
  implements CanvasAlignmentAdapter
{
  public override getMovingSubject(
    context: CanvasAlignmentContext
  ): AlignmentSubject | null {
    const bounds = getAggregateAlignmentRect(context.movingElements);
    if (!bounds) return null;

    const movingElements = context.movingElements;
    const taskContainerMap = this.getTaskContainerMap(context.elements);
    const firstElement = movingElements[0];
    const sharedTaskScopeId = this.getSharedTaskScopeId(
      movingElements,
      taskContainerMap
    );

    if (movingElements.length === 1 && firstElement instanceof StoryElement) {
      return createAlignmentSubject({
        id: '__moving__',
        bounds,
        role: 'container',
        scopeKind: 'global',
        scopeId: null,
        priority: PLANNING_ALIGNMENT_PRIORITIES.story,
      });
    }

    if (movingElements.length === 1 && firstElement instanceof GoalElement) {
      return createAlignmentSubject({
        id: '__moving__',
        bounds,
        role: 'element',
        scopeKind: 'global',
        scopeId: null,
        priority: PLANNING_ALIGNMENT_PRIORITIES.goal,
      });
    }

    if (movingElements.every((element) => element instanceof TaskElement)) {
      return createAlignmentSubject({
        id: '__moving__',
        bounds,
        role: 'element',
        scopeKind: sharedTaskScopeId ? 'container' : 'global',
        scopeId: sharedTaskScopeId,
        priority: PLANNING_ALIGNMENT_PRIORITIES.task,
      });
    }

    return createAlignmentSubject({
      id: '__moving__',
      bounds,
      role: 'element',
      scopeKind: 'global',
      scopeId: null,
    });
  }

  public override getReferenceSubjects(
    context: CanvasAlignmentContext
  ): AlignmentSubject[] {
    const taskContainerMap = this.getTaskContainerMap(context.elements);
    const movingIds = new Set(
      context.movingElements.map((element) => element.id)
    );

    return context.elements
      .filter((element) => !movingIds.has(element.id))
      .map((element) =>
        this.toPlanningReferenceSubject(element, taskContainerMap)
      )
      .filter((subject) => subject !== null)
      .filter((subject) =>
        isAlignmentRectVisibleInViewport(subject.bounds, context.viewport)
      );
  }

  public override getVirtualSubjects(
    context: CanvasAlignmentContext
  ): AlignmentSubject[] {
    return super.getVirtualSubjects(context);
  }

  private toPlanningReferenceSubject(
    element: ICanvasElement,
    taskContainerMap: Map<string, string>
  ): AlignmentSubject | null {
    if (element instanceof TaskElement) {
      const scopeId = taskContainerMap.get(element.id) ?? null;
      return getElementAlignmentSubject(element, {
        role: 'element',
        scopeKind: scopeId ? 'container' : 'global',
        scopeId,
        priority: PLANNING_ALIGNMENT_PRIORITIES.task,
      });
    }

    if (element instanceof StoryElement) {
      return getElementAlignmentSubject(element, {
        role: 'container',
        scopeKind: 'global',
        scopeId: null,
        priority: PLANNING_ALIGNMENT_PRIORITIES.story,
      });
    }

    if (element instanceof GoalElement) {
      return getElementAlignmentSubject(element, {
        role: 'element',
        scopeKind: 'global',
        scopeId: null,
        priority: PLANNING_ALIGNMENT_PRIORITIES.goal,
      });
    }

    return this.toReferenceSubject(element);
  }

  private getTaskContainerMap(
    elements: ReadonlyArray<ICanvasElement>
  ): Map<string, string> {
    const map = new Map<string, string>();

    elements.forEach((element) => {
      if (!(element instanceof StoryElement)) return;
      element.getOrderedLayoutChildren().forEach((task) => {
        map.set(task.id, element.id);
      });
    });

    return map;
  }

  private getSharedTaskScopeId(
    elements: ReadonlyArray<ICanvasElement>,
    taskContainerMap: Map<string, string>
  ): string | null {
    if (
      elements.length === 0 ||
      !elements.every((element) => element instanceof TaskElement)
    ) {
      return null;
    }

    const scopeIds = new Set(
      elements.map((element) => taskContainerMap.get(element.id) ?? null)
    );
    if (scopeIds.size !== 1) return null;

    return scopeIds.values().next().value ?? null;
  }
}
