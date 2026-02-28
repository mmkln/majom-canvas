import { historyService } from '../../core/services/HistoryService.ts';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { Subscription } from 'rxjs';
import {
  CANVAS_SAVE_LIFECYCLE_EVENT,
  isCanvasSaveLifecycleDetail,
} from '../../core/canvasSaveLifecycle.ts';
import { createTextButton, type TextButtonElement } from '../primitives/index.ts';
import { authFlowService } from '../auth/authFlowService.ts';

/**
 * Save button with lifecycle-driven loading state.
 */
export class SaveButton {
  private readonly container: HTMLElement;
  private readonly button: TextButtonElement;
  private readonly authService = new AuthService();
  private historySubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private readonly lifecycleHandler: (event: Event) => void;
  private savesInFlight = 0;
  private loadingSince = 0;
  private hideLoadingTimer: number | null = null;
  private readonly minimumLoadingMs = 700;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'flex items-center';

    this.button = createTextButton({
      tone: 'primary',
      size: 'md',
      text: 'Save',
      className: 'min-w-[80px]',
      loadingText: 'Saving..',
      disabled: true,
      onClick: () => this.handleClick(),
    });

    this.container.appendChild(this.button);

    this.historySubscription = historyService.changes.subscribe(() =>
      this.updateButtonState()
    );
    this.refreshHandler = () => this.updateButtonState();
    window.addEventListener('refreshCanvasData', this.refreshHandler);

    this.lifecycleHandler = (event: Event) => this.handleSaveLifecycleEvent(event);
    window.addEventListener(CANVAS_SAVE_LIFECYCLE_EVENT, this.lifecycleHandler);

    this.updateButtonState();
  }

  private handleClick(): void {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('save');
      return;
    }
    window.dispatchEvent(new CustomEvent('saveCanvasLayout'));
  }

  private handleSaveLifecycleEvent(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    const detail = customEvent.detail;
    if (!isCanvasSaveLifecycleDetail(detail)) return;

    if (detail.action === 'started') {
      this.savesInFlight += 1;
      this.showLoading();
      return;
    }

    this.savesInFlight = Math.max(0, this.savesInFlight - 1);
    if (this.savesInFlight === 0) {
      this.hideLoadingWithDelay();
    }
  }

  private showLoading(): void {
    if (this.hideLoadingTimer !== null) {
      window.clearTimeout(this.hideLoadingTimer);
      this.hideLoadingTimer = null;
    }
    if (this.button.loading) return;
    this.loadingSince = Date.now();
    this.button.loading = true;
    this.updateButtonState();
  }

  private hideLoadingWithDelay(): void {
    if (!this.button.loading) return;
    const elapsed = Date.now() - this.loadingSince;
    const remaining = Math.max(0, this.minimumLoadingMs - elapsed);
    if (remaining === 0) {
      this.hideLoadingNow();
      return;
    }
    if (this.hideLoadingTimer !== null) {
      window.clearTimeout(this.hideLoadingTimer);
    }
    this.hideLoadingTimer = window.setTimeout(() => {
      this.hideLoadingTimer = null;
      if (this.savesInFlight === 0) {
        this.hideLoadingNow();
      }
    }, remaining);
  }

  private hideLoadingNow(): void {
    if (!this.button.loading) return;
    this.button.loading = false;
    this.updateButtonState();
  }

  private updateButtonState(): void {
    const canSave = historyService.hasUnsavedChanges();
    const isLoggedIn = this.authService.isLoggedIn();
    this.button.disabled = this.button.loading || !isLoggedIn || !canSave;
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    window.removeEventListener(CANVAS_SAVE_LIFECYCLE_EVENT, this.lifecycleHandler);
    if (this.hideLoadingTimer !== null) {
      window.clearTimeout(this.hideLoadingTimer);
      this.hideLoadingTimer = null;
    }
    this.savesInFlight = 0;
    this.hideLoadingNow();
    this.historySubscription?.unsubscribe();
    this.historySubscription = null;
    this.container.remove();
  }
}
