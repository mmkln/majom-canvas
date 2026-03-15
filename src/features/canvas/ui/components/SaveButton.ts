import { historyService } from '../../core/services/HistoryService.ts';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import type { Subscription } from 'rxjs';
import {
  CANVAS_SAVE_LIFECYCLE_EVENT,
  isCanvasSaveLifecycleDetail,
} from '../../core/canvasSaveLifecycle.ts';
import {
  CANVAS_AUTOSAVE_TOGGLE_EVENT,
  isCanvasAutosaveToggleDetail,
} from '../../core/canvasAutosaveLifecycle.ts';
import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';
import {
  createTextButton,
  type TextButtonElement,
} from '../primitives/index.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import { createIcon, type IconName } from '../icons.ts';

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
  private readonly autosaveToggleHandler: (event: Event) => void;
  private autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);
  private autosaveFailed = false;
  private manualSaveSucceeded = false;
  private manualSavesInFlight = 0;
  private autosaveSavesInFlight = 0;
  private loadingSince = 0;
  private hideLoadingTimer: number | null = null;
  private readonly minimumLoadingMs = 700;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'flex items-center';

    this.button = createTextButton({
      tone: 'primary',
      size: 'md',
      text: this.autosaveEnabled ? 'Save now' : 'Save',
      className: 'min-w-[96px]',
      loadingText: 'Saving...',
      disabled: true,
      onClick: () => this.handleClick(),
    });
    this.container.append(this.button);

    this.historySubscription = historyService.changes.subscribe(() =>
      this.updateUiState()
    );
    this.refreshHandler = () => this.updateUiState();
    window.addEventListener('refreshCanvasData', this.refreshHandler);

    this.lifecycleHandler = (event: Event) =>
      this.handleSaveLifecycleEvent(event);
    window.addEventListener(CANVAS_SAVE_LIFECYCLE_EVENT, this.lifecycleHandler);

    this.autosaveToggleHandler = (event: Event) =>
      this.handleAutosaveToggle(event);
    window.addEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.autosaveToggleHandler
    );

    this.updateUiState();
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

    if (detail.source === 'manual') {
      if (detail.action === 'started') {
        this.manualSavesInFlight += 1;
        this.manualSaveSucceeded = false;
        this.showLoading();
        return;
      }
      this.manualSavesInFlight = Math.max(0, this.manualSavesInFlight - 1);
      this.manualSaveSucceeded = !historyService.hasUnsavedChanges();
      if (this.manualSavesInFlight === 0) {
        this.hideLoadingWithDelay();
      }
      if (!historyService.hasUnsavedChanges()) {
        this.autosaveFailed = false;
      }
      this.updateUiState();
      return;
    }

    if (detail.action === 'started') {
      this.autosaveSavesInFlight += 1;
      this.autosaveFailed = false;
      this.updateUiState();
      return;
    }

    this.autosaveSavesInFlight = Math.max(0, this.autosaveSavesInFlight - 1);
    if (this.autosaveSavesInFlight === 0) {
      this.autosaveFailed = historyService.hasUnsavedChanges();
    }
    this.updateUiState();
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
      if (this.manualSavesInFlight === 0) {
        this.hideLoadingNow();
      }
    }, remaining);
  }

  private hideLoadingNow(): void {
    if (!this.button.loading) return;
    this.button.loading = false;
    this.updateUiState();
  }

  private handleAutosaveToggle(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasAutosaveToggleDetail(customEvent.detail)) return;
    const { enabled } = customEvent.detail;
    if (this.autosaveEnabled === enabled) return;
    this.autosaveEnabled = enabled;
    if (!enabled) {
      this.autosaveFailed = false;
    }
    this.updateUiState();
  }

  private updateUiState(): void {
    if (historyService.hasUnsavedChanges()) {
      this.manualSaveSucceeded = false;
    }
    this.updateButtonContent();
    this.updateButtonState();
  }

  private updateButtonContent(): void {
    if (this.button.loading) return;
    const status = this.getAutosaveVisualStatus();
    const label = this.getButtonLabel(status);

    this.button.innerHTML = '';
    const content = document.createElement('span');
    content.className = 'inline-flex items-center justify-center gap-2';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    content.appendChild(labelSpan);

    if (label === 'Saved') {
      const indicator = this.createSavedIndicator();
      content.appendChild(indicator);
    }

    this.button.appendChild(content);
    const statusLabel = this.getAutosaveStatusLabel(status);
    const aria = statusLabel ? `${label}. ${statusLabel}` : label;
    this.button.setAttribute('aria-label', aria);
    this.button.title = aria;
  }

  private getButtonLabel(
    status: ReturnType<SaveButton['getAutosaveVisualStatus']>
  ): string {
    if (!this.autosaveEnabled) {
      if (this.manualSaveSucceeded && !historyService.hasUnsavedChanges()) {
        return 'Saved';
      }
      return 'Save';
    }
    if (status === 'saved') return 'Saved';
    return 'Save now';
  }

  private updateButtonState(): void {
    const canSave = historyService.hasUnsavedChanges();
    const isLoggedIn = this.authService.isLoggedIn();
    const hasSaveInFlight =
      this.manualSavesInFlight > 0 || this.autosaveSavesInFlight > 0;
    this.button.disabled =
      this.button.loading || hasSaveInFlight || !isLoggedIn || !canSave;
  }

  private getAutosaveVisualStatus():
    | 'saving'
    | 'error'
    | 'dirty'
    | 'saved'
    | null {
    if (!this.autosaveEnabled) return null;
    if (this.autosaveSavesInFlight > 0) return 'saving';
    if (this.autosaveFailed) return 'error';
    if (historyService.hasUnsavedChanges()) return 'dirty';
    return 'saved';
  }

  private getAutosaveStatusLabel(
    status: ReturnType<SaveButton['getAutosaveVisualStatus']>
  ): string {
    switch (status) {
      case 'saving':
        return 'Autosave in progress';
      case 'error':
        return 'Autosave failed';
      case 'dirty':
        return 'Unsaved changes';
      case 'saved':
        return 'All changes saved';
      default:
        return '';
    }
  }

  private getAutosaveIndicatorClass(): string {
    return 'h-4 w-4 shrink-0';
  }

  private getSavedIndicatorIconName(): IconName {
    return 'check';
  }

  private createSavedIndicator(): SVGSVGElement {
    const icon = createIcon(this.getSavedIndicatorIconName(), {
      size: 14,
      strokeWidth: 2,
    });
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add(...this.getAutosaveIndicatorClass().split(' '));
    return icon;
  }

  mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    window.removeEventListener(
      CANVAS_SAVE_LIFECYCLE_EVENT,
      this.lifecycleHandler
    );
    window.removeEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.autosaveToggleHandler
    );
    if (this.hideLoadingTimer !== null) {
      window.clearTimeout(this.hideLoadingTimer);
      this.hideLoadingTimer = null;
    }
    this.manualSavesInFlight = 0;
    this.autosaveSavesInFlight = 0;
    this.hideLoadingNow();
    this.historySubscription?.unsubscribe();
    this.historySubscription = null;
    this.container.remove();
  }
}
