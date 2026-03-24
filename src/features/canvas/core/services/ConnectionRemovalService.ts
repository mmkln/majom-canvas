import type { IConnectable } from '../interfaces/connectable.ts';
import type { IConnection } from '../interfaces/connection.ts';
import { CompositeCommand } from '../commands/CompositeCommand.ts';
import { RemoveConnectionCommand } from '../commands/RemoveConnectionCommand.ts';
import { historyService } from './HistoryService.ts';
import { Scene } from '../scene/Scene.ts';

export type ConnectionBatchRemoveResult = {
  removedConnections: IConnection[];
};

export class ConnectionRemovalService {
  constructor(private readonly scene: Scene) {}

  public hasConnectionsForElement(element: IConnectable): boolean {
    return this.findConnectionsForElement(element).length > 0;
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

    const commands = uniqueConnections.map(
      (connection) => new RemoveConnectionCommand(this.scene, connection)
    );

    historyService.execute(
      commands.length === 1 ? commands[0] : new CompositeCommand(commands)
    );

    return { removedConnections: uniqueConnections };
  }

  private getElementRef(element: IConnectable): string {
    const uuid = (element as { uuid?: string }).uuid;
    return uuid ?? element.id;
  }
}
