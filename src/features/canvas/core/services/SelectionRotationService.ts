import { MoveCommand } from '../commands/MoveCommand.ts';
import { Scene } from '../scene/Scene.ts';
import { historyService } from './HistoryService.ts';
import { SelectionContext, type PlanningElement } from './SelectionContext.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';

const POSITION_EPSILON = 0.01;

type RotationGroup = {
  anchor: PlanningElement;
  followers: PlanningElement[];
};

export class SelectionRotationService {
  public static canRotate(
    scene: Scene,
    elements: PlanningElement[]
  ): boolean {
    return this.createRotationPlan(scene, elements) !== null;
  }

  public static rotateClockwise(
    scene: Scene,
    elements: PlanningElement[]
  ): boolean {
    const plan = this.createRotationPlan(scene, elements);
    if (!plan) return false;
    historyService.execute(
      new MoveCommand(scene, plan.initialPositions, plan.finalPositions)
    );
    return true;
  }

  private static createRotationPlan(
    scene: Scene,
    elements: PlanningElement[]
  ): {
    initialPositions: Map<string, { x: number; y: number }>;
    finalPositions: Map<string, { x: number; y: number }>;
  } | null {
    const groups = this.getRotationGroups(scene, elements);
    if (!groups || groups.length <= 1) {
      return null;
    }

    const bounds = SelectionContext.getSelectionBounds(
      groups.map((group) => group.anchor)
    );
    const pivotX = bounds.x + bounds.width / 2;
    const pivotY = bounds.y + bounds.height / 2;
    const initialPositions = new Map<string, { x: number; y: number }>();
    const finalPositions = new Map<string, { x: number; y: number }>();

    groups.forEach((group) => {
      const anchor = group.anchor;
      const anchorCenterX = anchor.x + anchor.width / 2;
      const anchorCenterY = anchor.y + anchor.height / 2;
      const rotatedAnchorCenterX = pivotX - (anchorCenterY - pivotY);
      const rotatedAnchorCenterY = pivotY + (anchorCenterX - pivotX);
      const nextAnchorX = rotatedAnchorCenterX - anchor.width / 2;
      const nextAnchorY = rotatedAnchorCenterY - anchor.height / 2;
      const dx = nextAnchorX - anchor.x;
      const dy = nextAnchorY - anchor.y;

      this.recordPositionChange(
        anchor,
        anchor.x,
        anchor.y,
        nextAnchorX,
        nextAnchorY,
        initialPositions,
        finalPositions
      );

      group.followers.forEach((follower) => {
        this.recordPositionChange(
          follower,
          follower.x,
          follower.y,
          follower.x + dx,
          follower.y + dy,
          initialPositions,
          finalPositions
        );
      });
    });

    if (finalPositions.size === 0) {
      return null;
    }

    return { initialPositions, finalPositions };
  }

  private static getRotationGroups(
    scene: Scene,
    elements: PlanningElement[]
  ): RotationGroup[] | null {
    const uniqueSelection = this.dedupeElements(elements);
    if (uniqueSelection.length <= 1) return null;

    const selectedIds = new Set(uniqueSelection.map((element) => element.id));
    const taskOwnerById = this.getTaskOwnerById(scene);

    for (const element of uniqueSelection) {
      if (!(element instanceof TaskElement)) continue;
      const owner = taskOwnerById.get(element.id);
      if (owner && !selectedIds.has(owner.id)) {
        return null;
      }
    }

    const groups: RotationGroup[] = [];
    uniqueSelection.forEach((element) => {
      if (element instanceof TaskElement) {
        const owner = taskOwnerById.get(element.id);
        if (owner && selectedIds.has(owner.id)) {
          return;
        }
      }

      if (element instanceof StoryElement) {
        groups.push({
          anchor: element,
          followers: this.dedupeElements(element.tasks),
        });
        return;
      }

      groups.push({ anchor: element, followers: [] });
    });

    return groups;
  }

  private static getTaskOwnerById(scene: Scene): Map<string, StoryElement> {
    const ownerByTaskId = new Map<string, StoryElement>();
    scene
      .getElements()
      .filter((element): element is StoryElement => element instanceof StoryElement)
      .forEach((story) => {
        story.tasks.forEach((task) => {
          if (!ownerByTaskId.has(task.id)) {
            ownerByTaskId.set(task.id, story);
          }
        });
      });
    return ownerByTaskId;
  }

  private static dedupeElements<T extends PlanningElement>(elements: T[]): T[] {
    const unique = new Map<string, T>();
    elements.forEach((element) => {
      unique.set(element.id, element);
    });
    return Array.from(unique.values());
  }

  private static recordPositionChange(
    element: PlanningElement,
    initialX: number,
    initialY: number,
    nextX: number,
    nextY: number,
    initialPositions: Map<string, { x: number; y: number }>,
    finalPositions: Map<string, { x: number; y: number }>
  ): void {
    if (
      Math.abs(nextX - initialX) <= POSITION_EPSILON &&
      Math.abs(nextY - initialY) <= POSITION_EPSILON
    ) {
      return;
    }

    initialPositions.set(element.id, { x: initialX, y: initialY });
    finalPositions.set(element.id, { x: nextX, y: nextY });
  }
}
