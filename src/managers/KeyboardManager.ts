// managers/KeyboardManager.ts
import { Scene } from '../core/scene/Scene';
import { IShape } from '../core/interfaces/shape';
import { CanvasManager } from './CanvasManager';

export class KeyboardManager {
  private clipboard: IShape[] = [];

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager
  ) {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private getCanvasCenter(): { x: number; y: number } {
    const canvas = this.canvasManager.getCanvas();
    const width = canvas.width;
    const height = canvas.height;
    const panZoom = this.canvasManager.getPanZoomManager();
    const centerX = (width / 2 + panZoom.scrollX) / panZoom.scale;
    const centerY = (height / 2 + panZoom.scrollY) / panZoom.scale;
    return { x: centerX, y: centerY };
  }

  private onKeyDown(e: KeyboardEvent): void {
    console.log({ key: e.key });

    if (e.key === 'Escape') {
      // Скасовуємо створення зв’язку
      this.canvasManager.getInteractionManager().cancelConnectionCreation();
      return;
    }

    if (e.ctrlKey && e.key === 'c') {
      const selectedShapes = this.scene.getSelectedShapes();
      if (selectedShapes.length > 0) {
        this.clipboard = selectedShapes.map((shape) => shape.clone());
        console.log(`Copied ${this.clipboard.length} shapes to clipboard`);
      }
      e.preventDefault();
    }

    if (e.ctrlKey && e.key === 'v') {
      if (this.clipboard.length > 0) {
        let mouseCoords = this.canvasManager.getLastMouseCoords();
        if (!mouseCoords) {
          mouseCoords = this.getCanvasCenter();
          console.log(
            `Mouse coordinates not available, pasting at canvas center (${mouseCoords.x}, ${mouseCoords.y})`
          );
        }

        this.scene.getShapes().forEach((shape) => (shape.selected = false));

        this.clipboard.forEach((shape) => {
          const clonedShape = shape.clone();
          clonedShape.x = mouseCoords!.x + (clonedShape.x - shape.x);
          clonedShape.y = mouseCoords!.y + (clonedShape.y - shape.y);
          clonedShape.selected = true;
          this.scene.addElement(clonedShape);
        });
        console.log(
          `Pasted ${this.clipboard.length} shapes at (${mouseCoords.x}, ${mouseCoords.y})`
        );
      }
      e.preventDefault();
    }

    if (e.key === 'Backspace') {
      const selectedShapes = [...this.scene.getSelectedShapes()];
      this.scene.removeElements(selectedShapes);
    }
  }
}
