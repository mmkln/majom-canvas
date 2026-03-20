import { Scene } from '../scene/Scene.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { RoutineElement } from '../../elements/RoutineElement.ts';
import type { Habit } from '../../../../majom-wrapper/interfaces/index.ts';
import { historyService } from './HistoryService.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';

export class AddExistingRoutineService {
  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {}

  public addOrFocus(routine: Habit, sceneX: number, sceneY: number): void {
    const existing = this.getExistingRoutine(routine);
    if (existing) {
      this.scene.setSelected([existing]);
      this.canvasManager.centerOnScenePoint(
        existing.x + RoutineElement.radius,
        existing.y + RoutineElement.radius
      );
      this.canvasManager.draw();
      return;
    }

    const routineUuidRaw = (routine as Habit & { uuid?: unknown }).uuid;
    const routineUuid =
      typeof routineUuidRaw === 'string' && routineUuidRaw.trim().length > 0
        ? routineUuidRaw
        : `habit-${routine.id}`;

    const routineElement = new RoutineElement({
      id: routineUuid,
      uuid: routineUuid,
      backendId: routine.id,
      title: routine.title,
      description: routine.description,
      status: mapStatus(routine.status),
      x: sceneX - RoutineElement.radius,
      y: sceneY - RoutineElement.radius,
    });

    historyService.execute(new AddElementCommand(this.scene, routineElement));
    this.scene.setSelected([routineElement]);
    this.canvasManager.draw();
  }

  public isOnCanvas(routine: Habit): boolean {
    return this.getExistingRoutine(routine) !== null;
  }

  public focusExisting(routine: Habit): boolean {
    const existing = this.getExistingRoutine(routine);
    if (!existing) return false;
    this.scene.setSelected([existing]);
    this.canvasManager.centerOnScenePoint(
      existing.x + RoutineElement.radius,
      existing.y + RoutineElement.radius
    );
    this.canvasManager.draw();
    return true;
  }

  public getExistingRoutine(routine: Habit): RoutineElement | null {
    const sceneRoutines = this.scene
      .getElements()
      .filter(
        (element): element is RoutineElement => element instanceof RoutineElement
      );

    const routineId = String(routine.id);
    return (
      sceneRoutines.find((existing) => {
        if (
          Number.isFinite(existing.backendId) &&
          String(existing.backendId) === routineId
        ) {
          return true;
        }
        return existing.id === routineId;
      }) ?? null
    );
  }
}
