/**
 * Base reversible command used by history/undo infrastructure.
 */
export abstract class Command {
  /**
   * Applies the command side effects.
   */
  abstract execute(): void;
  /**
   * Reverts side effects produced by {@link execute}.
   */
  abstract undo(): void;

  /**
   * Indicates whether this command should affect "unsaved changes" state.
   */
  public affectsUnsavedChanges(): boolean {
    return true;
  }
}
