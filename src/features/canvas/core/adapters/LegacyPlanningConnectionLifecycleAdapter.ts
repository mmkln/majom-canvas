import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { emitStoryGoalLinkSet } from '../canvasLinkLifecycle.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import type { IConnectable } from '../interfaces/connectable.ts';
import type {
  ConnectionCreatedContext,
  ConnectionLifecycleAdapter,
} from './ConnectionLifecycleAdapter.ts';

export class LegacyPlanningConnectionLifecycleAdapter
  implements ConnectionLifecycleAdapter
{
  public normalizeConnectionRefs(
    relationType: ConnectionRelationType,
    from: IConnectable,
    to: IConnectable
  ): { from: IConnectable; to: IConnectable } | null {
    if (relationType !== ConnectionRelationType.ParentChild) {
      return { from, to };
    }
    if (from instanceof GoalElement && to instanceof StoryElement) {
      return { from, to };
    }
    if (from instanceof StoryElement && to instanceof GoalElement) {
      return { from: to, to: from };
    }
    return null;
  }

  public onConnectionCreated(context: ConnectionCreatedContext): void {
    const { relationType, from, to } = context;
    if (
      relationType === ConnectionRelationType.ParentChild &&
      from instanceof GoalElement &&
      to instanceof StoryElement
    ) {
      emitStoryGoalLinkSet(to, from);
    }
  }
}
