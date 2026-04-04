import type { AppRuntime } from '../../../app-runtime/index.ts';
import type { CanvasManager } from '../core/managers/CanvasManager.ts';
import type { ICanvasElement } from '../core/interfaces/canvasElement.ts';
import type { Scene } from '../core/scene/Scene.ts';
import type { IPlanningElement } from '../elements/interfaces/planningElement.ts';
import type { CanvasLookupAdapter } from './CanvasLookupAdapter.ts';

export type CanvasRelatedItemsTab = 'tasks' | 'stories';

export type CanvasRelatedItem = {
  key: string;
  kind: 'task' | 'story';
  title: string;
  description?: string | null;
  fallbackMeta: string;
  payload: unknown;
};

export type CanvasRelatedItemsLoadResult = {
  title: string;
  availableTabs: CanvasRelatedItemsTab[];
  defaultTab: CanvasRelatedItemsTab;
  tasks: CanvasRelatedItem[];
  stories: CanvasRelatedItem[];
};

export type CanvasRelatedItemsLoadContext = {
  host: IPlanningElement;
  scene: Scene;
  lookupAdapter: CanvasLookupAdapter;
  runtime: AppRuntime;
};

export type CanvasRelatedItemsMutationContext = {
  host: IPlanningElement;
  scene: Scene;
  canvasManager: CanvasManager;
};

export interface CanvasRelatedItemsAdapter {
  isSupportedHost(element: ICanvasElement): element is IPlanningElement;
  loadRelatedItems(
    context: CanvasRelatedItemsLoadContext
  ): Promise<CanvasRelatedItemsLoadResult>;
  addItemToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      item: CanvasRelatedItem;
      index: number;
    }
  ): void;
  addAllToCanvas(
    context: CanvasRelatedItemsMutationContext & {
      tab: CanvasRelatedItemsTab;
      items: CanvasRelatedItem[];
    }
  ): void;
}
