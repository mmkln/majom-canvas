import Connection from '../../core/shapes/Connection.ts';
import type { ICanvasElement } from '../../core/interfaces/canvasElement.ts';
import type { IConnection } from '../../core/interfaces/connection.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type {
  CanvasActionDefinition,
  CanvasActionGroup,
  CanvasActionExecutionContext,
  CanvasContextMenuContext,
  CanvasCreationContext,
  CanvasInteractionAdapter,
  CanvasSelectionActionContext,
} from '../CanvasInteractionAdapter.ts';

export const PLANNING_CANVAS_ACTION_REQUESTED_EVENT =
  'planningCanvasActionRequested';

type PlanningTargetKind = 'goal' | 'story' | 'task' | 'connection' | 'canvas';

type PlanningActionSpec = {
  id: string;
  label: string;
  description?: string;
  icon?: CanvasActionDefinition['icon'];
  tone?: CanvasActionDefinition['tone'];
  disabled?: boolean;
};

const CREATE_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:create-goal',
    label: 'Create goal',
    description: 'Add a new goal to the canvas.',
    icon: 'plus',
    tone: 'primary',
  },
  {
    id: 'planning:create-story',
    label: 'Create story',
    description: 'Add a new story to the canvas.',
    icon: 'plus',
    tone: 'primary',
  },
  {
    id: 'planning:create-task',
    label: 'Create task',
    description: 'Add a new task to the canvas.',
    icon: 'plus',
    tone: 'primary',
  },
];

const COMMON_ELEMENT_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:edit-element',
    label: 'Edit',
    description: 'Open the selected item for editing.',
    icon: 'pencil',
  },
  {
    id: 'planning:copy-element',
    label: 'Copy',
    description: 'Copy the selected item to the clipboard.',
    icon: 'square-2-stack',
  },
  {
    id: 'planning:delete-element',
    label: 'Delete',
    description: 'Remove the selected item from the canvas.',
    icon: 'trash',
    tone: 'danger',
  },
];

const STORY_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:create-task-under-story',
    label: 'Create task',
    description: 'Add a new task beneath this story.',
    icon: 'plus',
    tone: 'primary',
  },
  {
    id: 'planning:add-existing-task',
    label: 'Add existing task',
    description: 'Attach an existing task to this story.',
    icon: 'magnifying-glass',
  },
];

const GOAL_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:create-story-under-goal',
    label: 'Create story',
    description: 'Add a new story beneath this goal.',
    icon: 'plus',
    tone: 'primary',
  },
  {
    id: 'planning:add-existing-story',
    label: 'Add existing story',
    description: 'Attach an existing story to this goal.',
    icon: 'magnifying-glass',
  },
];

const MULTI_SELECTION_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:connect-selected',
    label: 'Connect selected',
    description: 'Create links between the selected items.',
    icon: 'link',
    tone: 'primary',
  },
  {
    id: 'planning:copy-selection',
    label: 'Copy',
    description: 'Copy the current selection to the clipboard.',
    icon: 'square-2-stack',
  },
  {
    id: 'planning:delete-selection',
    label: 'Delete',
    description: 'Remove the current selection from the canvas.',
    icon: 'trash',
    tone: 'danger',
  },
];

const CONNECTION_ACTIONS: PlanningActionSpec[] = [
  {
    id: 'planning:delete-connection',
    label: 'Delete connection',
    description: 'Remove the selected connection from the canvas.',
    icon: 'link-slash',
    tone: 'danger',
  },
];

export class PlanningCanvasInteractionAdapter
  implements CanvasInteractionAdapter
{
  public getCreationActions(
    _context: CanvasCreationContext
  ): CanvasActionGroup[] {
    return [
      {
        id: 'planning:create',
        title: 'Create',
        actions: CREATE_ACTIONS.map((action) => this.toAction(action)),
      },
    ];
  }

  public getContextMenuActions(
    context: CanvasContextMenuContext
  ): CanvasActionGroup[] {
    if (!context.target) {
      return [];
    }

    if (context.target instanceof Connection) {
      return [
        {
          id: 'planning:connection',
          title: 'Connection',
          actions: CONNECTION_ACTIONS.map((action) => this.toAction(action)),
        },
      ];
    }

    const targetKind = this.getTargetKind(context.target);
    const groups: CanvasActionGroup[] = [
      {
        id: `planning:${targetKind}`,
        title: this.titleForKind(targetKind),
        actions: COMMON_ELEMENT_ACTIONS.map((action) => this.toAction(action)),
      },
    ];

    if (targetKind === 'goal') {
      groups.push({
        id: 'planning:goal-planning',
        title: 'Planning',
        actions: GOAL_ACTIONS.map((action) => this.toAction(action)),
      });
    }

    if (targetKind === 'story') {
      groups.push({
        id: 'planning:story-planning',
        title: 'Planning',
        actions: STORY_ACTIONS.map((action) => this.toAction(action)),
      });
    }

    return groups;
  }

  public getSelectionActions(
    context: CanvasSelectionActionContext
  ): CanvasActionGroup[] {
    if (context.selectedElements.length === 0) {
      return [];
    }

    if (context.selectedElements.length > 1) {
      return [
        {
          id: 'planning:selection-multi',
          title: 'Selection',
          actions: MULTI_SELECTION_ACTIONS.map((action) =>
            this.toAction(action)
          ),
        },
      ];
    }

    const primary = context.selectedElements[0];
    const targetKind = this.getTargetKind(primary);
    const groups: CanvasActionGroup[] = [
      {
        id: `planning:selection-${targetKind}`,
        title: this.titleForKind(targetKind),
        actions: COMMON_ELEMENT_ACTIONS.map((action) => this.toAction(action)),
      },
    ];

    if (targetKind === 'goal') {
      groups.push({
        id: 'planning:selection-goal-planning',
        title: 'Planning',
        actions: GOAL_ACTIONS.map((action) => this.toAction(action)),
      });
    }

    if (targetKind === 'story') {
      groups.push({
        id: 'planning:selection-story-planning',
        title: 'Planning',
        actions: STORY_ACTIONS.map((action) => this.toAction(action)),
      });
    }

    return groups;
  }

  public executeAction(
    context: CanvasActionExecutionContext
  ): void {
    window.dispatchEvent(
      new CustomEvent(PLANNING_CANVAS_ACTION_REQUESTED_EVENT, {
        detail: {
          actionId: context.actionId,
          targetId: context.target?.id ?? null,
          targetKind: context.target ? this.getTargetKind(context.target) : 'canvas',
          selectedElementIds: context.selectedElements.map((element) => element.id),
          sceneX: context.sceneX ?? null,
          sceneY: context.sceneY ?? null,
        },
      })
    );
  }

  private toAction(action: PlanningActionSpec): CanvasActionDefinition {
    return {
      id: action.id,
      label: action.label,
      description: action.description,
      icon: action.icon,
      tone: action.tone,
      disabled: action.disabled,
    };
  }

  private getTargetKind(target: ICanvasElement | IConnection): PlanningTargetKind {
    if (target instanceof GoalElement) {
      return 'goal';
    }
    if (target instanceof StoryElement) {
      return 'story';
    }
    if (target instanceof TaskElement) {
      return 'task';
    }
    if (target instanceof Connection) {
      return 'connection';
    }
    return 'canvas';
  }

  private titleForKind(kind: PlanningTargetKind): string {
    switch (kind) {
      case 'goal':
        return 'Goal';
      case 'story':
        return 'Story';
      case 'task':
        return 'Task';
      case 'connection':
        return 'Connection';
      case 'canvas':
      default:
        return 'Canvas';
    }
  }
}
