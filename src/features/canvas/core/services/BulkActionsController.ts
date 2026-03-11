import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { CopyCommand } from '../commands/CopyCommand.ts';
import { DeleteCommand } from '../commands/DeleteCommand.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';
import type { PlanningElement } from './SelectionContext.ts';
import {
  emitCanvasElementDeleteRequested,
  emitCanvasElementDetailsEdited,
} from '../canvasElementLifecycle.ts';

export class BulkActionsController {
  constructor(private readonly scene: Scene) {}

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
      emitCanvasElementDeleteRequested(element);
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
      emitCanvasElementDetailsEdited(element, { status });
    });
    this.scene.changes.next();
  }
}
