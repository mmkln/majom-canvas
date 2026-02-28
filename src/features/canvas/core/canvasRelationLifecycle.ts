import type { IConnectable } from './interfaces/connectable.ts';
import { ConnectionRelationType } from './interfaces/connection.ts';
import { TaskElement } from '../elements/TaskElement.ts';
import { StoryElement } from '../elements/StoryElement.ts';
import { GoalElement } from '../elements/GoalElement.ts';

export type CanvasRelationElementType = 'task' | 'story' | 'goal' | 'other';
export type CanvasRelationLifecycleAction = 'created';

export type CanvasRelationEndpoint = {
  ref: string;
  elementType: CanvasRelationElementType;
  element: IConnectable;
};

export type CanvasRelationLifecycleDetail = {
  action: CanvasRelationLifecycleAction;
  relationType: ConnectionRelationType;
  from: CanvasRelationEndpoint;
  to: CanvasRelationEndpoint;
};

export const CANVAS_RELATION_LIFECYCLE_EVENT = 'canvasRelationLifecycle';

export function getCanvasRelationElementType(
  element: IConnectable
): CanvasRelationElementType {
  if (element instanceof TaskElement) return 'task';
  if (element instanceof StoryElement) return 'story';
  if (element instanceof GoalElement) return 'goal';
  return 'other';
}

export function buildCanvasRelationEndpoint(
  element: IConnectable,
  ref: string
): CanvasRelationEndpoint {
  return {
    ref,
    elementType: getCanvasRelationElementType(element),
    element,
  };
}

export function emitCanvasRelationLifecycle(
  detail: CanvasRelationLifecycleDetail
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CanvasRelationLifecycleDetail>(
      CANVAS_RELATION_LIFECYCLE_EVENT,
      { detail }
    )
  );
}

export function isCanvasRelationLifecycleDetail(
  detail: unknown
): detail is CanvasRelationLifecycleDetail {
  if (!detail || typeof detail !== 'object') return false;
  const value = detail as Partial<CanvasRelationLifecycleDetail>;
  const hasEndpoints =
    value.from &&
    typeof value.from === 'object' &&
    value.to &&
    typeof value.to === 'object';
  return (
    value.action === 'created' &&
    typeof value.relationType === 'string' &&
    Boolean(hasEndpoints)
  );
}

