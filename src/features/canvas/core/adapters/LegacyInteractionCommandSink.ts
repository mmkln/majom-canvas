import type { InteractionCommandSink } from '../managers/InteractionManager.ts';
import type { Scene } from '../scene/Scene.ts';
import { MoveCommand } from '../commands/MoveCommand.ts';
import { ResizeCommand } from '../commands/ResizeCommand.ts';
import { historyService } from '../services/HistoryService.ts';

export function createLegacyInteractionCommandSink(
  scene: Scene
): InteractionCommandSink {
  return {
    executeMove: (initial, final) => {
      historyService.execute(new MoveCommand(scene, initial, final));
    },
    executeResize: (initial, final) => {
      historyService.execute(new ResizeCommand(scene, initial, final));
    },
  };
}
