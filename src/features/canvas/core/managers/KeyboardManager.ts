import { Scene } from '../scene/Scene.ts';
import { CanvasManager } from './CanvasManager.ts';
import { modalService } from '../../../../ui-lib/src/services/ModalService.ts';

export class KeyboardManager {
  private readonly keyDownHandler = (event: KeyboardEvent): void =>
    this.onKeyDown(event);

  constructor(
    _scene: Scene,
    private canvasManager: CanvasManager
  ) {
    document.addEventListener('keydown', this.keyDownHandler);
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.keyDownHandler);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (modalService.hasBlockingOverlay()) return;
    const tgt = e.target as HTMLElement;
    if (
      tgt.tagName === 'INPUT' ||
      tgt.tagName === 'TEXTAREA' ||
      tgt.tagName === 'SELECT' ||
      tgt.isContentEditable
    )
      return;

    if (e.key === 'Escape') {
      this.canvasManager.getInteractionManager().cancelConnectionCreation();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }
}
