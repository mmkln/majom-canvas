import type { IConnectable } from '../../core/interfaces/connectable.ts';
import { ConnectionRelationType } from '../../core/interfaces/connection.ts';
import { emitStoryGoalLinkSet } from '../../core/canvasLinkLifecycle.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type {
  CanvasConnectionEndpoints,
  CanvasConnectionPlanContext,
  CanvasConnectionPolicy,
} from '../CanvasConnectionPolicy.ts';

export class PlanningCanvasConnectionPolicy
  implements CanvasConnectionPolicy
{
  public isInvalidPair(source: IConnectable, target: IConnectable): boolean {
    return (
      (source instanceof StoryElement &&
        target instanceof TaskElement &&
        source.tasks.some((task) => task.id === target.id)) ||
      (source instanceof TaskElement &&
        target instanceof StoryElement &&
        target.tasks.some((task) => task.id === source.id))
    );
  }

  public violatesBatchRule(
    sources: ReadonlyArray<IConnectable>,
    targets: ReadonlyArray<IConnectable>
  ): boolean {
    const sourceStories = sources.filter(
      (element): element is StoryElement => element instanceof StoryElement
    );
    const targetGoals = targets.filter(
      (element): element is GoalElement => element instanceof GoalElement
    );
    if (sourceStories.length === 1 && targetGoals.length > 1) {
      return true;
    }

    const sourceGoals = sources.filter(
      (element): element is GoalElement => element instanceof GoalElement
    );
    const targetStories = targets.filter(
      (element): element is StoryElement => element instanceof StoryElement
    );
    return sourceGoals.length > 1 && targetStories.length === 1;
  }

  public resolveRelationType(
    source: IConnectable,
    target: IConnectable,
    requestedRelationType?: ConnectionRelationType
  ): ConnectionRelationType | null {
    if (requestedRelationType) {
      return this.isRequestedRelationTypeAllowed(
        source,
        target,
        requestedRelationType
      )
        ? requestedRelationType
        : null;
    }
    if (source instanceof GoalElement && target instanceof GoalElement) {
      return ConnectionRelationType.LeadsTo;
    }
    if (this.isGoalStoryParentChildPair(source, target)) {
      return ConnectionRelationType.ParentChild;
    }
    return ConnectionRelationType.RelatesTo;
  }

  public normalizeEndpoints(
    relationType: ConnectionRelationType,
    source: IConnectable,
    target: IConnectable
  ): CanvasConnectionEndpoints | null {
    if (relationType !== ConnectionRelationType.ParentChild) {
      return { from: source, to: target };
    }
    if (source instanceof GoalElement && target instanceof StoryElement) {
      return { from: source, to: target };
    }
    if (source instanceof StoryElement && target instanceof GoalElement) {
      return { from: target, to: source };
    }
    return null;
  }

  public onConnectionCreated(plan: CanvasConnectionPlanContext): void {
    if (
      plan.relationType === ConnectionRelationType.ParentChild &&
      plan.from instanceof GoalElement &&
      plan.to instanceof StoryElement
    ) {
      emitStoryGoalLinkSet(plan.to, plan.from);
    }
  }

  private isRequestedRelationTypeAllowed(
    source: IConnectable,
    target: IConnectable,
    relationType: ConnectionRelationType
  ): boolean {
    if (relationType === ConnectionRelationType.ParentChild) {
      return this.isGoalStoryParentChildPair(source, target);
    }
    if (this.isGoalStoryParentChildPair(source, target)) {
      return false;
    }
    return true;
  }

  private isGoalStoryParentChildPair(
    a: IConnectable,
    b: IConnectable
  ): boolean {
    return (
      (a instanceof GoalElement && b instanceof StoryElement) ||
      (a instanceof StoryElement && b instanceof GoalElement)
    );
  }
}
