import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { Scene } from '../core/scene/Scene.ts';
import type { IPlanningElement } from '../elements/interfaces/planningElement.ts';

export type LegacyPlanningElementKind = 'goal' | 'story' | 'task';

export type LegacyPlanningCreateContext = {
  scene: Scene;
  canvasManager: CanvasManager;
  sceneX: number;
  sceneY: number;
};

export type LegacyPlanningChildCreateContext = {
  scene: Scene;
  canvasManager: CanvasManager;
  parent: IPlanningElement;
  childKind: LegacyPlanningElementKind;
};

export interface CanvasLegacyPlanningActionsAdapter {
  createElement(
    kind: LegacyPlanningElementKind,
    context: LegacyPlanningCreateContext
  ): void;
  openExisting(
    kind: LegacyPlanningElementKind,
    context: LegacyPlanningCreateContext
  ): void;
  createChild?(context: LegacyPlanningChildCreateContext): void;
  supportsRelatedItems?(element: IPlanningElement): boolean;
  openRelatedItems?(element: IPlanningElement): void;
}
