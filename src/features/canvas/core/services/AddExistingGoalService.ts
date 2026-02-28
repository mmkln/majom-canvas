import { Scene } from '../scene/Scene.ts';
import type { CanvasManager } from '../managers/CanvasManager.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import type { Goal } from '../../../../majom-wrapper/interfaces/index.ts';
import { mapStatus } from '../../../../majom-wrapper/utils/statusMapping.ts';
import { historyService } from './HistoryService.ts';
import { AddElementCommand } from '../commands/AddElementCommand.ts';

export class AddExistingGoalService {
  constructor(
    private readonly scene: Scene,
    private readonly canvasManager: CanvasManager
  ) {}

  public addOrFocus(goal: Goal, sceneX: number, sceneY: number): void {
    const existing = this.getExistingGoal(goal);
    if (existing) {
      this.scene.setSelected([existing]);
      this.canvasManager.centerOnScenePoint(
        existing.x + existing.width / 2,
        existing.y + existing.height / 2
      );
      this.canvasManager.draw();
      return;
    }

    const normalizedPriority =
      goal.priority === 'low' ||
      goal.priority === 'medium' ||
      goal.priority === 'high'
        ? goal.priority
        : 'medium';

    const goalElement = new GoalElement({
      id: goal.uuid ?? String(goal.id),
      backendId: goal.id,
      uuid: goal.uuid,
      title: goal.title,
      description: goal.description,
      status: mapStatus(goal.status),
      priority: normalizedPriority,
      x: sceneX - GoalElement.width / 2,
      y: sceneY - GoalElement.height / 2,
    });

    historyService.execute(new AddElementCommand(this.scene, goalElement));
    this.scene.setSelected([goalElement]);
    this.canvasManager.draw();
  }

  public isOnCanvas(goal: Goal): boolean {
    return this.getExistingGoal(goal) !== null;
  }

  public focusExisting(goal: Goal): boolean {
    const existing = this.getExistingGoal(goal);
    if (!existing) return false;
    this.scene.setSelected([existing]);
    this.canvasManager.centerOnScenePoint(
      existing.x + existing.width / 2,
      existing.y + existing.height / 2
    );
    this.canvasManager.draw();
    return true;
  }

  public getExistingGoal(goal: Goal): GoalElement | null {
    const sceneGoals = this.scene
      .getElements()
      .filter(
        (element): element is GoalElement => element instanceof GoalElement
      );

    const goalId = String(goal.id);
    return (
      sceneGoals.find((existing) => {
        if (goal.uuid && existing.uuid === goal.uuid) return true;
        if (goal.uuid && existing.id === goal.uuid) return true;
        if (
          Number.isFinite(existing.backendId) &&
          String(existing.backendId) === goalId
        ) {
          return true;
        }
        return existing.id === goalId;
      }) ?? null
    );
  }
}
