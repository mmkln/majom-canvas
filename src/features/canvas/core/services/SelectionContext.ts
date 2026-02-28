import type { Scene } from '../scene/Scene.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';

export type PlanningElement = TaskElement | StoryElement | GoalElement;

export class SelectionContext {
  public static getPlanningSelection(scene: Scene): PlanningElement[] {
    return scene
      .getSelectedElements()
      .filter((el) =>
        SelectionContext.isPlanningElement(el)
      ) as PlanningElement[];
  }

  public static isPlanningElement(
    element: ICanvasElement
  ): element is PlanningElement {
    return (
      element instanceof TaskElement ||
      element instanceof StoryElement ||
      element instanceof GoalElement
    );
  }

  public static getSelectionBounds(elements: PlanningElement[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    elements.forEach((el) => {
      const bounds = SelectionContext.getElementBounds(el);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });
    if (!Number.isFinite(minX)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  public static getMixedStatus(
    elements: PlanningElement[]
  ): ElementStatus | null {
    if (elements.length === 0) return null;
    const statuses = new Set(elements.map((el) => el.status));
    if (statuses.size !== 1) return null;
    return elements[0].status;
  }

  public static isSelectionMatch(
    selected: ICanvasElement[],
    elements: PlanningElement[]
  ): boolean {
    if (elements.length === 0) return false;
    if (selected.length !== elements.length) return false;
    const selectedIds = new Set(selected.map((el) => (el as any).id));
    return elements.every((el) => selectedIds.has(el.id));
  }

  private static getElementBounds(element: ICanvasElement): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const el = element as any;
    if (typeof el.width === 'number' && typeof el.height === 'number') {
      return { x: el.x, y: el.y, width: el.width, height: el.height };
    }
    if (typeof el.radius === 'number') {
      return {
        x: el.x - el.radius,
        y: el.y - el.radius,
        width: el.radius * 2,
        height: el.radius * 2,
      };
    }
    return { x: el.x, y: el.y, width: 0, height: 0 };
  }
}
