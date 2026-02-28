import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import { isPlanningElement } from '../../elements/utils/typeGuards.ts';

/**
 * Command to set/clear highlighted element with undo/redo support.
 */
export class SetHighlightCommand extends Command {
  private previousHighlighted = false;

  constructor(
    private readonly scene: Scene,
    private readonly elementId: string,
    private readonly nextHighlighted: boolean
  ) {
    super();
  }

  execute(): void {
    this.previousHighlighted = this.scene.isHighlightedById(this.elementId);
    this.scene.setHighlightedElementById(this.elementId, this.nextHighlighted);
    this.notifyPositionsDirty();
  }

  undo(): void {
    this.scene.setHighlightedElementById(this.elementId, this.previousHighlighted);
    this.notifyPositionsDirty();
  }

  private notifyPositionsDirty(): void {
    if (typeof window === 'undefined') return;
    const element = this.scene
      .getElements()
      .find((candidate) => candidate.id === this.elementId);
    if (!element || !isPlanningElement(element)) return;
    window.dispatchEvent(
      new CustomEvent('canvasPositionsDirty', {
        detail: { elements: [element] },
      })
    );
  }
}
