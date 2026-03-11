import type { ShortcutHandler } from './ShortcutManager.ts';

type CommandHandler = () => void;

type ShortcutBindingTarget = {
  register(combo: string, handler: ShortcutHandler): void;
  unregister(combo: string, handler?: ShortcutHandler): void;
};

type BoundShortcut = {
  combo: string;
  handler: ShortcutHandler;
};

/**
 * Maps named commands to handlers and optional keyboard shortcuts.
 */
export class CommandManager {
  private readonly commands = new Map<string, CommandHandler>();
  private readonly boundShortcuts = new Map<string, BoundShortcut[]>();

  constructor(private readonly shortcutTarget: ShortcutBindingTarget) {}

  /**
   * Registers or replaces command handler by name.
   */
  public register(command: string, handler: CommandHandler): void {
    this.commands.set(command, handler);
  }

  /**
   * Removes command and all its shortcut bindings.
   */
  public unregister(command: string): void {
    this.commands.delete(command);
    this.unbindAll(command);
  }

  /**
   * Binds keyboard combo to an existing command.
   */
  public bindShortcut(command: string, combo: string): void {
    if (!this.commands.has(command)) {
      console.warn(`Command "${command}" is not registered.`);
      return;
    }
    const boundHandler: ShortcutHandler = () => {
      this.execute(command);
    };
    this.shortcutTarget.register(combo, boundHandler);

    const existing = this.boundShortcuts.get(command);
    if (!existing) {
      this.boundShortcuts.set(command, [{ combo, handler: boundHandler }]);
      return;
    }
    existing.push({ combo, handler: boundHandler });
  }

  /**
   * Executes command handler if it is registered.
   */
  public execute(command: string): void {
    const handler = this.commands.get(command);
    if (!handler) {
      console.warn(`No handler found for command "${command}".`);
      return;
    }
    handler();
  }

  /**
   * Returns all registered command names.
   */
  public list(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Unbinds all shortcuts and clears command registry.
   */
  public destroy(): void {
    Array.from(this.boundShortcuts.keys()).forEach((command) => {
      this.unbindAll(command);
    });
    this.commands.clear();
  }

  private unbindAll(command: string): void {
    const bindings = this.boundShortcuts.get(command);
    if (!bindings || bindings.length === 0) return;
    bindings.forEach((binding) => {
      this.shortcutTarget.unregister(binding.combo, binding.handler);
    });
    this.boundShortcuts.delete(command);
  }
}
