import { Command } from './Command.ts';

export class CompositeCommand extends Command {
  constructor(private readonly commands: Command[]) {
    super();
  }

  public execute(): void {
    this.commands.forEach((command) => {
      command.execute();
    });
  }

  public undo(): void {
    [...this.commands].reverse().forEach((command) => {
      command.undo();
    });
  }

  public affectsUnsavedChanges(): boolean {
    return this.commands.some((command) => command.affectsUnsavedChanges());
  }
}
