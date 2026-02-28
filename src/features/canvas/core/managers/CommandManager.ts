import { shortcutManager } from './ShortcutManager.ts';

type CommandHandler = () => void;

/**
 * Manages named commands and binds them to shortcuts.
 */
export class CommandManager {
  private commands: Map<string, CommandHandler> = new Map();

  /** Register a command with a unique name and its action. */
  public register(command: string, handler: CommandHandler): void {
    this.commands.set(command, handler);
  }

  /** Bind a keyboard shortcut to a registered command by name. */
  public bindShortcut(command: string, combo: string): void {
    if (!this.commands.has(command)) {
      console.warn(`Command "${command}" is not registered.`);
      return;
    }
    shortcutManager.register(combo, () => {
      this.execute(command);
    });
  }

  /** Execute a command action by its name. */
  public execute(command: string): void {
    const handler = this.commands.get(command);
    if (handler) handler();
    else console.warn(`No handler found for command "${command}".`);
  }

  /** List available commands. Useful for command palette. */
  public list(): string[] {
    return Array.from(this.commands.keys());
  }
}

export const commandManager = new CommandManager();
