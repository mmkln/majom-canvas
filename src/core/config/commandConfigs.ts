import { historyService } from '../services/HistoryService.ts';
import { CopyCommand } from '../commands/CopyCommand.ts';
import { PasteCommand } from '../commands/PasteCommand.ts';
import { CutCommand } from '../commands/CutCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import type { Scene } from '../scene/Scene.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';

export interface CommandConfig {
  name: string;
  handler: () => void;
  keys: string[];
}

export function getCommandConfigs(scene: Scene, canvasManager: CanvasManager): CommandConfig[] {
  return [
    {
      name: 'undo',
      handler: () => historyService.undo(),
      keys: ['ctrl+z', 'meta+z']
    },
    {
      name: 'redo',
      handler: () => historyService.redo(),
      keys: ['ctrl+y', 'meta+y', 'meta+shift+z']
    },
    {
      name: 'copy',
      handler: () => historyService.execute(new CopyCommand(scene)),
      keys: ['ctrl+c', 'meta+c']
    },
    {
      name: 'paste',
      handler: () => historyService.execute(new PasteCommand(scene, canvasManager)),
      keys: ['ctrl+v', 'meta+v']
    },
    {
      name: 'cut',
      handler: () => historyService.execute(new CutCommand(scene)),
      keys: ['ctrl+x', 'meta+x']
    },
    {
      name: 'delete',
      handler: () => {
        const elems = scene.getSelectedElements();
        historyService.execute(new DeleteCommand(scene, elems));
      },
      keys: ['delete', 'backspace']
    }
  ];
}
