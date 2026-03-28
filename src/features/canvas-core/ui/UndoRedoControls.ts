import { historyService } from '../core/services/HistoryService.ts';
import { Subscription } from 'rxjs';
import { createIconButton } from './primitives/index.ts';
import { AppRuntime, createAppRuntime } from '../../../app-runtime/index.ts';
import type { I18nService } from '../../../i18n/index.ts';

/**
 * Inline Undo/Redo controls for top action bars.
 */
export class UndoRedoControls {
  public readonly container: HTMLDivElement;
  private readonly runtime: AppRuntime;
  private readonly i18n: I18nService;
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private subscription!: Subscription;
  private disposeRuntimeSubscription: (() => void) | null = null;

  constructor(runtime: AppRuntime = createAppRuntime()) {
    this.runtime = runtime;
    this.i18n = runtime.i18n;
    this.container = document.createElement('div');
    this.container.className = 'flex items-center gap-2 px-0.5';

    this.undoBtn = createIconButton({
      icon: 'arrow-ultum-left',
      size: 'sm',
      title: this.i18n.t('common.undo'),
      ariaLabel: this.i18n.t('common.undo'),
      onClick: () => historyService.undo(),
    });
    this.undoBtn.setAttribute('aria-label', this.i18n.t('common.undo'));

    this.redoBtn = createIconButton({
      icon: 'arrow-ultum-right',
      size: 'sm',
      title: this.i18n.t('common.redo'),
      ariaLabel: this.i18n.t('common.redo'),
      onClick: () => historyService.redo(),
    });
    this.redoBtn.setAttribute('aria-label', this.i18n.t('common.redo'));

    this.container.appendChild(this.undoBtn);
    this.container.appendChild(this.redoBtn);

    this.subscription = historyService.changes.subscribe(() =>
      this.updateButtons()
    );
    this.updateButtons();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
    this.disposeRuntimeSubscription = this.runtime.subscribe(
      () => this.refreshTranslations(),
      { emitCurrent: true }
    );
  }

  private updateButtons(): void {
    this.undoBtn.disabled = !historyService.canUndo();
    this.redoBtn.disabled = !historyService.canRedo();
  }

  public unmount(): void {
    this.subscription.unsubscribe();
    this.disposeRuntimeSubscription?.();
    this.disposeRuntimeSubscription = null;
    this.container.remove();
  }

  private refreshTranslations(): void {
    const undo = this.i18n.t('common.undo');
    const redo = this.i18n.t('common.redo');
    this.undoBtn.title = undo;
    this.undoBtn.setAttribute('aria-label', undo);
    this.redoBtn.title = redo;
    this.redoBtn.setAttribute('aria-label', redo);
  }
}
