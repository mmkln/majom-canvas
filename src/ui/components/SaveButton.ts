import { Scene } from '../../core/scene/Scene.ts';
import { AuthService } from '../../majom-wrapper/data-access/auth-service.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import { OfflineCanvasService } from '../../majom-wrapper/services/OfflineCanvasService.ts';
import { Button } from '../../ui-lib/src/components/Button.js';

/**
 * SaveButton: shows "Save" when user is logged in and there are unsaved changes,
 * or "Login to Save" when not authenticated. Emits events on click.
 */
export class SaveButton {
  private container: HTMLElement;
  private button: HTMLButtonElement;
  private authService = new AuthService();

  constructor(private scene: Scene, private offlineService: OfflineCanvasService) {
    // Container overlay
    this.container = document.createElement('div');
    this.container.className = 'absolute top-5 right-20 z-20';
    this.container.style.display = 'none';

    // UI-lib Save button
    this.button = new Button({
      text: 'Save',
      variant: 'success',
      disabled: true,
      onClick: () => {
        if (!this.authService.isLoggedIn()) {
          window.dispatchEvent(new CustomEvent('showLoginModal'));
        } else {
          window.dispatchEvent(new CustomEvent('saveCanvasLayout'));
        }
      },
    }).createElement() as HTMLButtonElement;

    this.container.appendChild(this.button);

    // Update on history or auth changes
    historyService.changes.subscribe(() => this.updateButton());
    window.addEventListener('refreshCanvasData', () => this.updateButton());
    // Initial state update
    this.updateButton();
  }

  private updateButton(): void {
    const hasHistory = historyService.canUndo();
    const hasOffline = this.offlineService.getElements().length > 0;
    const canSave = hasHistory || hasOffline;
    this.container.style.display =
      this.authService.isLoggedIn() && canSave ? 'block' : 'none';
    this.button.disabled = !canSave;
  }

  /** Show loading state on Save button */
  public startLoading(): void {
    this.button.textContent = 'Saving...';
    this.button.disabled = true;
  }

  /** Revert loading state and update button status */
  public stopLoading(): void {
    this.button.textContent = 'Save';
    this.updateButton();
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
