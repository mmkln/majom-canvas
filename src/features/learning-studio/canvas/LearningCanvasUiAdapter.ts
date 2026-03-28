import type {
  CanvasUiAdapter,
  CanvasUiAdapterContext,
  CanvasUiComponent,
  CanvasUiPreferences,
} from '../../canvas-core/adapters/CanvasUiAdapter.ts';
import { BulkActionsController } from '../../canvas-core/core/services/BulkActionsController.ts';
import { ContextMenu } from '../../canvas-core/ui/ContextMenu.ts';
import { SelectionActionMenu } from '../../canvas-core/ui/SelectionActionMenu.ts';
import type { LearningCanvasHostApi } from './LearningCanvasHostApi.ts';
import { LearningCanvasSelectionBridge } from './LearningCanvasSelectionBridge.ts';

const LEARNING_CANVAS_PREFERENCES: CanvasUiPreferences = {
  showBoardSelector: false,
  showNavigationDock: true,
  showSaveControls: false,
  showCanvasMenu: false,
};

export class LearningCanvasUiAdapter implements CanvasUiAdapter {
  constructor(private readonly hostApi: LearningCanvasHostApi) {}

  public getPreferences(): Partial<CanvasUiPreferences> {
    return LEARNING_CANVAS_PREFERENCES;
  }

  public createComponents(context: CanvasUiAdapterContext): CanvasUiComponent[] {
    const bulkActions = new BulkActionsController(context.scene);
    return [
      new LearningCanvasSelectionBridge(context.scene, this.hostApi),
      new ContextMenu(
        context.scene,
        context.canvasManager,
        null,
        null,
        null,
        null,
        null,
        null,
        context.interactionAdapter,
        context.runtime,
        {
          enableLegacyPlanningActions: false,
        }
      ),
      new SelectionActionMenu(
        context.scene,
        context.canvasManager,
        bulkActions,
        context.interactionAdapter,
        context.runtime,
        {
          enableLegacyPlanningActions: false,
        }
      ),
    ];
  }
}
