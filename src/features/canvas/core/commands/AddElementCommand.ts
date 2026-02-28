import { Command } from './Command.ts';
import { Scene } from '../scene/Scene.ts';
import type { ICanvasElement } from '../interfaces/canvasElement.ts';

/**
 * Command to add elements: supports undo/redo.
 */
export class AddElementCommand extends Command {
  private scene: Scene;
  private elements: ICanvasElement[];

  constructor(scene: Scene, elements: ICanvasElement[] | ICanvasElement) {
    super();
    this.scene = scene;
    this.elements = Array.isArray(elements) ? [...elements] : [elements];
  }

  execute(): void {
    this.elements.forEach((el) => this.scene.addElement(el));
  }

  undo(): void {
    this.scene.removeElements(this.elements);
  }
}
