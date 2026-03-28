import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import type { AppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasInteractionAdapter } from './CanvasInteractionAdapter.ts';
import type { CanvasLookupAdapter } from './CanvasLookupAdapter.ts';
import type { ExistingPickerDragPayload } from '../ui/events/existingPickerEvents.ts';

export type CanvasUiComponent = {
  mount(parent?: HTMLElement): void;
  unmount(): void;
};

export type CanvasUiPreferences = {
  showBoardSelector: boolean;
  showNavigationDock: boolean;
  showSaveControls: boolean;
  showCanvasMenu: boolean;
};

export type CanvasUiAdapterContext = {
  canvasManager: CanvasManager;
  scene: Scene;
  lookupAdapter: CanvasLookupAdapter;
  interactionAdapter: CanvasInteractionAdapter | null;
  runtime: AppRuntime;
};

export interface CanvasUiAdapter {
  getPreferences?(): Partial<CanvasUiPreferences>;
  createComponents(context: CanvasUiAdapterContext): CanvasUiComponent[];
  handleExistingPickerDrop?(
    payload: ExistingPickerDragPayload,
    position: { x: number; y: number }
  ): boolean;
}
