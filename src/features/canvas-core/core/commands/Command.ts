/**
 * Command pattern base class for undoable actions.
 */
export abstract class Command {
  /** Execute the command. */
  abstract execute(): void;
  /** Undo the command. */
  abstract undo(): void;

  /**
   * Controls whether this command should participate in save-state tracking.
   * Commands that only change local UI state (e.g. viewport navigation)
   * should return false to avoid false "unsaved changes".
   */
  public affectsUnsavedChanges(): boolean {
    return true;
  }
}
