import { Scene } from '../../core/scene/Scene.ts';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { SaveButton } from './SaveButton.ts';
import { SaveSpinner } from './SaveSpinner.ts';

/**
 * SaveControls: wraps the save spinner and button in a shared layout.
 */
export class SaveControls {
  private container: HTMLDivElement;
  private saveButton: SaveButton;
  private saveSpinner: SaveSpinner;
  private authService = new AuthService();
  private refreshHandler: () => void;

  constructor(scene: Scene) {
    this.container = document.createElement('div');
    this.container.className =
      'absolute top-5 right-20 z-20 flex items-center gap-2';
    this.saveButton = new SaveButton(scene);
    this.saveSpinner = new SaveSpinner();
    this.refreshHandler = () => this.updateVisibility();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.saveSpinner.mount(this.container);
    this.saveButton.mount(this.container);
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.updateVisibility();
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    this.saveSpinner.unmount();
    this.saveButton.unmount();
    this.container.remove();
  }

  private updateVisibility(): void {
    this.container.style.display = this.authService.isLoggedIn()
      ? 'flex'
      : 'none';
  }
}
