import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import { CompositeCommand } from '../commands/CompositeCommand.ts';
import { RemoveConnectionCommand } from '../commands/RemoveConnectionCommand.ts';
import { historyService } from './HistoryService.ts';
import { Scene } from '../scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import {
  emitGoalLinkRemoved,
  type GoalLinkSnapshot,
  isGoalLinkRelationType,
} from '../canvasLinkLifecycle.ts';

export type ConnectionBatchRemoveResult = {
  removedConnections: IConnection[];
};

export class ConnectionRemovalService {
  constructor(private readonly scene: Scene) {}

  public removeConnection(connection: IConnection): ConnectionBatchRemoveResult {
    return this.removeConnections([connection]);
  }

  public removeConnectionsBatch(
    connections: ReadonlyArray<IConnection>
  ): ConnectionBatchRemoveResult {
    return this.removeConnections(connections);
  }

  public hasConnectionsForElement(element: IConnectable): boolean {
    return this.findConnectionsForElement(element).length > 0;
  }

  public hasConnectionsForElements(
    elements: ReadonlyArray<IConnectable>
  ): boolean {
    return this.findConnectionsForElements(elements).length > 0;
  }

  public hasConnectionsBetweenElementAndTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>
  ): boolean {
    return this.findConnectionsBetweenElementAndTargets(source, targets).length > 0;
  }

  public removeConnectionsForElement(
    element: IConnectable
  ): ConnectionBatchRemoveResult {
    return this.removeConnections(this.findConnectionsForElement(element));
  }

  public removeConnectionsForElements(
    elements: ReadonlyArray<IConnectable>
  ): ConnectionBatchRemoveResult {
    return this.removeConnections(this.findConnectionsForElements(elements));
  }

  public removeConnectionsBetweenElementAndTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>
  ): ConnectionBatchRemoveResult {
    return this.removeConnections(
      this.findConnectionsBetweenElementAndTargets(source, targets)
    );
  }

  private findConnectionsForElement(element: IConnectable): IConnection[] {
    const elementRef = this.getElementRef(element);
    return this.scene.getConnections().filter(
      (connection) =>
        connection.fromId === elementRef || connection.toId === elementRef
    );
  }

  private findConnectionsForElements(
    elements: ReadonlyArray<IConnectable>
  ): IConnection[] {
    if (elements.length === 0) {
      return [];
    }

    const elementRefs = new Set(
      elements.map((element) => this.getElementRef(element))
    );

    return this.scene.getConnections().filter(
      (connection) =>
        elementRefs.has(connection.fromId) || elementRefs.has(connection.toId)
    );
  }

  private findConnectionsBetweenElementAndTargets(
    source: IConnectable,
    targets: ReadonlyArray<IConnectable>
  ): IConnection[] {
    if (targets.length === 0) {
      return [];
    }

    const sourceRef = this.getElementRef(source);
    const targetRefs = new Set(targets.map((target) => this.getElementRef(target)));

    return this.scene.getConnections().filter(
      (connection) =>
        (connection.fromId === sourceRef && targetRefs.has(connection.toId)) ||
        (connection.toId === sourceRef && targetRefs.has(connection.fromId))
    );
  }

  private removeConnections(
    connections: ReadonlyArray<IConnection>
  ): ConnectionBatchRemoveResult {
    const uniqueConnections = Array.from(
      new Map(connections.map((connection) => [connection.id, connection])).values()
    );

    if (uniqueConnections.length === 0) {
      return { removedConnections: [] };
    }

    const removedGoalLinks = uniqueConnections
      .map((connection) => this.buildGoalLinkSnapshot(connection))
      .filter((goalLink): goalLink is GoalLinkSnapshot => goalLink !== null);

    const commands = uniqueConnections.map(
      (connection) => new RemoveConnectionCommand(this.scene, connection)
    );

    historyService.execute(
      commands.length === 1 ? commands[0] : new CompositeCommand(commands)
    );

    removedGoalLinks.forEach((goalLink) => {
      emitGoalLinkRemoved(goalLink);
    });

    return { removedConnections: uniqueConnections };
  }

  private getElementRef(element: IConnectable): string {
    const uuid = (element as { uuid?: string }).uuid;
    return uuid ?? element.id;
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
