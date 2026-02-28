import { Scene } from '../scene/Scene.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import type { PlatformTask } from '../../../../majom-wrapper/interfaces/index.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { historyService } from './HistoryService.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';
import { elementPlacementPolicy } from './ElementPlacementPolicy.ts';

export class AddExistingTaskService {
  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {}

  public addOrFocus(task: PlatformTask, sceneX: number, sceneY: number): void {
    const existing = this.getExistingTask(task);
    if (existing) {
      this.scene.setSelected([existing]);
      this.canvasManager.centerOnScenePoint(
        existing.x + TaskElement.width / 2,
        existing.y + TaskElement.height / 2
      );
      this.canvasManager.draw();
      return;
    }

    const normalizedPriority =
      task.priority === 'low' ||
      task.priority === 'medium' ||
      task.priority === 'high'
        ? task.priority
        : 'medium';

    const dueDateRaw = task.due_date;
    let dueDate: Date | null = null;
    if (dueDateRaw instanceof Date) {
      dueDate = dueDateRaw;
    } else if (typeof dueDateRaw === 'string') {
      const parsed = new Date(dueDateRaw);
      dueDate = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const taskElement = new TaskElement({
      id: task.uuid ?? String(task.id),
      backendId: task.id,
      uuid: task.uuid,
      title: task.title,
      description: task.description,
      status: mapStatus(task.status),
      priority: normalizedPriority,
      dueDate,
      x: sceneX - TaskElement.width / 2,
      y: sceneY - TaskElement.height / 2,
    });
    elementPlacementPolicy.placeElements([taskElement], this.scene.getElements());

    historyService.execute(new AddElementCommand(this.scene, taskElement));
    this.scene.setSelected([taskElement]);
    this.canvasManager.draw();
  }

  public isOnCanvas(task: PlatformTask): boolean {
    return this.getExistingTask(task) !== null;
  }

  public focusExisting(task: PlatformTask): boolean {
    const existing = this.getExistingTask(task);
    if (!existing) return false;
    this.scene.setSelected([existing]);
    this.canvasManager.centerOnScenePoint(
      existing.x + TaskElement.width / 2,
      existing.y + TaskElement.height / 2
    );
    this.canvasManager.draw();
    return true;
  }

  public getExistingTask(task: PlatformTask): TaskElement | null {
    const sceneTasks = this.scene
      .getElements()
      .filter((element): element is TaskElement => element instanceof TaskElement);

    const taskId = String(task.id);
    return (
      sceneTasks.find((existing) => {
        if (task.uuid && existing.uuid === task.uuid) return true;
        if (task.uuid && existing.id === task.uuid) return true;
        if (
          Number.isFinite(existing.backendId) &&
          String(existing.backendId) === taskId
        ) {
          return true;
        }
        return existing.id === taskId;
      }) ?? null
    );
  }
}
