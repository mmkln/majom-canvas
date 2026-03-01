import type { Subscription } from 'rxjs';
import { AuthService } from '../../../../majom-wrapper/data-access/auth-service.ts';
import { historyService } from '../../core/services/HistoryService.ts';
import {
  CANVAS_SAVE_LIFECYCLE_EVENT,
  isCanvasSaveLifecycleDetail,
} from '../../core/canvasSaveLifecycle.ts';
import { authFlowService } from '../auth/authFlowService.ts';
import { createTextButton, setTextButtonState } from '../primitives/index.ts';

type SaveStatusChipState = 'saved' | 'unsaved' | 'saving';

export class SaveStatusChip {
  private readonly container: HTMLDivElement;
  private readonly button: HTMLButtonElement;
  private readonly authService = new AuthService();
  private historySubscription: Subscription | null = null;
  private readonly refreshHandler: () => void;
  private readonly lifecycleHandler: (event: Event) => void;
  private savesInFlight = 0;
  private state: SaveStatusChipState | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'flex items-center';

    this.button = createTextButton({
      tone: 'text',
      size: 'sm',
      text: 'Saved',
      className:
        'h-8 min-w-[84px] justify-center rounded-full px-3 text-xs font-semibold tracking-[0.02em]',
      onClick: () => this.handleClick(),
    });
    this.button.setAttribute('aria-label', 'Save status');
    this.container.appendChild(this.button);

    this.historySubscription = historyService.changes.subscribe(() =>
      this.syncState()
    );
    this.refreshHandler = () => this.syncState();
    window.addEventListener('refreshCanvasData', this.refreshHandler);
    this.lifecycleHandler = (event: Event) => this.handleLifecycle(event);
    window.addEventListener(CANVAS_SAVE_LIFECYCLE_EVENT, this.lifecycleHandler);
    this.syncState();
  }

  public mount(parent: HTMLElement = document.body): void {
    parent.appendChild(this.container);
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  public unmount(): void {
    window.removeEventListener('refreshCanvasData', this.refreshHandler);
    window.removeEventListener(
      CANVAS_SAVE_LIFECYCLE_EVENT,
      this.lifecycleHandler
    );
    this.historySubscription?.unsubscribe();
    this.historySubscription = null;
    this.container.remove();
  }

  private handleClick(): void {
    if (!this.authService.isLoggedIn()) {
      authFlowService.requestLogin('save');
      return;
    }
    if (this.state !== 'unsaved') return;
    window.dispatchEvent(new CustomEvent('saveCanvasLayout'));
  }

  private handleLifecycle(event: Event): void {
    const customEvent = event as CustomEvent<unknown>;
    const detail = customEvent.detail;
    if (!isCanvasSaveLifecycleDetail(detail)) return;

    if (detail.action === 'started') {
      this.savesInFlight += 1;
    } else {
      this.savesInFlight = Math.max(0, this.savesInFlight - 1);
    }
    this.syncState();
  }

  private syncState(): void {
    if (!this.authService.isLoggedIn()) {
      this.render('saved');
      return;
    }
    const nextState: SaveStatusChipState =
      this.savesInFlight > 0
        ? 'saving'
        : historyService.hasUnsavedChanges()
          ? 'unsaved'
          : 'saved';
    this.render(nextState);
  }

  private render(nextState: SaveStatusChipState): void {
    if (this.state === nextState) return;
    this.state = nextState;

    this.button.classList.remove(
      'bg-slate-100',
      'text-slate-500',
      'hover:bg-slate-100',
      'hover:text-slate-500',
      'bg-amber-100',
      'text-amber-700',
      'hover:bg-amber-200',
      'hover:text-amber-800',
      'bg-indigo-100',
      'text-indigo-700',
      'hover:bg-indigo-100',
      'hover:text-indigo-700'
    );

    if (nextState === 'saving') {
      setTextButtonState(this.button, {
        loading: true,
        loadingText: 'Saving',
        disabled: true,
      });
      this.button.classList.add(
        'bg-indigo-100',
        'text-indigo-700',
        'hover:bg-indigo-100',
        'hover:text-indigo-700'
      );
      return;
    }

    setTextButtonState(this.button, { loading: false });
    if (nextState === 'unsaved') {
      this.button.textContent = 'Unsaved';
      setTextButtonState(this.button, { disabled: false });
      this.button.classList.add(
        'bg-amber-100',
        'text-amber-700',
        'hover:bg-amber-200',
        'hover:text-amber-800'
      );
      return;
    }

    this.button.textContent = 'Saved';
    setTextButtonState(this.button, { disabled: true });
    this.button.classList.add(
      'bg-slate-100',
      'text-slate-500',
      'hover:bg-slate-100',
      'hover:text-slate-500'
    );
  }
}
