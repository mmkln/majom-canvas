import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';

/**
 * Command to move elements: supports undo/redo of position changes.
 */
export class MoveCommand extends Command {
  private scene: Scene;
  private initialPositions: Map<string, { x: number; y: number }>;
  private finalPositions: Map<string, { x: number; y: number }>;

  constructor(
    scene: Scene,
    initialPositions: Map<string, { x: number; y: number }>,
    finalPositions: Map<string, { x: number; y: number }>
  ) {
    super();
    this.scene = scene;
    // clone maps to avoid mutation
    this.initialPositions = new Map(initialPositions);
    this.finalPositions = new Map(finalPositions);
  }

  execute(): void {
    this.applyPositions(this.finalPositions);
    this.notifyPositionsDirty(this.finalPositions.keys());
    this.scene.changes.next();
  }

  undo(): void {
    this.applyPositions(this.initialPositions);
    this.notifyPositionsDirty(this.initialPositions.keys());
    this.scene.changes.next();
  }

  private applyPositions(
    positions: Map<string, { x: number; y: number }>
  ): void {
    positions.forEach((pos, id) => {
      const element = this.scene
        .getElements()
        .find((el) => el.id === id) as any;
      if (element) {
        element.x = pos.x;
        element.y = pos.y;
      }
    });
  }

  private notifyPositionsDirty(ids: Iterable<string>): void {
    if (typeof window === 'undefined') return;
    const elements = Array.from(ids)
      .map((id) => this.scene.getElements().find((el) => el.id === id))
      .filter(
        (el): el is IPlanningElement => Boolean(el) && isPlanningElement(el)
      );
    if (elements.length === 0) return;
    window.dispatchEvent(
      new CustomEvent('canvasPositionsDirty', {
        detail: { elements },
      })
    );
  }
}
