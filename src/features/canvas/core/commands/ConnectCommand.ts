// src/core/commands/ConnectCommand.ts
import { Command } from './Command.ts';
import Connection from '../shapes/Connection.ts';
import type { ConnectionRelationType } from '../interfaces/connection.ts';
import { Scene } from '../scene/Scene.ts';
import { isSameConnectionPair } from '../utils/connectionPairs.ts';

/**
 * Command to create a connection between two elements.
 */
export class ConnectCommand extends Command {
  private connection: Connection;
  private didCreate = false;
  constructor(
    private scene: Scene,
    private fromId: string,
    private toId: string,
    private relationType?: ConnectionRelationType
  ) {
    super();
    this.connection = new Connection(
      fromId,
      toId,
      undefined,
      undefined,
      relationType
    );
  }

  /** Add connection */
  public execute(): void {
    if (
      this.fromId === this.toId ||
      this.scene.getConnections().some((connection) =>
        isSameConnectionPair(
          connection.fromId,
          connection.toId,
          this.fromId,
          this.toId
        )
      )
    ) {
      this.didCreate = false;
      return;
    }
    this.scene.addElement(this.connection);
    this.didCreate = true;
  }

  /** Remove connection */
  public undo(): void {
    if (!this.didCreate) {
      return;
    }
    this.scene.removeElements([this.connection]);
  }

  public affectsUnsavedChanges(): boolean {
    return this.didCreate;
  }
}
