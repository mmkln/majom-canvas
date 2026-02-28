/**
 * Command pattern base class for undoable actions.
 */
export abstract class Command {
  /** Execute the command. */
  abstract execute(): void;
  /** Undo the command. */
  abstract undo(): void;
}
