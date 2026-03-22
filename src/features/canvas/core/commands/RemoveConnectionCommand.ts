import { Command } from './Command.ts';
import type { Scene } from '../scene/Scene.ts';
import type { IConnection } from '../interfaces/connection.ts';

export class RemoveConnectionCommand extends Command {
  constructor(
    private readonly scene: Scene,
    private readonly connection: IConnection
  ) {
    super();
  }

  public execute(): void {
    this.scene.removeElements([this.connection]);
  }

  public undo(): void {
    this.scene.addElement(this.connection);
  }
}
