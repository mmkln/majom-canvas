import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { CopyCommand } from '../commands/CopyCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import type { PlanningElement } from './SelectionContext.ts';
import { ConnectionCreationService } from './ConnectionCreationService.ts';
import { notify } from './NotificationService.ts';

export class BulkActionsController {
  private readonly connectionCreationService: ConnectionCreationService;

  constructor(private readonly scene: Scene) {
    this.connectionCreationService = new ConnectionCreationService(scene);
  }

  public copy(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    historyService.execute(new CopyCommand(this.scene, elements));
  }

  public removeFromCanvas(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    historyService.execute(new DeleteCommand(this.scene, elements));
  }

  public deletePermanently(elements: PlanningElement[]): void {
    if (elements.length === 0) return;
    elements.forEach((element) => {
      window.dispatchEvent(
        new CustomEvent('elementDeleteRequested', {
          detail: { element },
        })
      );
    });
  }

  public updateStatus(
    elements: PlanningElement[],
    status: ElementStatus
  ): void {
    if (elements.length === 0) return;
    // TODO: replace per-element PATCH with bulk endpoints:
    // /tasks/bulk/, /stories/bulk/, /goals/bulk/ (ids + patch payload).
    elements.forEach((element) => {
      if (element.status === status) return;
      element.status = status;
      window.dispatchEvent(
        new CustomEvent('elementDetailsEdited', {
          detail: { element, patch: { status } },
        })
      );
    });
    this.scene.changes.next();
  }

  public getEligibleLinkSourcesToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): PlanningElement[] {
    return elements.filter((element) =>
      this.connectionCreationService.canCreate(element, target, {
        preventDuplicates: true,
      })
    );
  }

  public connectToTarget(
    elements: PlanningElement[],
    target: PlanningElement
  ): void {
    if (elements.length === 0) return;
    const result = this.connectionCreationService.createManyToTarget(
      elements,
      target,
      {
        preventDuplicates: true,
      }
    );
    if (result.createdPlans.length > 0) {
      return;
    }
    notify('No new links could be created for the current selection.', 'info');
  }
}
