import { GoalElement } from '../../elements/GoalElement.ts';
import {
  emitGoalLinkUpdated,
  type GoalLinkSnapshot,
  isGoalLinkRelationType,
} from '../canvasLinkLifecycle.ts';
import { RemoveConnectionCommand } from '../commands/RemoveConnectionCommand.ts';
import { UpdateConnectionCommand } from '../commands/UpdateConnectionCommand.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';

const GOAL_LINK_RELATION_TYPES: readonly ConnectionRelationType[] = [
  ConnectionRelationType.LeadsTo,
  ConnectionRelationType.Blocks,
  ConnectionRelationType.RelatesTo,
];

export class ConnectionMutationService {
  constructor(private readonly scene: Scene) {}

  public removeConnectionFromCanvas(connection: IConnection): void {
    historyService.execute(new RemoveConnectionCommand(this.scene, connection));
  }

  public canUpdateRelationType(connection: IConnection): boolean {
    return this.buildGoalLinkSnapshot(connection) !== null;
  }

  public getAvailableRelationTypes(
    connection: IConnection
  ): readonly ConnectionRelationType[] {
    return this.canUpdateRelationType(connection) ? GOAL_LINK_RELATION_TYPES : [];
  }

  public updateRelationType(
    connection: IConnection,
    relationType: ConnectionRelationType
  ): boolean {
    const currentGoalLink = this.buildGoalLinkSnapshot(connection);
    if (!currentGoalLink || !isGoalLinkRelationType(relationType)) {
      return false;
    }
    if (connection.relationType === relationType) {
      return true;
    }

    historyService.execute(
      new UpdateConnectionCommand(this.scene, connection, {
        fromId: connection.fromId,
        toId: connection.toId,
        relationType,
      })
    );

    const nextGoalLink = this.buildGoalLinkSnapshot(connection);
    if (!nextGoalLink) {
      return false;
    }

    emitGoalLinkUpdated(currentGoalLink, nextGoalLink);
    return true;
  }

  private buildGoalLinkSnapshot(connection: IConnection): GoalLinkSnapshot | null {
    if (!isGoalLinkRelationType(connection.relationType)) {
      return null;
    }

    const fromGoal = this.findGoalByRef(connection.fromId);
    const toGoal = this.findGoalByRef(connection.toId);
    if (!fromGoal || !toGoal) {
      return null;
    }

    return {
      connectionId: connection.id,
      lineType: connection.lineType,
      fromGoalRef: connection.fromId,
      toGoalRef: connection.toId,
      fromGoalUuid: fromGoal.uuid ?? null,
      toGoalUuid: toGoal.uuid ?? null,
      relationType: connection.relationType,
    };
  }

  private findGoalByRef(goalRef: string): GoalElement | null {
    return (
      this.scene
        .getElements()
        .find(
          (element): element is GoalElement =>
            element instanceof GoalElement &&
            (element.id === goalRef || element.uuid === goalRef)
        ) ?? null
    );
  }
}
