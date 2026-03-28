import type { AppRuntime } from '../../../app-runtime/index.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { IConnection } from '../core/interfaces/connection.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import type { IconName } from '../ui/icons.ts';

export type CanvasActionTone = 'default' | 'primary' | 'danger';

export type CanvasActionDefinition = {
  id: string;
  label: string;
  description?: string;
  icon?: IconName;
  tone?: CanvasActionTone;
  disabled?: boolean;
};

export type CanvasActionGroup = {
  id: string;
  title?: string;
  actions: CanvasActionDefinition[];
};

export type CanvasInteractionContext = {
  scene: Scene;
  canvasManager: CanvasManager;
  runtime: AppRuntime;
};

export type CanvasCreationContext = CanvasInteractionContext & {
  sceneX: number;
  sceneY: number;
  selectedElements: ICanvasElement[];
};

export type CanvasContextMenuContext = CanvasInteractionContext & {
  sceneX: number;
  sceneY: number;
  target: ICanvasElement | IConnection | null;
  selectedElements: ICanvasElement[];
};

export type CanvasSelectionActionContext = CanvasInteractionContext & {
  selectedElements: ICanvasElement[];
};

export type CanvasActionExecutionContext = CanvasInteractionContext & {
  actionId: string;
  target: ICanvasElement | IConnection | null;
  selectedElements: ICanvasElement[];
  sceneX?: number;
  sceneY?: number;
};

export interface CanvasInteractionAdapter {
  getCreationActions?(context: CanvasCreationContext): CanvasActionGroup[];
  getContextMenuActions?(context: CanvasContextMenuContext): CanvasActionGroup[];
  getSelectionActions?(
    context: CanvasSelectionActionContext
  ): CanvasActionGroup[];
  executeAction?(context: CanvasActionExecutionContext): void | Promise<void>;
}
