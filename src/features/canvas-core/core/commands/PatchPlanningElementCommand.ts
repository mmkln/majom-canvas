import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import { Scene } from '../scene/Scene.ts';
import { Command } from './Command.ts';

type PatchablePlanningElement = GoalElement | StoryElement | TaskElement;

export type PlanningElementPatch = Partial<{
  title: string;
  description: string;
  status: ElementStatus;
  priority: UiPriority;
}>;

export class PatchPlanningElementCommand extends Command {
  private readonly previousPatch: PlanningElementPatch;

  constructor(
    private readonly scene: Scene,
    private readonly element: PatchablePlanningElement,
    private readonly nextPatch: PlanningElementPatch
  ) {
    super();
    this.previousPatch = {
      title: element.title,
      description: element.description,
      status: element.status,
      priority: element.priority,
    };
  }

  public execute(): void {
    this.applyPatch(this.nextPatch);
  }

  public undo(): void {
    this.applyPatch(this.previousPatch);
  }

  private applyPatch(patch: PlanningElementPatch): void {
    if (patch.title !== undefined) {
      this.element.title = patch.title;
    }
    if (patch.description !== undefined) {
      this.element.description = patch.description;
    }
    if (patch.status !== undefined) {
      this.element.status = patch.status;
    }
    if (patch.priority !== undefined) {
      this.element.priority = patch.priority;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element: this.element, patch },
        })
      );
    }
    this.scene.changes.next();
  }
}
