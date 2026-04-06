import { CanvasPersistenceState } from '../../core/services/CanvasPersistenceState.ts';
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
import {
  CANVAS_ELEMENT_AUTOSAVE_STATUS_EVENT,
  type CanvasElementAutosaveStatus,
  isCanvasElementAutosaveStatusDetail,
} from '../../core/canvasElementAutosaveLifecycle.ts';
import {
  createTextButton,
  type TextButtonElement,
} from '../primitives/index.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import { createIcon, type IconName } from '../icons.ts';
import { AppRuntime, createAppRuntime } from '../../../../app-runtime/index.ts';
import type { I18nService } from '../../../../i18n/index.ts';
import { CanvasClientStorage } from '../../core/services/CanvasClientStorage.ts';

const CANVAS_UI_STATE_CHANGED_EVENT = 'canvasUiStateChanged';

type SaveButtonOptions = {
  getActiveCanvasId: () => string | null;
  canTriggerManualSave?: () => boolean;
  getManualSaveBlockedReason?: () => string;
};

/**
 * Save button with lifecycle-driven loading state.
 */
export class SaveButton {
  private readonly persistenceState: CanvasPersistenceState;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private readonly getActiveCanvasId: () => string | null;
  private readonly canTriggerManualSave: () => boolean;
  private readonly getManualSaveBlockedReason: () => string;
  private readonly container: HTMLElement;
  private readonly button: TextButtonElement;
  private readonly authService = new AuthService();
  private persistenceSubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private readonly lifecycleHandler: (event: Event) => void;
  private readonly autosaveToggleHandler: (event: Event) => void;
  private readonly elementAutosaveStatusHandler: (event: Event) => void;
  private disposeRuntimeSubscription: (() => void) | null = null;
  private autosaveEnabled = CanvasClientStorage.getCanvasAutosaveEnabled(true);
  private autosaveFailed = false;
  private activeCanvasId: string | null = null;
  private elementAutosaveStatus: CanvasElementAutosaveStatus = 'saved';
  private manualSavesInFlight = 0;
  private autosaveSavesInFlight = 0;
  private loadingSince = 0;
  private hideLoadingTimer: number | null = null;
  private readonly minimumLoadingMs = 700;

  constructor(
    persistenceState: CanvasPersistenceState,
    options: SaveButtonOptions,
    runtime: AppRuntime = createAppRuntime()
  ) {
    this.persistenceState = persistenceState;
    this.getActiveCanvasId = options.getActiveCanvasId;
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.canTriggerManualSave = options.canTriggerManualSave ?? (() => true);
    this.getManualSaveBlockedReason =
      options.getManualSaveBlockedReason ??
      (() => this.i18n.t('saveButton.waitForCanvasLoad'));
    this.container = document.createElement('div');
    this.container.className = 'flex items-center';

    this.button = createTextButton({
      tone: 'primary',
      size: 'md',
      text: this.i18n.t('saveButton.save'),
      className: 'min-w-[96px]',
      loadingText: this.i18n.t('saveButton.saving'),
      disabled: true,
      onClick: () => this.handleClick(),
    });
    this.container.append(this.button);

    this.persistenceSubscription = this.persistenceState.changes.subscribe(() =>
      this.updateUiState()
    );
    this.refreshHandler = () => this.updateUiState();
    window.addEventListener(
      CANVAS_UI_STATE_CHANGED_EVENT,
      this.refreshHandler
    );

    this.lifecycleHandler = (event: Event) =>
      this.handleSaveLifecycleEvent(event);
    window.addEventListener(CANVAS_SAVE_LIFECYCLE_EVENT, this.lifecycleHandler);

    this.autosaveToggleHandler = (event: Event) =>
      this.handleAutosaveToggle(event);
    window.addEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.autosaveToggleHandler
    );
    this.elementAutosaveStatusHandler = (event: Event) =>
      this.handleElementAutosaveStatus(event);
    window.addEventListener(
      CANVAS_ELEMENT_AUTOSAVE_STATUS_EVENT,
      this.elementAutosaveStatusHandler
    );

