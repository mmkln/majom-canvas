import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';
import type { IPlanningElement } from '../../elements/interfaces/planningElement.ts';

/**
 * Command to set/clear focused element with undo/redo support.
 */
export class SetFocusCommand extends Command {
  private previousFocusId: string | null = null;
  private nextFocusId: string | null;

  constructor(scene: Scene, nextFocusId: string | null) {
    super();
    this.scene = scene;
    this.nextFocusId = nextFocusId;
  }

  private scene: Scene;

  execute(): void {
    this.previousFocusId = this.scene.getFocusedElementId();
    this.scene.setFocusedElementById(this.nextFocusId);
    this.notifyPositionsDirty(this.previousFocusId, this.nextFocusId);
  }

  undo(): void {
    this.scene.setFocusedElementById(this.previousFocusId);
    this.notifyPositionsDirty(this.nextFocusId, this.previousFocusId);
  }

  private notifyPositionsDirty(
    fromId: string | null,
    toId: string | null
  ): void {
    if (typeof window === 'undefined') return;
    const affected = new Set<string>();
    if (fromId) affected.add(fromId);
    if (toId) affected.add(toId);
    if (affected.size === 0) return;
    const elements = Array.from(affected)
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
