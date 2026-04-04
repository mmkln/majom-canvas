import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import type { ICanvasLayoutContainer } from '../interfaces/canvasLayoutContainer.ts';
import type { IPlanningElement } from '../interfaces/planningElement.ts';
import type { IStructuredCanvasNode } from '../interfaces/structuredCanvasNode.ts';
import {
  isCanvasLayoutContainer,
  isPlanningElement as isPlanningElementBase,
} from './typeGuards.ts';

export type PlanningNodeKind = 'task' | 'story' | 'goal' | 'habit';

export type GoalPlanningElement = IPlanningElement & {
  nodeKind: 'goal';
  tagIds?: number[];
  tags?: string[];
};

export type StoryPlanningElement = IPlanningElement &
  ICanvasLayoutContainer<IStructuredCanvasNode> & {
    nodeKind: 'story';
  };

export type TaskPlanningElement = IPlanningElement & {
  nodeKind: 'task';
};

export function isPlanningNode(element: unknown): element is IPlanningElement {
  return isPlanningElementBase(element);
}

export function isPlanningCanvasElement(
  element: ICanvasElement
): element is IPlanningElement {
  return isPlanningNode(element);
}

export function hasPlanningNodeKind<K extends string>(
  element: IPlanningElement,
  kind: K
): element is IPlanningElement & { nodeKind: K } {
  return element.nodeKind === kind;
}

export function isGoalPlanningElement(
  element: unknown
): element is GoalPlanningElement {
  return isPlanningNode(element) && element.nodeKind === 'goal';
}

export function isStoryPlanningElement(
  element: unknown
): element is StoryPlanningElement {
  return (
    isPlanningNode(element) &&
    element.nodeKind === 'story' &&
    isCanvasLayoutContainer(element)
  );
}

export function isTaskPlanningElement(
  element: unknown
): element is TaskPlanningElement {
  return isPlanningNode(element) && element.nodeKind === 'task';
}

export function getPlanningElementConfirmKey(
  element: IPlanningElement
): string | null {
  if (
    element.nodeKind !== 'task' &&
    element.nodeKind !== 'story' &&
    element.nodeKind !== 'goal' &&
    element.nodeKind !== 'habit'
  ) {
    return null;
  }
  return `${element.nodeKind}:${element.id}`;
}
