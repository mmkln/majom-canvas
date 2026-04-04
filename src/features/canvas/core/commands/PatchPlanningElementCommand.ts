import type { UiPriority } from '../../../../majom-wrapper/utils/priorityMapping.ts';
import { GoalElement, type GoalScale } from '../../elements/GoalElement.ts';
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
  dueDate: Date | null;
  tagIds: number[];
  tags: string[];
  scale: GoalScale;
}>;

type PersistedPlanningElementPatch = Partial<{
  title: string;
  description: string;
  status: ElementStatus;
  priority: UiPriority;
  dueDate: Date | null;
  tagIds: number[];
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
    if (element instanceof TaskElement) {
      this.previousPatch.dueDate = element.dueDate;
    }
    if (element instanceof GoalElement) {
      this.previousPatch.tagIds = [...(element.tagIds ?? [])];
      this.previousPatch.tags = [...(element.tags ?? [])];
      this.previousPatch.scale = element.scale;
    }
  }

  public execute(): void {
    this.applyPatch(this.nextPatch);
  }

  public undo(): void {
    this.applyPatch(this.previousPatch);
  }

  public override affectsUnsavedChanges(): boolean {
    return this.nextPatch.scale !== undefined;
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
    if (patch.dueDate !== undefined && this.element instanceof TaskElement) {
      this.element.dueDate = patch.dueDate;
    }

    let scaleChanged = false;
    if (this.element instanceof GoalElement) {
      if (patch.tagIds !== undefined) {
        this.element.tagIds = [...patch.tagIds];
      }
      if (patch.tags !== undefined) {
        this.element.tags = [...patch.tags];
      }
      if (patch.scale !== undefined) {
        this.element.setScale(patch.scale);
        scaleChanged = true;
      }
    }

    const persistedPatch = this.toPersistedPatch(patch);

    if (typeof window !== 'undefined' && Object.keys(persistedPatch).length > 0) {
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element: this.element, patch: persistedPatch },
        })
      );
    }
    if (typeof window !== 'undefined' && scaleChanged) {
      window.dispatchEvent(
        new CustomEvent('canvasPositionsDirty', {
          detail: { elements: [this.element] },
        })
      );
    }
    this.scene.changes.next();
  }

  private toPersistedPatch(
    patch: PlanningElementPatch
  ): PersistedPlanningElementPatch {
    const persistedPatch: PersistedPlanningElementPatch = {};
    if (patch.title !== undefined) {
      persistedPatch.title = patch.title;
    }
    if (patch.description !== undefined) {
      persistedPatch.description = patch.description;
    }
    if (patch.status !== undefined) {
      persistedPatch.status = patch.status;
    }
    if (patch.priority !== undefined) {
      persistedPatch.priority = patch.priority;
    }
    if (patch.dueDate !== undefined) {
      persistedPatch.dueDate = patch.dueDate;
    }
    if (patch.tagIds !== undefined) {
      persistedPatch.tagIds = [...patch.tagIds];
    }
    return persistedPatch;
  }
}
