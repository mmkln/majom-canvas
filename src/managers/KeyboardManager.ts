// managers/KeyboardManager.ts
import { Scene } from '../core/scene/Scene';

export class KeyboardManager {
  constructor(private scene: Scene) {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    // Check for the Delete key (or Backspace, depending on your needs)
    console.log({ key: e.key });
    if (e.key === 'Backspace') {
      // Get a copy of selected shapes to avoid mutation issues during iteration
      const selectedShapes = [...this.scene.getSelectedShapes()];
        this.scene.removeElements(selectedShapes);
    }
  }

  public init(): void {
    // Nothing to initialize
  }
}
