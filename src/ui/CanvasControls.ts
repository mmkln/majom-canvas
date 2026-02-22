// ui/CanvasControls.ts
import { CanvasManager } from '../core/managers/CanvasManager.ts';
import { Scene } from '../core/scene/Scene.ts';
import { Subscription } from 'rxjs';
import {
  createHudIconButton,
  createHudSurface,
} from './primitives/index.ts';

export class CanvasControls {
  private readonly container: HTMLDivElement;
  private readonly goToFocusBtn: HTMLButtonElement;
  private focusSubscription: Subscription;

  constructor(
    private canvasManager: CanvasManager,
    private scene: Scene
  ) {
    this.container = createHudSurface({
      className: 'absolute right-4 bottom-4 z-20 flex flex-col gap-2 p-2',
    });

    const zoomInBtn = createHudIconButton({
      icon: 'plus',
      title: 'Zoom In',
      ariaLabel: 'Zoom In',
      onClick: () => this.canvasManager.zoomIn(),
    });

    const zoomOutBtn = createHudIconButton({
      icon: 'minus',
      title: 'Zoom Out',
      ariaLabel: 'Zoom Out',
      onClick: () => this.canvasManager.zoomOut(),
    });

    this.goToFocusBtn = createHudIconButton({
      icon: 'map-pin',
      title: 'Go to Focus',
      ariaLabel: 'Go to Focus',
      onClick: () => this.canvasManager.goToFocusedElement(),
    });

    // append controls: zoom in/out and go-to-focus
    this.container.appendChild(zoomInBtn);
    this.container.appendChild(zoomOutBtn);
    this.container.appendChild(this.goToFocusBtn);

    this.focusSubscription = this.scene.focusChanges.subscribe(() =>
      this.updateFocusAvailability()
    );
    this.updateFocusAvailability();
  }

  public mount(parent: HTMLElement = document.body) {
    parent.appendChild(this.container);
  }

  public unmount() {
    this.focusSubscription.unsubscribe();
    this.container.remove();
  }

  private updateFocusAvailability(): void {
    this.goToFocusBtn.disabled = this.scene.getFocusedElement() === null;
  }
}
