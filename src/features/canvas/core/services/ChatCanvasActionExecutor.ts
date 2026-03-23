import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';
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
import { StoryLayoutService } from './StoryLayoutService.ts';
import { addTaskToStory } from '../../ui/storyTaskActions.ts';
import {
  emitStoryGoalLinkSet,
} from '../canvasLinkLifecycle.ts';
import type {
  WorkspaceChatActionExecutionRequest,
  WorkspaceChatActionExecutionResult,
  WorkspaceChatCreateAction,
  WorkspaceChatGoalBlueprintAction,
  WorkspaceChatRemoveRelationAction,
  WorkspaceChatRelationAction,
  WorkspaceChatRelationSuggestionType,
  WorkspaceChatUpdateAction,
  WorkspaceChatUpdateRelationAction,
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

type WorkspaceChatCreateTaskAction = WorkspaceChatCreateAction & {
  kind: 'create_task';
};

type WorkspaceChatCreateStoryAction = WorkspaceChatCreateAction & {
  kind: 'create_story';
};

type WorkspaceChatCreateGoalAction = WorkspaceChatCreateAction & {
  kind: 'create_goal';
};

export class ChatCanvasActionExecutor {
  private readonly layoutService: StoryLayoutService;

  constructor(
    private readonly options: ChatCanvasActionExecutorOptions
  ) {
    this.layoutService = options.layoutService ?? new StoryLayoutService();
  }

  public execute(
    request: WorkspaceChatActionExecutionRequest
  ): Promise<WorkspaceChatActionExecutionResult> {
    try {
      switch (request.action.kind) {
        case 'create_task':
          return Promise.resolve(
            this.applyCreateTask(
              request.action as WorkspaceChatCreateTaskAction,
              request.allowSelectionTargeting
            )
          );
        case 'create_story':
          return Promise.resolve(
            this.applyCreateStory(
              request.action as WorkspaceChatCreateStoryAction,
              request.allowSelectionTargeting
            )
          );
        case 'create_goal':
          return Promise.resolve(
            this.applyCreateGoal(request.action as WorkspaceChatCreateGoalAction)
          );
        case 'create_goal_blueprint':
          return Promise.resolve(this.applyCreateGoalBlueprint(request.action));
        case 'suggest_relation':
          return Promise.resolve(this.applySuggestRelation(request.action));
        case 'remove_relation':
          return Promise.resolve(this.applyRemoveRelation(request.action));
        case 'update_relation':
          return Promise.resolve(this.applyUpdateRelation(request.action));
        case 'suggest_update':
          return Promise.resolve(this.applySuggestUpdate(request.action));
      }
    } catch (error) {
      return Promise.resolve({
        status: 'failed',
        errorMessage:
          error instanceof Error ? error.message : 'Failed to create element.',
      });
    }
  }

  private applyCreateTask(
    action: WorkspaceChatCreateTaskAction,
    allowSelectionTargeting: boolean
  ): WorkspaceChatActionExecutionResult {
    const explicitStory =
      action.target?.kind === 'story'
        ? this.findStoryById(action.target.id)
        : null;
    const selectedStory = allowSelectionTargeting
      ? this.getSingleSelectedStory()
      : null;
    const story = explicitStory ?? selectedStory;

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
    const existingConnection = this.findMatchingConnection(
      from.id,
      to.id,
      relationType
    );
    if (existingConnection) {
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

  private applyRemoveRelation(
    action: WorkspaceChatRemoveRelationAction
  ): WorkspaceChatActionExecutionResult {
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
    this.options.scene.setSelected([from, to]);
    this.options.canvasManager.draw();
    return {
      status: 'applied',
      affectedElementIds: [from.id, to.id],
    };
  }

  private applyUpdateRelation(
    action: WorkspaceChatUpdateRelationAction
  ): WorkspaceChatActionExecutionResult {
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

    historyService.execute(
      new UpdateConnectionCommand(this.options.scene, currentConnection, {
        fromId: from.id,
        toId: to.id,
        relationType: nextRelationType,
      })
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
    action: WorkspaceChatCreateStoryAction,
    allowSelectionTargeting: boolean
  ): WorkspaceChatActionExecutionResult {
    const explicitGoal =
      action.target?.kind === 'goal'
        ? this.findGoalById(action.target.id)
        : null;
    const selectedGoal = allowSelectionTargeting
      ? this.getSingleSelectedGoal()
      : null;
    const goal = explicitGoal ?? selectedGoal;

    if (action.target?.kind === 'goal' && !goal) {
      return {
        status: 'failed',
        errorMessage: 'Target goal is unavailable.',
      };
    }

    const { x, y } = this.getViewportCenter();
    const story = new StoryElement({
      x: x - StoryElement.width / 2,
      y: y - StoryElement.height / 2,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
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
    action: WorkspaceChatCreateGoalAction
  ): WorkspaceChatActionExecutionResult {
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

    const { x, y } = this.getViewportCenter();
    const goal = new GoalElement({
      x: x - GoalElement.width / 2,
      y: y - GoalElement.height / 2,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
    });

    const commands: Command[] = [new AddElementCommand(this.options.scene, goal)];
    if (parentGoal) {
      commands.push(
        new ConnectCommand(
          this.options.scene,
          parentGoal.id,
          goal.id,
          ConnectionRelationType.ParentChild
        )
      );
    }
    historyService.execute(new CompositeCommand(commands));
    this.options.scene.setSelected([goal]);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      createdElementId: goal.id,
    };
  }

  private applyCreateGoalBlueprint(
    action: WorkspaceChatGoalBlueprintAction
  ): WorkspaceChatActionExecutionResult {
    if (action.goals.length === 0) {
      return {
        status: 'failed',
        errorMessage: 'The strategic plan has no goals to create.',
      };
    }

    const positions = this.buildGoalBlueprintPositions(action);
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
        commands.push(
          new ConnectCommand(
            this.options.scene,
            targetGoal.id,
            rootGoal.id,
            ConnectionRelationType.ParentChild
          )
        );
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
      commands.push(
        new ConnectCommand(
          this.options.scene,
          parentGoal.id,
          childGoal.id,
          ConnectionRelationType.ParentChild
        )
      );
    });
    action.relations.forEach((relation) => {
      const fromGoal = goalByRef.get(relation.fromRef);
      const toGoal = goalByRef.get(relation.toRef);
      if (!fromGoal || !toGoal) {
        return;
      }
      commands.push(
        new ConnectCommand(
          this.options.scene,
          fromGoal.id,
          toGoal.id,
          ConnectionRelationType.LeadsTo
        )
      );
    });

    historyService.execute(new CompositeCommand(commands));
    this.options.scene.setSelected(createdGoals);
    this.options.canvasManager.draw();

    return {
      status: 'applied',
      affectedElementIds: createdGoals.map((goal) => goal.id),
    };
  }

  private createStandaloneTask(
    action: WorkspaceChatCreateTaskAction
  ): TaskElement {
    const { x, y } = this.getViewportCenter();
    const task = new TaskElement({
      x: x - TaskElement.width / 2,
      y: y - TaskElement.height / 2,
      title: action.title,
      description: action.description ?? '',
      priority: action.priority ?? 'low',
      status: this.toElementStatus(action.elementStatus),
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

  private buildGoalBlueprintPositions(
    action: WorkspaceChatGoalBlueprintAction
  ): Map<string, { x: number; y: number }> {
    return action.pattern === 'goal_graph'
      ? this.buildGoalGraphPositions(action)
      : this.buildGoalTreePositions(action);
  }

  private buildGoalGraphPositions(
    action: WorkspaceChatGoalBlueprintAction
  ): Map<string, { x: number; y: number }> {
    const center = this.getViewportCenter();
    const positions = new Map<string, { x: number; y: number }>();
    const columnCount = Math.max(2, Math.ceil(Math.sqrt(action.goals.length)));
    const horizontalGap = GoalElement.width + 96;
    const verticalGap = GoalElement.height + 120;
    const rowCount = Math.ceil(action.goals.length / columnCount);

    action.goals.forEach((goal, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const x =
        center.x + (column - (columnCount - 1) / 2) * horizontalGap;
      const y = center.y + (row - (rowCount - 1) / 2) * verticalGap;
      positions.set(goal.ref, { x, y });
    });

    return positions;
  }

  private buildGoalTreePositions(
    action: WorkspaceChatGoalBlueprintAction
  ): Map<string, { x: number; y: number }> {
    const center = this.getViewportCenter();
    const childrenByParent = new Map<
      string | null,
      WorkspaceChatGoalBlueprintAction['goals']
    >();
    action.goals.forEach((goal) => {
      const key = goal.parentRef ?? null;
      const bucket = childrenByParent.get(key) ?? [];
      bucket.push(goal);
      childrenByParent.set(key, bucket);
    });

    const leafCounts = new Map<string, number>();
    const depthByRef = new Map<string, number>();
    const countLeaves = (ref: string): number => {
      const cached = leafCounts.get(ref);
      if (typeof cached === 'number') {
        return cached;
      }
      const children = childrenByParent.get(ref) ?? [];
      const count =
        children.length === 0
          ? 1
          : children.reduce((total, child) => total + countLeaves(child.ref), 0);
      leafCounts.set(ref, count);
      return count;
    };
    const collectDepth = (ref: string, depth: number): number => {
      depthByRef.set(ref, depth);
      const children = childrenByParent.get(ref) ?? [];
      if (children.length === 0) {
        return depth;
      }
      return children.reduce((maxDepth, child) => {
        return Math.max(maxDepth, collectDepth(child.ref, depth + 1));
      }, depth);
    };

    const roots = childrenByParent.get(null) ?? action.goals.slice(0, 1);
    const totalLeaves = Math.max(
      1,
      roots.reduce((total, root) => total + countLeaves(root.ref), 0)
    );
    const maxDepth = roots.reduce((depth, root) => {
      return Math.max(depth, collectDepth(root.ref, 0));
    }, 0);

    const horizontalGap = GoalElement.width + 96;
    const verticalGap = GoalElement.height + 120;
    const positions = new Map<string, { x: number; y: number }>();

    const assign = (goalRef: string, startLeafIndex: number): void => {
      const leafCount = leafCounts.get(goalRef) ?? 1;
      const depth = depthByRef.get(goalRef) ?? 0;
      const x =
        center.x +
        (startLeafIndex + (leafCount - 1) / 2 - (totalLeaves - 1) / 2) *
          horizontalGap;
      const y = center.y + (depth - maxDepth / 2) * verticalGap;
      positions.set(goalRef, { x, y });

      let childStartLeafIndex = startLeafIndex;
      const children = childrenByParent.get(goalRef) ?? [];
      children.forEach((child) => {
        assign(child.ref, childStartLeafIndex);
        childStartLeafIndex += leafCounts.get(child.ref) ?? 1;
      });
    };

    let currentLeafIndex = 0;
    roots.forEach((root) => {
      assign(root.ref, currentLeafIndex);
      currentLeafIndex += leafCounts.get(root.ref) ?? 1;
    });

    action.goals.forEach((goal) => {
      if (!positions.has(goal.ref)) {
        positions.set(goal.ref, center);
      }
    });

    return positions;
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
    value: WorkspaceChatRelationSuggestionType
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
    const directConnection = this.options.scene.getConnections().find(
      (connection) =>
        connection.fromId === fromId &&
        connection.toId === toId &&
        connection.relationType === relationType
    );
    if (directConnection) {
      return {
        connection: directConnection,
        reversed: false,
      };
    }
    if (relationType !== ConnectionRelationType.RelatesTo) {
      return null;
    }
    const reverseConnection =
      this.options.scene.getConnections().find(
        (connection) =>
          connection.fromId === toId &&
          connection.toId === fromId &&
          connection.relationType === relationType
      ) ?? null;
    if (!reverseConnection) {
      return null;
    }
    return {
      connection: reverseConnection,
      reversed: true,
    };
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
