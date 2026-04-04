import { BulkActionsController } from '../../core/services/BulkActionsController.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { AddExistingTaskService } from '../../core/services/AddExistingTaskService.ts';
import { AddExistingGoalService } from '../../core/services/AddExistingGoalService.ts';
import { AddExistingStoryService } from '../../core/services/AddExistingStoryService.ts';
import { AddElementCommand } from '../../core/commands/AddElementCommand.ts';
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
import type {
  CanvasLegacyPlanningActionsAdapter,
  LegacyPlanningCreateContext,
} from '../CanvasLegacyPlanningActionsAdapter.ts';
import type { ExistingPickerDragPayload } from '../../ui/events/existingPickerEvents.ts';
import { PlanningCanvasRelatedItemsAdapter } from './PlanningCanvasRelatedItemsAdapter.ts';
import {
  CANVAS_QUICK_CREATE_TASK_REQUESTED_EVENT,
  type CanvasQuickCreateTaskRequestedDetail,
} from '../../ui/events/quickCreateEvents.ts';
import { addTaskToStory } from '../../ui/storyTaskActions.ts';
import { StoryLayoutService } from '../../core/services/StoryLayoutService.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';

class PlanningQuickCreateTaskBridge implements CanvasUiComponent {
  private readonly layoutService = new StoryLayoutService();
  private readonly handler = (event: Event): void => {
    const customEvent = event as CustomEvent<CanvasQuickCreateTaskRequestedDetail>;
    const element = customEvent.detail?.element ?? null;
    if (!(element instanceof StoryElement)) {
      return;
    }
    addTaskToStory({
      story: element,
      scene: this.context.scene,
      canvasManager: this.context.canvasManager,
      layoutService: this.layoutService,
    });
  };

  constructor(private readonly context: CanvasUiAdapterContext) {}

  public mount(): void {
    window.addEventListener(
      CANVAS_QUICK_CREATE_TASK_REQUESTED_EVENT,
      this.handler
    );
  }

  public unmount(): void {
    window.removeEventListener(
      CANVAS_QUICK_CREATE_TASK_REQUESTED_EVENT,
      this.handler
    );
  }
}

class PlanningLegacyActionsAdapter
  implements CanvasLegacyPlanningActionsAdapter
{
  private readonly layoutService = new StoryLayoutService();

  constructor(
    private readonly context: CanvasUiAdapterContext,
    private readonly existingTaskPicker: ExistingTaskPicker,
    private readonly existingGoalPicker: ExistingGoalPicker,
    private readonly existingStoryPicker: ExistingStoryPicker,
    private readonly addExistingTaskService: AddExistingTaskService,
    private readonly addExistingGoalService: AddExistingGoalService,
    private readonly addExistingStoryService: AddExistingStoryService
  ) {}

  public createElement(
    kind: 'goal' | 'story' | 'task',
    createContext: LegacyPlanningCreateContext
  ): void {
    const element =
      kind === 'goal'
        ? new GoalElement({
            x: createContext.sceneX - GoalElement.width / 2,
            y: createContext.sceneY - GoalElement.height / 2,
          })
        : kind === 'story'
          ? new StoryElement({
              x: createContext.sceneX - StoryElement.width / 2,
              y: createContext.sceneY - StoryElement.height / 2,
            })
          : new TaskElement({
              x: createContext.sceneX - TaskElement.width / 2,
              y: createContext.sceneY - TaskElement.height / 2,
            });
    historyService.execute(new AddElementCommand(createContext.scene, element));
    createContext.scene.setSelected([element]);
    createContext.canvasManager.draw();
  }

  public openExisting(
    kind: 'goal' | 'story' | 'task',
    createContext: LegacyPlanningCreateContext
  ): void {
    if (kind === 'goal') {
      this.existingGoalPicker.open({
        sceneX: createContext.sceneX,
        sceneY: createContext.sceneY,
        canvasChanges: this.context.scene.changes,
        isOnCanvas: (goal) => this.addExistingGoalService.isOnCanvas(goal),
        onPick: (goal, goalX, goalY) => {
          this.addExistingGoalService.addOrFocus(goal, goalX, goalY);
        },
      });
      return;
    }
    if (kind === 'story') {
      this.existingStoryPicker.open({
        sceneX: createContext.sceneX,
        sceneY: createContext.sceneY,
        canvasChanges: this.context.scene.changes,
        isOnCanvas: (story) => this.addExistingStoryService.isOnCanvas(story),
        onPick: (story, storyX, storyY) => {
          this.addExistingStoryService.addOrFocus(story, storyX, storyY);
        },
      });
      return;
    }
    this.existingTaskPicker.open({
      sceneX: createContext.sceneX,
      sceneY: createContext.sceneY,
      canvasChanges: this.context.scene.changes,
      isOnCanvas: (task) => this.addExistingTaskService.isOnCanvas(task),
      onPick: (task, taskX, taskY) => {
        this.addExistingTaskService.addOrFocus(task, taskX, taskY);
      },
    });
  }

  public createChild(context: {
    scene: CanvasUiAdapterContext['scene'];
    canvasManager: CanvasUiAdapterContext['canvasManager'];
    parent: IPlanningElement;
    childKind: 'goal' | 'story' | 'task';
  }): void {
    if (!(context.parent instanceof StoryElement) || context.childKind !== 'task') {
      return;
    }
    addTaskToStory({
      story: context.parent,
      scene: context.scene,
      canvasManager: context.canvasManager,
      layoutService: this.layoutService,
    });
  }

  public supportsRelatedItems(element: IPlanningElement): boolean {
    return element instanceof StoryElement || element instanceof GoalElement;
  }

  public openRelatedItems(element: IPlanningElement): void {
    window.dispatchEvent(
      new CustomEvent('relatedItemsPickerRequested', {
        detail: { element },
      })
    );
  }
}

export class PlanningCanvasUiAdapter implements CanvasUiAdapter {
  private addExistingTaskService: AddExistingTaskService | null = null;
  private addExistingGoalService: AddExistingGoalService | null = null;
  private addExistingStoryService: AddExistingStoryService | null = null;
  private readonly relatedItemsAdapter = new PlanningCanvasRelatedItemsAdapter();

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
    const legacyPlanningActions = new PlanningLegacyActionsAdapter(
      context,
      existingTaskPicker,
      existingGoalPicker,
      existingStoryPicker,
      this.addExistingTaskService,
      this.addExistingGoalService,
      this.addExistingStoryService
    );

    const contextMenu = new ContextMenu(
      context.scene,
      context.canvasManager,
      context.interactionAdapter,
      context.runtime,
      {
        legacyPlanningActionsAdapter: legacyPlanningActions,
      }
    );
    const bulkActions = new BulkActionsController(context.scene);
    const selectionActions = new SelectionActionMenu(
      context.scene,
      context.canvasManager,
      bulkActions,
      context.interactionAdapter,
      context.runtime,
      {
        relatedItemsAdapter: this.relatedItemsAdapter,
      }
    );
    const relatedItemsPicker = new RelatedItemsPicker(
      context.scene,
      context.canvasManager,
      context.lookupAdapter,
      context.runtime,
      {
        adapter: this.relatedItemsAdapter,
      }
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
      new PlanningQuickCreateTaskBridge(context),
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
