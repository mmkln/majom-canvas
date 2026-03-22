import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import { PatchPlanningElementCommand } from '../commands/PatchPlanningElementCommand.ts';
import { ConnectionRelationType } from '../interfaces/connection.ts';
import { CanvasManager } from '../managers/CanvasManager.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { StoryLayoutService } from './StoryLayoutService.ts';
import { addTaskToStory } from '../../ui/storyTaskActions.ts';
import {
  emitStoryGoalLinkSet,
} from '../canvasLinkLifecycle.ts';
import type {
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
  WorkspaceChatRelationAction,
  WorkspaceChatUpdateAction,
} from '../../../shell/workspaceChatActions.ts';

type CanvasManagerLike = Pick<
  CanvasManager,
  'draw' | 'getCanvas' | 'getPanZoomManager'
>;

type ChatCanvasActionExecutorOptions = {
  scene: Scene;
  canvasManager: CanvasManagerLike;
  layoutService?: StoryLayoutService;
};

export class ChatCanvasActionExecutor {
  private readonly layoutService: StoryLayoutService;

  constructor(
    private readonly options: ChatCanvasActionExecutorOptions
  ) {
    this.layoutService = options.layoutService ?? new StoryLayoutService();
  }

  public async execute(
    request: WorkspaceChatActionExecutionRequest
  ): Promise<WorkspaceChatActionExecutionResult> {
    try {
      switch (request.action.kind) {
        case 'create_task':
          return this.applyCreateTask(request);
        case 'create_story':
          return this.applyCreateStory(request);
        case 'create_goal':
          return this.applyCreateGoal(request);
        case 'suggest_relation':
          return this.applySuggestRelation(request.action);
        case 'suggest_update':
          return this.applySuggestUpdate(request.action);
      }
    } catch (error) {
      return {
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Failed to create element.',
      };
    }
  }

  private applyCreateTask(
    request: WorkspaceChatActionExecutionRequest
  ): WorkspaceChatActionExecutionResult {
    const explicitStory =
      request.action.target?.kind === 'story'
        ? this.findStoryById(request.action.target.id)
        : null;
    const selectedStory = request.allowSelectionTargeting
      ? this.getSingleSelectedStory()
      : null;
    const story = explicitStory ?? selectedStory;

    if (request.action.target?.kind === 'story' && !story) {
      return {
        status: 'failed',
        errorMessage: 'Target story is unavailable.',
      };
    }

    const task = story
      ? addTaskToStory({
          story,
          scene: this.options.scene,
          canvasManager: this.options.canvasManager as CanvasManager,
          layoutService: this.layoutService,
          title: request.action.title,
          description: request.action.description ?? '',
          priority: request.action.priority,
          status: this.toElementStatus(request.action.elementStatus),
        })
      : this.createStandaloneTask(request);

    return {
      status: 'applied',
      createdElementId: task.id,
    };
  }

  private applySuggestRelation(
    action: WorkspaceChatRelationAction
  ): WorkspaceChatActionExecutionResult {
    const from = this.findPlanningElementById(action.fromId);
    const to = this.findPlanningElementById(action.toId);
    if (!from || !to) {
      return {
        status: 'failed',
        errorMessage: 'One of the suggested relation targets is unavailable.',
      };
    }

    const relationType = this.toConnectionRelationType(action.relationType);
    const alreadyExists = this.options.scene.getConnections().some(
      (connection) =>
        connection.fromId === from.id &&
        connection.toId === to.id &&
        connection.relationType === relationType
    );
    if (alreadyExists) {
      return {
        status: 'failed',
        errorMessage: 'This relation already exists on the canvas.',
      };
    }

    historyService.execute(
      new ConnectCommand(this.options.scene, from.id, to.id, relationType)
    );
    this.options.scene.setSelected([from, to]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [from.id, to.id],
    };
  }

  private applySuggestUpdate(
    action: WorkspaceChatUpdateAction
  ): WorkspaceChatActionExecutionResult {
    const element = this.findPlanningElementById(action.elementId);
    const matchesKind =
      (action.elementKind === 'goal' && element instanceof GoalElement) ||
      (action.elementKind === 'story' && element instanceof StoryElement) ||
      (action.elementKind === 'task' && element instanceof TaskElement);
    if (!element || !matchesKind) {
      return {
        status: 'failed',
        errorMessage: 'The suggested update target is unavailable.',
      };
    }

    const patch = {
      title: action.patch.title,
      description: action.patch.description,
      priority: action.patch.priority,
      status: this.toElementStatus(action.patch.elementStatus),
    };
    if (
      patch.title === undefined &&
      patch.description === undefined &&
      patch.priority === undefined &&
      patch.status === undefined
    ) {
      return {
        status: 'failed',
        errorMessage: 'The suggested update has no valid changes.',
      };
    }

    historyService.execute(
      new PatchPlanningElementCommand(this.options.scene, element, patch)
    );
    this.options.scene.setSelected([element]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [element.id],
    };
  }

