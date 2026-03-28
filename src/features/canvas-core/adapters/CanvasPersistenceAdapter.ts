import type { Scene } from '../core/scene/Scene.ts';
import type { IViewState } from '../core/interfaces/interfaces.ts';

export interface CanvasPersistenceAdapter {
  loadViewState(canvasId?: string | null): Promise<IViewState>;
  saveViewState(
    state: IViewState,
    canvasId?: string | null
  ): Promise<void>;
  loadLegacyDiagram(scene: Scene): Promise<void>;
  saveLegacyDiagram(scene: Scene): Promise<void>;
}
