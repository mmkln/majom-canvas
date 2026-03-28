import { BulkActionsController } from '../../core/services/BulkActionsController.ts';
import { AddExistingTaskService } from '../../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../../core/services/AddExistingStoryService.ts';
import { ExistingTaskPicker } from '../../ui/components/ExistingTaskPicker.ts';
import { ExistingGoalPicker } from '../../ui/components/ExistingGoalPicker.ts';
import { ExistingStoryPicker } from '../../ui/components/ExistingStoryPicker.ts';
import { ContextMenu } from '../../ui/ContextMenu.ts';
import { SelectionActionMenu } from '../../ui/SelectionActionMenu.ts';
import { RelatedItemsPicker } from '../../ui/RelatedItemsPicker.ts';
import { StatusPicker } from '../../ui/StatusPicker.ts';
import { StoryQuickCreateAction } from '../../ui/StoryQuickCreateAction.ts';
import type {
  CanvasUiAdapter,
  CanvasUiAdapterContext,
  CanvasUiComponent,
} from '../CanvasUiAdapter.ts';
import type { ExistingPickerDragPayload } from '../../ui/events/existingPickerEvents.ts';

export class PlanningCanvasUiAdapter implements CanvasUiAdapter {
  private addExistingTaskService: AddExistingTaskService | null = null;
  private addExistingGoalService: AddExistingGoalService | null = null;
  private addExistingStoryService: AddExistingStoryService | null = null;

  public createComponents(
    context: CanvasUiAdapterContext
  ): CanvasUiComponent[] {
    this.addExistingTaskService = new AddExistingTaskService(
      context.scene,
      context.canvasManager
    );
    this.addExistingGoalService = new AddExistingGoalService(
      context.scene,
      context.canvasManager
    );
    this.addExistingStoryService = new AddExistingStoryService(
      context.scene,
      context.canvasManager
    );

    const existingTaskPicker = new ExistingTaskPicker(
      (term, page, pageSize) =>
        context.lookupAdapter.searchTasks(term, page, pageSize),
      30,
      context.runtime
    );
    const existingGoalPicker = new ExistingGoalPicker(
      (term, page, pageSize) =>
        context.lookupAdapter.searchGoals(term, page, pageSize),
      30,
      context.runtime
    );
    const existingStoryPicker = new ExistingStoryPicker(
      (term, page, pageSize) =>
        context.lookupAdapter.searchStories(term, page, pageSize),
      30,
      context.runtime
    );

    const contextMenu = new ContextMenu(
      context.scene,
      context.canvasManager,
      existingTaskPicker,
      existingGoalPicker,
      existingStoryPicker,
      this.addExistingTaskService,
      this.addExistingGoalService,
      this.addExistingStoryService,
      context.interactionAdapter,
      context.runtime
    );
    const bulkActions = new BulkActionsController(context.scene);
    const selectionActions = new SelectionActionMenu(
      context.scene,
      context.canvasManager,
      bulkActions,
      context.interactionAdapter,
      context.runtime
    );
    const relatedItemsPicker = new RelatedItemsPicker(
      context.scene,
      context.canvasManager,
      context.lookupAdapter,
      context.runtime
    );
    const statusPicker = new StatusPicker(
      context.scene,
      context.canvasManager,
      bulkActions
    );
    const storyQuickCreateAction = new StoryQuickCreateAction(
      context.scene,
      context.canvasManager,
      context.runtime
    );

    return [
      contextMenu,
      selectionActions,
      relatedItemsPicker,
      statusPicker,
      storyQuickCreateAction,
    ];
  }

  public handleExistingPickerDrop(
    payload: ExistingPickerDragPayload,
    position: { x: number; y: number }
  ): boolean {
    if (payload.kind === 'existing-goal' && this.addExistingGoalService) {
      this.addExistingGoalService.addOrFocus(payload.item, position.x, position.y);
      return true;
    }
    if (payload.kind === 'existing-task' && this.addExistingTaskService) {
      this.addExistingTaskService.addOrFocus(payload.item, position.x, position.y);
      return true;
    }
    if (payload.kind === 'existing-story' && this.addExistingStoryService) {
      this.addExistingStoryService.addOrFocus(payload.item, position.x, position.y);
      return true;
    }
    return false;
  }
}