  private applyCreateStory(
    request: WorkspaceChatActionExecutionRequest
  ): WorkspaceChatActionExecutionResult {
    const explicitGoal =
      request.action.target?.kind === 'goal'
        ? this.findGoalById(request.action.target.id)
        : null;
    const selectedGoal = request.allowSelectionTargeting
      ? this.getSingleSelectedGoal()
      : null;
    const goal = explicitGoal ?? selectedGoal;

    if (request.action.target?.kind === 'goal' && !goal) {
      return {
        status: 'failed',
        errorMessage: 'Target goal is unavailable.',
      };
    }

    const { x, y } = this.getViewportCenter();
    const story = new StoryElement({
      x: x - StoryElement.width / 2,
      y: y - StoryElement.height / 2,
      title: request.action.title,
      description: request.action.description ?? '',
      priority: request.action.priority ?? 'low',
      status: this.toElementStatus(request.action.elementStatus),
      goalBackendId:
        goal && Number.isFinite(goal.backendId) ? Number(goal.backendId) : null,
    });

    historyService.execute(new AddElementCommand(this.options.scene, story));
    if (goal) {
      historyService.execute(
        new ConnectCommand(
          this.options.scene,
          goal.id,
          story.id,
          ConnectionRelationType.ParentChild
        )
      );
      emitStoryGoalLinkSet(story, goal);
    }
    this.options.scene.setSelected([story]);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      createdElementId: story.id,
    };
  }

  private applyCreateGoal(
    request: WorkspaceChatActionExecutionRequest
  ): WorkspaceChatActionExecutionResult {
    const { x, y } = this.getViewportCenter();
    const goal = new GoalElement({
      x: x - GoalElement.width / 2,
      y: y - GoalElement.height / 2,
      title: request.action.title,
      description: request.action.description ?? '',
      priority: request.action.priority ?? 'low',
      status: this.toElementStatus(request.action.elementStatus),
    });

    historyService.execute(new AddElementCommand(this.options.scene, goal));
    this.options.scene.setSelected([goal]);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      createdElementId: goal.id,
    };
  }

  private createStandaloneTask(
    request: WorkspaceChatActionExecutionRequest
  ): TaskElement {
    const { x, y } = this.getViewportCenter();
    const task = new TaskElement({
      x: x - TaskElement.width / 2,
      y: y - TaskElement.height / 2,
      title: request.action.title,
      description: request.action.description ?? '',
      priority: request.action.priority ?? 'low',
      status: this.toElementStatus(request.action.elementStatus),
    });
    historyService.execute(new AddElementCommand(this.options.scene, task));
    this.options.scene.setSelected([task]);
    this.options.canvasManager.draw();
    return task;
  }

  private getViewportCenter(): { x: number; y: number } {
    const canvas = this.options.canvasManager.getCanvas();
    const panZoom = this.options.canvasManager.getPanZoomManager();
    return {
      x: (canvas.width / 2 + panZoom.scrollX) / panZoom.scale,
      y: (canvas.height / 2 + panZoom.scrollY) / panZoom.scale,
    };
  }

  private getSingleSelectedStory(): StoryElement | null {
    const selected = this.options.scene
      .getSelectedElements()
      .filter((element): element is StoryElement => element instanceof StoryElement);
    return selected.length === 1 ? selected[0] : null;
  }

  private getSingleSelectedGoal(): GoalElement | null {
    const selected = this.options.scene
      .getSelectedElements()
      .filter((element): element is GoalElement => element instanceof GoalElement);
    return selected.length === 1 ? selected[0] : null;
  }

  private findStoryById(id: string): StoryElement | null {
    return (
      this.options.scene
        .getElements()
        .find(
          (element): element is StoryElement =>
            element instanceof StoryElement && element.id === id
        ) ?? null
    );
  }

  private findGoalById(id: string): GoalElement | null {
    return (
      this.options.scene
        .getElements()
        .find(
          (element): element is GoalElement =>
            element instanceof GoalElement && element.id === id
        ) ?? null
    );
  }

  private findPlanningElementById(
    id: string
  ): GoalElement | StoryElement | TaskElement | null {
    return (
      this.options.scene
        .getElements()
        .find(
          (element): element is GoalElement | StoryElement | TaskElement =>
            (element instanceof GoalElement ||
              element instanceof StoryElement ||
              element instanceof TaskElement) &&
            element.id === id
        ) ?? null
    );
  }

  private toConnectionRelationType(
    value: WorkspaceChatRelationAction['relationType']
  ): ConnectionRelationType {
    switch (value) {
      case 'blocks':
        return ConnectionRelationType.Blocks;
      case 'leads_to':
        return ConnectionRelationType.LeadsTo;
      case 'relates_to':
      default:
        return ConnectionRelationType.RelatesTo;
    }
  }

  private toElementStatus(value: string | undefined): ElementStatus {
    switch (value) {
      case 'pending':
        return ElementStatus.Pending;
      case 'in-progress':
        return ElementStatus.InProgress;
      case 'done':
        return ElementStatus.Done;
      case 'defined':
      default:
        return ElementStatus.Defined;
    }
  }
}
