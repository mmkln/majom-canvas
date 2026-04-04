import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';
import { AddTasksToStoryCommand } from '../commands/AddTasksToStoryCommand.ts';
import { Command } from '../commands/Command.ts';
import { CompositeCommand } from '../commands/CompositeCommand.ts';
import { ConnectCommand } from '../commands/ConnectCommand.ts';
import { PatchPlanningElementCommand } from '../commands/PatchPlanningElementCommand.ts';
import { RemoveConnectionCommand } from '../commands/RemoveConnectionCommand.ts';
import { UpdateConnectionCommand } from '../commands/UpdateConnectionCommand.ts';
import {
  ConnectionRelationType,
  type IConnection,
} from '../interfaces/connection.ts';
import { CanvasManager } from '../managers/CanvasManager.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { GoalPlacementService } from './GoalPlacementService.ts';
import { StoryLayoutService } from './StoryLayoutService.ts';
import {
  ConnectionCreationService,
  type ConnectionCreationPlan,
} from './ConnectionCreationService.ts';
import { addTaskToStory } from '../../ui/storyTaskActions.ts';
import {
  type GoalLinkSnapshot,
  emitGoalLinkRemoved,
  emitGoalLinkSet,
  emitGoalLinkUpdated,
  emitStoryGoalLinkSet,
  isGoalLinkRelationType,
} from '../canvasLinkLifecycle.ts';
import { findConnectionForPair } from '../utils/connectionPairs.ts';
import type {
  AiAssistantActionExecutionRequest,
  AiAssistantActionExecutionResult,
  AiAssistantCreateAction,
  AiAssistantGoalBlueprintAction,
  AiAssistantRemoveRelationAction,
  AiAssistantRelationAction,
  AiAssistantRelationSuggestionType,
  AiAssistantUpdateAction,
  AiAssistantUpdateRelationAction,
} from '../../../ai-assistant/aiAssistantActions.ts';

type CanvasManagerLike = Pick<
  CanvasManager,
  'draw' | 'getCanvas' | 'getPanZoomManager'
>;

type AiAssistantCanvasActionExecutorOptions = {
  scene: Scene;
  canvasManager: CanvasManagerLike;
  layoutService?: StoryLayoutService;
};

type AiAssistantCreateTaskAction = AiAssistantCreateAction & {
  kind: 'create_task';
};

type AiAssistantCreateStoryAction = AiAssistantCreateAction & {
  kind: 'create_story';
};

type AiAssistantCreateGoalAction = AiAssistantCreateAction & {
  kind: 'create_goal';
};

type BatchEntry<TAction extends AiAssistantCreateAction> = {
  index: number;
  request: AiAssistantActionExecutionRequest;
  action: TAction;
};

type BatchRunResult = {
  results: Map<number, AiAssistantActionExecutionResult>;
};

type PlanningRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class AiAssistantCanvasActionExecutor {
  private readonly layoutService: StoryLayoutService;
  private readonly goalPlacementService: GoalPlacementService;
  private readonly connectionCreationService: ConnectionCreationService;

  constructor(
    private readonly options: AiAssistantCanvasActionExecutorOptions
  ) {
    this.layoutService = options.layoutService ?? new StoryLayoutService();
    this.goalPlacementService = new GoalPlacementService();
    this.connectionCreationService = new ConnectionCreationService(options.scene);
  }

  public execute(
    request: AiAssistantActionExecutionRequest
  ): Promise<AiAssistantActionExecutionResult> {
    try {
      return Promise.resolve(this.executeRequest(request));
    } catch (error) {
      return Promise.resolve({
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Failed to create element.',
      });
    }
  }

  public executeBatch(
    requests: AiAssistantActionExecutionRequest[]
  ): Promise<AiAssistantActionExecutionResult[]> {
    const historySnapshot = historyService.captureState();
    const selectionSnapshot = this.options.scene
      .getSelectedElements()
      .filter(isPlanningElement);
    try {
      const results = new Array<AiAssistantActionExecutionResult>(requests.length);
      let index = 0;
      while (index < requests.length) {
        const request = requests[index];
        if (!request) {
          index += 1;
          continue;
        }

        if (request.action.kind === 'create_task') {
          const nextIndex = this.findBatchRunEnd(requests, index, 'create_task');
          if (nextIndex - index > 1) {
            const runResult = this.applyCreateTaskBatch(
              requests.slice(index, nextIndex).map((batchRequest, offset) => ({
                index: index + offset,
                request: batchRequest,
                action: batchRequest.action as AiAssistantCreateTaskAction,
              }))
            );
            runResult.results.forEach((result, resultIndex) => {
              results[resultIndex] = result;
            });
            index = nextIndex;
            continue;
          }
        }

        if (request.action.kind === 'create_story') {
          const nextIndex = this.findBatchRunEnd(requests, index, 'create_story');
          if (nextIndex - index > 1) {
            const runResult = this.applyCreateStoryBatch(
              requests.slice(index, nextIndex).map((batchRequest, offset) => ({
                index: index + offset,
                request: batchRequest,
                action: batchRequest.action as AiAssistantCreateStoryAction,
              }))
            );
            runResult.results.forEach((result, resultIndex) => {
              results[resultIndex] = result;
            });
            index = nextIndex;
            continue;
          }
        }

        if (request.action.kind === 'create_goal') {
          const nextIndex = this.findBatchRunEnd(requests, index, 'create_goal');
          if (nextIndex - index > 1) {
            const runResult = this.applyCreateGoalBatch(
              requests.slice(index, nextIndex).map((batchRequest, offset) => ({
                index: index + offset,
                request: batchRequest,
                action: batchRequest.action as AiAssistantCreateGoalAction,
              }))
            );
            runResult.results.forEach((result, resultIndex) => {
              results[resultIndex] = result;
            });
            if ([...runResult.results.values()].some((result) => result.status === 'failed')) {
              this.rollbackBatchState(historySnapshot, selectionSnapshot);
              return results.map(
                () =>
                  ({
                    status: 'failed',
                    errorMessage: 'The batch was rolled back because one action failed.',
                  }) as AiAssistantActionExecutionResult
              );
            }
            index = nextIndex;
            continue;
          }
        }

        const result = this.executeRequest(request);
        results[index] = result;
        if (result.status === 'failed') {
          this.rollbackBatchState(historySnapshot, selectionSnapshot);
          return results.map(
            () =>
              ({
                status: 'failed',
                errorMessage:
                  result.errorMessage ?? 'The batch was rolled back because one action failed.',
              }) as AiAssistantActionExecutionResult
          );
        }
        index += 1;
      }

      return Promise.resolve(
        results.map(
          (result) =>
            result ?? {
              status: 'failed',
              errorMessage: 'Failed to create element.',
            }
        )
      );
    } catch (error) {
      this.rollbackBatchState(historySnapshot, selectionSnapshot);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create element.';
      return Promise.resolve(
        requests.map(() => ({
          status: 'failed' as const,
          errorMessage,
        }))
      );
    }
  }

  private executeRequest(
    request: AiAssistantActionExecutionRequest
  ): AiAssistantActionExecutionResult {
    switch (request.action.kind) {
      case 'create_task':
        return this.applyCreateTask(
          request.action as AiAssistantCreateTaskAction,
          request.allowSelectionTargeting
        );
      case 'create_story':
        return this.applyCreateStory(
          request.action as AiAssistantCreateStoryAction,
          request.allowSelectionTargeting
        );
      case 'create_goal':
        return this.applyCreateGoal(request.action as AiAssistantCreateGoalAction);
      case 'create_goal_blueprint':
        return this.applyCreateGoalBlueprint(request.action);
      case 'suggest_relation':
        return this.applySuggestRelation(request.action);
      case 'remove_relation':
        return this.applyRemoveRelation(request.action);
      case 'update_relation':
        return this.applyUpdateRelation(request.action);
      case 'suggest_update':
        return this.applySuggestUpdate(request.action);
    }
  }

  private applyCreateTask(
    action: AiAssistantCreateTaskAction,
    allowSelectionTargeting: boolean
  ): AiAssistantActionExecutionResult {
    const story = this.resolveStoryTarget(action, allowSelectionTargeting);

    if (action.target?.kind === 'story' && !story) {
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
          title: action.title,
          description: action.description ?? '',
          priority: action.priority,
          status: this.toElementStatus(action.elementStatus),
        })
      : this.createStandaloneTask(action);

    return {
      status: 'applied',
      createdElementId: task.id,
    };
  }

  private applyCreateTaskBatch(
    entries: BatchEntry<AiAssistantCreateTaskAction>[]
  ): BatchRunResult {
    const results = new Map<number, AiAssistantActionExecutionResult>();
    const commands: Command[] = [];
    const createdTasks: TaskElement[] = [];
    const standaloneEntries: BatchEntry<AiAssistantCreateTaskAction>[] = [];
    const groupedEntries = new Map<
      string,
      {
        story: StoryElement;
        entries: BatchEntry<AiAssistantCreateTaskAction>[];
      }
    >();

    entries.forEach((entry) => {
      const story = this.resolveStoryTarget(
        entry.action,
        entry.request.allowSelectionTargeting
      );
      if (entry.action.target?.kind === 'story' && !story) {
        results.set(entry.index, {
          status: 'failed',
          errorMessage: 'Target story is unavailable.',
        });
        return;
      }
      if (!story) {
        standaloneEntries.push(entry);
        return;
      }

      const existingGroup = groupedEntries.get(story.id);
      if (existingGroup) {
        existingGroup.entries.push(entry);
        return;
      }
      groupedEntries.set(story.id, {
        story,
        entries: [entry],
      });
    });

    if (standaloneEntries.length > 0) {
      const positions = this.planNonOverlappingPositions({
        origin: this.getCenteredTopLeft(TaskElement.width, TaskElement.height),
        width: TaskElement.width,
        height: TaskElement.height,
        gapX: 32,
        gapY: 32,
        count: standaloneEntries.length,
        occupied: this.getPlanningRects(),
      });
      const standaloneTasks = standaloneEntries.map((entry, index) => {
        const position = positions[index];
        const task = this.createTaskElement(
          entry.action,
          position?.x ?? 0,
          position?.y ?? 0
        );
        results.set(entry.index, {
          status: 'applied',
          createdElementId: task.id,
        });
        createdTasks.push(task);
        return task;
      });
      commands.push(new AddElementCommand(this.options.scene, standaloneTasks));
    }

    groupedEntries.forEach(({ story, entries: storyEntries }) => {
      const planningStory = new StoryElement({
        x: story.x,
        y: story.y,
        width: story.width,
        height: story.height,
        title: story.title,
        description: story.description,
        status: story.status,
        priority: story.priority,
        tasks: [...story.tasks],
        goalBackendId: story.goalBackendId,
      });
      const planningTasks = [
        ...this.options.scene
          .getElements()
          .filter((element): element is TaskElement => element instanceof TaskElement),
      ];
      const tasksToAdd: TaskElement[] = [];
      let nextHeight = story.height;

      storyEntries.forEach((entry) => {
        const task = this.createTaskElement(entry.action, 0, 0);
        const plan = this.layoutService.planAddTask(planningStory, planningTasks);
        task.x = plan.position.x;
        task.y = plan.position.y;
        planningStory.addTask(task);
        planningTasks.push(task);
        tasksToAdd.push(task);
        createdTasks.push(task);
        nextHeight = Math.max(nextHeight, plan.nextHeight);
        results.set(entry.index, {
          status: 'applied',
          createdElementId: task.id,
        });
      });

      commands.push(
        new AddTasksToStoryCommand(this.options.scene, story, tasksToAdd, nextHeight)
      );
    });

    if (commands.length > 0) {
      const command = commands.length === 1 ? commands[0] : new CompositeCommand(commands);
      if (command) {
        historyService.execute(command);
      }
      this.options.scene.setSelected(createdTasks);
      this.options.canvasManager.draw();
    }

    return { results };
  }

  private applyCreateStoryBatch(
    entries: BatchEntry<AiAssistantCreateStoryAction>[]
  ): BatchRunResult {
    const results = new Map<number, AiAssistantActionExecutionResult>();
    const commands: Command[] = [];
    const createdStories: StoryElement[] = [];
    const storyGoalLinks: Array<{ story: StoryElement; goal: GoalElement }> = [];
    const standaloneEntries: BatchEntry<AiAssistantCreateStoryAction>[] = [];
    const groupedEntries = new Map<
      string,
      {
        goal: GoalElement;
        entries: BatchEntry<AiAssistantCreateStoryAction>[];
      }
    >();

    entries.forEach((entry) => {
      const goal = this.resolveGoalTarget(
        entry.action,
        entry.request.allowSelectionTargeting
      );
      if (entry.action.target?.kind === 'goal' && !goal) {
        results.set(entry.index, {
          status: 'failed',
          errorMessage: 'Target goal is unavailable.',
        });
        return;
      }
      if (!goal) {
        standaloneEntries.push(entry);
        return;
      }

      const existingGroup = groupedEntries.get(goal.id);
      if (existingGroup) {
        existingGroup.entries.push(entry);
        return;
      }
      groupedEntries.set(goal.id, {
        goal,
        entries: [entry],
      });
    });

    const occupied = this.getPlanningRects();

    if (standaloneEntries.length > 0) {
      const positions = this.planNonOverlappingPositions({
        origin: this.getCenteredTopLeft(StoryElement.width, StoryElement.height),
        width: StoryElement.width,
        height: StoryElement.height,
        gapX: 48,
        gapY: 40,
        count: standaloneEntries.length,
        occupied,
      });
      const stories = standaloneEntries.map((entry, index) => {
        const position = positions[index];
        const story = this.createStoryElement(
          entry.action,
          position?.x ?? 0,
          position?.y ?? 0,
          null
        );
        createdStories.push(story);
        occupied.push(this.getRect(story));
        results.set(entry.index, {
          status: 'applied',
          createdElementId: story.id,
        });
        return story;
      });
      commands.push(new AddElementCommand(this.options.scene, stories));
    }

    groupedEntries.forEach(({ goal, entries: goalEntries }) => {
      const positions = this.planNonOverlappingPositions({
        origin: {
          x: goal.x + goal.width / 2 - StoryElement.width / 2,
          y: goal.y + goal.height + 32,
        },
        width: StoryElement.width,
        height: StoryElement.height,
        gapX: 48,
        gapY: 40,
        count: goalEntries.length,
        occupied,
        preferDownward: true,
      });
      const stories = goalEntries.map((entry, index) => {
        const position = positions[index];
        const story = this.createStoryElement(
          entry.action,
          position?.x ?? 0,
          position?.y ?? 0,
          goal
        );
        createdStories.push(story);
        occupied.push(this.getRect(story));
        storyGoalLinks.push({ story, goal });
        results.set(entry.index, {
          status: 'applied',
          createdElementId: story.id,
        });
        return story;
      });

      commands.push(new AddElementCommand(this.options.scene, stories));
      stories.forEach((story) => {
        commands.push(
          new ConnectCommand(
            this.options.scene,
            goal.id,
            story.id,
            ConnectionRelationType.ParentChild
          )
        );
      });
    });

    if (commands.length > 0) {
      const command = commands.length === 1 ? commands[0] : new CompositeCommand(commands);
      if (command) {
        historyService.execute(command);
      }
      storyGoalLinks.forEach(({ story, goal }) => {
        emitStoryGoalLinkSet(story, goal);
      });
      this.options.scene.setSelected(createdStories);
      this.options.canvasManager.draw();
    }

    return { results };
  }

  private applySuggestRelation(
    action: AiAssistantRelationAction
  ): AiAssistantActionExecutionResult {
    const from = this.findPlanningElementById(action.fromId);
    const to = this.findPlanningElementById(action.toId);
    if (!from || !to) {
      return {
        status: 'failed',
        errorMessage: 'One of the suggested relation targets is unavailable.',
      };
    }

    const relationType = this.toConnectionRelationType(action.relationType);
    const createResult = this.connectionCreationService.createWithRelationType(
      from,
      to,
      relationType
    );
    if (!createResult.ok) {
      if (createResult.reason === 'duplicate') {
        return {
          status: 'failed',
          errorMessage: 'This relation already exists on the canvas.',
        };
      }
      if (createResult.reason === 'pair-occupied') {
        const redirectResult =
          this.connectionCreationService.redirectWithRelationType(
            from,
            to,
            relationType
          );
        if (!redirectResult.ok) {
          return {
            status: 'failed',
            errorMessage:
              'These items already have a different relation on the canvas. Update or remove it instead.',
          };
        }
      } else if (createResult.reason === 'invalid-pair') {
        return {
          status: 'failed',
          errorMessage: 'This relation type is not valid for these items.',
        };
      } else {
        return {
          status: 'failed',
          errorMessage: 'This relation could not be created on the canvas.',
        };
      }
    }

    this.options.scene.setSelected([from, to]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [from.id, to.id],
    };
  }

  private applyRemoveRelation(
    action: AiAssistantRemoveRelationAction
  ): AiAssistantActionExecutionResult {
    const from = this.findPlanningElementById(action.fromId);
    const to = this.findPlanningElementById(action.toId);
    if (!from || !to) {
      return {
        status: 'failed',
        errorMessage: 'One of the relation targets is unavailable.',
      };
    }

    const relationType = this.toConnectionRelationType(action.relationType);
    const connection = this.findMatchingConnection(from.id, to.id, relationType);
    if (!connection) {
      return {
        status: 'failed',
        errorMessage: 'This relation is no longer available on the canvas.',
      };
    }

    historyService.execute(
      new RemoveConnectionCommand(this.options.scene, connection)
    );
    const goalLink = this.toGoalLinkSnapshot(connection);
    if (goalLink) {
      emitGoalLinkRemoved(goalLink);
    }
    this.options.scene.setSelected([from, to]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [from.id, to.id],
    };
  }

  private applyUpdateRelation(
    action: AiAssistantUpdateRelationAction
  ): AiAssistantActionExecutionResult {
    const from = this.findPlanningElementById(action.fromId);
    const to = this.findPlanningElementById(action.toId);
    if (!from || !to) {
      return {
        status: 'failed',
        errorMessage: 'One of the relation targets is unavailable.',
      };
    }

    const currentRelationType = this.toConnectionRelationType(
      action.currentRelationType
    );
    const nextRelationType = this.toConnectionRelationType(action.nextRelationType);
    if (currentRelationType === nextRelationType) {
      return {
        status: 'failed',
        errorMessage: 'The relation type is already set to the requested value.',
      };
    }

    const currentConnection = this.findMatchingConnection(
      from.id,
      to.id,
      currentRelationType
    );
    if (!currentConnection) {
      return {
        status: 'failed',
        errorMessage: 'This relation is no longer available on the canvas.',
      };
    }

    if (
      !this.connectionCreationService.canUseRelationType(
        from,
        to,
        nextRelationType
      )
    ) {
      return {
        status: 'failed',
        errorMessage: 'The requested relation type is not valid for these items.',
      };
    }

    const nextConnection = this.findMatchingConnection(
      from.id,
      to.id,
      nextRelationType
    );
    if (nextConnection && nextConnection.id !== currentConnection.id) {
      return {
        status: 'failed',
        errorMessage: 'A relation with the requested type already exists.',
      };
    }

    const currentGoalLink = this.toGoalLinkSnapshot(currentConnection);
    historyService.execute(
      new UpdateConnectionCommand(this.options.scene, currentConnection, {
        fromId: from.id,
        toId: to.id,
        relationType: nextRelationType,
      })
    );
    const nextGoalLink = this.toGoalLinkSnapshot(currentConnection, {
      relationType: nextRelationType,
    });
    if (currentGoalLink && nextGoalLink) {
      emitGoalLinkUpdated(currentGoalLink, nextGoalLink);
    }
    this.options.scene.setSelected([from, to]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [from.id, to.id],
    };
  }

  private applySuggestUpdate(
    action: AiAssistantUpdateAction
  ): AiAssistantActionExecutionResult {
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
    action: AiAssistantCreateStoryAction,
    allowSelectionTargeting: boolean
  ): AiAssistantActionExecutionResult {
    const goal = this.resolveGoalTarget(action, allowSelectionTargeting);

    if (action.target?.kind === 'goal' && !goal) {
      return {
        status: 'failed',
        errorMessage: 'Target goal is unavailable.',
      };
    }

    const position = this.getCenteredTopLeft(StoryElement.width, StoryElement.height);
    const story = this.createStoryElement(action, position.x, position.y, goal);

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
    action: AiAssistantCreateGoalAction
  ): AiAssistantActionExecutionResult {
    const parentGoal =
      action.target?.kind === 'goal'
        ? this.findGoalById(action.target.id)
        : null;
    if (action.target?.kind === 'goal' && !parentGoal) {
      return {
        status: 'failed',
        errorMessage: 'Target goal is unavailable.',
      };
    }

    const preferredCenter = parentGoal
      ? {
          x: parentGoal.x + parentGoal.width / 2,
          y: parentGoal.y + parentGoal.height + GoalElement.height + 72,
        }
      : this.getViewportCenter();
    const position = this.goalPlacementService.planGoalPosition({
      preferredCenter,
      occupiedRects: this.getPlanningRects(),
      preferDownward: Boolean(parentGoal),
    });
    const goal = new GoalElement({
      x: position.x - GoalElement.width / 2,
      y: position.y - GoalElement.height / 2,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
    });

    const commands: Command[] = [new AddElementCommand(this.options.scene, goal)];
    const parentLinkPlan = parentGoal
      ? this.connectionCreationService.plan(parentGoal, goal)
      : null;
    if (parentLinkPlan && !parentLinkPlan.ok) {
      return {
        status: 'failed',
        errorMessage: 'The new goal could not be linked to the target goal.',
      };
    }
    if (parentGoal) {
      commands.push(this.buildConnectCommand(parentLinkPlan.plan));
    }
    historyService.execute(new CompositeCommand(commands));
    if (parentLinkPlan?.ok) {
      this.emitGoalLinkSetForPlan(parentLinkPlan.plan);
    }
    this.options.scene.setSelected([goal]);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      createdElementId: goal.id,
    };
  }

  private applyCreateGoalBatch(
    entries: BatchEntry<AiAssistantCreateGoalAction>[]
  ): BatchRunResult {
    const results = new Map<number, AiAssistantActionExecutionResult>();
    const commands: Command[] = [];
    const createdGoals: GoalElement[] = [];
    const createdGoalLinkPlans: Array<ConnectionCreationPlan | null> = [];
    const occupied = this.getPlanningRects();
    const resolvedTargets: Array<GoalElement | null> = [];

    entries.forEach((entry) => {
      const targetGoal = this.resolveGoalTarget(
        entry.action,
        entry.request.allowSelectionTargeting
      );
      if (entry.action.target?.kind === 'goal' && !targetGoal) {
        resolvedTargets.push(null);
        return;
      }
      resolvedTargets.push(targetGoal);
    });

    if (
      entries.some(
        (entry, index) =>
          entry.action.target?.kind === 'goal' && resolvedTargets[index] === null
      )
    ) {
      entries.forEach((entry) => {
        results.set(entry.index, {
          status: 'failed',
          errorMessage: 'Target goal is unavailable.',
        });
      });
      return { results };
    }

    entries.forEach((entry, index) => {
      const parentGoal = resolvedTargets[index] ?? null;
      const preferredCenter = parentGoal
        ? {
            x: parentGoal.x + parentGoal.width / 2,
            y: parentGoal.y + parentGoal.height + GoalElement.height + 72,
          }
        : this.getViewportCenter();
      const position = this.goalPlacementService.planGoalPosition({
        preferredCenter,
        occupiedRects: occupied,
        preferDownward: Boolean(parentGoal),
      });
      const goal = new GoalElement({
        x: position.x - GoalElement.width / 2,
        y: position.y - GoalElement.height / 2,
        title: entry.action.title,
        description: entry.action.description ?? '',
        priority: entry.action.priority ?? 'low',
        status: this.toElementStatus(entry.action.elementStatus),
      });
      const parentLinkPlan = parentGoal
        ? this.connectionCreationService.plan(parentGoal, goal)
        : null;
      if (parentLinkPlan && !parentLinkPlan.ok) {
        createdGoalLinkPlans.push(null);
        results.set(entry.index, {
          status: 'failed',
          errorMessage: 'The new goal could not be linked to the target goal.',
        });
        return;
      }
      createdGoals.push(goal);
      createdGoalLinkPlans.push(parentLinkPlan?.ok ? parentLinkPlan.plan : null);
      occupied.push(this.getRect(goal));
      commands.push(new AddElementCommand(this.options.scene, goal));
      if (parentGoal) {
        commands.push(this.buildConnectCommand(parentLinkPlan.plan));
      }
      results.set(entry.index, {
        status: 'applied',
        createdElementId: goal.id,
      });
    });

    if (commands.length > 0) {
      const command = commands.length === 1 ? commands[0] : new CompositeCommand(commands);
      if (command) {
        historyService.execute(command);
      }
      createdGoalLinkPlans.forEach((plan) => {
        if (!plan) {
          return;
        }
        this.emitGoalLinkSetForPlan(plan);
      });
      this.options.scene.setSelected(createdGoals);
      this.options.canvasManager.draw();
    }

    return { results };
  }

  private applyCreateGoalBlueprint(
    action: AiAssistantGoalBlueprintAction
  ): AiAssistantActionExecutionResult {
    if (action.goals.length === 0) {
      return {
        status: 'failed',
        errorMessage: 'The strategic plan has no goals to create.',
      };
    }

    const targetGoal =
      action.target?.kind === 'goal'
        ? this.findGoalById(action.target.id)
        : null;
    if (action.target?.kind === 'goal' && !targetGoal) {
      return {
        status: 'failed',
        errorMessage: 'Target goal is unavailable.',
      };
    }

    const preferredCenter = targetGoal
      ? {
          x: targetGoal.x + targetGoal.width / 2,
          y: targetGoal.y + targetGoal.height + GoalElement.height + 96,
        }
      : this.getViewportCenter();
    const positions = this.goalPlacementService.planBlueprintPositions(action, {
      occupiedRects: this.getPlanningRects(),
      preferredCenter,
      preferDownward: Boolean(targetGoal),
    });
    const createdGoals = action.goals.map((goalDefinition) => {
      const position = positions.get(goalDefinition.ref) ?? this.getViewportCenter();
      return new GoalElement({
        x: position.x - GoalElement.width / 2,
        y: position.y - GoalElement.height / 2,
        title: goalDefinition.title,
        description: goalDefinition.description ?? '',
        priority: goalDefinition.priority ?? 'low',
        status: this.toElementStatus(goalDefinition.elementStatus),
      });
    });

    const goalByRef = new Map(
      action.goals.map((goalDefinition, index) => [
        goalDefinition.ref,
        createdGoals[index],
      ])
    );
    const goalLinkPlans: ConnectionCreationPlan[] = [];

    const commands: Command[] = [
      new AddElementCommand(this.options.scene, createdGoals),
    ];
    if (targetGoal) {
      action.goals.forEach((goalDefinition) => {
        if (goalDefinition.parentRef) {
          return;
        }
        const rootGoal = goalByRef.get(goalDefinition.ref);
        if (!rootGoal) {
          return;
        }
        const targetLinkPlan = this.connectionCreationService.plan(
          targetGoal,
          rootGoal
        );
        if (!targetLinkPlan.ok) {
          throw new Error('The blueprint root could not be linked to the target goal.');
        }
        commands.push(this.buildConnectCommand(targetLinkPlan.plan));
        goalLinkPlans.push(targetLinkPlan.plan);
      });
    }
    action.goals.forEach((goalDefinition) => {
      if (!goalDefinition.parentRef) {
        return;
      }
      const parentGoal = goalByRef.get(goalDefinition.parentRef);
      const childGoal = goalByRef.get(goalDefinition.ref);
      if (!parentGoal || !childGoal) {
        return;
      }
      const hierarchyPlan = this.connectionCreationService.plan(
        parentGoal,
        childGoal
      );
      if (!hierarchyPlan.ok) {
        throw new Error('The blueprint hierarchy could not be created on the canvas.');
      }
      commands.push(this.buildConnectCommand(hierarchyPlan.plan));
      goalLinkPlans.push(hierarchyPlan.plan);
    });
    action.relations.forEach((relation) => {
      const fromGoal = goalByRef.get(relation.fromRef);
      const toGoal = goalByRef.get(relation.toRef);
      if (!fromGoal || !toGoal) {
        return;
      }
      const relationPlan = this.connectionCreationService.planWithRelationType(
        fromGoal,
        toGoal,
        ConnectionRelationType.LeadsTo
      );
      if (!relationPlan.ok) {
        throw new Error('The blueprint relation could not be created on the canvas.');
      }
      commands.push(this.buildConnectCommand(relationPlan.plan));
      goalLinkPlans.push(relationPlan.plan);
    });

    historyService.execute(new CompositeCommand(commands));
    goalLinkPlans.forEach((plan) => {
      this.emitGoalLinkSetForPlan(plan);
    });
    this.options.scene.setSelected(createdGoals);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      affectedElementIds: createdGoals.map((goal) => goal.id),
    };
  }

  private createStandaloneTask(
    action: AiAssistantCreateTaskAction
  ): TaskElement {
    const position = this.getCenteredTopLeft(TaskElement.width, TaskElement.height);
    const task = this.createTaskElement(action, position.x, position.y);
    historyService.execute(new AddElementCommand(this.options.scene, task));
    this.options.scene.setSelected([task]);
    this.options.canvasManager.draw();
    return task;
  }

  private findBatchRunEnd(
    requests: AiAssistantActionExecutionRequest[],
    startIndex: number,
    kind: 'create_task' | 'create_story' | 'create_goal'
  ): number {
    let index = startIndex;
    while (requests[index]?.action.kind === kind) {
      index += 1;
    }
    return index;
  }

  private buildConnectCommand(plan: {
    fromRef: string;
    toRef: string;
    relationType: ConnectionRelationType;
  }): ConnectCommand {
    return new ConnectCommand(
      this.options.scene,
      plan.fromRef,
      plan.toRef,
      plan.relationType
    );
  }

  private emitGoalLinkSetForPlan(plan: {
    from: GoalElement | StoryElement | TaskElement;
    to: GoalElement | StoryElement | TaskElement;
    fromRef: string;
    toRef: string;
    relationType: ConnectionRelationType;
  }): void {
    if (
      !(plan.from instanceof GoalElement) ||
      !(plan.to instanceof GoalElement) ||
      !isGoalLinkRelationType(plan.relationType)
    ) {
      return;
    }
    const connection = this.findConnectionByRefsAndType(
      plan.fromRef,
      plan.toRef,
      plan.relationType
    );
    if (!connection) {
      return;
    }
    emitGoalLinkSet({
      connectionId: connection.id,
      lineType: connection.lineType,
      fromGoalRef: plan.fromRef,
      toGoalRef: plan.toRef,
      fromGoalUuid: plan.from.uuid ?? null,
      toGoalUuid: plan.to.uuid ?? null,
      relationType: plan.relationType,
    });
  }

  private toGoalLinkSnapshot(
    connection: IConnection,
    override?: {
      fromGoal: GoalElement | null;
      toGoal: GoalElement | null;
      relationType?: ConnectionRelationType;
    }
  ) {
    const relationType = override?.relationType ?? connection.relationType;
    if (!isGoalLinkRelationType(relationType)) {
      return null;
    }
    const fromGoal =
      override?.fromGoal ??
      this.findPlanningElementById(connection.fromId);
    const toGoal =
      override?.toGoal ??
      this.findPlanningElementById(connection.toId);
    if (!(fromGoal instanceof GoalElement) || !(toGoal instanceof GoalElement)) {
      return null;
    }
    return {
      connectionId: connection.id,
      lineType: connection.lineType,
      fromGoalRef: connection.fromId,
      toGoalRef: connection.toId,
      fromGoalUuid: fromGoal.uuid ?? null,
      toGoalUuid: toGoal.uuid ?? null,
      relationType,
    } satisfies GoalLinkSnapshot;
  }

  private createTaskElement(
    action: AiAssistantCreateTaskAction,
    x: number,
    y: number
  ): TaskElement {
    return new TaskElement({
      x,
      y,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
    });
  }

  private createStoryElement(
    action: AiAssistantCreateStoryAction,
    x: number,
    y: number,
    goal: GoalElement | null
  ): StoryElement {
    return new StoryElement({
      x,
      y,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
      goalBackendId:
        goal && Number.isFinite(goal.backendId) ? Number(goal.backendId) : null,
    });
  }

  private resolveStoryTarget(
    action: AiAssistantCreateTaskAction,
    allowSelectionTargeting: boolean
  ): StoryElement | null {
    const explicitStory =
      action.target?.kind === 'story'
        ? this.findStoryById(action.target.id)
        : null;
    const selectedStory = allowSelectionTargeting
      ? this.getSingleSelectedStory()
      : null;
    return explicitStory ?? selectedStory;
  }

  private resolveGoalTarget(
    action: AiAssistantCreateStoryAction,
    allowSelectionTargeting: boolean
  ): GoalElement | null {
    const explicitGoal =
      action.target?.kind === 'goal'
        ? this.findGoalById(action.target.id)
        : null;
    const selectedGoal = allowSelectionTargeting
      ? this.getSingleSelectedGoal()
      : null;
    return explicitGoal ?? selectedGoal;
  }

  private getPlanningRects(): PlanningRect[] {
    return this.options.scene
      .getElements()
      .filter(
        (
          element
        ): element is GoalElement | StoryElement | TaskElement =>
          element instanceof GoalElement ||
          element instanceof StoryElement ||
          element instanceof TaskElement
      )
      .map((element) => this.getRect(element));
  }

  private getRect(
    element:
      | GoalElement
      | StoryElement
      | TaskElement
      | PlanningRect
      | { x: number; y: number; width: number; height: number }
  ): PlanningRect {
    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    };
  }

  private getCenteredTopLeft(
    width: number,
    height: number
  ): { x: number; y: number } {
    const center = this.getViewportCenter();
    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
    };
  }

  private planNonOverlappingPositions(options: {
    origin: { x: number; y: number };
    width: number;
    height: number;
    gapX: number;
    gapY: number;
    count: number;
    occupied: PlanningRect[];
    preferDownward?: boolean;
  }): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const occupied = [...options.occupied];
    let ring = 0;
    while (positions.length < options.count) {
      const offsets = this.getPlacementOffsets(ring, options.preferDownward);
      for (const offset of offsets) {
        const position = {
          x: options.origin.x + offset.col * (options.width + options.gapX),
          y: options.origin.y + offset.row * (options.height + options.gapY),
        };
        const rect = {
          x: position.x,
          y: position.y,
          width: options.width,
          height: options.height,
        };
        if (this.intersectsAny(rect, occupied)) {
          continue;
        }
        positions.push(position);
        occupied.push(rect);
        if (positions.length === options.count) {
          break;
        }
      }
      ring += 1;
    }
    return positions;
  }

  private getPlacementOffsets(
    ring: number,
    preferDownward: boolean = false
  ): Array<{ col: number; row: number }> {
    if (ring === 0) {
      return [{ col: 0, row: 0 }];
    }

    const offsets: Array<{ col: number; row: number }> = [];
    for (let row = -ring; row <= ring; row += 1) {
      for (let col = -ring; col <= ring; col += 1) {
        if (Math.max(Math.abs(col), Math.abs(row)) !== ring) {
          continue;
        }
        offsets.push({ col, row });
      }
    }

    offsets.sort((left, right) => {
      if (preferDownward) {
        const leftPriority = left.row < 0 ? 1 : 0;
        const rightPriority = right.row < 0 ? 1 : 0;
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        if (left.row !== right.row) {
          return left.row - right.row;
        }
      } else {
        const leftDistance = Math.abs(left.row) + Math.abs(left.col);
        const rightDistance = Math.abs(right.row) + Math.abs(right.col);
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
      }
      if (Math.abs(left.col) !== Math.abs(right.col)) {
        return Math.abs(left.col) - Math.abs(right.col);
      }
      return left.col - right.col;
    });

    return offsets;
  }

  private intersectsAny(candidate: PlanningRect, occupied: PlanningRect[]): boolean {
    return occupied.some((rect) => this.intersects(candidate, rect));
  }

  private getViewportCenter(): { x: number; y: number } {
    const canvas = this.options.canvasManager.getCanvas();
    const panZoom = this.options.canvasManager.getPanZoomManager();
    return {
      x: (canvas.width / 2 + panZoom.scrollX) / panZoom.scale,
      y: (canvas.height / 2 + panZoom.scrollY) / panZoom.scale,
    };
  }

  private rollbackBatchState(
    snapshot: ReturnType<typeof historyService.captureState>,
    selectedElements: Array<GoalElement | StoryElement | TaskElement>
  ): void {
    const snapshotToken = {
      branchId: snapshot.branchId,
      index: snapshot.undoStack.filter((command) =>
        command.affectsUnsavedChanges()
      ).length,
    };
    while (!historyService.isTokenCurrent(snapshotToken) && historyService.canUndo()) {
      historyService.undo();
    }
    historyService.restoreState(snapshot);
    this.options.scene.setSelected(selectedElements);
    this.options.canvasManager.draw();
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
    value: AiAssistantRelationSuggestionType
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

  private findMatchingConnection(
    fromId: string,
    toId: string,
    relationType: ConnectionRelationType
  ): IConnection | null {
    return this.findMatchingConnectionResult(fromId, toId, relationType)?.connection ?? null;
  }

  private findMatchingConnectionResult(
    fromId: string,
    toId: string,
    relationType: ConnectionRelationType
  ): { connection: IConnection; reversed: boolean } | null {
    return findConnectionForPair(
      this.options.scene
        .getConnections()
        .filter((connection) => connection.relationType === relationType),
      fromId,
      toId
    );
  }

  private findConnectionByRefsAndType(
    fromRef: string,
    toRef: string,
    relationType: ConnectionRelationType
  ): IConnection | null {
    const match = findConnectionForPair(
      this.options.scene
        .getConnections()
        .filter((connection) => connection.relationType === relationType),
      fromRef,
      toRef
    );
    if (!match) {
      return null;
    }
    if (
      relationType !== ConnectionRelationType.RelatesTo &&
      (match.connection.fromId !== fromRef || match.connection.toId !== toRef)
    ) {
      return null;
    }
    return match.connection;
  }

  private intersects(a: PlanningRect, b: PlanningRect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
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
