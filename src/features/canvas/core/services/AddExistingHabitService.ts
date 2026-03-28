import type { Habit } from '../../../../majom-wrapper/interfaces/index.ts';
import { HabitElement } from '../../elements/HabitElement.ts';
import { mapHabit } from '../../mappers/habit-mapper.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';
import { historyService } from './HistoryService.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { Scene } from '../scene/Scene.ts';

export class AddExistingHabitService {
  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {}

  public addOrFocus(habit: Habit, sceneX: number, sceneY: number): void {
    const existing = this.getExistingHabit(habit);
    if (existing) {
      this.scene.setSelected([existing]);
      this.canvasManager.centerOnScenePoint(
        existing.x + existing.width / 2,
        existing.y + existing.height / 2
      );
      this.canvasManager.draw();
      return;
    }

    const habitElement = mapHabit(habit, []);
    habitElement.x = sceneX - HabitElement.radius;
    habitElement.y = sceneY - HabitElement.radius;

    historyService.execute(new AddElementCommand(this.scene, habitElement));
    this.scene.setSelected([habitElement]);
    this.canvasManager.draw();
  }

  public isOnCanvas(habit: Habit): boolean {
    return this.getExistingHabit(habit) !== null;
  }

  public focusExisting(habit: Habit): boolean {
    const existing = this.getExistingHabit(habit);
    if (!existing) return false;
    this.scene.setSelected([existing]);
    this.canvasManager.centerOnScenePoint(
      existing.x + existing.width / 2,
      existing.y + existing.height / 2
    );
    this.canvasManager.draw();
    return true;
  }

  public getExistingHabit(habit: Habit): HabitElement | null {
    const sceneHabits = this.scene
      .getElements()
      .filter(
        (element): element is HabitElement => element instanceof HabitElement
      );

    const habitId = String(habit.id);
    return (
      sceneHabits.find((existing) => {
        if (habit.uuid && existing.uuid === habit.uuid) return true;
        if (habit.uuid && existing.id === habit.uuid) return true;
        if (existing.backendId !== undefined && String(existing.backendId) === habitId) {
          return true;
        }
        return existing.id === habitId;
      }) ?? null
    );
  }
}
