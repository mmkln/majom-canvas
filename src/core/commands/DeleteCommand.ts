import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';

/**
 * Command to delete elements: supports undo/redo.
 */
export class DeleteCommand extends Command {
  private scene: Scene;
  private elements: ICanvasElement[];

  constructor(scene: Scene, elements: ICanvasElement[]) {
    super();
    this.scene = scene;
    // store references to elements to delete
    this.elements = [...elements];
  }

  execute(): void {
    this.scene.removeElements(this.elements);
  }

  undo(): void {
    // re-add deleted elements
    this.elements.forEach(el => this.scene.addElement(el));
  }
}
