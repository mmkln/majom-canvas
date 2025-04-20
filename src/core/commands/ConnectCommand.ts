// src/core/commands/ConnectCommand.ts
import { Command } from './Command.ts';
import Connection from '../shapes/Connection.ts';
import { Scene } from '../scene/Scene.ts';

/**
 * Command to create a connection between two elements.
 */
export class ConnectCommand extends Command {
  private connection: Connection;
  constructor(
    private scene: Scene,
    private fromId: string,
    private toId: string
  ) {
    super();
    this.connection = new Connection(fromId, toId);
  }

  /** Add connection */
  public execute(): void {
    this.scene.addElement(this.connection);
  }

  /** Remove connection */
  public undo(): void {
    this.scene.removeElement(this.connection);
  }
}
