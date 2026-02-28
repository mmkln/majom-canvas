import { createIcon } from './icons.ts';

export type HudButtonState = {
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
};

type HudButtonBaseOptions = {
  className: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void;
};

export const HUD_BUTTON_CONTROLLER = Symbol('HUD_BUTTON_CONTROLLER');

export type HudButtonElement = HTMLButtonElement & {
  loading: boolean;
  loadingText?: string;
  [HUD_BUTTON_CONTROLLER]?: HudButtonBase;
};

export abstract class HudButtonBase {
  protected readonly button: HudButtonElement;

  protected constructor(options: HudButtonBaseOptions) {
    const button = document.createElement('button') as HudButtonElement;
    button.type = options.type ?? 'button';
    button.className = options.className;
    if (options.title) {
      button.title = options.title;
    }
    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }
    this.button = button;
    this.button[HUD_BUTTON_CONTROLLER] = this;
    this.attachStateAccessors();
  }

  public getElement(): HudButtonElement {
    return this.button;
  }

  protected initializeState(state: HudButtonState): void {
    this.setState(state);
  }

  public setState(state: HudButtonState): void {
    if (state.loadingText !== undefined) {
      this.setStoredLoadingText(state.loadingText);
    }
    const loading = state.loading ?? this.isLoading();
    if (loading) {
      this.enterLoading();
      return;
    }
    this.leaveLoading(state.disabled);
  }

  protected createSpinner(
    size: number = 14,
    strokeWidth: number = 2
  ): SVGSVGElement {
    const spinner = createIcon('arrow-path', { size, strokeWidth });
    startSpinnerAnimation(spinner);
    spinner.setAttribute('aria-hidden', 'true');
    return spinner;
  }

  protected abstract renderLoadingContent(loadingText?: string): void;

  protected onLoadingCleared(): void {}

  private isLoading(): boolean {
    return this.button.getAttribute('data-loading') === 'true';
  }

  private enterLoading(): void {
    if (!this.isLoading()) {
      this.button.dataset.hudRestoreHtml = this.button.innerHTML;
      this.button.dataset.hudRestoreDisabled = this.button.disabled
        ? 'true'
        : 'false';
    }
    this.button.setAttribute('data-loading', 'true');
    this.button.setAttribute('aria-busy', 'true');
    this.button.setAttribute('aria-disabled', 'true');
    this.button.disabled = true;
    this.renderLoadingContent(this.getStoredLoadingText());
  }

  private leaveLoading(nextDisabled?: boolean): void {
    const wasLoading = this.isLoading();
    if (wasLoading && this.button.dataset.hudRestoreHtml !== undefined) {
      this.button.innerHTML = this.button.dataset.hudRestoreHtml;
      delete this.button.dataset.hudRestoreHtml;
      this.onLoadingCleared();
    }
    this.button.removeAttribute('aria-busy');
    this.button.removeAttribute('data-loading');

    const restoreDisabled = this.button.dataset.hudRestoreDisabled === 'true';
    const disabled =
      nextDisabled ?? (wasLoading ? restoreDisabled : this.button.disabled);
    this.button.disabled = disabled;
    if (disabled) {
      this.button.setAttribute('aria-disabled', 'true');
    } else {
      this.button.removeAttribute('aria-disabled');
    }
    delete this.button.dataset.hudRestoreDisabled;
  }

  private attachStateAccessors(): void {
    Object.defineProperty(this.button, 'loading', {
      get: () => this.isLoading(),
      set: (value: unknown) => {
        this.setState({ loading: Boolean(value) });
      },
      configurable: true,
    });
    Object.defineProperty(this.button, 'loadingText', {
      get: () => this.getStoredLoadingText(),
      set: (value: unknown) => {
        if (typeof value === 'string') {
          this.setStoredLoadingText(value);
        } else {
          delete this.button.dataset.hudLoadingText;
        }
        if (this.isLoading()) {
          this.renderLoadingContent(this.getStoredLoadingText());
        }
      },
      configurable: true,
    });
  }

  private getStoredLoadingText(): string | undefined {
    return this.button.dataset.hudLoadingText;
  }

  private setStoredLoadingText(value: string): void {
    this.button.dataset.hudLoadingText = value;
  }
}

export function getHudButtonController(
  button: HTMLButtonElement
): HudButtonBase | null {
  return (button as HudButtonElement)[HUD_BUTTON_CONTROLLER] ?? null;
}

function startSpinnerAnimation(spinner: SVGSVGElement): void {
  if (typeof spinner.animate === 'function') {
    spinner.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
      { duration: 900, iterations: Infinity, easing: 'linear' }
    );
    return;
  }
  spinner.classList.add('animate-spin');
}
