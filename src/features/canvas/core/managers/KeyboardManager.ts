// managers/KeyboardManager.ts
import { Scene } from '../scene/Scene.ts';
import { IShape } from '../interfaces/shape.ts';
import { CanvasManager } from './CanvasManager.ts';
import { ConnectionRemovalService } from '../services/ConnectionRemovalService.ts';
import { isConnection } from '../utils/typeGuards.ts';
import { modalService } from '../../../../ui-lib/src/services/ModalService.ts';
import { normalizeKeyboardKey } from '../utils/keyboardUtils.ts';

export class KeyboardManager {
  private clipboard: IShape[] = [];
  private readonly keyDownHandler = (event: KeyboardEvent): void =>
    this.onKeyDown(event);

  constructor(
    private scene: Scene,
    private canvasManager: CanvasManager
  ) {
    document.addEventListener('keydown', this.keyDownHandler);
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.keyDownHandler);
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
    // Do not handle global shortcuts if a blocking overlay is open.
    if (modalService.hasBlockingOverlay()) return;
    // Ignore shortcuts when focused on form fields or editable content
    const tgt = e.target as HTMLElement;
    if (
      tgt.tagName === 'INPUT' ||
      tgt.tagName === 'TEXTAREA' ||
      tgt.tagName === 'SELECT' ||
      tgt.isContentEditable
    )
      return;
    console.log({ key: e.key });
    const key = normalizeKeyboardKey(e);

    if (e.key === 'Escape') {
      // Cancel connection creation.
      this.canvasManager.getInteractionManager().cancelConnectionCreation();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && key === 'c') {
      const selectedShapes = this.scene.getSelectedShapes();
      if (selectedShapes.length > 0) {
        this.clipboard = selectedShapes.map((shape) => shape.clone());
        console.log(`Copied ${this.clipboard.length} shapes to clipboard`);
      }
      e.preventDefault();
    }

    if ((e.ctrlKey || e.metaKey) && key === 'v') {
      if (this.clipboard.length > 0) {
        let mouseCoords = this.canvasManager.getLastMouseCoords();
        if (!mouseCoords) {
          mouseCoords = this.getCanvasCenter();
          console.log(
            `Mouse coordinates not available, pasting at canvas center (${mouseCoords.x}, ${mouseCoords.y})`
          );
        }

        this.scene.clearSelected();

        const pasteX = mouseCoords?.x ?? 0;
        const pasteY = mouseCoords?.y ?? 0;
        this.clipboard.forEach((shape) => {
          const clonedShape = shape.clone();
          clonedShape.x = pasteX + (clonedShape.x - shape.x);
          clonedShape.y = pasteY + (clonedShape.y - shape.y);
          clonedShape.selected = true;
          this.scene.addElement(clonedShape);
        });
        console.log(
          `Pasted ${this.clipboard.length} shapes at (${mouseCoords.x}, ${mouseCoords.y})`
        );
      }
      e.preventDefault();
    }

    // Select all elements on canvas
    if ((e.ctrlKey || e.metaKey) && key === 'a') {
      const allElements = this.scene.getElements();
      this.scene.setSelected(allElements);
      e.preventDefault();
    }

    if (e.key === 'Backspace') {
      // Prevent browser default (e.g., navigation) and stop bubbling
      e.preventDefault();
      e.stopPropagation();
      const selectedElements = [...this.scene.getSelectedElements()];
      if (
        selectedElements.length > 0 &&
        selectedElements.every((element) => isConnection(element))
      ) {
        new ConnectionRemovalService(this.scene).removeConnectionsBatch(
          selectedElements
        );
        return;
      }
      this.scene.removeElements(selectedElements);
    }
  }
}
