import type { ConnectionRelationType, IConnection } from '../interfaces/connection.ts';
import type { Scene } from '../scene/Scene.ts';
import { Command } from './Command.ts';

type ConnectionPatch = {
  fromId: string;
  toId: string;
  relationType: ConnectionRelationType;
};

export class UpdateConnectionCommand extends Command {
  private readonly previousPatch: ConnectionPatch;

  constructor(
    private readonly scene: Scene,
    private readonly connection: IConnection,
    private readonly nextPatch: ConnectionPatch
  ) {
    super();
    this.previousPatch = {
      fromId: connection.fromId,
      toId: connection.toId,
      relationType: connection.relationType,
    };
  }

  public execute(): void {
    this.applyPatch(this.nextPatch);
  }

  public undo(): void {
    this.applyPatch(this.previousPatch);
  }

  private applyPatch(patch: ConnectionPatch): void {
    this.connection.fromId = patch.fromId;
    this.connection.toId = patch.toId;
    this.connection.relationType = patch.relationType;
    this.scene.changes.next();
  }
}
