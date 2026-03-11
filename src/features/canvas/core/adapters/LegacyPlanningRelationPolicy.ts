import type {
  RelationPolicy,
  RelationPolicyDecision,
} from 'majom-canvas-core';
import type { IConnectable } from '../interfaces/connectable.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

export class LegacyPlanningRelationPolicy
  implements RelationPolicy<IConnectable>
{
  public canConnect({
    source,
    target,
  }: {
    source: IConnectable;
    target: IConnectable;
  }): RelationPolicyDecision {
    if (source === target) {
      return { allowed: false, reason: 'Cannot connect element to itself' };
    }

    if (
      source instanceof StoryElement &&
      target instanceof TaskElement &&
      source.tasks.some((task) => task.id === target.id)
    ) {
      return {
        allowed: false,
        reason: 'Task is already attached to this story',
      };
    }
    if (
      source instanceof TaskElement &&
      target instanceof StoryElement &&
      target.tasks.some((task) => task.id === source.id)
    ) {
      return {
        allowed: false,
        reason: 'Task is already attached to this story',
      };
    }

    if (source instanceof GoalElement && target instanceof GoalElement) {
      return {
        allowed: true,
        relationType: ConnectionRelationType.LeadsTo,
      };
    }

    if (
      (source instanceof GoalElement && target instanceof StoryElement) ||
      (source instanceof StoryElement && target instanceof GoalElement)
    ) {
      return {
        allowed: true,
        relationType: ConnectionRelationType.ParentChild,
      };
    }

    return {
      allowed: true,
      relationType: ConnectionRelationType.RelatesTo,
    };
  }
}

