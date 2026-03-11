import { CommandManager as CoreCommandManager } from 'majom-canvas-core';
import { shortcutManager } from './ShortcutManager.ts';

/**
 * Manages named commands and binds them to shortcuts.
 */
export class CommandManager extends CoreCommandManager {
  constructor() {
    super(shortcutManager);
  }
}

export const commandManager = new CommandManager();