    this.activeCanvasId = this.getActiveCanvasId();
    this.updateUiState();
  }

  private handleClick(): void {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('save');
      return;
    }
    if (!this.canTriggerManualSave()) {
      this.updateUiState();
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
        this.showLoading();
        return;
      }
      this.manualSavesInFlight = Math.max(0, this.manualSavesInFlight - 1);
      if (this.manualSavesInFlight === 0) {
        this.hideLoadingWithDelay();
      }
      if (this.areAllChangesSaved()) {
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
        this.autosaveFailed = this.persistenceState.hasLayoutDirty();
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

  private handleElementAutosaveStatus(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    if (!isCanvasElementAutosaveStatusDetail(customEvent.detail)) return;
    this.syncActiveCanvasId();
    if (customEvent.detail.canvasId !== this.activeCanvasId) return;
    this.elementAutosaveStatus = customEvent.detail.status;
    this.updateUiState();
  }

  private updateUiState(): void {
    this.syncActiveCanvasId();
    this.updateButtonContent();
    this.updateButtonState();
  }

  private updateButtonContent(): void {
    if (this.button.loading) {
      const loadingLabel = this.i18n.t('saveButton.saving');
      this.button.loadingText = loadingLabel;
      this.button.setAttribute('aria-label', loadingLabel);
      this.button.title = loadingLabel;
      return;
    }
    const status = this.getAutosaveVisualStatus();
    const label = this.getButtonLabel(status);

    this.button.innerHTML = '';
    const content = document.createElement('span');
    content.className = 'inline-flex items-center justify-center gap-2';

    if (label === this.i18n.t('saveButton.saved')) {
      const indicator = this.createSavedIndicator();
      content.appendChild(indicator);
    }
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    content.appendChild(labelSpan);

    this.button.appendChild(content);
    const statusLabel = this.getAutosaveStatusLabel(status, label);
    const blockedReason =
      this.persistenceState.hasManualSaveWork() && !this.canTriggerManualSave()
        ? this.getManualSaveBlockedReason()
        : '';
    const detail = blockedReason || statusLabel;
    const aria = detail ? `${label}. ${detail}` : label;
    this.button.setAttribute('aria-label', aria);
    this.button.title = aria;
  }

  private getButtonLabel(
    status: ReturnType<SaveButton['getAutosaveVisualStatus']>
  ): string {
    if (!this.autosaveEnabled) {
      if (this.areAllChangesSaved()) {
        return this.i18n.t('saveButton.saved');
      }
      return this.i18n.t('saveButton.save');
    }
    if (status === 'saved') return this.i18n.t('saveButton.saved');
    return this.i18n.t('saveButton.save');
  }

  private updateButtonState(): void {
    const canSave = this.persistenceState.hasManualSaveWork();
    const canTrigger = this.canTriggerManualSave();
    const isLoggedIn = this.authService.isLoggedIn();
    const hasSaveInFlight =
      this.manualSavesInFlight > 0 || this.autosaveSavesInFlight > 0;
    this.button.disabled =
      this.button.loading ||
      hasSaveInFlight ||
      !isLoggedIn ||
      !canSave ||
      !canTrigger;
  }

  private getAutosaveVisualStatus():
    | 'saving'
    | 'error'
    | 'dirty'
    | 'saved'
    | null {
    if (
      this.autosaveSavesInFlight > 0 ||
      this.elementAutosaveStatus === 'saving' ||
      this.persistenceState.hasRestoredReplayPending()
    ) {
      return 'saving';
    }
    if (
      this.autosaveFailed ||
      this.elementAutosaveStatus === 'failed' ||
      this.persistenceState.hasRestoredReplayFailed()
    ) {
      return 'error';
    }
    if (
      this.persistenceState.hasLayoutDirty() ||
      this.elementAutosaveStatus === 'queued'
    ) {
      return 'dirty';
    }
    if (!this.autosaveEnabled) return null;
    return 'saved';
  }

  private areAllChangesSaved(): boolean {
    return (
      !this.persistenceState.hasLayoutDirty() &&
      !this.persistenceState.hasRestoredReplayPending() &&
      !this.persistenceState.hasRestoredReplayFailed() &&
      this.elementAutosaveStatus === 'saved'
    );
  }

  private syncActiveCanvasId(): void {
    const nextCanvasId = this.getActiveCanvasId();
    if (this.activeCanvasId === nextCanvasId) return;
    this.activeCanvasId = nextCanvasId;
    this.elementAutosaveStatus = 'saved';
  }

  private getAutosaveStatusLabel(
    status: ReturnType<SaveButton['getAutosaveVisualStatus']>,
    label: string
  ): string {
    if (status === null && label === this.i18n.t('saveButton.saved')) {
      return this.i18n.t('saveButton.allChangesSaved');
    }
    switch (status) {
      case 'saving':
        return this.i18n.t('saveButton.autosaveInProgress');
      case 'error':
        return this.i18n.t('saveButton.autosaveFailed');
      case 'dirty':
        return this.i18n.t('saveButton.unsavedChanges');
      case 'saved':
        return this.i18n.t('saveButton.allChangesSaved');
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
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.updateUiState(),
      { emitCurrent: true }
    );
  }

  unmount(): void {
    window.removeEventListener(
      CANVAS_UI_STATE_CHANGED_EVENT,
      this.refreshHandler
    );
    window.removeEventListener(
      CANVAS_SAVE_LIFECYCLE_EVENT,
      this.lifecycleHandler
    );
    window.removeEventListener(
      CANVAS_AUTOSAVE_TOGGLE_EVENT,
      this.autosaveToggleHandler
    );
    window.removeEventListener(
      CANVAS_ELEMENT_AUTOSAVE_STATUS_EVENT,
      this.elementAutosaveStatusHandler
    );
    if (this.hideLoadingTimer !== null) {
      window.clearTimeout(this.hideLoadingTimer);
      this.hideLoadingTimer = null;
    }
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.manualSavesInFlight = 0;
    this.autosaveSavesInFlight = 0;
    this.hideLoadingNow();
    this.persistenceSubscription?.unsubscribe();
    this.persistenceSubscription = null;
    this.container.remove();
  }
}
